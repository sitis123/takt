#!/usr/bin/env bash
# Одноразовая подготовка VPS. Запуск: sudo bash deploy/bootstrap-origin.sh <git-repo-url>
set -euo pipefail

REPO_URL="${1:?Использование: bootstrap-origin.sh <git-repo-url>}"
APP_DIR=/opt/takt/app
VENV_DIR=/opt/takt/venv
DATA_DIR=/var/lib/takt
BACKUP_DIR=/var/backups/takt
SERVICE_USER=takt

echo "==> Устанавливаем пакеты"
apt-get update
apt-get install -y python3 python3-venv python3-pip git curl ca-certificates

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "==> Добавляем репозиторий Cloudflare и ставим cloudflared"
  install -d -m 0755 /usr/share/keyrings
  curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
    | install -m 0644 /dev/stdin /usr/share/keyrings/cloudflare-main.gpg
  echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' \
    > /etc/apt/sources.list.d/cloudflared.list
  apt-get update
  apt-get install -y cloudflared
fi

echo "==> Создаём пользователя и каталоги"
id -u "$SERVICE_USER" >/dev/null 2>&1 || useradd --system --home /opt/takt --shell /usr/sbin/nologin "$SERVICE_USER"
install -d -o "$SERVICE_USER" -g "$SERVICE_USER" -m 0750 "$DATA_DIR" "$DATA_DIR/out" "$BACKUP_DIR"

echo "==> Клонируем код"
if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO_URL" "$APP_DIR"
fi
chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"

echo "==> Готовим виртуальное окружение"
python3 -m venv "$VENV_DIR"
"$VENV_DIR/bin/pip" install --quiet --upgrade pip
"$VENV_DIR/bin/pip" install --quiet -e "$APP_DIR"

if [ ! -f /opt/takt/.env ]; then
  cp "$APP_DIR/.env.example" /opt/takt/.env
  chmod 0600 /opt/takt/.env
  chown "$SERVICE_USER:$SERVICE_USER" /opt/takt/.env
  echo "==> Создан /opt/takt/.env — заполни TELEGRAM_BOT_TOKEN, TAKT_HOME, CLOUDFLARE_TUNNEL_TOKEN"
fi

echo "==> Устанавливаем systemd-юниты"
cp "$APP_DIR"/deploy/systemd/*.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now takt-web takt-bot takt-scheduler

echo "==> Проверка"
sleep 4
curl -fsS http://127.0.0.1:8765/api/health
systemctl --no-pager status takt-web takt-bot takt-scheduler --lines=5 || true
echo "Готово. Дальше — по docs/DEPLOY.md: туннель Cloudflare и секреты GitHub."
