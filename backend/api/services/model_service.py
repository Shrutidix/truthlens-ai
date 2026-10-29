"""Wraps the existing FakeNewsPredictor (src/predict.py) for the API."""
import io
import json
import logging
from typing import Dict, List, Optional

import pandas as pd

from src import config
from src.predict import FakeNewsPredictor
from src.preprocess import clean_text
from api.settings import Settings

log = logging.getLogger("truthlens")


class ModelUnavailable(Exception):
    """Model artifact missing or unreadable."""


class ModelService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._predictor: Optional[FakeNewsPredictor] = None

    # -- loading ---------------------------------------------------------
    def load(self) -> FakeNewsPredictor:
        if self._predictor is None:
            try:
                self._predictor = FakeNewsPredictor(model_path=self.settings.model_path)
            except FileNotFoundError:
                log.error("Model artifact not found")
                raise ModelUnavailable("The model is not available on the server.")
            except Exception:  # corrupt / incompatible pickle
                log.exception("Model failed to load")
                raise ModelUnavailable("The model could not be loaded.")
        return self._predictor

    @property
    def loaded(self) -> bool:
        try:
            self.load()
            return True
        except ModelUnavailable:
            return False

    # -- single ----------------------------------------------------------
    @staticmethod
    def combine(title: Optional[str], text: str) -> str:
        # Training used title + " " + text (preprocess.clean_dataframe).
        return f"{title or ''} {text}".strip()

    def predict_one(self, title: Optional[str], text: str, top_n: int = 10) -> dict:
        p = self.load()
        combined = self.combine(title, text)
        res = p.predict(combined)  # raises ValueError if empty after cleaning
        feats = [
            {
                "token": str(tok),
                "contribution": float(c),
                "direction": "FAKE" if c > 0 else "REAL",
            }
            for tok, c in p.top_features(combined, top_n=top_n)
        ]
        return {**res, "top_features": feats}

    # -- batch -----------------------------------------------------------
    def predict_frame(self, df: pd.DataFrame) -> List[dict]:
        """Row-level results; one vectorised predict_proba call for valid rows."""
        p = self.load()
        pipe = p.pipeline
        has_title = "title" in df.columns
        max_chars = self.settings.max_text_chars

        rows: List[dict] = []
        valid_idx, valid_clean = [], []
        for i, rec in enumerate(df.to_dict(orient="records")):
            data = {k: (None if pd.isna(v) else str(v)) for k, v in rec.items()}
            raw_text = data.get("text")
            row = {"row": i + 1, "status": "skipped", "reason": None, "data": data}
            if raw_text is None or not raw_text.strip():
                row["reason"] = "Empty text"
            elif len(raw_text) > max_chars:
                row["reason"] = f"Text longer than {max_chars} characters"
            else:
                combined = self.combine(data.get("title") if has_title else None, raw_text)
                cleaned = clean_text(combined)
                if not cleaned:
                    row["reason"] = "No usable words after cleaning"
                else:
                    valid_idx.append(i)
                    valid_clean.append(cleaned)
            rows.append(row)

        if valid_clean:
            proba = pipe.predict_proba(valid_clean)
            classes = list(pipe.classes_)
            for i, pr in zip(valid_idx, proba):
                by_label = {config.INVERSE_LABEL_MAP[c]: float(pr[j]) for j, c in enumerate(classes)}
                label = max(by_label, key=by_label.get)
                rows[i].update(
                    status="ok", label=label,
                    confidence=round(by_label[label], 4),
                    prob_real=round(by_label["REAL"], 4),
                    prob_fake=round(by_label["FAKE"], 4),
                )
        return rows

    # -- info --------------------------------------------------------------
    def evaluation(self) -> dict:
        try:
            return json.loads(self.settings.evaluation_path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            raise ModelUnavailable("Evaluation artifacts are not available on the server.")


def parse_csv(raw: bytes, max_rows: int) -> pd.DataFrame:
    """Safe CSV parse: UTF-8 only, everything as text, bounded rows."""
    try:
        content = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise ValueError("File must be UTF-8 encoded text.")
    if not content.strip():
        raise ValueError("The file is empty.")
    try:
        df = pd.read_csv(io.StringIO(content), dtype=str, keep_default_na=False,
                         na_values=[""], nrows=max_rows + 1, engine="python")
    except Exception:
        raise ValueError("Could not parse the file as CSV.")
    df.columns = [str(c).strip() for c in df.columns]
    lower = {c.lower(): c for c in df.columns}
    if "text" not in lower:
        raise ValueError("CSV must contain a 'text' column.")
    # normalise header case for the two columns the model uses
    df = df.rename(columns={lower["text"]: "text", **({lower["title"]: "title"} if "title" in lower else {})})
    if len(df) == 0:
        raise ValueError("The CSV has a header but no data rows.")
    if len(df) > max_rows:
        raise ValueError(f"Too many rows. The limit is {max_rows} rows per file.")
    return df
