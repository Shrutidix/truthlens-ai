"""
Streamlit UI for the Fake News Detection project.

Run with:
    streamlit run app/streamlit_app.py
"""

import sys
from pathlib import Path

import pandas as pd
import streamlit as st

# Allow running `streamlit run app/streamlit_app.py` from the project root
# by adding the project root to sys.path so `src` is importable.
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from src import config
from src.predict import FakeNewsPredictor
from src.train import main as train_model
from src.utils import load_json


st.set_page_config(
    page_title="Fake News Detector",
    page_icon="📰",
    layout="centered",
)


@st.cache_resource(show_spinner=False)
def get_predictor():
    return FakeNewsPredictor()


def model_is_ready() -> bool:
    return config.MODEL_PATH.exists()


def render_sidebar():
    st.sidebar.title("📰 Fake News Detector")
    st.sidebar.markdown(
        "A TF-IDF + Logistic Regression classifier built with "
        "**scikit-learn** and served with **Streamlit**."
    )
    st.sidebar.divider()

    st.sidebar.subheader("Model status")
    if model_is_ready():
        st.sidebar.success("Model loaded and ready.")
        if config.METRICS_PATH.exists():
            metrics = load_json(config.METRICS_PATH)
            st.sidebar.markdown("**Test-set performance**")
            col1, col2 = st.sidebar.columns(2)
            col1.metric("Accuracy", f"{metrics['accuracy']*100:.1f}%")
            col2.metric("F1 score", f"{metrics['f1_score']*100:.1f}%")
            col1.metric("Precision", f"{metrics['precision']*100:.1f}%")
            col2.metric("Recall", f"{metrics['recall']*100:.1f}%")
    else:
        st.sidebar.warning("No trained model found yet.")

    st.sidebar.divider()
    if st.sidebar.button("🔁 (Re)train model", use_container_width=True):
        with st.spinner("Training TF-IDF + Logistic Regression model ..."):
            train_model()
        st.cache_resource.clear()
        st.sidebar.success("Training complete!")
        st.rerun()

    st.sidebar.divider()
    st.sidebar.caption(
        "Demo data ships with a small synthetic sample dataset. "
        "Swap `data/sample_data.csv` for a real labeled dataset "
        "(columns: title, text, label) for production use."
    )


def render_single_prediction_tab():
    st.subheader("Check a single article")
    default_text = (
        "SHOCKING: You won't BELIEVE what they don't want you to know "
        "about the new vaccine!!!"
    )
    text = st.text_area(
        "Paste a news headline or article body:",
        value=default_text,
        height=180,
        placeholder="Paste news text here...",
    )

    col1, col2 = st.columns([1, 3])
    analyze_clicked = col1.button("🔍 Analyze", type="primary", use_container_width=True)
    col2.caption("The model classifies text as **REAL** or **FAKE** with a confidence score.")

    if analyze_clicked:
        if not text.strip():
            st.warning("Please enter some text to analyze.")
            return

        predictor = get_predictor()
        try:
            result = predictor.predict(text)
        except ValueError as e:
            st.error(str(e))
            return

        label = result["label"]
        confidence = result["confidence"]

        if label == "REAL":
            st.success(f"✅ Predicted label: **{label}**  (confidence: {confidence*100:.1f}%)")
        else:
            st.error(f"🚨 Predicted label: **{label}**  (confidence: {confidence*100:.1f}%)")

        proba = result["probabilities"]
        proba_df = pd.DataFrame(
            {"Label": list(proba.keys()), "Probability": list(proba.values())}
        ).set_index("Label")
        st.bar_chart(proba_df)

        with st.expander("🔎 Why did the model decide this? (top contributing words)"):
            contributions = predictor.top_features(text, top_n=10)
            if contributions:
                contrib_df = pd.DataFrame(
                    contributions, columns=["token", "contribution"]
                )
                contrib_df["direction"] = contrib_df["contribution"].apply(
                    lambda v: "→ FAKE" if v > 0 else "→ REAL"
                )
                st.dataframe(
                    contrib_df.style.format({"contribution": "{:.4f}"}),
                    use_container_width=True,
                    hide_index=True,
                )
                st.caption(
                    "Positive contribution pushes the prediction toward "
                    "FAKE; negative pushes toward REAL."
                )
            else:
                st.info("No recognizable tokens to explain (text too short/unusual).")


def render_batch_tab():
    st.subheader("Batch check (CSV upload)")
    st.caption(
        "Upload a CSV with a `text` column (and optionally a `title` "
        "column) to classify many articles at once."
    )
    uploaded = st.file_uploader("Upload CSV", type=["csv"])

    if uploaded is not None:
        df = pd.read_csv(uploaded)
        if "text" not in df.columns:
            st.error("CSV must contain a `text` column.")
            return

        predictor = get_predictor()
        with st.spinner("Classifying rows ..."):
            texts = (
                df["title"].fillna("").astype(str) + " " + df["text"].fillna("").astype(str)
                if "title" in df.columns
                else df["text"].fillna("").astype(str)
            )
            results = []
            for t in texts:
                try:
                    r = predictor.predict(t)
                    results.append((r["label"], r["confidence"]))
                except ValueError:
                    results.append((None, None))

        df["predicted_label"] = [r[0] for r in results]
        df["confidence"] = [r[1] for r in results]

        st.dataframe(df, use_container_width=True)
        st.download_button(
            "⬇️ Download results as CSV",
            data=df.to_csv(index=False).encode("utf-8"),
            file_name="fake_news_predictions.csv",
            mime="text/csv",
        )


def main():
    render_sidebar()

    st.title("📰 Fake News Detection")
    st.markdown(
        "Classify news text as **REAL** or **FAKE** using a "
        "**TF-IDF + Logistic Regression** model trained with scikit-learn."
    )

    if not model_is_ready():
        st.info(
            "No trained model found yet. Click **🔁 (Re)train model** in "
            "the sidebar to train one on the bundled sample dataset."
        )
        return

    tab1, tab2 = st.tabs(["🔍 Single prediction", "📄 Batch (CSV)"])
    with tab1:
        render_single_prediction_tab()
    with tab2:
        render_batch_tab()


if __name__ == "__main__":
    main()
