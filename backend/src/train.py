"""
Train a TF-IDF + Logistic Regression fake news classifier.

Usage:
    python -m src.train

This will:
    1. Load (or auto-generate) the dataset.
    2. Clean the text.
    3. Split into train / test sets.
    4. Fit a TF-IDF vectorizer + Logistic Regression inside a single
       scikit-learn Pipeline.
    5. Evaluate on the held-out test set.
    6. Save the fitted pipeline, metrics, and a confusion matrix plot.
"""

import matplotlib

matplotlib.use("Agg")  # headless backend, safe for servers / CI

import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer

from src import config
from src.data_loader import load_data
from src.preprocess import clean_dataframe
from src.utils import get_logger, save_json, save_object

logger = get_logger(__name__)


def build_pipeline() -> Pipeline:
    """Construct the TF-IDF + Logistic Regression sklearn Pipeline."""
    return Pipeline(
        steps=[
            ("tfidf", TfidfVectorizer(**config.TFIDF_PARAMS)),
            ("clf", LogisticRegression(**config.LOGREG_PARAMS)),
        ]
    )


def prepare_data():
    """Load, clean, encode labels, and split the dataset."""
    df = load_data()
    df = clean_dataframe(
        df,
        text_col=config.TEXT_COLUMN,
        title_col=config.TITLE_COLUMN,
        output_col="clean_text",
    )

    df = df[df["clean_text"].str.strip().str.len() > 0].reset_index(drop=True)

    y = df[config.LABEL_COLUMN].map(config.LABEL_MAP)
    if y.isna().any():
        raise ValueError(
            "Found labels outside of {'REAL', 'FAKE'}. "
            "Please check the `label` column of your dataset."
        )

    X_train, X_test, y_train, y_test = train_test_split(
        df["clean_text"],
        y,
        test_size=config.TEST_SIZE,
        random_state=config.RANDOM_STATE,
        stratify=y,
    )
    return X_train, X_test, y_train, y_test


def evaluate(pipeline: Pipeline, X_test, y_test) -> dict:
    """Compute evaluation metrics and save a confusion matrix plot."""
    y_pred = pipeline.predict(X_test)

    metrics = {
        "accuracy": accuracy_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred),
        "recall": recall_score(y_test, y_pred),
        "f1_score": f1_score(y_test, y_pred),
    }

    report = classification_report(
        y_test, y_pred, target_names=["REAL", "FAKE"]
    )
    logger.info("Classification report:\n%s", report)
    for name, value in metrics.items():
        logger.info("%s: %.4f", name, value)

    cm = confusion_matrix(y_test, y_pred)
    plt.figure(figsize=(5, 4))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=["REAL", "FAKE"],
        yticklabels=["REAL", "FAKE"],
    )
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.title("Confusion Matrix")
    plt.tight_layout()
    plt.savefig(config.CONFUSION_MATRIX_PATH, dpi=150)
    plt.close()

    return metrics


def main():
    logger.info("Preparing data ...")
    X_train, X_test, y_train, y_test = prepare_data()
    logger.info(
        "Train size: %d | Test size: %d", len(X_train), len(X_test)
    )

    logger.info("Building and training pipeline (TF-IDF + LogisticRegression) ...")
    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    logger.info("Evaluating on held-out test set ...")
    metrics = evaluate(pipeline, X_test, y_test)

    logger.info("Saving model pipeline to '%s' ...", config.MODEL_PATH)
    save_object(pipeline, config.MODEL_PATH)
    save_json(metrics, config.METRICS_PATH)

    logger.info("Training complete. Model and metrics saved to '%s'.", config.MODELS_DIR)


if __name__ == "__main__":
    main()
