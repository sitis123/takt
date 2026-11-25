# Эксплуатация

## Локальный запуск

```powershell
python -m pip install -e .
$env:PYTHONPATH = "src"
python -m takt init
python -m takt serve --host 127.0.0.1 --port 8765
```

Бот поднимается отдельно:

```powershell
$env:TELEGRAM_BOT_TOKEN = "..."
python -m takt bot
```

Напоминания отправляет планировщик:

```powershell
python -c "from takt.config import get_config; from takt.services import Takt; from takt.bot import notify; print(Takt(get_config()).flush_reminders(notify))"
```

Для этого в `~/.takt/notify_chat_id` должен лежать chat id, куда слать уведомления.

## Сервер

Минимальный набор: VPS с Python 3.11, домен, HTTPS-прокси (Nginx/Caddy), два service-процесса — веб и планировщик. Telegram-бот работает через long polling и не требует публичного webhook.

Переменные окружения задаются systemd `Environment=` или файлом окружения с restrictive правами. Ни в коем случае не коммитьте `.env`.

## Бэкапы

База — один файл `~/.takt/takt.db` в режиме WAL. Резервная копия:

```powershell
python -c "import sqlite3; c=sqlite3.connect(r'C:\Users\eshar\.takt\takt.db'); c.backup(sqlite3.connect('backup.db'))"
```

Копируйте также каталог `~/.takt/out` — там сгенерированные счета, акты и CSV. Достаточно ежедневной копии и хранения последних 30 дней.

## Проверки

- `python -m pytest` — основная проверка перед обновлением;
- `GET /api/health` — простой healthcheck для мониторинга;
- журнал `events` в базе — что происходит внутри продукта;
- просроченные документы и ожидающие напоминания видны в `/api/overview`.

## Обновление

1. Сделать бэкап базы и `out/`.
2. Обновить код, прогнать тесты.
3. Перезапустить веб, бота и планировщик.
4. Проверить `/api/health` и один тестовый счёт.

Схема базы версионируется через `CREATE TABLE IF NOT EXISTS`; на этом этапе миграций не требуется.

## Безопасность

- Секреты только в окружении.
- Пользовательские данные не уходят никуда, пока не настроен AI-провайдер; при включённом AI текст документа уходит выбранному провайдеру — это нужно честно отразить в политике.
- Telegram-бот принимает файлы только от авторизованных пользователей: при выходе в продакшн добавьте whitelist chat id.
- Доступ к веб-панели на сервере закрывается прокси и авторизацией.
