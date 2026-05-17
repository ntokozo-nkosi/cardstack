import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from time import perf_counter

from fastapi import Depends
from fastapi import FastAPI
from fastapi import Request
from fastapi import Response

from .auth import AuthenticatedUser
from .auth import get_current_user
from .db import close_pool
from .db import list_decks_for_user
from .schemas import Deck

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("cardstack.api")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    try:
        yield
    finally:
        await close_pool()


app = FastAPI(title="CardStack API", lifespan=lifespan)


@app.middleware("http")
async def log_requests(request: Request, call_next) -> Response:
    started_at = perf_counter()
    response = await call_next(request)
    duration_ms = (perf_counter() - started_at) * 1000
    clerk_user_id = getattr(request.state, "clerk_user_id", "anonymous")
    db_user_id = getattr(request.state, "db_user_id", "none")
    logger.info(
        "request clerk_user=%s db_user=%s method=%s path=%s status=%s duration_ms=%.1f",
        clerk_user_id,
        db_user_id,
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "Hello from CardStack API"}


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/v1/decks", response_model=list[Deck])
async def list_decks(current_user: AuthenticatedUser = Depends(get_current_user)) -> list[Deck]:
    decks = await list_decks_for_user(current_user.db_user.id)
    card_count = sum(len(deck["cards"]) for deck in decks)
    logger.info(
        "serving neon decks clerk_user=%s db_user=%s deck_count=%s card_count=%s",
        current_user.clerk_id,
        current_user.db_user.id,
        len(decks),
        card_count,
    )
    return [Deck.model_validate(deck) for deck in decks]
