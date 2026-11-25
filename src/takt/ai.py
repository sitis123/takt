from __future__ import annotations

import base64
import json
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

    def chat_json(self, system: str, user: str, model: str | None = None) -> dict[str, Any]:
        if not self.enabled:
            raise AIError("AI не настроен")
        response = self._client.post(
            self._url("chat/completions"),
            headers=self._headers(),
            json={
                "model": model or self.config.ai_model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0,
            },
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        try:
            return json.loads(content)
        except json.JSONDecodeError as exc:
            raise AIError("AI вернул не JSON") from exc

    def extract_fields(self, text: str) -> dict[str, Any]:
        return self.chat_json(
            "Извлеки поля из текста договора или переписки. Верни JSON с ключами "
            "client_name, inn, email, amount (число), title, due_date (YYYY-MM-DD или пусто). "
            "Не выдумывай значения: если поля нет, поставь пустую строку или 0.",
            text,
        )

    def vision_to_text(self, image_bytes: bytes, mime: str = "image/jpeg") -> str:
        if not self.enabled:
            raise AIError("AI не настроен")
        encoded = base64.b64encode(image_bytes).decode("ascii")
        response = self._client.post(
            self._url("chat/completions"),
            headers=self._headers(),
            json={
                "model": self.config.ai_vision_model,
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
        response.raise_for_status()
        return str(response.json()["choices"][0]["message"]["content"])

    def transcribe(self, audio_bytes: bytes, filename: str = "voice.ogg") -> str:
        if not self.enabled:
            raise AIError("AI не настроен")
        response = self._client.post(
            self._url("audio/transcriptions"),
            headers={"Authorization": f"Bearer {self.config.ai_api_key}"},
            files={"file": (filename, audio_bytes, "audio/ogg")},
            data={"model": self.config.ai_model},
        )
        response.raise_for_status()
        return str(response.json().get("text", ""))
