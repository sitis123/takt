from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .ai import AIError
from .config import get_config
from .services import Takt


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="takt", description="Такт — администратор рутины")
    subs = parser.add_subparsers(dest="command", required=True)

    subs.add_parser("init", help="Создать базу и каталоги")

    invoice = subs.add_parser("invoice", help="Счёт и акт из текста договора")
    _add_text(invoice)
    invoice.add_argument("--due-days", type=int, default=7)

    capture = subs.add_parser("capture", help="Таблица из текста или файла")
    _add_text(capture)
    capture.add_argument("--out", help="Куда сохранить CSV")

    task = subs.add_parser("task", help="Задача с напоминанием")
    _add_text(task)

    subs.add_parser("report", help="Отчёт за неделю")
    subs.add_parser("overview", help="Сводка по продукту")
    subs.add_parser("reminders", help="Список ожидающих напоминаний")

    serve = subs.add_parser("serve", help="Поднять веб-интерфейс и API")
    serve.add_argument("--host", default="127.0.0.1")
    serve.add_argument("--port", type=int, default=8765)

    subs.add_parser("bot", help="Запустить Telegram-бота")

    scheduler = subs.add_parser("scheduler", help="Слать созревшие напоминания")
    scheduler.add_argument("--interval", type=int, default=60)
    return parser


def _add_text(parser: argparse.ArgumentParser) -> None:
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--text", help="Сам текст")
    group.add_argument("--file", help="Файл с текстом")


def _text(args: argparse.Namespace) -> str:
    return args.text if args.text is not None else Path(args.file).read_text(encoding="utf-8")


def main(argv: list[str] | None = None) -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    args = build_parser().parse_args(argv)
    config = get_config()
    service = Takt(config)

    if args.command == "init":
        print(f"База: {config.db_path}")
        print(f"Файлы: {config.out_dir}")
        print("Готово.")
        return
    if args.command == "invoice":
        doc = service.create_invoice(_text(args), args.due_days)
        print(f"Счёт №{doc['id']:04d} · {doc['title']} · до {doc['due_date']}")
        print(f"HTML: {doc['payload']['invoice_file']}")
        print(f"Акт:  {doc['payload']['act_file']}")
        return
    if args.command == "capture":
        result = service.capture(text=_text(args))
        target = Path(args.out) if args.out else Path(result["file"])
        if args.out:
            target.write_bytes(Path(result["file"]).read_bytes())
        print(f"Строк: {result['rows']} · файл: {target}")
        return
    if args.command == "task":
        task = service.create_task(_text(args), source="cli")
        print(f"Задача #{task['id']}: {task['title']}" + (f" · до {task['due_date']}" if task["due_date"] else ""))
        return
    if args.command == "report":
        print(service.weekly_report())
        return
    if args.command == "overview":
        for key, value in service.overview()["counts"].items():
            print(f"{key}: {value}")
        return
    if args.command == "reminders":
        reminders = service.store.due_reminders()
        for item in reminders:
            print(f"#{item['id']} {item['due_at']} — {item['message']}")
        if not reminders:
            print("Нет ожидающих напоминаний.")
        return
    if args.command == "bot":
        from .bot import run_bot

        run_bot()
        return
    if args.command == "scheduler":
        from .scheduler import main as scheduler_main

        scheduler_main(args.interval)
        return
    if args.command == "serve":
        import uvicorn

        uvicorn.run("takt.api:app", host=args.host, port=args.port, log_level="info")
        return

    raise AIError(f"Неизвестная команда: {args.command}")


if __name__ == "__main__":
    main()
