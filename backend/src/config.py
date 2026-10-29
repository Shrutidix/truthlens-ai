"""
Central configuration for the Fake News Detection project.

Keeping every path and hyperparameter in one place makes the codebase
easy to tune and keeps `train.py`, `predict.py`, and the Streamlit app
in sync.
"""

from pathlib import Path

# --------------------------------------------------------------------------
# Paths
# --------------------------------------------------------------------------
ROOT_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = ROOT_DIR / "data"
MODELS_DIR = ROOT_DIR / "models"

RAW_DATA_PATH = DATA_DIR / "sample_data.csv"
MODEL_PATH = MODELS_DIR / "fake_news_model.pkl"
METRICS_PATH = MODELS_DIR / "metrics.json"
CONFUSION_MATRIX_PATH = MODELS_DIR / "confusion_matrix.png"

# Make sure the directories exist so downstream code never has to check.
DATA_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# --------------------------------------------------------------------------
# Dataset columns
# --------------------------------------------------------------------------
TEXT_COLUMN = "text"
TITLE_COLUMN = "title"
LABEL_COLUMN = "label"

# Canonical label encoding used throughout the project.
LABEL_MAP = {"REAL": 0, "FAKE": 1}
INVERSE_LABEL_MAP = {0: "REAL", 1: "FAKE"}

# --------------------------------------------------------------------------
# Train / test split
# --------------------------------------------------------------------------
TEST_SIZE = 0.2
RANDOM_STATE = 42

# --------------------------------------------------------------------------
# TF-IDF vectorizer hyperparameters
# --------------------------------------------------------------------------
TFIDF_PARAMS = {
    "max_features": 5000,
    "ngram_range": (1, 2),
    "min_df": 2,
    "max_df": 0.9,
    "sublinear_tf": True,
}

# --------------------------------------------------------------------------
# Logistic Regression hyperparameters
# --------------------------------------------------------------------------
LOGREG_PARAMS = {
    "C": 1.0,
    "max_iter": 1000,
    "class_weight": "balanced",
    "random_state": RANDOM_STATE,
}
