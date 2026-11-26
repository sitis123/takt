from __future__ import annotations

import json
import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


SCHEMA = """
CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    inn TEXT,
    email TEXT,
    telegram_id INTEGER,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,
    client_id INTEGER REFERENCES clients(id),
    client_name TEXT NOT NULL,
    title TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'RUB',
    status TEXT NOT NULL DEFAULT 'draft',
    payload TEXT NOT NULL DEFAULT '{}',
    due_date TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    due_date TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    source TEXT NOT NULL DEFAULT 'text',
    payload TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,
    ref_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    due_at TEXT NOT NULL,
    sent_at TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,
    detail TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(sent_at, due_at);
"""


class Store:
    """Небольшой надёжный слой хранения на SQLite, общий для всех трёх интерфейсов."""

    def __init__(self, path: Path | str) -> None:
        self.path = Path(path)
        self._lock = threading.RLock()
        with self._connect() as conn:
            conn.executescript(SCHEMA)

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.path), timeout=15, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute("PRAGMA journal_mode = WAL")
        return conn

    def execute(self, sql: str, params: Iterable[Any] = ()) -> sqlite3.Cursor:
        with self._lock, self._connect() as conn:
            return conn.execute(sql, tuple(params))

    def one(self, sql: str, params: Iterable[Any] = ()) -> dict[str, Any] | None:
        with self._lock, self._connect() as conn:
            row = conn.execute(sql, tuple(params)).fetchone()
        return dict(row) if row else None

    def all(self, sql: str, params: Iterable[Any] = ()) -> list[dict[str, Any]]:
        with self._lock, self._connect() as conn:
            rows = conn.execute(sql, tuple(params)).fetchall()
        return [dict(row) for row in rows]

    # --- клиенты -------------------------------------------------------
    def add_client(
        self, name: str, inn: str | None = None, email: str | None = None, telegram_id: int | None = None
    ) -> int:
        cur = self.execute(
            "INSERT INTO clients(name, inn, email, telegram_id, created_at) VALUES (?,?,?,?,?)",
            (name, inn, email, telegram_id, now_iso()),
        )
        return int(cur.lastrowid)

    def find_client(self, name: str) -> dict[str, Any] | None:
        return self.one("SELECT * FROM clients WHERE lower(name) = lower(?) ORDER BY id DESC LIMIT 1", (name,))

    def client(self, client_id: int) -> dict[str, Any] | None:
        return self.one("SELECT * FROM clients WHERE id = ?", (client_id,))

    # --- документы -----------------------------------------------------
    def add_document(
        self,
        *,
        kind: str,
        title: str,
        client_name: str,
        amount: float = 0,
        client_id: int | None = None,
        currency: str = "RUB",
        status: str = "draft",
        payload: dict[str, Any] | None = None,
        due_date: str | None = None,
    ) -> int:
        cur = self.execute(
            """INSERT INTO documents(kind, client_id, client_name, title, amount, currency,
                                      status, payload, due_date, created_at)
               VALUES (?,?,?,?,?,?,?,?,?,?)""",
            (
                kind,
                client_id,
                client_name,
                title,
                amount,
                currency,
                status,
                json.dumps(payload or {}, ensure_ascii=False),
                due_date,
                now_iso(),
            ),
        )
        doc_id = int(cur.lastrowid)
        self.log_event("document.created", f"{kind} #{doc_id} — {title}")
        return doc_id

    def update_document(self, doc_id: int, **fields: Any) -> None:
        allowed = {"status", "title", "amount", "due_date", "payload"}
        keys = [key for key in fields if key in allowed]
        if not keys:
            return
        values = []
        for key in keys:
            value = fields[key]
            values.append(json.dumps(value, ensure_ascii=False) if key == "payload" else value)
        assignments = ", ".join(f"{key} = ?" for key in keys)
        self.execute(f"UPDATE documents SET {assignments} WHERE id = ?", (*values, doc_id))
        self.log_event("document.updated", f"#{doc_id}: {', '.join(keys)}")

    def document(self, doc_id: int) -> dict[str, Any] | None:
        doc = self.one("SELECT * FROM documents WHERE id = ?", (doc_id,))
        return self._decode(doc)

    def documents(
        self, limit: int = 50, status: str | None = None, kind: str | None = None
    ) -> list[dict[str, Any]]:
        sql = "SELECT * FROM documents WHERE 1=1"
        params: list[Any] = []
        if status:
            sql += " AND status = ?"
            params.append(status)
        if kind:
            sql += " AND kind = ?"
            params.append(kind)
        sql += " ORDER BY id DESC LIMIT ?"
        params.append(limit)
        return [self._decode(row) for row in self.all(sql, params)]

    @staticmethod
    def _decode(doc: dict[str, Any] | None) -> dict[str, Any] | None:
        if doc is None:
            return None
        doc["payload"] = json.loads(doc.get("payload") or "{}")
        return doc

    # --- задачи --------------------------------------------------------
    def add_task(
        self, title: str, due_date: str | None = None, source: str = "text", payload: dict[str, Any] | None = None
    ) -> int:
        cur = self.execute(
            "INSERT INTO tasks(title, due_date, status, source, payload, created_at) VALUES (?,?,?,?,?,?)",
            (
                title,
                due_date,
                "open",
                source,
                json.dumps(payload or {}, ensure_ascii=False),
                now_iso(),
            ),
        )
        task_id = int(cur.lastrowid)
        self.log_event("task.created", f"#{task_id} — {title}")
        return task_id

    def tasks(self, status: str | None = "open", limit: int = 50) -> list[dict[str, Any]]:
        sql = "SELECT * FROM tasks WHERE 1=1"
        params: list[Any] = []
        if status:
            sql += " AND status = ?"
            params.append(status)
        sql += " ORDER BY id DESC LIMIT ?"
        params.append(limit)
        return self.all(sql, params)

    def close_task(self, task_id: int) -> None:
        self.execute("UPDATE tasks SET status = 'done' WHERE id = ?", (task_id,))
        self.log_event("task.done", f"#{task_id}")

    # --- напоминания ---------------------------------------------------
    def add_reminder(self, kind: str, ref_id: int, message: str, due_at: str) -> int:
        cur = self.execute(
            "INSERT INTO reminders(kind, ref_id, message, due_at, created_at) VALUES (?,?,?,?,?)",
            (kind, ref_id, message, due_at, now_iso()),
        )
        return int(cur.lastrowid)

    def due_reminders(self, limit: int = 50) -> list[dict[str, Any]]:
        return self.all(
            "SELECT * FROM reminders WHERE sent_at IS NULL AND due_at <= ? ORDER BY due_at LIMIT ?",
            (now_iso(), limit),
        )

    def mark_reminder_sent(self, reminder_id: int) -> None:
        self.execute("UPDATE reminders SET sent_at = ? WHERE id = ?", (now_iso(), reminder_id))

    def claim_reminder(self, reminder_id: int) -> bool:
        """Атомарно резервирует напоминание: два воркера не отправят одно и то же."""
        cur = self.execute(
            "UPDATE reminders SET sent_at = ? WHERE id = ? AND sent_at IS NULL",
            (now_iso(), reminder_id),
        )
        return cur.rowcount > 0

    def release_reminder(self, reminder_id: int) -> None:
        self.execute("UPDATE reminders SET sent_at = NULL WHERE id = ?", (reminder_id,))

    def cancel_reminders(self, kind: str, ref_id: int) -> int:
        """Отменяет ещё не отправленные напоминания, например после оплаты счёта."""
        cur = self.execute(
            "UPDATE reminders SET sent_at = ? WHERE kind = ? AND ref_id = ? AND sent_at IS NULL",
            (now_iso(), kind, ref_id),
        )
        return max(cur.rowcount, 0)

    def pending_reminders(self, limit: int = 50) -> list[dict[str, Any]]:
        return self.all(
            "SELECT * FROM reminders WHERE sent_at IS NULL ORDER BY due_at LIMIT ?", (limit,)
        )

    # --- служебное -----------------------------------------------------
    def log_event(self, kind: str, detail: str) -> None:
        self.execute(
            "INSERT INTO events(kind, detail, created_at) VALUES (?,?,?)", (kind, detail, now_iso())
        )

    def events(self, limit: int = 20) -> list[dict[str, Any]]:
        return self.all("SELECT * FROM events ORDER BY id DESC LIMIT ?", (limit,))

    def setting(self, key: str, default: str | None = None) -> str | None:
        row = self.one("SELECT value FROM settings WHERE key = ?", (key,))
        return row["value"] if row else default

    def set_setting(self, key: str, value: str) -> None:
        self.execute(
            "INSERT INTO settings(key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            (key, value),
        )

    def delete_setting(self, key: str) -> None:
        self.execute("DELETE FROM settings WHERE key = ?", (key,))

    def settings(self) -> dict[str, str]:
        return {row["key"]: row["value"] for row in self.all("SELECT key, value FROM settings")}

    def counts(self) -> dict[str, int]:
        return {
            "documents": int(self.one("SELECT count(*) AS n FROM documents")["n"]),
            "unpaid": int(self.one("SELECT count(*) AS n FROM documents WHERE status != 'paid'")["n"]),
            "overdue": int(
                self.one(
                    "SELECT count(*) AS n FROM documents WHERE status != 'paid' AND due_date < ?",
                    (now_iso()[:10],),
                )["n"]
            ),
            "open_tasks": int(self.one("SELECT count(*) AS n FROM tasks WHERE status = 'open'")["n"]),
            "pending_reminders": int(
                self.one("SELECT count(*) AS n FROM reminders WHERE sent_at IS NULL")["n"]
            ),
        }
