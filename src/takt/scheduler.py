from __future__ import annotations

import logging
import time
from datetime import datetime, timezone

from .config import get_config
from .services import Takt

log = logging.getLogger("takt.scheduler")


def _sender(message: str) -> None:
    from .bot import notify

    notify(message)


def _digest_sender(chat: str, text: str) -> None:
    from .bot import notify

    notify(text, chat)


def run_once(service: Takt | None = None) -> int:
    """Отправляет все созревшие напоминания. Возвращает число отправленных."""
    return (service or Takt(get_config())).flush_reminders(_sender)


def run_digest(service: Takt | None = None) -> int:
    """Отправляет ежедневный обзор один раз в день."""
    return (service or Takt(get_config())).send_digest(_digest_sender)


def main(interval: int = 60) -> None:
    if interval <= 0:
        raise ValueError("Интервал должен быть больше нуля")
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    log.info("scheduler started, interval=%ss", interval)
    while True:
        try:
            sent = run_once()
            if sent:
                log.info("sent %s reminder(s)", sent)
            if datetime.now(timezone.utc).hour == 9:
                digests = run_digest()
                if digests:
                    log.info("sent %s digest(s)", digests)
        except Exception:
            log.exception("scheduler iteration failed")
        time.sleep(interval)


if __name__ == "__main__":
    main()
