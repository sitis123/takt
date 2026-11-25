from __future__ import annotations

import re
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta
from typing import Any

from .money import normalise

_DATE_FORMATS = ("%d.%m.%Y", "%Y-%m-%d", "%d/%m/%Y", "%d %B %Y", "%d %b %Y")
_MONTHS = {
    "января": 1, "февраля": 2, "марта": 3, "апреля": 4, "мая": 5, "июня": 6,
    "июля": 7, "августа": 8, "сентября": 9, "октября": 10, "ноября": 11, "декабря": 12,
}


@dataclass(slots=True)
class Parsed:
    client_name: str = ""
    inn: str = ""
    email: str = ""
    amount: float = 0.0
    title: str = ""
    due_date: str = ""
    raw: dict[str, Any] = field(default_factory=dict)

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


def _clean(text: str) -> str:
    return text.replace("\r", "").strip()


def _today() -> datetime:
    return datetime.now()


def parse_date(text: str, today: datetime | None = None) -> str:
    """Достаёт дату из фразы вида 'до 25.11.2026' или 'через 7 дней'."""
    base = today or _today()
    lowered = text.lower()
    match = re.search(r"через\s+(\d+)\s*(день|дня|дней)", lowered)
    if match:
        return (base + timedelta(days=int(match.group(1)))).date().isoformat()
    if "завтра" in lowered:
        return (base + timedelta(days=1)).date().isoformat()
    if "послезавтра" in lowered:
        return (base + timedelta(days=2)).date().isoformat()
    for month_name, month_number in _MONTHS.items():
        match = re.search(rf"(\d{{1,2}})\s+{month_name}", lowered)
        if match:
            return datetime(base.year, month_number, int(match.group(1))).date().isoformat()
    for pattern in (r"\d{2}\.\d{2}\.\d{4}", r"\d{4}-\d{2}-\d{2}", r"\d{2}/\d{2}/\d{4}"):
        match = re.search(pattern, text)
        if match:
            raw = match.group(0)
            for fmt in _DATE_FORMATS:
                try:
                    return datetime.strptime(raw, fmt).date().isoformat()
                except ValueError:
                    continue
    return ""


def _amount(text: str) -> float:
    patterns = (
        r"(?:сумма|на\s+сумму|итого|total|₽|руб)[^\d]{0,12}([\d\s\u00a0]+(?:[.,]\d{1,2})?)",
        r"([\d\s\u00a0]+(?:[.,]\d{1,2})?)\s*(?:₽|рубл(?:ь|я|ей))",
    )
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            candidate = re.sub(r"\s|\u00a0", "", match.group(1))
            try:
                return float(normalise(candidate))
            except Exception:
                continue
    match = re.search(r"(?<!\d)(\d{3,}(?:[.,]\d{1,2})?)(?!\d)", text)
    if match:
        try:
            return float(normalise(match.group(1)))
        except Exception:
            return 0.0
    return 0.0


def _client_name(text: str) -> str:
    labelled = re.search(
        r"(?:клиент|заказчик|кому|получатель|client)\s*[:\-–]\s*(.+)", text, re.IGNORECASE
    )
    if labelled:
        return _clean(labelled.group(1).splitlines()[0])[:120]
    organisation = re.search(r"(ООО|ИП|АО|ОАО|ООО)\s*[«\"']?([^\n«»\"']{2,60})", text, re.IGNORECASE)
    if organisation:
        return _clean(organisation.group(0))[:120]
    for line in text.splitlines():
        stripped = _clean(line)
        if stripped and not stripped.lower().startswith(("сумма", "итого", "тема", "predmet", "реквизиты")):
            return stripped[:120]
    return ""


def parse_text(text: str, today: datetime | None = None) -> Parsed:
    """Детерминированный парсер: работает без AI и без сети."""
    source = _clean(text)
    inn_match = re.search(r"\bИНН\s*[:\-]?\s*(\d{10,12})\b", source, re.IGNORECASE)
    email_match = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", source)
    title_match = re.search(r"(?:тема|предмет|описание|за\s+(?:что|услуги|работы))\s*[:\-]\s*(.+)", source, re.IGNORECASE)
    title = _clean(title_match.group(1).splitlines()[0])[:160] if title_match else ""
    if not title:
        first_line = next((line.strip() for line in source.splitlines() if line.strip()), "")
        title = first_line[:160] if first_line else "Работы и услуги"
    return Parsed(
        client_name=_client_name(source),
        inn=inn_match.group(1) if inn_match else "",
        email=email_match.group(0) if email_match else "",
        amount=_amount(source),
        title=title,
        due_date=parse_date(source, today),
        raw={"length": len(source), "engine": "local"},
    )


def parse_table(text: str) -> list[dict[str, str]]:
    """Превращает скрин/текст таблицы в строки: разделитель — таб, ';' или '|'."""
    rows: list[dict[str, str]] = []
    lines = [line.strip() for line in _clean(text).splitlines() if line.strip()]
    if not lines:
        return rows
    separator = "|" if "|" in lines[0] else ("\t" if "\t" in lines[0] else ";")
    header = [cell.strip() for cell in lines[0].split(separator)]
    if not any(header):
        return rows
    for line in lines[1:]:
        cells = [cell.strip() for cell in line.split(separator)]
        if not any(cells):
            continue
        row = {name: cells[index] if index < len(cells) else "" for index, name in enumerate(header)}
        rows.append(row)
    return rows
