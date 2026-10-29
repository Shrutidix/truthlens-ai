"""
Text cleaning utilities used before TF-IDF vectorization.

The cleaning pipeline is deliberately dependency-light (no NLTK corpus
downloads required) so the project runs offline out of the box. A common
English stopword list is embedded directly in this module.
"""

import re

import pandas as pd

# A standard, compact English stopword list (no external download needed).
STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an",
    "and", "any", "are", "aren't", "as", "at", "be", "because", "been",
    "before", "being", "below", "between", "both", "but", "by", "can",
    "could", "did", "do", "does", "doing", "down", "during", "each", "few",
    "for", "from", "further", "had", "has", "have", "having", "he", "he'd",
    "he'll", "he's", "her", "here", "here's", "hers", "herself", "him",
    "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've",
    "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself",
    "let's", "me", "more", "most", "my", "myself", "no", "nor", "not",
    "of", "off", "on", "once", "only", "or", "other", "ought", "our",
    "ours", "ourselves", "out", "over", "own", "same", "she", "she'd",
    "she'll", "she's", "should", "so", "some", "such", "than", "that",
    "that's", "the", "their", "theirs", "them", "themselves", "then",
    "there", "there's", "these", "they", "they'd", "they'll", "they're",
    "they've", "this", "those", "through", "to", "too", "under", "until",
    "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've",
    "were", "weren't", "what", "what's", "when", "when's", "where",
    "where's", "which", "while", "who", "who's", "whom", "why", "why's",
    "with", "won't", "would", "wouldn't", "you", "you'd", "you'll",
    "you're", "you've", "your", "yours", "yourself", "yourselves",
}

_URL_PATTERN = re.compile(r"https?://\S+|www\.\S+")
_HTML_TAG_PATTERN = re.compile(r"<.*?>")
_NON_ALPHA_PATTERN = re.compile(r"[^a-zA-Z\s]")
_MULTI_SPACE_PATTERN = re.compile(r"\s+")


def clean_text(text: str, remove_stopwords: bool = True) -> str:
    """Clean a single string of raw news text for TF-IDF vectorization.

    Steps: lowercase -> strip URLs/HTML -> strip non-alphabetic characters
    -> collapse whitespace -> optionally drop stopwords and 1-letter tokens.
    """
    if not isinstance(text, str):
        return ""

    text = text.lower()
    text = _URL_PATTERN.sub(" ", text)
    text = _HTML_TAG_PATTERN.sub(" ", text)
    text = _NON_ALPHA_PATTERN.sub(" ", text)
    text = _MULTI_SPACE_PATTERN.sub(" ", text).strip()

    if remove_stopwords:
        tokens = [
            tok for tok in text.split()
            if tok not in STOPWORDS and len(tok) > 1
        ]
        text = " ".join(tokens)

    return text


def clean_dataframe(
    df: pd.DataFrame,
    text_col: str = "text",
    title_col: str = "title",
    output_col: str = "clean_text",
) -> pd.DataFrame:
    """Combine title + body text into one cleaned column, added in place.

    Returns the same dataframe with a new `output_col` column.
    """
    df = df.copy()

    if title_col in df.columns:
        combined = (
            df[title_col].fillna("").astype(str)
            + " "
            + df[text_col].fillna("").astype(str)
        )
    else:
        combined = df[text_col].fillna("").astype(str)

    df[output_col] = combined.apply(clean_text)
    return df
