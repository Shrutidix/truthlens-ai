"""
Generic helper utilities: logging setup and joblib save/load wrappers.
"""

import json
import logging
import sys
from pathlib import Path
from typing import Any

import joblib


def get_logger(name: str = "fake_news_detector") -> logging.Logger:
    """Return a configured logger that writes to stdout.

    Reusing the same logger name across modules avoids duplicate handlers.
    """
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    return logger


def save_object(obj: Any, path: Path) -> None:
    """Persist any Python object (model, vectorizer, pipeline) with joblib."""
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(obj, path)


def load_object(path: Path) -> Any:
    """Load a joblib-serialized object, raising a clear error if missing."""
    if not path.exists():
        raise FileNotFoundError(
            f"No file found at '{path}'. Have you run `python -m src.train` yet?"
        )
    return joblib.load(path)


def save_json(data: dict, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def load_json(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
