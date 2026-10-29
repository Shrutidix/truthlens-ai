"""TruthLens AI – FastAPI service around the existing scikit-learn pipeline."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src import config
from api.ratelimit import RateLimiter
from api.schemas import (BatchResponse, BatchSummary, HealthResponse, ModelInfo,
                         PredictRequest, PredictResponse)
from api.services.model_service import ModelService, ModelUnavailable, parse_csv
from api.settings import Settings, get_settings

log = logging.getLogger("truthlens")
logging.basicConfig(level=logging.INFO)

NOTICE = ("Metrics come from a template-generated demo dataset. They do not describe "
          "real-world performance, and predictions are not independent fact-checks.")


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    service = ModelService(settings)
    limiter = RateLimiter(settings.rate_limit_per_min, settings.trust_proxy)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        service.loaded  # warm the model once per process; failure is tolerated
        yield

    app = FastAPI(title="TruthLens AI API", version="1.0.0", lifespan=lifespan,
                  docs_url="/docs", redoc_url=None)
    app.state.service = service

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_origin_regex=settings.cors_origin_regex or None,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type"],
        max_age=600,
    )

    # -- safe error handling (never echo user input or internals) ---------
    @app.exception_handler(RequestValidationError)
    async def validation_handler(_: Request, exc: RequestValidationError):
        errors = [{"field": ".".join(str(p) for p in e["loc"] if p != "body"), "message": e["msg"]}
                  for e in exc.errors()]
        return JSONResponse(status_code=422, content={"detail": "Invalid request.", "errors": errors})

    @app.exception_handler(ModelUnavailable)
    async def model_handler(_: Request, exc: ModelUnavailable):
        return JSONResponse(status_code=503, content={"detail": str(exc)})

    @app.exception_handler(Exception)
    async def unhandled(_: Request, exc: Exception):
        log.error("Unhandled error: %s", type(exc).__name__)
        return JSONResponse(status_code=500, content={"detail": "Internal server error."})

    # -- routes -------------------------------------------------------------
    @app.get("/health", response_model=HealthResponse)
    def health():
        return {"status": "ok", "model_loaded": service.loaded}

    @app.get("/api/model-info", response_model=ModelInfo)
    def model_info():
        service.load()
        ev = service.evaluation()
        return {
            "name": "TF-IDF + Logistic Regression (scikit-learn Pipeline)",
            "architecture": [
                "clean_text: lowercase, strip URLs/HTML/non-letters, drop stopwords and 1-letter tokens",
                "TfidfVectorizer (unigrams + bigrams, sublinear tf)",
                "LogisticRegression (class_weight=balanced)",
            ],
            "label_mapping": config.LABEL_MAP,
            "tfidf_params": {k: list(v) if isinstance(v, tuple) else v for k, v in config.TFIDF_PARAMS.items()},
            "logreg_params": config.LOGREG_PARAMS,
            "split": {"test_size": config.TEST_SIZE, "random_state": config.RANDOM_STATE, "stratified": True},
            "evaluation": ev,
            "limits": {"max_text_chars": settings.max_text_chars,
                       "max_upload_bytes": settings.max_upload_bytes,
                       "max_batch_rows": settings.max_batch_rows},
            "notice": NOTICE,
        }

    @app.post("/api/predict", response_model=PredictResponse)
    def predict(req: PredictRequest, request: Request):
        limiter.check(request)
        if len(req.text) > settings.max_text_chars:
            raise HTTPException(413, f"Text is too long (limit {settings.max_text_chars} characters).")
        try:
            return service.predict_one(req.title, req.text)
        except ValueError:
            raise HTTPException(422, "The text contains no usable words after cleaning.")

    @app.post("/api/predict/batch", response_model=BatchResponse)
    def predict_batch(request: Request, file: UploadFile = File(...)):
        limiter.check(request, cost=5)
        name = (file.filename or "").lower()
        if not name.endswith(".csv"):
            raise HTTPException(415, "Please upload a .csv file.")
        raw = file.file.read(settings.max_upload_bytes + 1)
        if len(raw) > settings.max_upload_bytes:
            raise HTTPException(413, f"File too large (limit {settings.max_upload_bytes // 1024} KB).")
        try:
            df = parse_csv(raw, settings.max_batch_rows)
        except ValueError as e:
            raise HTTPException(422, str(e))
        finally:
            del raw  # nothing is written to disk or retained
        rows = service.predict_frame(df)
        ok = [r for r in rows if r["status"] == "ok"]
        summary = BatchSummary(
            total_rows=len(rows), predicted=len(ok), skipped=len(rows) - len(ok),
            real=sum(r["label"] == "REAL" for r in ok), fake=sum(r["label"] == "FAKE" for r in ok))
        return {"columns": list(df.columns), "summary": summary, "rows": rows}

    return app


app = create_app()
