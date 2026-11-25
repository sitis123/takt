#!/usr/bin/env bash
# Ежедневный бэкап базы и сгенерированных файлов, храним 30 дней.
set -euo pipefail

DATA_DIR=/var/lib/takt
BACKUP_DIR=/var/backups/takt
mkdir -p "$BACKUP_DIR"

python3 - <<'PY'
import datetime
import pathlib
import shutil
import sqlite3

src = pathlib.Path('/var/lib/takt/takt.db')
dst = pathlib.Path('/var/backups/takt')
stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')

if src.exists():
    connection = sqlite3.connect(src)
    connection.backup(sqlite3.connect(dst / f'takt-{stamp}.db'))
    connection.close()

out = src / 'out'
if out.exists():
    shutil.make_archive(str(dst / f'out-{stamp}'), 'zip', out)
print(f'backup {stamp} done')
PY

find "$BACKUP_DIR" -type f -mtime +30 -delete
