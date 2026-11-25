from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP

_ONES = (
    "",
    "один",
    "два",
    "три",
    "четыре",
    "пять",
    "шесть",
    "семь",
    "восемь",
    "девять",
    "десять",
    "одиннадцать",
    "двенадцать",
    "тринадцать",
    "четырнадцать",
    "пятнадцать",
    "шестнадцать",
    "семнадцать",
    "восемнадцать",
    "девятнадцать",
)
_TENS = ("", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто")
_HUNDREDS = ("", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот")


def normalise(value: float | int | str | Decimal) -> Decimal:
    return Decimal(str(value).replace(" ", "").replace("\u00a0", "").replace(",", ".")).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )


def money(value: float | int | str | Decimal, currency: str = "₽") -> str:
    amount = normalise(value)
    return f"{amount:,.2f}".replace(",", " ").replace(".", ",") + f" {currency}"


def _under_thousand(number: int) -> str:
    parts = []
    hundreds, rest = divmod(number, 100)
    if hundreds:
        parts.append(_HUNDREDS[hundreds])
    if rest < 20:
        if rest:
            parts.append(_ONES[rest])
    else:
        tens, ones = divmod(rest, 10)
        parts.append(_TENS[tens])
        if ones:
            parts.append(_ONES[ones])
    return " ".join(parts)


def _plural(number: int, one: str, few: str, many: str) -> str:
    mod100, mod10 = number % 100, number % 10
    if 11 <= mod100 <= 14:
        return many
    if mod10 == 1:
        return one
    if 2 <= mod10 <= 4:
        return few
    return many


def rubles_in_words(value: float | int | str | Decimal) -> str:
    """Человеческая сумма для печатной формы документа."""
    amount = normalise(value)
    rubles = int(amount)
    kopecks = int((amount - rubles) * 100)
    words = []
    thousands, rest = divmod(rubles, 1000)
    millions, thousands = divmod(thousands, 1000)
    if millions:
        words.append(f"{_under_thousand(millions)} {_plural(millions, 'миллион', 'миллиона', 'миллионов')}")
    if thousands:
        words.append(f"{_under_thousand(thousands)} {_plural(thousands, 'тысяча', 'тысячи', 'тысяч')}")
    ruble_form = _plural(rubles, "рубль", "рубля", "рублей")
    words.append(f"{_under_thousand(rest)} {ruble_form}" if rest else ruble_form)
    words.append(f"{kopecks:02d} {_plural(kopecks, 'копейка', 'копейки', 'копеек')}")
    return " ".join(w for w in words if w.strip()).capitalize()
