from __future__ import annotations

import os
from dataclasses import dataclass, field
from urllib.parse import urlparse
from functools import lru_cache
from pathlib import Path


@dataclass(slots=True)
class Config:
    """Настройки берутся из окружения, у проекта нет обязательных секретов."""

    home: Path = field(default_factory=lambda: Path(os.getenv("TAKT_HOME", Path.home() / ".takt")))
    db_path: Path = field(init=False)
    out_dir: Path = field(init=False)
    bot_token: str = field(default_factory=lambda: os.getenv("TELEGRAM_BOT_TOKEN", ""))
    ai_base_url: str = field(default_factory=lambda: os.getenv("AI_BASE_URL", ""))
    ai_api_key: str = field(default_factory=lambda: os.getenv("AI_API_KEY", ""))
    ai_model: str = field(default_factory=lambda: os.getenv("AI_MODEL", ""))
    ai_vision_model: str = field(default_factory=lambda: os.getenv("AI_VISION_MODEL", ""))

    def __post_init__(self) -> None:
        self.home = Path(self.home).expanduser()
        self.home.mkdir(parents=True, exist_ok=True)
        self.db_path = Path(os.getenv("TAKT_DB", self.home / "takt.db")).expanduser()
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.out_dir = Path(os.getenv("TAKT_OUT", self.home / "out")).expanduser()
        self.out_dir.mkdir(parents=True, exist_ok=True)

    @property
    def ai_enabled(self) -> bool:
        return bool(self.ai_base_url and self.ai_api_key)

    @property
    def is_gemini(self) -> bool:
        host = (urlparse(self.ai_base_url).hostname or "").lower()
        return host == "generativelanguage.googleapis.com" or host.endswith(
            ".generativelanguage.googleapis.com"
        )

    @property
    def model(self) -> str:
        return self.ai_model or self.default_model

    @property
    def default_model(self) -> str:
        return "gemini-2.0-flash" if self.is_gemini else "gpt-4o-mini"

    @property
    def vision_model(self) -> str:
        return self.ai_vision_model or self.default_model

    @property
    def bot_enabled(self) -> bool:
        return bool(self.bot_token)


@lru_cache(maxsize=1)
def get_config() -> Config:
    return Config()


def reset_config_cache() -> None:
    get_config.cache_clear()
