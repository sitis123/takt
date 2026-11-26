# Эксплуатация

## Рабочий контур

- Прод: Cloudflare Worker `takt`, D1 `takt-db`, cron `*/5 * * * *`, адрес `https://takt.gwsuite.workers.dev/`.
- Обновление: `git push` в `main` → зелёный run `Deploy to Cloudflare` → проверка `/api/health`.
- Веб и `/api/*` на `workers.dev` публичны и без авторизации. Админ-роуты (`agent`, `settings`, `reminders`) защищены токеном. Не храните конфиденциальные данные до ввода полноценной авторизации.
- Telegram-бот отвечает любому чату, если не задан `TELEGRAM_ALLOWED_CHAT_IDS`; в дайджест попадают только чаты, написавшие `/start` или `/status`.

## Локальный режим

```powershell
$env:PYTHONPATH = "src"
python -m takt init
python -m takt serve
python -m takt scheduler --interval 60
```

Планировщик отправляет созревшие напоминания и один раз в день короткий обзор. Чат напоминаний локально хранится в `$TAKT_HOME/notify_chat_id`; в Worker — в таблице `settings` (`POST /api/settings`).

## Данные и безопасность

- Схема создаётся лениво (`CREATE TABLE IF NOT EXISTS`); при изменении структуры нужна ручная миграция/пересоздание D1.
- SQL-запросы параметризованы; пользовательский текст экранируется в HTML и XML; CSV/XLSX защищены от формульных инъекций.
- Секреты хранятся в GitHub Secrets и Worker env, в базу и логи не попадают.
- Данные уходят в Telegram и, при включении AI, выбранному провайдеру. Без AI работает локальный парсер.
- Резервная копия D1 в репозитории не настроена; при необходимости используйте экспорт D1 через Cloudflare Dashboard.

## Проверки

См. [RUNBOOK.md](RUNBOOK.md): health, веб, последний деплой, webhook, секреты, админ-роуты.
