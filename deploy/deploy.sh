#!/usr/bin/env bash
# Вызывается GitHub Actions на сервере. При любом сбое возвращает предыдущий коммит.
set -euo pipefail

APP_DIR=/opt/takt/app
VENV_DIR=/opt/takt/venv
STATE_FILE=/opt/takt/current_sha
TARGET="${1:-}"
PREVIOUS="$(cat "$STATE_FILE" 2>/dev/null || git -C "$APP_DIR" rev-parse HEAD)"

rollback() {
  trap - ERR
  echo "==> DEPLOY FAILED — откат к $PREVIOUS"
  git -C "$APP_DIR" checkout --quiet "$PREVIOUS" || true
  "$VENV_DIR/bin/pip" install --quiet -e "$APP_DIR" || true
  systemctl restart takt-web takt-bot takt-scheduler || true
  sleep 5
  curl -fsS http://127.0.0.1:8765/api/health || true
  echo "$PREVIOUS" > "$STATE_FILE"
  echo "==> Откат завершён"
  exit 1
}
trap rollback ERR

if [ -z "$TARGET" ]; then
  TARGET="$(git -C "$APP_DIR" rev-parse origin/HEAD 2>/dev/null || git -C "$APP_DIR" rev-parse origin/master)"
fi

echo "==> Разворачиваем $TARGET (было $PREVIOUS)"
git -C "$APP_DIR" fetch --quiet origin
git -C "$APP_DIR" checkout --quiet "$TARGET"
"$VENV_DIR/bin/pip" install --quiet -e "$APP_DIR"

echo "==> Тесты"
(cd "$APP_DIR" && "$VENV_DIR/bin/python" -m pytest -q)

echo "==> Перезапуск сервисов"
systemctl restart takt-web takt-bot takt-scheduler
sleep 6

echo "==> Проверка здоровья"
curl -fsS http://127.0.0.1:8765/api/health
curl -fsS http://127.0.0.1:8765/web/ >/dev/null

echo "$TARGET" > "$STATE_FILE"
trap - ERR
echo "==> DEPLOY OK $TARGET"
