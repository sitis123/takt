# Runbook: что делать, если что-то пошло не так

## Быстрая диагностика

```bash
ssh root@<IP>
systemctl status takt-web takt-bot takt-scheduler cloudflared --no-pager
curl -fsS http://127.0.0.1:8765/api/health
journalctl -u takt-web -n 100 --no-pager
journalctl -u takt-bot -n 100 --no-pager
journalctl -u takt-scheduler -n 100 --no-pager
```

## Сайт не открывается

1. Проверьте локальный health: `curl http://127.0.0.1:8765/api/health`.
   - Отвечает → проблема в Cloudflare: проверьте `cloudflared` и Public Hostname в Dashboard.
   - Не отвечает → перезапустите веб: `systemctl restart takt-web`.
2. Проверьте, что туннель подключён: `cloudflared tunnel list` в журнале `journalctl -u cloudflared`.
3. Проверьте домен: `curl -I https://takt.example.com/api/health`.

## Бот молчит

```bash
systemctl restart takt-bot
journalctl -u takt-bot -f
```

Чаще всего причина — истёкший или неправильный `TELEGRAM_BOT_TOKEN`. Проверьте `/opt/takt/.env`.

## Напоминания не приходят

```bash
systemctl restart takt-scheduler
journalctl -u takt-scheduler -n 50 --no-pager
python3 -c "import sqlite3; c=sqlite3.connect('/var/lib/takt/takt.db'); print(c.execute('select count(*) from reminders where sent_at is null').fetchone())"
```

Проверьте, что в боте задан chat id: файл `/var/lib/takt/notify_chat_id` должен содержать числовой id чата, куда слать уведомления.

## Деплой упал

`deploy.sh` уже откатился автоматически. Убедитесь в этом:

```bash
cat /opt/takt/current_sha
git -C /opt/takt/app rev-parse HEAD
curl -fsS http://127.0.0.1:8765/api/health
```

Если цифры совпадают и health зелёный — можно чинить причину в следующем коммите.

Принудительный откат на конкретный коммит:

```bash
cd /opt/takt/app
git checkout <SHA>
/opt/takt/venv/bin/pip install -e .
systemctl restart takt-web takt-bot takt-scheduler
curl -fsS http://127.0.0.1:8765/api/health
echo <SHA> > /opt/takt/current_sha
```

## Восстановление из бэкапа

```bash
systemctl stop takt-web takt-bot takt-scheduler
cp /var/backups/takt/takt-YYYYMMDD-HHMMSS.db /var/lib/takt/takt.db
unzip /var/backups/takt/out-YYYYMMDD-HHMMSS.zip -d /var/lib/takt/out
systemctl start takt-web takt-bot takt-scheduler
curl -fsS http://127.0.0.1:8765/api/health
```

## Ротация секретов

1. Обновите значение в `/opt/takt/.env` (владелец `takt`, права `0600`).
2. `systemctl restart takt-web takt-bot takt-scheduler cloudflared`.
3. Если менялся SSH-ключ — обновите `SSH_KEY` в GitHub Secrets.
4. Если менялся токен Cloudflare — обновите его в `.env` и перезапустите `cloudflared`.

## Проверка после любого инцидента

- `/api/health` через Cloudflare отвечает `{"status":"ok"}`;
- веб открывается, документы видны;
- бот отвечает на `/status`;
- в `events` есть новые записи после тестового действия.
