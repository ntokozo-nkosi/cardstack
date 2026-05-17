import logging
from time import perf_counter

from fastapi import FastAPI
from fastapi import Request
from fastapi import Response

from .mock_data import MOCK_DECKS
from .schemas import Deck

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("cardstack.api")

app = FastAPI(title="CardStack API")

# TODO(auth-backend): Add a Clerk auth dependency that validates
# Authorization: Bearer <session_token> with clerk-backend-api,
# accepts_token=["session_token"], and returns a current-user context.
# Invalid or missing tokens should produce 401 responses from protected routes.


@app.middleware("http")
async def log_requests(request: Request, call_next) -> Response:
    started_at = perf_counter()
    response = await call_next(request)
    duration_ms = (perf_counter() - started_at) * 1000
    user_id = request.headers.get("x-cardstack-user-id", "anonymous")
    # TODO(auth-backend): Replace header-based user logging with the verified
    # Clerk subject from the request auth context after token validation exists.
    logger.info(
        "request user=%s method=%s path=%s status=%s duration_ms=%.1f",
        user_id,
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


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
    card_count = sum(len(deck.cards) for deck in MOCK_DECKS)
    logger.info("serving mock decks deck_count=%s card_count=%s", len(MOCK_DECKS), card_count)
    return MOCK_DECKS
