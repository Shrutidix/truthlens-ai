"""
Unit tests for src.preprocess.

Run with:
    pytest tests/
"""

import sys
from pathlib import Path

import pandas as pd

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from src.preprocess import clean_dataframe, clean_text


def test_clean_text_lowercases():
    assert clean_text("HELLO World") == "hello world"


def test_clean_text_removes_urls():
    result = clean_text("Check this out https://example.com/fake now")
    assert "http" not in result
    assert "example" not in result


def test_clean_text_removes_punctuation_and_digits():
    result = clean_text("Breaking!!! 100% true???")
    assert "!" not in result
    assert "?" not in result
    assert "100" not in result


def test_clean_text_removes_stopwords():
    result = clean_text("this is the best article about the topic")
    for stopword in ["is", "the", "about"]:
        assert stopword not in result.split()


def test_clean_text_handles_non_string_input():
    assert clean_text(None) == ""
    assert clean_text(12345) == ""


def test_clean_text_empty_string():
    assert clean_text("") == ""


def test_clean_dataframe_combines_title_and_text():
    df = pd.DataFrame({
        "title": ["Breaking News"],
        "text": ["Something happened today."],
        "label": ["REAL"],
    })
    cleaned = clean_dataframe(df)
    assert "clean_text" in cleaned.columns
    assert "breaking" in cleaned.loc[0, "clean_text"]
    assert "happened" in cleaned.loc[0, "clean_text"]


def test_clean_dataframe_without_title_column():
    df = pd.DataFrame({
        "text": ["Something happened today."],
        "label": ["REAL"],
    })
    cleaned = clean_dataframe(df)
    assert "happened" in cleaned.loc[0, "clean_text"]
