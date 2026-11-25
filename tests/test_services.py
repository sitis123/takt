from pathlib import Path

from takt.config import Config
from takt.services import Takt


def make_service(tmp_path: Path) -> Takt:
    config = Config(home=tmp_path, ai_base_url="", ai_api_key="", bot_token="")
    return Takt(config)


def test_invoice_creates_documents_files_and_reminder(tmp_path):
    service = make_service(tmp_path)
    doc = service.create_invoice(
        "Клиент: ООО «Ромашка»\nИНН: 7707083893\nСумма 120 000 ₽\nдо 20.12.2026",
        due_days=7,
    )
    assert doc["amount"] == 120000.0
    assert doc["client_name"] == "ООО «Ромашка»"
    assert doc["due_date"] == "2026-12-20"
    assert doc["status"] == "sent"
    assert Path(doc["payload"]["invoice_file"]).exists()
    assert Path(doc["payload"]["act_file"]).exists()
    assert service.store.due_reminders() == []  # срок в будущем

    paid = service.mark_paid(doc["id"])
    assert paid["status"] == "paid"


def test_capture_creates_csv(tmp_path):
    service = make_service(tmp_path)
    result = service.capture(text="Имя | Сумма\nА | 10\nБ | 20")
    assert result["rows"] == 2
    content = Path(result["file"]).read_text(encoding="utf-8-sig")
    assert "Имя;Сумма" in content
    assert "Б;20" in content


def test_task_with_due_date_adds_reminder(tmp_path):
    service = make_service(tmp_path)
    task = service.create_task("Напомни позвонить в банк до 30.11.2026", source="test")
    assert task["due_date"] == "2026-11-30"
    assert "позвонить" in task["title"]
    reminders = service.store.one("SELECT * FROM reminders WHERE kind = 'task'")
    assert reminders is not None


def test_weekly_report_has_numbers(tmp_path):
    service = make_service(tmp_path)
    service.create_invoice("Клиент: Тест\nСумма 5000\nзавтра")
    report = service.weekly_report()
    assert "Отчёт за неделю" in report
    assert "Счетов за неделю: 1" in report
