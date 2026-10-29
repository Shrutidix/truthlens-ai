"""Environment-driven settings (no secrets live in code)."""
import os
from dataclasses import dataclass, field
from pathlib import Path

from src import config


def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    model_path: Path = field(default_factory=lambda: Path(os.getenv("MODEL_PATH", str(config.MODEL_PATH))))
    evaluation_path: Path = field(default_factory=lambda: Path(os.getenv("EVALUATION_PATH", str(config.MODELS_DIR / "evaluation.json"))))
    cors_origins: tuple = field(default_factory=lambda: tuple(
        o.strip().rstrip("/") for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()))
    # Optional regex, e.g. for Vercel preview URLs: https://truthlens-.*\.vercel\.app
    cors_origin_regex: str = field(default_factory=lambda: os.getenv("CORS_ORIGIN_REGEX", ""))
    max_text_chars: int = field(default_factory=lambda: _int("MAX_TEXT_CHARS", 20000))
    max_upload_bytes: int = field(default_factory=lambda: _int("MAX_UPLOAD_BYTES", 2 * 1024 * 1024))
    max_batch_rows: int = field(default_factory=lambda: _int("MAX_BATCH_ROWS", 1000))
    rate_limit_per_min: int = field(default_factory=lambda: _int("RATE_LIMIT_PER_MIN", 60))
    trust_proxy: bool = field(default_factory=lambda: os.getenv("TRUST_PROXY", "0") == "1")


def get_settings() -> Settings:
    return Settings()
