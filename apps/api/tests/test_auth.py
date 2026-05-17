from fastapi.testclient import TestClient

from src.main import app
from src.settings import get_settings


def test_decks_requires_auth(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://example.invalid/db")
    monkeypatch.setenv("CLERK_SECRET_KEY", "sk_test_example")
    get_settings.cache_clear()

    with TestClient(app) as client:
        response = client.get("/v1/decks")

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid or missing Clerk session token"}


def test_decks_rejects_invalid_bearer_token(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://example.invalid/db")
    monkeypatch.setenv("CLERK_SECRET_KEY", "sk_test_example")
    get_settings.cache_clear()

    with TestClient(app) as client:
        response = client.get(
            "/v1/decks",
            headers={"Authorization": "Bearer invalid-token"},
        )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid or missing Clerk session token"}
