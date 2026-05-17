import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.settings import get_settings


def _setup_env(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://example.invalid/db")
    monkeypatch.setenv("CLERK_SECRET_KEY", "sk_test_example")
    get_settings.cache_clear()


def test_decks_requires_auth(monkeypatch):
    _setup_env(monkeypatch)

    with TestClient(app) as client:
        response = client.get("/v1/decks")

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid or missing Clerk session token"}


def test_decks_rejects_invalid_bearer_token(monkeypatch):
    _setup_env(monkeypatch)

    with TestClient(app) as client:
        response = client.get(
            "/v1/decks",
            headers={"Authorization": "Bearer invalid-token"},
        )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid or missing Clerk session token"}


# Every protected route hangs off Depends(get_current_user); confirm a sample
# from each CRUD verb shape returns 401 when unauthenticated.
_FIXTURE_UUID = "00000000-0000-0000-0000-000000000000"

_PROTECTED_ROUTES = [
    ("GET", "/v1/decks", None),
    ("POST", "/v1/decks", {"name": "x"}),
    ("GET", f"/v1/decks/{_FIXTURE_UUID}", None),
    ("PUT", f"/v1/decks/{_FIXTURE_UUID}", {"name": "x"}),
    ("DELETE", f"/v1/decks/{_FIXTURE_UUID}", None),
    ("GET", "/v1/cards", None),
    ("GET", f"/v1/decks/{_FIXTURE_UUID}/cards", None),
    ("POST", f"/v1/decks/{_FIXTURE_UUID}/cards", {"front": "f", "back": "b"}),
    ("PUT", f"/v1/cards/{_FIXTURE_UUID}", {"front": "f", "back": "b"}),
    ("DELETE", f"/v1/cards/{_FIXTURE_UUID}", None),
    ("GET", "/v1/collections", None),
    ("POST", "/v1/collections", {"name": "x"}),
    ("GET", f"/v1/collections/{_FIXTURE_UUID}", None),
    ("PUT", f"/v1/collections/{_FIXTURE_UUID}", {"name": "x"}),
    ("DELETE", f"/v1/collections/{_FIXTURE_UUID}", None),
    ("POST", f"/v1/collections/{_FIXTURE_UUID}/decks", {"deckId": _FIXTURE_UUID}),
    ("DELETE", f"/v1/collections/{_FIXTURE_UUID}/decks/{_FIXTURE_UUID}", None),
]


@pytest.mark.parametrize(("method", "path", "body"), _PROTECTED_ROUTES)
def test_protected_route_requires_auth(monkeypatch, method, path, body):
    _setup_env(monkeypatch)

    with TestClient(app) as client:
        response = client.request(method, path, json=body)

    assert response.status_code == 401, f"{method} {path} returned {response.status_code}"
