from __future__ import annotations

from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

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
_ONES_FEMININE = ("", "одна", "две") + _ONES[3:]
_TENS = ("", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто")
_HUNDREDS = ("", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот")


def normalise(value: float | int | str | Decimal) -> Decimal:
    try:
        raw = str(value).replace(" ", "").replace("\u00a0", "").replace(",", ".")
        return Decimal(raw).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except (InvalidOperation, ValueError, TypeError):
        return Decimal("0.00")


def money(value: float | int | str | Decimal, currency: str = "₽") -> str:
    amount = normalise(value)
    return f"{amount:,.2f}".replace(",", " ").replace(".", ",") + f" {currency}"


def _under_thousand(number: int, feminine: bool = False) -> str:
    parts = []
    ones = _ONES_FEMININE if feminine else _ONES
    hundreds, rest = divmod(number, 100)
    if hundreds:
        parts.append(_HUNDREDS[hundreds])
    if rest < 20:
        if rest:
            parts.append(ones[rest])
    else:
        tens, last = divmod(rest, 10)
        parts.append(_TENS[tens])
        if last:
            parts.append(ones[last])
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
    rubles = int(abs(amount))
    kopecks = int((abs(amount) - rubles) * 100)

    billions, rest = divmod(rubles, 1_000_000_000)
    millions, rest = divmod(rest, 1_000_000)
    thousands, units = divmod(rest, 1000)

    words: list[str] = []
    for count, forms in (
        (billions, ("миллиард", "миллиарда", "миллиардов")),
        (millions, ("миллион", "миллиона", "миллионов")),
        (thousands, ("тысяча", "тысячи", "тысяч")),
    ):
        if count:
            words.append(f"{_under_thousand(count, feminine=forms[0] == 'тысяча')} {_plural(count, *forms)}")

    ruble_form = _plural(rubles, "рубль", "рубля", "рублей")
    if rubles == 0 and not words:
        words.append("ноль рублей")
    elif units or not words:
        prefix = _under_thousand(units)
        words.append(f"{prefix} {ruble_form}" if prefix else ruble_form)
    else:
        words.append(ruble_form)
    words.append(f"{kopecks:02d} {_plural(kopecks, 'копейка', 'копейки', 'копеек')}")

    result = " ".join(word for word in words if word.strip())
    return ("минус " + result).capitalize() if amount < 0 else result.capitalize()
