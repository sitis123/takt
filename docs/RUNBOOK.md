# Runbook: быстрая диагностика

## Cloudflare-first (рабочий контур)

```powershell
curl.exe -fsS -o NUL -w "%{http_code}`n" https://takt.gwsuite.workers.dev/api/health
curl.exe -fsS -o NUL -w "%{http_code}`n" https://takt.gwsuite.workers.dev/web/
```

Ожидается `200` и `{"status":"ok","product":"takt"}`. Если `curl` в Windows дал таймаут, но браузер/webfetch видит страницу — это локальный канал, не поломка продукта.

Порядок проверок:

1. GitHub → Actions → `Deploy to Cloudflare`: последний run должен быть `completed successfully`.
2. Cloudflare Dashboard → Workers → `takt` → Settings → D1 bindings: `DB` → `takt-db`; Triggers → Cron `*/5 * * * *`.
3. Cloudflare Dashboard → D1 → `takt-db`: таблицы `clients`, `documents`, `tasks`, `reminders`, `events`, `settings`.
4. GitHub Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`; Variables: `CLOUDFLARE_DEPLOY=true`.
5. Telegram: `getWebhookInfo` должен показывать `https://takt.<subdomain>.workers.dev/telegram/<secret>`.

## Админ-эндпоинты

Запросы к `/api/agent/digest`, `/api/agent/digest/send`, `/api/settings`, `/api/reminders/due`, `/api/reminders/flush` требуют заголовок:

```
Authorization: Bearer <TAKT_ADMIN_TOKEN>
```

Если `TAKT_ADMIN_TOKEN` не задан, используется `TELEGRAM_WEBHOOK_SECRET`. Токены не печатать в чаты и логи.

## Полезные вызовы

```powershell
$h = @{ Authorization = "Bearer <ADMIN_TOKEN>" }
Invoke-RestMethod -Headers $h https://takt.gwsuite.workers.dev/api/agent/digest
Invoke-RestMethod -Method Post -Headers $h 'https://takt.gwsuite.workers.dev/api/agent/digest/send?force=1'
Invoke-RestMethod -Headers $h https://takt.gwsuite.workers.dev/api/reminders/due
Invoke-RestMethod -Method Post -Headers $h https://takt.gwsuite.workers.dev/api/reminders/flush
```

- `POST /api/settings` с `{"notify_chat_id": 123}` задаёт чат напоминаний.
- Чат для дайджеста появляется после `/start` или `/status`.
- `GET /api/documents/<id>/export.xlsx` возвращает настоящий XLSX.

## Типичные поломки

| Симптом | Причина | Лечение |
| --- | --- | --- |
| 401 на админ-роуте | неверный/отсутствующий токен | проверить `TAKT_ADMIN_TOKEN` и `TELEGRAM_WEBHOOK_SECRET` в Secrets |
| 404 на `/telegram` | секрет не совпал или не задан | перезаписать секрет и перевыставить webhook через workflow |
| Бот не отвечает | заблокирован или webhook сбит | `getWebhookInfo`, затем повторный run `Deploy to Cloudflare` |
| Напоминания не приходят | нет `notify_chat_id` | написать боту `/status` или `POST /api/settings` |
| Дайджест не приходит | чат не зарегистрирован | написать боту `/status`, затем `?force=1` |
| Excel не открывается | старый бандл без санитизации XML | пересобрать `python scripts/build_worker.py` и задеплоить |

## VPS-архив

`deploy/` оставлен только как архив. SSH, systemd, `cloudflared`, домен `takt.example.com`, `/var/lib/takt` и VPN в рабочем контуре не используются.
