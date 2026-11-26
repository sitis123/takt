from __future__ import annotations

import io
import zipfile
from datetime import date, timedelta
from xml.etree import ElementTree

from takt.config import Config
from takt.money import rubles_in_words
from takt.parser import parse_date, parse_table, parse_text
from takt.services import Takt
from takt.xlsx import xlsx_bytes


def service(tmp_path) -> Takt:
    return Takt(Config(home=tmp_path, ai_base_url="", ai_api_key="", bot_token=""))


def test_xlsx_is_valid_and_sanitizes_xml(tmp_path):
    data = xlsx_bytes([{"Имя": "A&B <скобки>", "Формула": "=1+1"}])
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        assert archive.testzip() is None
        assert "[Content_Types].xml" in archive.namelist()
        sheet = archive.read("xl/worksheets/sheet1.xml").decode("utf-8")
        assert "&amp;" in sheet and "&lt;" in sheet
        assert "\x00" not in sheet
        ElementTree.fromstring(sheet)


def test_parser_edge_cases():
    today = date.today()
    assert parse_date("послезавтра") == (today + timedelta(days=2)).isoformat()
    assert parse_date("31 февраля") != "2026-02-31"
    parsed = parse_text("ООО Тест\nИНН 7707083893\nСумма 15 000 ₽")
    assert parsed.inn == "7707083893"
    assert parsed.amount == 15000
    rows = parse_table("Имя | Сумma\nA | 1\n|---|---|\nB | 2")
    assert [row["Имя"] for row in rows] == ["A", "B"]


def test_rubles_in_words_extremes():
    assert rubles_in_words(-1).startswith("Минус")
    assert "миллиард" in rubles_in_words(1_000_000_000)
    assert rubles_in_words(0).startswith("Ноль") or rubles_in_words(0).startswith("Ноль")


def test_payment_cancels_reminder_and_digest_is_once(tmp_path):
    takt = service(tmp_path)
    due = (date.today() + timedelta(days=3)).isoformat()
    doc = takt.create_invoice(f"Клиент: Тест\nСумма 1000\nдо {due}")
    assert takt.store.one("SELECT id FROM reminders WHERE kind='payment' AND ref_id=?", (doc["id"],))
    takt.mark_paid(doc["id"])
    assert not takt.store.one(
        "SELECT id FROM reminders WHERE kind='payment' AND ref_id=? AND sent_at IS NULL", (doc["id"],)
    )

    takt.register_chat(12345)
    sent: list[tuple[str, str]] = []
    sender = lambda chat, text: sent.append((chat, text))
    assert takt.send_digest(sender) == 1
    assert takt.send_digest(sender) == 0
    assert sent and "Такт" in sent[0][1]
