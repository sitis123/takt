from __future__ import annotations

import base64
import json
import math
from datetime import date, timedelta
from typing import Any

import httpx

from .config import Config


class AIError(RuntimeError):
    """AI недоступен или вернул непригодный ответ."""


class AI:
    """Тонкий OpenAI-совместимый адаптер. Без ключа просто молча недоступен."""

    def __init__(self, config: Config) -> None:
        self.config = config
        self._client = httpx.Client(timeout=45.0)

    def close(self) -> None:
        self._client.close()

    @property
    def enabled(self) -> bool:
        return self.config.ai_enabled

    def _url(self, path: str) -> str:
        return f"{self.config.ai_base_url.rstrip('/')}/{path.lstrip('/')}"

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.config.ai_api_key}",
            "Content-Type": "application/json",
        }

    def _request_json(self, **kwargs: Any) -> dict[str, Any]:
        """Запрашивает JSON и никогда не выбрасывает httpx-ошибку с URL/ключом наружу."""
        try:
            response = self._client.request(**kwargs)
            response.raise_for_status()
            payload = response.json()
        except (httpx.HTTPError, ValueError, TypeError):
            raise AIError("AI недоступен или вернул неверный ответ") from None
        if not isinstance(payload, dict):
            raise AIError("AI вернул неверный ответ") from None
        return payload

    @staticmethod
    def _content(payload: dict[str, Any]) -> str:
        try:
            content = payload["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError):
            raise AIError("AI вернул пустой ответ") from None
        if not isinstance(content, str) or not content.strip():
            raise AIError("AI вернул пустой ответ") from None
        return content.strip()

    @staticmethod
    def _amount(value: Any, fallback: float = 0.0) -> float:
        try:
            number = float(value)
        except (TypeError, ValueError):
            return fallback
        return number if math.isfinite(number) and number >= 0 else fallback

    @staticmethod
    def _date(value: Any) -> str:
        raw = str(value or "").strip()
        if not raw:
            return ""
        try:
            parsed = date.fromisoformat(raw[:10])
        except ValueError:
            return ""
        if parsed > date.today() + timedelta(days=3650):
            return ""
        return parsed.isoformat()

    def chat_json(self, system: str, user: str, model: str | None = None) -> dict[str, Any]:
        if not self.enabled:
            raise AIError("AI не настроен")
        payload = self._request_json(
            method="POST",
            url=self._url("chat/completions"),
            headers=self._headers(),
            json={
                "model": model or self.config.model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0,
            },
        )
        content = self._content(payload)
        try:
            result = json.loads(content)
        except json.JSONDecodeError:
            raise AIError("AI вернул не JSON") from None
        if not isinstance(result, dict):
            raise AIError("AI вернул не объект JSON") from None
        return result

    def extract_fields(self, text: str) -> dict[str, Any]:
        fields = self.chat_json(
            "Извлеки поля из текста договора или переписки. Верни JSON с ключами "
            "client_name, inn, email, amount (число), title, due_date (YYYY-MM-DD или пусто). "
            "Не выдумывай значения: если поля нет, поставь пустую строку или 0.",
            text,
        )
        return {
            "client_name": str(fields.get("client_name") or "").strip()[:120],
            "inn": str(fields.get("inn") or "").strip()[:12],
            "email": str(fields.get("email") or "").strip()[:120],
            "amount": self._amount(fields.get("amount")),
            "title": str(fields.get("title") or "").strip()[:160],
            "due_date": self._date(fields.get("due_date")),
        }

    def vision_to_text(self, image_bytes: bytes, mime: str = "image/jpeg") -> str:
        if not self.enabled:
            raise AIError("AI не настроен")
        encoded = base64.b64encode(image_bytes).decode("ascii")
        payload = self._request_json(
            method="POST",
            url=self._url("chat/completions"),
            headers=self._headers(),
            json={
                "model": self.config.vision_model,
                "messages": [
                    {
                        "role": "system",
                        "content": "Перепиши содержимое изображения в моноширинный текст таблицы "
                        "с разделителем '|'. Сохрани числа и заголовки столбцов без изменений.",
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Распознай таблицу."},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:{mime};base64,{encoded}"},
                            },
                        ],
                    },
                ],
                "temperature": 0,
            },
        )
        return self._content(payload)

    @staticmethod
    def _audio_mime(filename: str) -> str:
        suffix = filename.rsplit(".", 1)[-1].lower()
        return {
            "ogg": "audio/ogg",
            "oga": "audio/ogg",
            "mp3": "audio/mpeg",
            "wav": "audio/wav",
            "m4a": "audio/mp4",
        }.get(suffix, "audio/ogg")

    def transcribe(self, audio_bytes: bytes, filename: str = "voice.ogg") -> str:
        if not self.enabled:
            raise AIError("AI не настроен")
        mime = self._audio_mime(filename)
        encoded = base64.b64encode(audio_bytes).decode("ascii")
        if self.config.is_gemini:
            # Ключ уходит в заголовке, а не в URL: httpx-ошибки не содержат секрет.
            payload = self._request_json(
                method="POST",
                url="https://generativelanguage.googleapis.com/v1beta/models/"
                f"{self.config.model}:generateContent",
                headers={"x-goog-api-key": self.config.ai_api_key, "Content-Type": "application/json"},
                json={
                    "contents": [{
                        "parts": [
                            {"text": "Расшифруй аудиозапись дословно, по-русски. Только текст."},
                            {"inline_data": {"mime_type": mime, "data": encoded}},
                        ],
                    }],
                    "generationConfig": {"temperature": 0},
                },
            )
            try:
                parts = payload["candidates"][0]["content"]["parts"]
                text = "".join(str(part.get("text", "")) for part in parts).strip()
            except (KeyError, IndexError, TypeError):
                raise AIError("Gemini вернул пустую расшифровку") from None
            if not text:
                raise AIError("Gemini вернул пустую расшифровку")
            return text
        payload = self._request_json(
            method="POST",
            url=self._url("audio/transcriptions"),
            headers={"Authorization": f"Bearer {self.config.ai_api_key}"},
            files={"file": (filename, audio_bytes, mime)},
            data={"model": self.config.model},
        )
        text = str(payload.get("text") or "").strip()
        if not text:
            raise AIError("AI вернул пустую расшифровку")
        return text
