from __future__ import annotations

import logging
import time

from .config import get_config
from .services import Takt

log = logging.getLogger("takt.scheduler")


def _sender(message: str) -> None:
    from .bot import notify

    notify(message)


def run_once(service: Takt | None = None) -> int:
    """Отправляет все созревшие напоминания. Возвращает число отправленных."""
    return (service or Takt(get_config())).flush_reminders(_sender)


def main(interval: int = 60) -> None:
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
        except Exception:
            log.exception("scheduler iteration failed")
        time.sleep(interval)


if __name__ == "__main__":
    main()
