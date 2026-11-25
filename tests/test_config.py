from pathlib import Path

from takt.config import Config


def make_config(tmp_path: Path, **overrides) -> Config:
    values = {
        "home": tmp_path,
        "ai_base_url": "",
        "ai_api_key": "",
        "ai_model": "",
        "ai_vision_model": "",
        "bot_token": "",
    }
    values.update(overrides)
    return Config(**values)


def test_ai_disabled_without_key(tmp_path: Path) -> None:
    config = make_config(
        tmp_path,
        ai_base_url="https://generativelanguage.googleapis.com/v1beta/openai",
    )
    assert not config.ai_enabled
    assert config.is_gemini
    assert config.model == "gemini-2.0-flash"
    assert config.vision_model == "gemini-2.0-flash"


def test_gemini_models_can_be_overridden(tmp_path: Path) -> None:
    config = make_config(
        tmp_path,
        ai_base_url="https://generativelanguage.googleapis.com/v1beta/openai",
        ai_api_key="test-key",
        ai_model="gemini-2.5-flash",
        ai_vision_model="gemini-2.5-pro",
    )
    assert config.ai_enabled
    assert config.is_gemini
    assert config.model == "gemini-2.5-flash"
    assert config.vision_model == "gemini-2.5-pro"


def test_openai_compatible_defaults(tmp_path: Path) -> None:
    config = make_config(
        tmp_path,
        ai_base_url="https://api.openai.com/v1",
        ai_api_key="test-key",
    )
    assert config.ai_enabled
    assert not config.is_gemini
    assert config.model == "gpt-4o-mini"
    assert config.vision_model == "gpt-4o-mini"
