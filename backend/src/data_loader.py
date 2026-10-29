"""
Dataset loading utilities.

If no dataset is found at `config.RAW_DATA_PATH`, a synthetic sample
dataset is generated automatically so the project is runnable end-to-end
out of the box (for demos, tests, and CI). For real-world use, replace
`data/sample_data.csv` with a production dataset such as the Kaggle
"Fake and Real News" dataset (columns: title, text, label), keeping the
same column names.
"""

import itertools
import random

import pandas as pd

from src import config
from src.utils import get_logger

logger = get_logger(__name__)


def load_data(path=None) -> pd.DataFrame:
    """Load the news dataset as a DataFrame with columns: title, text, label.

    Generates a synthetic sample dataset on first run if none exists.
    """
    path = path or config.RAW_DATA_PATH

    if not path.exists():
        logger.warning(
            "No dataset found at '%s'. Generating a synthetic sample "
            "dataset for demo purposes.",
            path,
        )
        df = generate_sample_dataset()
        df.to_csv(path, index=False)
        logger.info("Sample dataset written to '%s' (%d rows).", path, len(df))
    else:
        df = pd.read_csv(path)
        logger.info("Loaded dataset from '%s' (%d rows).", path, len(df))

    _validate_columns(df)
    return df


def _validate_columns(df: pd.DataFrame) -> None:
    required = {config.TEXT_COLUMN, config.LABEL_COLUMN}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(
            f"Dataset is missing required column(s): {missing}. "
            f"Expected at least: {required}"
        )


# --------------------------------------------------------------------------
# Synthetic sample dataset generator
# --------------------------------------------------------------------------
def generate_sample_dataset(seed: int = 42) -> pd.DataFrame:
    """Generate a small, template-based labeled news dataset.

    This is meant strictly as a *demo / smoke-test* dataset so the project
    works immediately after cloning. It is not a substitute for a real
    labeled corpus in production use.
    """
    rng = random.Random(seed)

    topics = [
        "the economy", "the national election", "a new vaccine",
        "climate policy", "the space program", "the housing market",
        "a celebrity marriage", "the local school district",
        "a tech company merger", "the stock market", "a sports championship",
        "immigration reform", "a new smartphone launch", "the healthcare bill",
        "a wildlife conservation project", "the central bank's interest rate",
        "an oil pipeline", "a university research study", "the film industry",
        "a public transportation project",
    ]

    real_templates = [
        "Officials confirmed on {day} that {topic} will be reviewed following "
        "a report published by independent analysts.",
        "According to a statement released by the department, {topic} showed "
        "measurable change over the past quarter.",
        "Researchers at a leading university published findings this week "
        "regarding {topic}, based on data collected over three years.",
        "The committee voted on {day} to advance a proposal related to "
        "{topic}, pending further public comment.",
        "A spokesperson said {topic} remains under evaluation, with a formal "
        "report expected within the coming months.",
        "New data released by government statisticians shows {topic} grew "
        "modestly compared to the previous year.",
        "The city council approved a measure on {day} addressing {topic} "
        "after months of public hearings.",
        "Experts interviewed by several news outlets noted that {topic} is "
        "developing gradually, cautioning against premature conclusions.",
        "A peer-reviewed study on {topic} was published this week, and its "
        "authors say more research is needed to confirm the results.",
        "The organization released its quarterly report on {topic}, citing "
        "verified figures from multiple independent sources.",
    ]

    fake_templates = [
        "SHOCKING: You won't BELIEVE what they don't want you to know about "
        "{topic}!!!",
        "Secret documents PROVE {topic} is a total scam, insiders reveal.",
        "Doctors HATE this one trick that instantly fixes {topic} forever!",
        "BREAKING: {topic} is a hoax invented by the elite to control you, "
        "anonymous source claims.",
        "This ONE weird secret about {topic} will change your life -- "
        "government tries to hide it!",
        "Experts are STUNNED after discovering the shocking truth behind "
        "{topic} that mainstream media refuses to report.",
        "You have been LIED to about {topic} for years, and now the truth "
        "is finally exposed!",
        "Leaked footage allegedly shows {topic} is far worse than anyone "
        "imagined, sources whisper.",
        "Scientists 'don't want you to see' this miracle proof about "
        "{topic}, viral post claims.",
        "WAKE UP: {topic} is secretly controlled by a hidden group, viral "
        "chain message warns.",
    ]

    days = [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
        "Saturday", "Sunday",
    ]

    rows = []
    for topic, template in itertools.product(topics, real_templates):
        text = template.format(topic=topic, day=rng.choice(days))
        rows.append({
            "title": f"Report on {topic.capitalize()}",
            "text": text,
            "label": "REAL",
        })

    for topic, template in itertools.product(topics, fake_templates):
        text = template.format(topic=topic, day=rng.choice(days))
        rows.append({
            "title": f"You won't believe this about {topic}",
            "text": text,
            "label": "FAKE",
        })

    df = pd.DataFrame(rows)
    df = df.sample(frac=1.0, random_state=seed).reset_index(drop=True)
    return df
