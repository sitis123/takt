# Деплой: GitHub → Cloudflare

Рабочий контур — облачный. VPS, SSH, домен, Cloudflare Tunnel и VPN не используются.

```
git push main
  → .github/workflows/cloudflare.yml
  → pytest + python scripts/build_worker.py
  → wrangler deploy (Worker takt)
  → GitHub Secrets → wrangler secret put
  → setWebhook + getWebhookInfo
  → GET /api/health (5 попыток)
  → https://takt.gwsuite.workers.dev/
```

## Адрес и состояние

- Прод: <https://takt.gwsuite.workers.dev/>
- Health: <https://takt.gwsuite.workers.dev/api/health> → `{"status":"ok","product":"takt"}`
- Веб: <https://takt.gwsuite.workers.dev/web/>
- Workflow: `Deploy to Cloudflare` (`cloudflare.yml`). Старый `Deploy` — VPS-архив, не запускать.
- Переменная репозитория `CLOUDFLARE_DEPLOY=true` включает выкладку в `main`.

## Секреты и переменные GitHub

Secrets:

| Имя | Назначение |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | выкладка Worker и D1 |
| `CLOUDFLARE_ACCOUNT_ID` | аккаунт Cloudflare |
| `TELEGRAM_BOT_TOKEN` | токен бота |
| `TELEGRAM_WEBHOOK_SECRET` | секрет пути вебхука и запасной админ-токен |
| `TAKT_ADMIN_TOKEN` | необязательный отдельный токен для админ-API |
| `AI_BASE_URL` | OpenAI-совместимый endpoint (Gemini: `https://generativelanguage.googleapis.com/v1beta/openai`) |
| `AI_API_KEY` | ключ провайдера; без него работает локальный парсер |

Variables: `CLOUDFLARE_DEPLOY=true`, необязательно `TELEGRAM_ALLOWED_CHAT_IDS=123,456`, `AI_MODEL`, `AI_VISION_MODEL`. Для Gemini модели оставьте пустыми — подставится `gemini-2.0-flash`.

`wrangler secret put` сразу создаёт новую версию Worker — отдельный редеплой после смены ключа не нужен.

## D1 и cron

- D1: `takt-db`, привязка `DB` в `wrangler.toml`. Реальный ID подставляется workflow; в репозитории плейсхолдер.
- Таблицы создаются лениво через `CREATE TABLE IF NOT EXISTS`; структуру меняйте миграцией вручную.
- Cron: `*/5 * * * *` — напоминания; короткий дайджест отправляется в 09:00 UTC с защитой от повторной отправки в тот же день.

## Telegram

Webhook: `https://takt.gwsuite.workers.dev/telegram/<TELEGRAM_WEBHOOK_SECRET>`. Дополнительно передаётся `secret_token`; Worker проверяет и сегмент пути, и заголовок `X-Telegram-Bot-Api-Secret-Token`. Секрет в URL не печатается в логах Actions.

Чат попадает в ежедневный дайджест после `/start` или `/status`. Админ-роуты (`/api/agent/*`, `/api/settings`, `/api/reminders/*`) требуют `Authorization: Bearer <TAKT_ADMIN_TOKEN>`; если отдельный токен не задан — используется `TELEGRAM_WEBHOOK_SECRET`.

## Что делать при падении

1. Открыть последний run `Deploy to Cloudflare` и ошибку шага.
2. Проверить health и веб; при сетевом таймауте повторить запрос — локальный канал до `workers.dev` иногда капризничает.
3. Проверить `getWebhookInfo`, секреты и Variable `CLOUDFLARE_DEPLOY`.
4. Подробности — [RUNBOOK.md](RUNBOOK.md).
