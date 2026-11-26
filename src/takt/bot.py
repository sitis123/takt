from __future__ import annotations

import os
from typing import Any

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters

from .ai import AIError
from .config import get_config
from .services import Takt

_help = """Такт — тихий администратор рутины.

/invoice — прислать договор или переписку, получить счёт и акт
/capture — таблица текстом или фото → CSV
/task — записать задачу с напоминанием
/status — что происходит сейчас
/report — отчёт за неделю
/paid <номер> — отметить счёт оплаченным
/start — приветствие · /help — эта справка

Просто текст без команды → быстрая задача."""

_service_cache: Takt | None = None


def _service() -> Takt:
    global _service_cache
    if _service_cache is None:
        _service_cache = Takt(get_config())
    return _service_cache


def _allowed(chat_id: int) -> bool:
    raw = os.getenv("TELEGRAM_ALLOWED_CHAT_IDS", "").strip()
    if not raw:
        return True
    allowed = {part.strip() for part in raw.replace(";", ",").split(",") if part.strip()}
    return str(chat_id) in allowed


async def _welcome(update: Update) -> bool:
    chat_id = update.effective_chat.id if update.effective_chat else 0
    if not _allowed(chat_id):
        await update.message.reply_text("Этот бот закрыт для вашего чата.")
        return False
    _service().register_chat(chat_id)
    return True


def _safe_error(exc: Exception) -> str:
    if isinstance(exc, (AIError, ValueError)) and "AI" in str(exc):
        return "AI недоступен или вернул непригодный ответ"
    return str(exc)[:300]


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not await _welcome(update):
        return
    await update.message.reply_text(
        "Привет. Я Такт. Забираю рутину у тебя — тихо и без лишних вопросов.\n\n" + _help
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not await _welcome(update):
        return
    await update.message.reply_text(_help)


async def ask(update: Update, context: ContextTypes.DEFAULT_TYPE, mode: str, prompt: str) -> None:
    if not await _welcome(update):
        return
    context.user_data["mode"] = mode
    await update.message.reply_text(prompt)


async def cmd_invoice(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await ask(update, context, "invoice", "Пришли текст договора или переписки — сделаю счёт и акт.")


async def cmd_capture(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await ask(update, context, "capture", "Пришли таблицу текстом (разделитель | или ;) или фото.")


async def cmd_task(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await ask(update, context, "task", "Что нужно сделать? Можно с датой: «до 25 ноября».")


async def cmd_status(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not await _welcome(update):
        return
    counts = _service().overview()["counts"]
    await update.message.reply_text(
        f"Сегодня в Такте:\n"
        f"• документов: {counts['documents']}\n"
        f"• без оплаты: {counts['unpaid']} (просрочено {counts['overdue']})\n"
        f"• открытых задач: {counts['open_tasks']}\n"
        f"• ожидают напоминания: {counts['pending_reminders']}"
    )


async def cmd_report(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not await _welcome(update):
        return
    await update.message.reply_text(_service().weekly_report())


async def cmd_paid(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not await _welcome(update):
        return
    parts = (update.message.text or "").split()
    if len(parts) < 2 or not parts[1].isdigit():
        await update.message.reply_text("Формат: /paid 12")
        return
    try:
        doc = _service().mark_paid(int(parts[1]))
    except ValueError as exc:
        await update.message.reply_text(str(exc))
        return
    await update.message.reply_text(f"Счёт №{doc['id']:04d} отмечен оплаченным.")


async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not await _welcome(update):
        return
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
        await update.message.reply_text(f"Не получилось: {_safe_error(exc)}")


async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not await _welcome(update):
        return
    context.user_data.pop("mode", None)
    if not update.message.photo:
        return
    file = await context.bot.get_file(update.message.photo[-1].file_id)
    data = await file.download_as_bytearray()
    try:
        result = _service().capture(image_bytes=bytes(data))
    except Exception as exc:
        await update.message.reply_text(f"Не получилось распознать фото: {_safe_error(exc)}")
        return
    await update.message.reply_text(f"Распознано строк: {result['rows']}. Файл прикладываю.")
    await _send_file(update, result["file"], "Таблица")


async def handle_voice(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not await _welcome(update):
        return
    context.user_data.pop("mode", None)
    if not update.message.voice:
        return
    file = await context.bot.get_file(update.message.voice.file_id)
    data = await file.download_as_bytearray()
    service = _service()
    try:
        text = service.ai.transcribe(bytes(data), "voice.ogg")
        task = service.create_task(text, source="voice")
    except Exception as exc:
        await update.message.reply_text(f"Расшифровка голоса недоступна: {_safe_error(exc)}")
        return
    await update.message.reply_text(f"Записано из голоса: {task['title']}")


async def _send_file(update: Update, path: str, caption: str) -> None:
    from pathlib import Path

    file_path = Path(path)
    with file_path.open("rb") as stream:
        await update.message.reply_document(document=stream, filename=file_path.name, caption=caption)


def notify(message: str, chat_id: str | int | None = None) -> None:
    """Отправка из ordinary-потока: планировщик и дайджест."""
    import asyncio

    from telegram import Bot

    token = get_config().bot_token
    if not token:
        raise RuntimeError("TELEGRAM_BOT_TOKEN не задан")
    target = chat_id if chat_id is not None else _chat_id()
    asyncio.run(Bot(token).send_message(chat_id=target, text=message))


def _chat_id() -> int:
    service = _service()
    value = service.store.setting("notify_chat_id")
    if not value:
        legacy = get_config().home.joinpath("notify_chat_id")
        if legacy.exists():
            value = legacy.read_text(encoding="utf-8").strip()
    if not value:
        raise RuntimeError("Чат для уведомлений не задан — напишите боту /status")
    return int(value)


def run_bot() -> None:
    config = get_config()
    if not config.bot_enabled:
        print("TELEGRAM_BOT_TOKEN не задан — бот не запущен. См. .env.example")
        return
    application = Application.builder().token(config.bot_token).build()
    for handler in (
        CommandHandler("start", start),
        CommandHandler("help", help_command),
        CommandHandler("invoice", cmd_invoice),
        CommandHandler("capture", cmd_capture),
        CommandHandler("task", cmd_task),
        CommandHandler("status", cmd_status),
        CommandHandler("report", cmd_report),
        CommandHandler("paid", cmd_paid),
    ):
        application.add_handler(handler)
    application.add_handler(MessageHandler(filters.PHOTO, handle_photo))
    application.add_handler(MessageHandler(filters.VOICE, handle_voice))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))
    application.run_polling(drop_pending_updates=True)
