"""Собирает worker/dist/takt-worker.js — один самодостаточный файл Worker.

Запуск из корня проекта: python scripts/build_worker.py
В `worker/index.js` маркер __TAKT_ASSETS__ заменяется JSON-объектом со
строками landing.html / landing.css / index.html / styles.css / app.js из папки web/.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MARKER = "__TAKT_ASSETS__"


def build() -> Path:
    source = (ROOT / "worker" / "index.js").read_text(encoding="utf-8")
    if MARKER not in source:
        raise RuntimeError(f"Маркер {MARKER} не найден в worker/index.js")

    assets = {
        "landing.html": (ROOT / "web" / "landing.html").read_text(encoding="utf-8"),
        "landing.css": (ROOT / "web" / "landing.css").read_text(encoding="utf-8"),
        "index.html": (ROOT / "web" / "index.html").read_text(encoding="utf-8"),
        "styles.css": (ROOT / "web" / "styles.css").read_text(encoding="utf-8"),
        "app.js": (ROOT / "web" / "app.js").read_text(encoding="utf-8"),
    }

    # json.dumps даёт JS-совместимый литерал; U+2028/U+2029 экранируем отдельно.
    encoded = json.dumps(assets, ensure_ascii=False)
    encoded = encoded.replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    bundle = source.replace(MARKER, encoded)

    dist = ROOT / "worker" / "dist"
    dist.mkdir(parents=True, exist_ok=True)
    target = dist / "takt-worker.js"
    target.write_text(bundle, encoding="utf-8")
    return target


if __name__ == "__main__":
    result = build()
    print(f"Готово: {result.relative_to(ROOT)} ({result.stat().st_size} байт)")
