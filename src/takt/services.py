from __future__ import annotations

import csv
import io
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Callable

from .ai import AI, AIError
from .config import Config, get_config
from .db import Store, now_iso
from .money import money
from .parser import Parsed, parse_table, parse_text
from .render import act_html, invoice_html


def safe_cell(value: Any) -> Any:
    """Предотвращает выполнение ячейки как формулы при открытии CSV в Excel."""
    text = str(value)
    if isinstance(value, str) and text.startswith(("=", "+", "-", "@", "\t", "\r")):
        return "'" + text
    return value


class Takt:
    """Прикладной слой: один и тот же используется вебом, ботом и CLI."""

    def __init__(
        self, config: Config | None = None, store: Store | None = None, ai: AI | None = None
    ) -> None:
        self.config = config or get_config()
        self.store = store or Store(self.config.db_path)
        self.ai = ai if ai is not None else AI(self.config)

    # --- понимание входа ------------------------------------------------
    def _understand(self, text: str) -> Parsed:
        parsed = parse_text(text)
        if not self.ai.enabled:
            return parsed
        try:
            fields = self.ai.extract_fields(text)
        except Exception:
            return parsed
        for key in ("client_name", "inn", "email", "title", "due_date"):
            value = str(fields.get(key) or "").strip()
            if value:
                setattr(parsed, key, value[:160])
        try:
            parsed.amount = float(fields.get("amount") or parsed.amount)
        except (TypeError, ValueError):
            pass
        parsed.raw["engine"] = "ai+local"
        return parsed

    # --- счета и акты ---------------------------------------------------
    def create_invoice(self, text: str, due_days: int = 7) -> dict[str, Any]:
        text = text.strip()
        if not text:
            raise ValueError("Нет текста для счёта")
        if not 0 <= due_days <= 365:
            raise ValueError("Срок оплаты должен быть от 0 до 365 дней")
        parsed = self._understand(text)
        try:
            parsed_due = date.fromisoformat(parsed.due_date[:10]) if parsed.due_date else None
        except ValueError:
            parsed_due = None
        due_date = parsed_due.isoformat() if parsed_due else (date.today() + timedelta(days=due_days)).isoformat()
        client_name = parsed.client_name or "Клиент без названия"
        client = self.store.find_client(client_name)
        client_id = client["id"] if client else self.store.add_client(
            name=client_name, inn=parsed.inn or None, email=parsed.email or None
        )
        doc_id = self.store.add_document(
            kind="invoice",
            title=parsed.title or "Работы и услуги",
            client_name=client_name,
            client_id=client_id,
            amount=parsed.amount,
            due_date=due_date,
            payload={"inn": parsed.inn, "email": parsed.email, "source": parsed.raw.get("engine", "local")},
        )
        doc = self.store.document(doc_id) or {}
        invoice_path = self.config.out_dir / f"{doc_id:04d}-invoice.html"
        act_path = self.config.out_dir / f"{doc_id:04d}-act.html"
        invoice_path.write_text(invoice_html(doc, client), encoding="utf-8")
        act_path.write_text(act_html(doc, client), encoding="utf-8")
        self.store.update_document(
            doc_id,
            payload={
                **doc.get("payload", {}),
                "invoice_file": str(invoice_path),
                "act_file": str(act_path),
            },
            status="sent",
        )
        self.store.add_reminder(
            "payment",
            doc_id,
            f"Счёт №{doc_id:04d} на {money(parsed.amount)} — оплата до {due_date}",
            f"{due_date}T09:00:00+00:00",
        )
        return self.store.document(doc_id) or {}

    def mark_paid(self, doc_id: int) -> dict[str, Any]:
        doc = self.store.document(doc_id)
        if not doc:
            raise ValueError(f"Документ #{doc_id} не найден")
        self.store.update_document(doc_id, status="paid")
        self.store.cancel_reminders("payment", doc_id)
        self.store.log_event("payment.received", f"#{doc_id} — {money(doc.get('amount', 0))}")
        return self.store.document(doc_id) or {}

    # --- ввод таблиц ----------------------------------------------------
    def capture(
        self, text: str | None = None, image_bytes: bytes | None = None, mime: str = "image/jpeg"
    ) -> dict[str, Any]:
        if image_bytes:
            if not self.ai.enabled:
                raise AIError("Для распознавания фото нужен AI-провайдер (AI_BASE_URL и AI_API_KEY)")
            text = self.ai.vision_to_text(image_bytes, mime)
        if not text or not text.strip():
            raise ValueError("Нет данных для импорта")
        rows = parse_table(text)
        if not rows:
            raise ValueError("Не удалось найти таблицу. Пришли строки с разделителем | или ;")
        header = list(rows[0].keys())
        buffer = io.StringIO()
        writer = csv.writer(buffer, delimiter=";", lineterminator="\r\n")
        writer.writerow([safe_cell(value) for value in header])
        for row in rows:
            writer.writerow([safe_cell(row.get(column, "")) for column in header])
        path = self.config.out_dir / f"capture-{datetime.now():%Y%m%d-%H%M%S-%f}.csv"
        path.write_text("\ufeff" + buffer.getvalue(), encoding="utf-8")
        doc_id = self.store.add_document(
            kind="capture",
            title=f"Импорт: {len(rows)} строк",
            client_name="—",
            payload={"file": str(path), "preview": rows[:5], "rows": len(rows), "table": rows[:500]},
            status="done",
        )
        return {"document_id": doc_id, "rows": len(rows), "file": str(path), "preview": rows[:5]}

    # --- задачи и напоминания ------------------------------------------
    def create_task(self, text: str, source: str = "text") -> dict[str, Any]:
        text = text.strip()
        if not text:
            raise ValueError("Пустая задача")
        parsed = parse_text(text)
        title = clean_task_title(text)
        due_date = parsed.due_date
        task_id = self.store.add_task(title=title, due_date=due_date, source=source)
        if due_date:
            self.store.add_reminder(
                "task", task_id, f"Задача: {title}", f"{due_date}T09:00:00+00:00"
            )
        task = {"id": task_id, "title": title, "due_date": due_date, "status": "open", "source": source}
        return task

    def close_task(self, task_id: int) -> None:
        self.store.close_task(task_id)

    def flush_reminders(self, sender: Callable[[str], None]) -> int:
        sent = 0
        for reminder in self.store.due_reminders():
            if not self.store.claim_reminder(reminder["id"]):
                continue
            try:
                sender(reminder["message"])
            except Exception:
                self.store.release_reminder(reminder["id"])
                continue
            self.store.log_event("reminder.sent", reminder["message"])
            sent += 1
        return sent

    # --- отчёты и сводки ------------------------------------------------
    def overview(self) -> dict[str, Any]:
        return {
            "counts": self.store.counts(),
            "documents": self.store.documents(limit=8),
            "tasks": self.store.tasks(limit=8),
            "events": self.store.events(limit=8),
        }

    def weekly_report(self) -> str:
        week_ago = (datetime.now() - timedelta(days=7)).date().isoformat()
        docs = [
            doc
            for doc in self.store.documents(limit=200)
            if doc.get("kind") == "invoice"
            and str(doc.get("created_at", ""))[:10] >= week_ago
        ]
        paid = sum(float(doc.get("amount") or 0) for doc in docs if doc.get("status") == "paid")
        waiting = sum(float(doc.get("amount") or 0) for doc in docs if doc.get("status") != "paid")
        overdue = [doc for doc in docs if doc.get("due_date") and doc["due_date"] < date.today().isoformat() and doc.get("status") != "paid"]
        tasks = self.store.tasks(limit=100)
        lines = [
            f"Отчёт за неделю · {date.today():%d.%m.%Y}",
            "",
            f"Счетов за неделю: {len(docs)}",
            f"Оплачено: {money(paid)}",
            f"Ожидаем: {money(waiting)}",
            f"Просрочено: {len(overdue)}",
            f"Открытых задач: {len(tasks)}",
        ]
        if overdue:
            lines += ["", "Нужно напомнить:"]
            for doc in overdue:
                lines.append(f"• #{doc['id']:04d} {doc['client_name']} — {money(doc['amount'])} до {doc['due_date']}")
        if tasks:
            lines += ["", "В работе:"]
            for task in tasks[:10]:
                suffix = f" (до {task['due_date']})" if task.get("due_date") else ""
                lines.append(f"• {task['title']}{suffix}")
        return "\n".join(lines)

    # --- дежурный агент --------------------------------------------------
    def register_chat(self, chat_id: int | str) -> None:
        self.store.set_setting(f"tg_chat:{chat_id}", "1")
        if not self.store.setting("notify_chat_id"):
            self.store.set_setting("notify_chat_id", str(chat_id))

    def known_chats(self) -> list[str]:
        return [key.split(":", 1)[1] for key in self.store.settings() if key.startswith("tg_chat:")]

    def agent_digest(self) -> dict[str, Any]:
        counts = self.store.counts()
        urgent = counts.get("overdue", 0)
        lines = [
            f"Такт · дежурный обзор · {date.today():%d.%m.%Y}",
            "",
            f"Счетов: {counts['documents']} · ждут оплаты: {counts['unpaid']} · просрочено: {urgent}",
            f"Открытых задач: {counts['open_tasks']} · напоминаний в очереди: {counts['pending_reminders']}",
            "",
            "Что сделать:",
            "• Рутина под контролем — ничего не горит." if not urgent else f"• Просрочено счетов: {urgent} — напомнить.",
        ]
        return {"text": "\n".join(lines), "chats": self.known_chats()}

    def send_digest(self, sender: Callable[[str, str], None], force: bool = False) -> int:
        key = f"agent_digest:{date.today().isoformat()}"
        if not force and self.store.setting(key):
            return 0
        digest = self.agent_digest()
        sent = 0
        for chat in digest["chats"]:
            try:
                sender(chat, digest["text"])
            except Exception:
                continue
            sent += 1
        if sent or not digest["chats"]:
            self.store.set_setting(key, "1")
        return sent


def clean_task_title(text: str) -> str:
    result = text.strip()
    for prefix in ("напомни", "нужно", "задача", "сделай", "не забудь", "поставь задачу"):
        if result.lower().startswith(prefix):
            result = result[len(prefix) :].lstrip(" :,-–—")
    return result[:200] or text.strip()[:200]
