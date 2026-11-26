from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse, RedirectResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .config import get_config
from .services import Takt
from .xlsx import xlsx_bytes

WEB_DIR = Path(__file__).resolve().parent.parent.parent / "web"
app = FastAPI(title="Такт", description="Администратор рутины", version="0.1.0")
_service: Takt | None = None


def service() -> Takt:
    global _service
    if _service is None:
        _service = Takt(get_config())
    return _service


class TextIn(BaseModel):
    text: str = Field(min_length=1)


class InvoiceIn(TextIn):
    due_days: int = Field(default=7, ge=0, le=365)


class TaskIn(TextIn):
    source: str = "web"


class SettingsIn(BaseModel):
    notify_chat_id: int | None = None


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "product": "takt"}


@app.get("/api/overview")
def overview() -> dict:
    return service().overview()


@app.get("/api/documents")
def documents(
    limit: int = Query(default=50, ge=1, le=200),
    status: str | None = None,
    kind: str | None = None,
) -> list[dict]:
    return service().store.documents(limit=limit, status=status, kind=kind)


@app.post("/api/invoices", status_code=201)
def create_invoice(body: InvoiceIn) -> dict:
    try:
        return service().create_invoice(body.text, body.due_days)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/documents/{doc_id}/paid")
def mark_paid(doc_id: int) -> dict:
    try:
        return service().mark_paid(doc_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.get("/api/documents/{doc_id}/file")
def document_file(doc_id: int, kind: str = "invoice") -> FileResponse:
    doc = service().store.document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Документ не найден")
    key = "act_file" if kind == "act" else "invoice_file"
    path = doc.get("payload", {}).get(key)
    if not path or not Path(path).exists():
        raise HTTPException(status_code=404, detail="Файл документа не найден")
    return FileResponse(path, media_type="text/html", filename=Path(path).name)


@app.get("/api/documents/{doc_id}/download")
def download_document(doc_id: int, key: str = "invoice_file") -> FileResponse:
    doc = service().store.document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Документ не найден")
    path = doc.get("payload", {}).get(key)
    if not path or not Path(path).exists():
        raise HTTPException(status_code=404, detail="Файл не найден")
    media = "text/html" if str(path).endswith(".html") else "text/csv"
    return FileResponse(path, media_type=media, filename=Path(path).name)


@app.get("/api/documents/{doc_id}/export.xlsx")
def export_xlsx(doc_id: int) -> Response:
    doc = service().store.document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Документ не найден")
    rows = doc.get("payload", {}).get("table") or []
    return Response(
        content=xlsx_bytes(rows),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="takt-{doc_id:04d}.xlsx"',
            "X-Content-Type-Options": "nosniff",
        },
    )


@app.post("/api/capture", status_code=201)
def capture(body: TextIn) -> dict:
    try:
        return service().capture(text=body.text)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/api/tasks", status_code=201)
def create_task(body: TaskIn) -> dict:
    try:
        return service().create_task(body.text, body.source)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/tasks/{task_id}/done")
def close_task(task_id: int) -> dict[str, bool]:
    service().close_task(task_id)
    return {"ok": True}


@app.get("/api/reports/weekly")
def weekly_report() -> dict[str, str]:
    return {"text": service().weekly_report()}


@app.get("/api/reminders/due")
def due_reminders() -> list[dict]:
    return service().store.due_reminders()


@app.post("/api/reminders/flush")
def flush_reminders() -> dict[str, int]:
    from . import bot as bot_module

    return {"sent": service().flush_reminders(bot_module.notify)}


@app.get("/api/settings")
def get_settings() -> dict[str, str]:
    return service().store.settings()


@app.post("/api/settings")
def update_settings(body: SettingsIn) -> dict[str, str]:
    if body.notify_chat_id is not None:
        service().store.set_setting("notify_chat_id", str(body.notify_chat_id))
    return service().store.settings()


@app.get("/api/agent/digest")
def agent_digest() -> dict[str, str]:
    return {"text": service().agent_digest()["text"]}


@app.post("/api/agent/digest/send")
def send_digest(force: bool = False) -> dict[str, int]:
    from . import bot as bot_module

    def sender(chat: str, text: str) -> None:
        bot_module.notify(text, chat)

    return {"sent": service().send_digest(sender, force=force)}


if WEB_DIR.exists():
    app.mount("/web", StaticFiles(directory=WEB_DIR, html=True), name="web")


@app.get("/")
def index() -> Response:
    landing = WEB_DIR / "landing.html"
    if landing.exists():
        return FileResponse(landing, media_type="text/html; charset=utf-8")
    return RedirectResponse(url="/web/", status_code=302)
