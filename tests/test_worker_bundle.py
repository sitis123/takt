"""Проверка собранного Cloudflare Worker: маршруты, схема и встроенные ассеты."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUNDLE = ROOT / "worker" / "dist" / "takt-worker.js"


def test_worker_bundle_contains_routes_schema_and_assets() -> None:
    subprocess.run(
        [sys.executable, str(ROOT / "scripts" / "build_worker.py")],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )

    bundle = BUNDLE.read_text(encoding="utf-8")

    for needle in (
        "/api/health",
        "/telegram/",
        "CREATE TABLE IF NOT EXISTS",
        "export default",
        "async scheduled",
        "export.xlsx",
        "/api/agent/digest",
        "isGemini",
        "tg_chat:",
    ):
        assert needle in bundle, f"В бандле нет: {needle}"

    # Маркер должен быть заменён, а HTML/CSS/JS — встроены в ASSETS.
    assert "__TAKT_ASSETS__" not in bundle
    assert "const ASSETS = {" in bundle
    assert '"index.html": "<!doctype html>' in bundle or '"index.html": "<html' in bundle
    assert '"styles.css":' in bundle
    assert '"app.js":' in bundle
