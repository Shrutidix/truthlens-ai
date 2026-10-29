"""Re-derive evaluation artifacts from the saved model + bundled dataset.

Reproduces the exact train/test split used by src/train.py (same seed,
stratified) and evaluates the *saved* pipeline on the held-out part.
Writes models/evaluation.json, which the API serves to the dashboard.
Run from backend/:  python scripts/generate_evaluation.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np
import pandas as pd
from sklearn.metrics import confusion_matrix
from sklearn.model_selection import train_test_split

from src import config
from src.preprocess import clean_dataframe
from src.utils import load_json, load_object

df = clean_dataframe(pd.read_csv(config.RAW_DATA_PATH))
y = df[config.LABEL_COLUMN].map(config.LABEL_MAP)
_, X_test, _, y_test = train_test_split(
    df["clean_text"], y, test_size=config.TEST_SIZE,
    random_state=config.RANDOM_STATE, stratify=y,
)
pipe = load_object(config.MODEL_PATH)
cm = confusion_matrix(y_test, pipe.predict(X_test), labels=[0, 1])

clf = pipe.named_steps["clf"]
names = pipe.named_steps["tfidf"].get_feature_names_out()
order = np.argsort(clf.coef_[0])
top = lambda idx: [{"token": str(names[i]), "coefficient": round(float(clf.coef_[0][i]), 4)} for i in idx]

out = {
    "source": "Re-derived from the saved pipeline and bundled sample_data.csv using the same split as src/train.py",
    "confusion_matrix": {
        "labels": ["REAL", "FAKE"],
        "matrix": cm.tolist(),
        "test_size": int(len(y_test)),
    },
    "metrics_file": load_json(config.METRICS_PATH),
    "dataset": {
        "rows": int(len(df)),
        "class_counts": {k: int((df[config.LABEL_COLUMN] == k).sum()) for k in ["REAL", "FAKE"]},
        "synthetic": True,
        "train_rows": int(len(df) - len(y_test)),
        "test_rows": int(len(y_test)),
    },
    "model": {
        "vocabulary_size": int(len(names)),
        "top_fake_features": top(order[::-1][:8]),
        "top_real_features": top(order[:8]),
    },
}
(config.MODELS_DIR / "evaluation.json").write_text(json.dumps(out, indent=2))
print(json.dumps(out["confusion_matrix"]), out["dataset"])
