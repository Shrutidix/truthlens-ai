"""
Inference utilities for the trained fake news classifier.

Usage as a library:
    from src.predict import FakeNewsPredictor
    predictor = FakeNewsPredictor()
    result = predictor.predict("Some news article text ...")

Usage from the command line:
    python -m src.predict "Some headline or article text to classify"
"""

import sys
from typing import List, Union

from src import config
from src.preprocess import clean_text
from src.utils import get_logger, load_object

logger = get_logger(__name__)


class FakeNewsPredictor:
    """Thin wrapper around the trained sklearn Pipeline for easy reuse."""

    def __init__(self, model_path=None):
        self.model_path = model_path or config.MODEL_PATH
        self.pipeline = load_object(self.model_path)

    def predict(self, text: str) -> dict:
        """Predict REAL/FAKE for a single piece of text with confidence."""
        cleaned = clean_text(text)
        if not cleaned:
            raise ValueError("Input text is empty after cleaning.")

        pred = self.pipeline.predict([cleaned])[0]
        proba = self.pipeline.predict_proba([cleaned])[0]

        label = config.INVERSE_LABEL_MAP[pred]
        confidence = float(proba[pred])

        return {
            "label": label,
            "confidence": round(confidence, 4),
            "probabilities": {
                "REAL": round(float(proba[config.LABEL_MAP["REAL"]]), 4),
                "FAKE": round(float(proba[config.LABEL_MAP["FAKE"]]), 4),
            },
        }

    def predict_batch(self, texts: List[str]) -> List[dict]:
        """Predict REAL/FAKE for a list of texts."""
        return [self.predict(t) for t in texts]

    def top_features(self, text: str, top_n: int = 10) -> List[tuple]:
        """Return the (token, weighted_contribution) pairs that most
        influenced the prediction for a single piece of text.

        Useful for basic model explainability in the Streamlit app.
        """
        vectorizer = self.pipeline.named_steps["tfidf"]
        clf = self.pipeline.named_steps["clf"]

        cleaned = clean_text(text)
        vec = vectorizer.transform([cleaned])
        feature_names = vectorizer.get_feature_names_out()

        # Contribution of each present token = tfidf_value * logreg_coef
        coefs = clf.coef_[0]
        row = vec.tocoo()
        contributions = [
            (feature_names[idx], vec[0, idx] * coefs[idx])
            for idx in row.col
        ]
        contributions.sort(key=lambda x: abs(x[1]), reverse=True)
        return contributions[:top_n]


def main():
    if len(sys.argv) < 2:
        print('Usage: python -m src.predict "News text to classify"')
        sys.exit(1)

    text = " ".join(sys.argv[1:])
    predictor = FakeNewsPredictor()
    result = predictor.predict(text)

    print(f"\nPrediction: {result['label']}")
    print(f"Confidence: {result['confidence'] * 100:.2f}%")
    print(f"Probabilities -> REAL: {result['probabilities']['REAL']:.4f} | "
          f"FAKE: {result['probabilities']['FAKE']:.4f}\n")


if __name__ == "__main__":
    main()
