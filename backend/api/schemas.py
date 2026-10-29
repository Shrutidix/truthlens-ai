from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field, field_validator

Label = Literal["REAL", "FAKE"]


class PredictRequest(BaseModel):
    title: Optional[str] = Field(default=None, max_length=1000)
    text: str = Field(..., max_length=20000)

    @field_validator("text")
    @classmethod
    def text_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("text must not be empty or whitespace-only")
        return v


class FeatureContribution(BaseModel):
    token: str
    contribution: float
    direction: Label


class Probabilities(BaseModel):
    REAL: float
    FAKE: float


class PredictResponse(BaseModel):
    label: Label
    confidence: float
    probabilities: Probabilities
    top_features: List[FeatureContribution]


class BatchRow(BaseModel):
    row: int = Field(description="1-based data row number in the uploaded file")
    status: Literal["ok", "skipped"]
    reason: Optional[str] = None
    label: Optional[Label] = None
    confidence: Optional[float] = None
    prob_real: Optional[float] = None
    prob_fake: Optional[float] = None
    data: Dict[str, Optional[str]]


class BatchSummary(BaseModel):
    total_rows: int
    predicted: int
    skipped: int
    real: int
    fake: int


class BatchResponse(BaseModel):
    columns: List[str]
    summary: BatchSummary
    rows: List[BatchRow]


class HealthResponse(BaseModel):
    status: Literal["ok"]
    model_loaded: bool


class ModelInfo(BaseModel):
    name: str
    architecture: List[str]
    label_mapping: Dict[str, int]
    tfidf_params: dict
    logreg_params: dict
    split: dict
    evaluation: dict
    limits: dict
    notice: str
