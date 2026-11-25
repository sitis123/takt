from __future__ import annotations

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters

from .config import get_config
from .services import Takt

_help = """Такт — тихий администратор рутины.

/invoice — прислать договор или переписку, получить счёт и акт
/capture — таблица текстом или фото → CSV
/task — записать задачу с напоминанием
/status — что происходит сейчас
/report — отчёт за неделю
/paid <номер> — отметить счёт оплаченным

Просто текст без команды → быстрая задача."""


def _service() -> Takt:
    return Takt(get_config())


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text("Привет. Я Такт. Забираю рутину у тебя — тихо и без лишних вопросов.\n\n" + _help)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(_help)


async def ask(update: Update, context: ContextTypes.DEFAULT_TYPE, mode: str, prompt: str) -> None:
    context.user_data["mode"] = mode
    await update.message.reply_text(prompt)


async def cmd_invoice(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await ask(update, context, "invoice", "Пришли текст договора или переписки — сделаю счёт и акт.")


async def cmd_capture(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await ask(update, context, "capture", "Пришли таблицу текстом (разделитель | или ;) или фото.")


async def cmd_task(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await ask(update, context, "task", "Что нужно сделать? Можно с датой: «до 25 ноября».")


async def cmd_status(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    data = _service().overview()
    counts = data["counts"]
    await update.message.reply_text(
        f"Сегодня в Такте:\n"
        f"• документов: {counts['documents']}\n"
        f"• без оплаты: {counts['unpaid']} (просрочено {counts['overdue']})\n"
        f"• открытых задач: {counts['open_tasks']}\n"
        f"• ожидают напоминания: {counts['pending_reminders']}"
    )


async def cmd_report(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(_service().weekly_report())


async def cmd_paid(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    parts = (update.message.text or "").split()
    if len(parts) < 2 or not parts[1].isdigit():
        await update.message.reply_text("Формат: /paid 12")
        return
    doc = _service().mark_paid(int(parts[1]))
    await update.message.reply_text(f"Счёт №{doc['id']:04d} отмечен оплаченным.")


async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = update.message.text or ""
    mode = context.user_data.pop("mode", "task")
    service = _service()
    try:
        if mode == "invoice":
            doc = service.create_invoice(text)
            await update.message.reply_text(
                f"Счёт №{doc['id']:04d} готов. Сумма {doc['amount']:.2f} ₽, оплата до {doc['due_date']}."
            )
            await _send_file(update, doc["payload"]["invoice_file"], "Счёт")
        elif mode == "capture":
            result = service.capture(text=text)
            await update.message.reply_text(f"Распознано строк: {result['rows']}. Файл прикладываю.")
            await _send_file(update, result["file"], "Таблица")
        else:
            task = service.create_task(text, source="telegram")
            suffix = f" · до {task['due_date']}" if task["due_date"] else ""
            await update.message.reply_text(f"Записано: {task['title']}{suffix}")
    except Exception as exc:
        await update.message.reply_text(f"Не получилось: {exc}")


async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    context.user_data.pop("mode", None)
    if not update.message.photo:
        return
    file = await context.bot.get_file(update.message.photo[-1].file_id)
    data = await file.download_as_bytearray()
    try:
        result = _service().capture(image_bytes=bytes(data))
    except Exception as exc:
        await update.message.reply_text(f"Не получилось распознать фото: {exc}")
        return
    await update.message.reply_text(f"Распознано строк: {result['rows']}. Файл прикладываю.")
    await _send_file(update, result["file"], "Таблица")


async def handle_voice(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message.voice:
        return
    file = await context.bot.get_file(update.message.voice.file_id)
    data = await file.download_as_bytearray()
    service = _service()
    try:
        text = service.ai.transcribe(bytes(data), "voice.ogg")
    except Exception as exc:
        await update.message.reply_text(f"Расшифровка голоса недоступна: {exc}")
        return
    task = service.create_task(text, source="voice")
    await update.message.reply_text(f"Записано из голоса: {task['title']}")


async def _send_file(update: Update, path: str, caption: str) -> None:
    from pathlib import Path

    file_path = Path(path)
    with file_path.open("rb") as stream:
        await update.message.reply_document(document=stream, filename=file_path.name, caption=caption)


def notify(message: str) -> None:
    """Используется планировщиком: отправка из ordinary-потока через Bot API."""
    import asyncio

    from telegram import Bot

    token = get_config().bot_token
    if not token:
        raise RuntimeError("TELEGRAM_BOT_TOKEN не задан")
    asyncio.run(Bot(token).send_message(chat_id=_chat_id(), text=message))


def _chat_id() -> int:
    from .config import get_config

    value = get_config().home.joinpath("notify_chat_id").read_text(encoding="utf-8").strip()
    return int(value)


def run_bot() -> None:
    config = get_config()
    if not config.bot_enabled:
        print("TELEGRAM_BOT_TOKEN не задан — бот не запущен. См. .env.example")
        return
    application = Application.builder().token(config.bot_token).build()
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("invoice", cmd_invoice))
    application.add_handler(CommandHandler("capture", cmd_capture))
    application.add_handler(CommandHandler("task", cmd_task))
    application.add_handler(CommandHandler("status", cmd_status))
    application.add_handler(CommandHandler("report", cmd_report))
    application.add_handler(CommandHandler("paid", cmd_paid))
    application.add_handler(MessageHandler(filters.PHOTO, handle_photo))
    application.add_handler(MessageHandler(filters.VOICE, handle_voice))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    application.run_polling(drop_pending_updates=True)
