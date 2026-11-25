import importlib
import sys

from fastapi.testclient import TestClient


def test_api_flow(tmp_path, monkeypatch):
    monkeypatch.setenv("TAKT_HOME", str(tmp_path))
    monkeypatch.delenv("AI_BASE_URL", raising=False)
    monkeypatch.delenv("AI_API_KEY", raising=False)
    if "takt.api" in sys.modules:
        api = importlib.reload(sys.modules["takt.api"])
    else:
        api = importlib.import_module("takt.api")
    api._service = None
    client = TestClient(api.app)

    assert client.get("/api/health").json()["status"] == "ok"

    created = client.post("/api/invoices", json={"text": "Клиент: Тест\nСумма 7000\nчерез 2 дня"})
    assert created.status_code == 201
    doc_id = created.json()["id"]

    assert client.post(f"/api/documents/{doc_id}/paid").json()["status"] == "paid"
    assert client.get("/api/documents").json()[0]["status"] == "paid"
    assert len(client.get("/api/documents").json()) == 1
    assert client.get(f"/api/documents/{doc_id}/download").status_code == 200

    task = client.post("/api/tasks", json={"text": "Проверить почту", "source": "test"})
    assert task.status_code == 201
    assert "Проверить почту" in client.get("/api/reports/weekly").json()["text"]
