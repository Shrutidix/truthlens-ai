import io
from dataclasses import replace
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from api.main import create_app
from api.settings import get_settings

FAKE_TXT = "SHOCKING: You won't BELIEVE what they don't want you to know about the economy!!!"
REAL_TXT = ("Officials confirmed on Monday that the housing market will be reviewed following "
            "a report published by independent analysts.")


@pytest.fixture(scope="module")
def client():
    with TestClient(create_app(replace(get_settings(), rate_limit_per_min=0))) as c:
        yield c


def csv_file(content, name="t.csv"):
    data = content.encode() if isinstance(content, str) else content
    return {"file": (name, io.BytesIO(data), "text/csv")}


# ---- health / readiness ------------------------------------------------
def test_health_and_model_ready(client):
    r = client.get("/health")
    assert r.status_code == 200 and r.json() == {"status": "ok", "model_loaded": True}


def test_model_info_matches_artifacts(client):
    j = client.get("/api/model-info").json()
    assert j["label_mapping"] == {"REAL": 0, "FAKE": 1}
    assert j["tfidf_params"]["max_features"] == 5000 and j["tfidf_params"]["ngram_range"] == [1, 2]
    cm = j["evaluation"]["confusion_matrix"]
    assert cm["labels"] == ["REAL", "FAKE"] and cm["matrix"] == [[40, 0], [0, 40]]
    assert j["evaluation"]["metrics_file"]["accuracy"] == 1.0
    assert j["evaluation"]["dataset"]["synthetic"] is True
    assert "not independent fact-checks" in j["notice"]


# ---- single prediction -------------------------------------------------
def test_predict_structure_and_mapping(client):
    fake = client.post("/api/predict", json={"text": FAKE_TXT}).json()
    real = client.post("/api/predict", json={"text": REAL_TXT}).json()
    assert fake["label"] == "FAKE" and real["label"] == "REAL"
    for j in (fake, real):
        assert set(j) == {"label", "confidence", "probabilities", "top_features"}
        p = j["probabilities"]
        assert abs(p["REAL"] + p["FAKE"] - 1) < 1e-3
        assert j["confidence"] == pytest.approx(max(p.values()), abs=1e-4)
        assert j["confidence"] == pytest.approx(p[j["label"]], abs=1e-4)


def test_feature_directions_are_consistent(client):
    j = client.post("/api/predict", json={"text": FAKE_TXT}).json()
    assert j["top_features"]
    for f in j["top_features"]:
        assert f["direction"] == ("FAKE" if f["contribution"] > 0 else "REAL")
    assert sum(f["contribution"] for f in j["top_features"]) > 0  # pushes toward FAKE


def test_title_is_used_like_training(client):
    a = client.post("/api/predict", json={"text": "the economy"}).json()
    b = client.post("/api/predict", json={"title": "SHOCKING secret scam", "text": "the economy"}).json()
    assert b["probabilities"]["FAKE"] != a["probabilities"]["FAKE"]


@pytest.mark.parametrize("payload", [{"text": ""}, {"text": "   \n\t "}])
def test_empty_and_whitespace_rejected(client, payload):
    assert client.post("/api/predict", json=payload).status_code == 422


def test_text_with_no_usable_words_rejected(client):
    r = client.post("/api/predict", json={"text": "!!! 123 ??? the a of"})
    assert r.status_code == 422


@pytest.mark.parametrize("payload", [{}, {"text": 5}, {"text": None}, {"text": "x" * 20001}])
def test_invalid_payloads(client, payload):
    r = client.post("/api/predict", json=payload)
    assert r.status_code == 422


def test_validation_error_does_not_echo_input(client):
    secret = "SECRET-ARTICLE-BODY " * 2000
    r = client.post("/api/predict", json={"text": secret})
    assert r.status_code == 422 and "SECRET-ARTICLE" not in r.text


# ---- missing model -----------------------------------------------------
def test_missing_model_is_graceful(tmp_path):
    s = replace(get_settings(), model_path=tmp_path / "nope.pkl", rate_limit_per_min=0)
    with TestClient(create_app(s)) as c:
        assert c.get("/health").json() == {"status": "ok", "model_loaded": False}
        r = c.post("/api/predict", json={"text": "hello world news"})
        assert r.status_code == 503 and str(tmp_path) not in r.text and "Traceback" not in r.text
        assert c.get("/api/model-info").status_code == 503
        assert c.post("/api/predict/batch", files=csv_file("text\nhello world")).status_code == 503


