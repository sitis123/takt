# Деплой: GitHub + Cloudflare

## Как развёрнуто сейчас (рабочий контур)

- Код: `https://github.com/sitis123/takt` (приватный репозиторий, ветка `main`).
- Приложение: Cloudflare Worker `takt`, база D1 `takt-db`.
- Адрес: `https://takt.gwsuite.workers.dev/` (домен покупать не нужно).
- Проверка здоровья: `https://takt.gwsuite.workers.dev/api/health`.
- Автодеплой: `.github/workflows/cloudflare.yml` — на каждый `push` в `main` прогоняет тесты, собирает Worker, проверяет/создаёт D1, выкладывает Worker и проверяет health.
- Cron: `*/5 * * * *` — планировщик напоминаний внутри Worker.

Секреты репозитория: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`; переменная `CLOUDFLARE_DEPLOY=true` включает workflow. Telegram-бот подключён: workflow ставит webhook на `https://takt.gwsuite.workers.dev/telegram/<секрет>` и проверяет через `getWebhookInfo`, что Telegram его видит. Секрет в URL надёжно прячет endpoint от посторонних. Токен бота и API-токен Cloudflare не должны попадать в логи и чаты; при утечке перевыпустите их и обновите Secrets.

## Схема

```
GitHub (код + Actions)
        |
        | push → tests → SSH → deploy.sh → откат при ошибке
        v
VPS: /opt/takt/app + systemd (web, bot, scheduler)
        |
        | cloudflared (только исходящее соединение)
        v
Cloudflare: HTTPS, WAF, домен takt.example.com
        |
        v
пользователь
```

Открытых портов, кроме SSH, нет. TLS и защита от DDoS — на стороне Cloudflare. Если сервис упадёт, systemd поднимет его сам; если обновление сломается, `deploy.sh` вернёт предыдущий коммит.

## Что понадобится

Для текущего облачного контура — только аккаунты GitHub и Cloudflare. VPS, домен и Zero Trust не нужны: Worker доступен на бесплатном `workers.dev`.

VPS-вариант ниже оставлен как альтернатива, если позже понадобится свой домен, постоянное соединение или интеграции, недоступные Worker'у. Для него понадобятся VPS с Ubuntu 24.04, домен в Cloudflare и токен Telegram-бота.

## 1. GitHub

```powershell
git remote add origin git@github.com:<USER>/takt.git
git branch -M main
git push -u origin main
```

Для приватного репозитория на VPS создайте deploy key:

```bash
ssh-keygen -t ed25519 -f /root/.ssh/takt_deploy -N ''
cat /root/.ssh/takt_deploy.pub
```

Публичный ключ добавьте в **Settings → Deploy keys** репозитория. Если деплой идёт с того же ключа, что и SSH-доступ Actions, можно использовать его — тогда отдельный ключ не нужен.

Секреты репозитория (**Settings → Secrets and variables → Actions**):

| Секрет | Значение |
| --- | --- |
| `SSH_KEY` | приватный ключ для входа на VPS |
| `SSH_HOST` | IP-адрес VPS |
| `SSH_USER` | `root` или пользователь с sudo |
| `SSH_PORT` | `22` (можно не задавать) |
| `PUBLIC_HEALTH_URL` | `https://takt.example.com/api/health` |
| `ALERT_BOT_TOKEN` | токен бота для алертов (необязательно) |
| `ALERT_CHAT_ID` | chat id для алертов (необязательно) |

## 2. VPS

```bash
scp deploy/bootstrap-origin.sh root@<IP>:/tmp/
ssh root@<IP>
bash /tmp/bootstrap-origin.sh git@github.com:<USER>/takt.git
```

Скрипт ставит Python, cloudflared, создаёт пользователя `takt`, каталоги `/var/lib/takt` и `/var/backups/takt`, виртуальное окружение и systemd-юниты.

Заполните `/opt/takt/.env`:

```ini
TAKT_HOME=/var/lib/takt
TAKT_OUT=/var/lib/takt/out
TELEGRAM_BOT_TOKEN=...
AI_BASE_URL=
AI_API_KEY=
AI_MODEL=gpt-4o-mini
CLOUDFLARE_TUNNEL_TOKEN=
```

Права файла — `0600`, владелец `takt`. Секреты не попадают в Git.

## 3. Cloudflare Tunnel

1. Zero Trust → **Networks → Tunnels → Create a tunnel**, тип Cloudflared.
2. Скопируйте токен туннеля и вставьте в `CLOUDFLARE_TUNNEL_TOKEN` в `.env`.
3. На вкладке **Public Hostnames** добавьте `takt.example.com` → `HTTP` → `127.0.0.1:8765`.
4. Включите туннель:

```bash
systemctl daemon-reload
systemctl enable --now cloudflared
systemctl status cloudflared --no-pager
```

DNS-запись Cloudflare создаст сам. Никаких портов на сервере открывать не нужно.

Дополнительно создайте **Health Check** в Cloudflare на `https://takt.example.com/api/health` и включите уведомления — это второй независимый канал мониторинга помимо GitHub Actions.

## 4. Проверка

```bash
curl https://takt.example.com/api/health
curl https://takt.example.com/web/
```

В Telegram отправьте боту `/status`. В вебе создайте тестовый счёт и проверьте, что сформировались HTML-файлы в `/var/lib/takt/out`.

## 5. Первый деплой

Просто сделайте `git push` в `main`: Actions прогонит тесты, зайдёт на сервер, обновит код, перезапустит сервисы и проверит здоровье. При любом сбое выполнится откат к предыдущему коммиту.

Ручной запуск: **Actions → Deploy → Run workflow**.

## Что защищает от поломок

- тесты до замены кода на сервере;
- откат на предыдущий коммит при любой ошибке деплоя;
- `Restart=always` для веба, бота и планировщика;
- smoke-проверка каждые 15 минут с алертом в Telegram;
- ежедневный бэкап базы и файлов с хранением 30 дней;
- `concurrency: production` — два деплоя никогда не идут одновременно.

При инциденте — [docs/RUNBOOK.md](RUNBOOK.md).
