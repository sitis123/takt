from datetime import datetime

from takt.parser import parse_date, parse_table, parse_text


def test_parse_text_extracts_routine_fields():
    text = """Клиент: ООО «Ромашка»
ИНН: 7707083893
Предмет: разработка лендинга
Сумма 150 000 ₽
Оплатить до 25.11.2026
mail: buh@romashka.ru"""
    parsed = parse_text(text, today=datetime(2026, 11, 1))
    assert "Ромашка" in parsed.client_name
    assert parsed.inn == "7707083893"
    assert parsed.email == "buh@romashka.ru"
    assert parsed.amount == 150000.0
    assert parsed.due_date == "2026-11-25"
    assert "лендинга" in parsed.title


def test_parse_date_relative():
    assert parse_date("через 3 дня", today=datetime(2026, 11, 1)) == "2026-11-04"
    assert parse_date("завтра", today=datetime(2026, 11, 1)) == "2026-11-02"


def test_parse_table_with_pipe_separator():
    rows = parse_table("Имя | Сумма | Дата\nА | 10 | 01.11\nБ | 20 | 02.11")
    assert rows[0] == {"Имя": "А", "Сумма": "10", "Дата": "01.11"}
    assert len(rows) == 2
