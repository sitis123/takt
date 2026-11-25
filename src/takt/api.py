from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .config import get_config
from .services import Takt

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


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "product": "takt"}


@app.get("/api/overview")
def overview() -> dict:
    return service().overview()


@app.get("/api/documents")
def documents(limit: int = 50, status: str | None = None, kind: str | None = None) -> list[dict]:
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


if WEB_DIR.exists():
    app.mount("/web", StaticFiles(directory=WEB_DIR, html=True), name="web")


@app.get("/")
def index() -> RedirectResponse:
    return RedirectResponse(url="/web/", status_code=302)
