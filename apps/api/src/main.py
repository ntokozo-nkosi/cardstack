import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from time import perf_counter

from fastapi import FastAPI
from fastapi import Request
from fastapi import Response

from .db import close_pool
from .routes import cards as cards_routes
from .routes import collections as collections_routes
from .routes import decks as decks_routes

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


app.include_router(decks_routes.router)
app.include_router(cards_routes.router)
app.include_router(collections_routes.router)
