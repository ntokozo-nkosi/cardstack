from fastapi import FastAPI

from .mock_data import MOCK_DECKS
from .schemas import Deck

app = FastAPI(title="CardStack API")

# TODO(auth-backend): Add a Clerk auth dependency that validates
# Authorization: Bearer <session_token> with clerk-backend-api,
# accepts_token=["session_token"], and returns a current-user context.
# Invalid or missing tokens should produce 401 responses from protected routes.


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Hello from CardStack API"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


# TODO(auth-backend): Protect v1 routers below this point with Clerk auth.


@app.get("/v1/decks", response_model=list[Deck])
def list_decks() -> list[Deck]:
    # TODO(auth-backend): Require a valid Clerk session token before returning
    # backend-owned sample data. Invalid or missing tokens should return 401.
    return MOCK_DECKS
