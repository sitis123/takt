# Такт

Тихий администратор для рутины. Один продукт, три точки входа: веб-интерфейс, Telegram-бот и локальная утилита. Все трое работают с одной базой и одним прикладным слоем.

Такт закрывает четыре повторяющиеся задачи:

1. **Счёт и акт** из договора или переписки, с напоминанием об оплате.
2. **Таблица из фото/скрина** — распознавание и чистый CSV.
3. **Отчёт за неделю** — деньги, просрочки, задачи.
4. **Задача с дедлайном** из текста или голосового сообщения.

## Быстрый старт

```powershell
python -m pip install -e .
$env:PYTHONPATH = "src"
python -m takt init
python -m takt serve
```

Откройте <http://127.0.0.1:8765/>.

Без AI-ключа всё работает на локальном парсере: он достаёт клиента, ИНН, сумму и дату из текста. AI подключается при наличии OpenAI-совместимого API и улучшает распознавание, фото и голос.

### Telegram-бот

```powershell
$env:TELEGRAM_BOT_TOKEN = "токен от @BotFather"
python -m takt bot
```

Команды: `/invoice`, `/capture`, `/task`, `/status`, `/report`, `/paid <номер>`. Фото распознаётся как таблица, голос — как задача.

### Утилита

```powershell
python -m takt invoice --text "Клиент: ООО Ромашка`nСумма 150 000 ₽`nдо 25.11.2026"
python -m takt capture --file table.txt
python -m takt task --text "Позвонить в банк до 30 ноября"
python -m takt report
python -m takt overview
python -m takt reminders
```

## Настройка

Скопируйте `.env.example` в `.env` и заполните при необходимости:

- `TAKT_HOME` — каталог базы и сгенерированных файлов (по умолчанию `~/.takt`);
- `TELEGRAM_BOT_TOKEN` — токен бота;
- `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`, `AI_VISION_MODEL` — AI-провайдер;
- `TAKT_WEB_ORIGIN` — публичный адрес веба.

Секреты читаются только из окружения, в базу и в файлы не попадают.

## Тесты

```powershell
$env:PYTHONPATH = "src"
python -m pytest
```

## Структура

```
src/takt/
  config.py      конфигурация из окружения
  db.py          SQLite-хранение, общее для всех интерфейсов
  parser.py      локальный парсер текста и таблиц
  ai.py          опциональный AI-адаптер
  money.py       форматирование сумм и суммы словами
  render.py      печатные формы счёта и акта
  services.py    прикладная логика
  api.py         FastAPI + раздача веба
  bot.py         Telegram-бот
  cli.py         консольная утилита
web/             интерфейс без сборки: HTML, CSS, JS
tests/           тесты парсера, логики и API
docs/            продукт, архитектура, эксплуатация
```

Подробности — в [docs/PRODUCT.md](docs/PRODUCT.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/OPERATIONS.md](docs/OPERATIONS.md).
