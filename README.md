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

Рабочий облачный контур: <https://takt.gwsuite.workers.dev/>. Обновления в `main` автоматически выкатываются workflow `Deploy to Cloudflare` (при `CLOUDFLARE_DEPLOY=true`); старый SSH-workflow `Deploy` не используется. Инструкция — в [docs/DEPLOY.md](docs/DEPLOY.md).

Оформление веба — глянцевый Frutiger Aero / старый Web 2.0: стеклянные панели, пузыри, синий воздух и мягкие нажимы. Всё на CSS, без внешних картинок и шрифтов.

Без AI-ключа всё работает на локальном парсере: он достаёт клиента, ИНН, сумму и дату из текста. С ключом Gemini (`AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai`) включаются фото→CSV, голос→задача и умный разбор договора. Документы можно скачать в HTML и настоящем `.xlsx`; дежурный агент раз в день присылает короткий обзор. Недельный отчёт доступен по `/report` и `GET /api/reports/weekly`.

### Telegram-бот

```powershell
$env:TELEGRAM_BOT_TOKEN = "токен от @BotFather"
python -m takt bot
```

Команды: `/start`, `/help`, `/invoice`, `/capture`, `/task`, `/status`, `/report`, `/paid <номер>`. Фото распознаётся как таблица, голос — как задача. Один раз напишите `/status`: это включит чат в ежедневный обзор и напоминания.

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

`.env.example` — шпаргалка: файл `.env` сам по себе не читается. Задавайте переменные через окружение PowerShell (`$env:AI_API_KEY="..."`) либо через GitHub Secrets для облака:

- `TAKT_HOME`, `TAKT_DB`, `TAKT_OUT` — каталог базы и файлов (по умолчанию `~/.takt`);
- `TELEGRAM_BOT_TOKEN` — токен бота, `TELEGRAM_ALLOWED_CHAT_IDS` — необязательный белый список чатов;
- `AI_BASE_URL`, `AI_API_KEY` — AI-провайдер; `AI_MODEL`/`AI_VISION_MODEL` оставьте пустыми, чтобы подставились дефолты (`gemini-2.0-flash` для Gemini, `gpt-4o-mini` иначе).

Секреты читаются только из окружения, в базу и в файлы не попадают. Веб и API на `workers.dev` публичны: не храните в них конфиденциальные данные до ввода авторизации.

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
  scheduler.py   планировщик напоминаний и дайджеста
  xlsx.py        генерация настоящего .xlsx
  cli.py         консольная утилита
web/             интерфейс без сборки: HTML, CSS, JS
tests/           тесты парсера, логики и API
deploy/          архивный VPS-вариант (не используется в Cloudflare-контуре)
docs/            продукт, архитектура, эксплуатация, деплой
```

Подробности — в [docs/PRODUCT.md](docs/PRODUCT.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/OPERATIONS.md](docs/OPERATIONS.md), [docs/DEPLOY.md](docs/DEPLOY.md) и [docs/RUNBOOK.md](docs/RUNBOOK.md).