def test_corrupt_model_is_graceful(tmp_path):
    bad = tmp_path / "bad.pkl"
    bad.write_bytes(b"not a pickle")
    s = replace(get_settings(), model_path=bad, rate_limit_per_min=0)
    with TestClient(create_app(s)) as c:
        r = c.post("/api/predict", json={"text": "hello world news"})
        assert r.status_code == 503 and str(tmp_path) not in r.text


# ---- batch -------------------------------------------------------------
def test_batch_happy_path_and_consistency(client):
    csv = f'id,title,text\n1,,"{FAKE_TXT}"\n2,Report on housing,"{REAL_TXT}"\n'
    r = client.post("/api/predict/batch", files=csv_file(csv))
    assert r.status_code == 200
    j = r.json()
    assert j["columns"] == ["id", "title", "text"]
    assert j["summary"] == {"total_rows": 2, "predicted": 2, "skipped": 0, "real": 1, "fake": 1}
    assert [x["label"] for x in j["rows"]] == ["FAKE", "REAL"]
    assert j["rows"][0]["data"]["id"] == "1"  # original columns preserved
    single = client.post("/api/predict", json={"title": "Report on housing", "text": REAL_TXT}).json()
    assert j["rows"][1]["prob_fake"] == pytest.approx(single["probabilities"]["FAKE"], abs=1e-3)


def test_batch_empty_and_invalid_rows_are_skipped_not_classified(client):
    csv = f'text\n"{FAKE_TXT}"\n\n   \n"!!! 123"\n'
    j = client.post("/api/predict/batch", files=csv_file(csv)).json()
    st = [r["status"] for r in j["rows"]]
    assert st[0] == "ok" and set(st[1:]) == {"skipped"}
    for r in j["rows"][1:]:
        assert r["label"] is None and r["confidence"] is None and r["reason"]
    assert j["summary"]["predicted"] == 1 and j["summary"]["skipped"] == len(st) - 1


def test_batch_missing_text_column(client):
    r = client.post("/api/predict/batch", files=csv_file("title,body\na,b\n"))
    assert r.status_code == 422 and "'text' column" in r.json()["detail"]


def test_batch_header_case_insensitive(client):
    r = client.post("/api/predict/batch", files=csv_file(f'TEXT\n"{FAKE_TXT}"\n'))
    assert r.status_code == 200 and r.json()["summary"]["predicted"] == 1


@pytest.mark.parametrize("content,name,code", [
    ("text\nhello", "x.txt", 415),
    ("", "x.csv", 422),
    ("text\n", "x.csv", 422),
    (b"text\n\xff\xfe\x00bad", "x.csv", 422),
])
def test_batch_validation(client, content, name, code):
    assert client.post("/api/predict/batch", files=csv_file(content, name)).status_code == code


def test_batch_limits():
    s = replace(get_settings(), max_batch_rows=3, max_upload_bytes=200, rate_limit_per_min=0)
    with TestClient(create_app(s)) as c:
        rows = "\n".join(["word"] * 5)
        assert c.post("/api/predict/batch", files=csv_file("text\n" + rows)).status_code == 422
        assert c.post("/api/predict/batch", files=csv_file("text\n" + "a" * 500)).status_code == 413


# ---- cross-cutting -----------------------------------------------------
def test_cors_allows_configured_origin_only():
    s = replace(get_settings(), cors_origins=("https://app.example.com",), rate_limit_per_min=0)
    with TestClient(create_app(s)) as c:
        ok = c.options("/api/predict", headers={"Origin": "https://app.example.com",
                                                 "Access-Control-Request-Method": "POST"})
        bad = c.options("/api/predict", headers={"Origin": "https://evil.example",
                                                  "Access-Control-Request-Method": "POST"})
        assert ok.headers.get("access-control-allow-origin") == "https://app.example.com"
        assert "access-control-allow-origin" not in bad.headers


def test_rate_limit():
    s = replace(get_settings(), rate_limit_per_min=3)
    with TestClient(create_app(s)) as c:
        codes = [c.post("/api/predict", json={"text": FAKE_TXT}).status_code for _ in range(5)]
        assert codes[:3] == [200] * 3 and codes[3] == 429
