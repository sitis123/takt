from takt.money import money, normalise, rubles_in_words


def test_normalise_comma_and_spaces():
    assert normalise("150 000,50") == normalise("150000.5")


def test_money_format():
    assert money(150000) == "150 000,00 ₽"


def test_words_for_large_amount():
    words = rubles_in_words(150000)
    assert "сто пятьдесят тысяч" in words.lower()
    assert "рублей" in words
    assert "00 копеек" in words
