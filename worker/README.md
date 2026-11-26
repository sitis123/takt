# Такт на Cloudflare Workers

Порт продукта «Такт» в один JS-файл без npm-зависимостей. Логика продублирована из `src/takt/*.py`; общий фронтенд `web/` встраивается в бандл. После изменений `web/` или `worker/index.js` пересобирайте бандл: `python scripts/build_worker.py`.

## 1. Сборка

Из корня проекта:

```bash
python scripts/build_worker.py
```

Результат: `worker/dist/takt-worker.js`. Скрипт берёт `worker/index.js`, заменяет маркер `__TAKT_ASSETS__` на JSON со строками `web/index.html`, `web/styles.css`, `web/app.js` и записывает готовый модуль.

Проверка:

```bash
python -m pytest
```

## 2. База D1

Binding `DB` обязателен — Worker сам создаёт таблицы `clients`, `documents`, `tasks`, `reminders`, `events`, `settings` при первом запросе (`CREATE TABLE IF NOT EXISTS`).

Через wrangler (единственный инструмент вне проекта, npm-пакеты в Worker не используются):

```bash
npx wrangler d1 create takt-db
```

Пример `wrangler.toml` (можно создать рядом с корнем проекта):

```toml
name = "takt"
main = "worker/dist/takt-worker.js"
compatibility_date = "2024-06-01"

[[d1_databases]]
binding = "DB"
database_name = "takt-db"
database_id = "<UUID из вывода wrangler d1 create>"

[triggers]
crons = ["*/5 * * * *"] # scheduled(): напоминания; дайджест в 09:00 UTC
```

Через API можно создать базу так:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/d1/database" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"takt-db"}'
```

## 3. Деплой готового файла

**Dashboard:** Workers & Pages → Create → Upload Worker → загрузить `worker/dist/takt-worker.js` (или вставить содержимое в Quick Edit). Затем Settings → Variables & Bindings → добавить D1 binding `DB`, секреты и Cron Trigger `* * * * *`.

**wrangler (рекомендуется, сохраняет bindings и cron):**

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler deploy
```

**API (вариант загрузки скрипта):**

```bash
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/workers/scripts/takt" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/javascript" \
  --data-binary @worker/dist/takt-worker.js
```

После загрузки через API binding `DB`, cron и секреты всё равно задаются в Dashboard или `wrangler.toml`.

## 4. Переменные и секреты

| Имя | Где задать | Назначение |
| --- | --- | --- |
| `DB` | D1 binding | **Обязательно**, основное хранилище |
| `TELEGRAM_BOT_TOKEN` | secret | Токен бота; без него Telegram и напоминания не работают |
| `TELEGRAM_WEBHOOK_SECRET` | secret | Если задан, webhook доступен только по `/telegram/<секрет>`; иначе `/telegram` |
| `AI_BASE_URL`, `AI_API_KEY` | secret | Необязательно; включают AI-дообработку текста, фото и голос |
| `AI_MODEL`, `AI_VISION_MODEL` | vars | Пусто → `gemini-2.0-flash` для Gemini, иначе `gpt-4o-mini` |

Токены и ключи не пишутся в логи.

Чат для уведомлений задаётся через API (заправляется в таблицу `settings`):

```bash
curl -X POST "https://takt.<account>.workers.dev/api/settings" \
  -H "Content-Type: application/json" \
  -d '{"notify_chat_id": 123456789}'
```

`GET /api/settings` возвращает текущее значение `{"notify_chat_id": "..."}`.

## 5. Telegram webhook

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://takt.<account>.workers.dev/telegram/<TELEGRAM_WEBHOOK_SECRET>","secret_token":"<TELEGRAM_WEBHOOK_SECRET>"}'
```

Команды: `/start`, `/help`, `/invoice`, `/capture`, `/task`, `/status`, `/report`, `/paid <id>`. Обычный текст становится задачей. Фото и голос обрабатываются только при наличии `AI_BASE_URL` + `AI_API_KEY`.

## 6. Маршруты

`GET /api/health`, `GET /api/overview`, `GET /api/documents?limit&status&kind`, `POST /api/invoices`, `POST /api/documents/:id/paid`, `GET /api/documents/:id/file?kind=invoice|act`, `GET /api/documents/:id/download?key=...`, `GET /api/documents/:id/export.xlsx`, `POST /api/capture`, `POST /api/tasks`, `POST /api/tasks/:id/done`, `GET /api/reports/weekly`, `GET /api/reminders/due`, `POST /api/reminders/flush`, `GET|POST /api/settings`, `GET /api/agent/digest`, `POST /api/agent/digest/send?force=1`.

Админ-роуты (`agent`, `settings`, `reminders`) требуют `Authorization: Bearer <TAKT_ADMIN_TOKEN>`; при отсутствии отдельного токена используется `TELEGRAM_WEBHOOK_SECRET`.

Статика: `/` → 302 `/web/`, затем `/web/`, `/web/styles.css`, `/web/app.js` — из встроенных ассетов. Ошибки — JSON `{"detail": "..."}` со статусами 400/404/422.
