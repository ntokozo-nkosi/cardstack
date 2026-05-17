from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from dataclasses import dataclass
from uuid import UUID

from psycopg import rows
from psycopg import AsyncConnection
from psycopg_pool import AsyncConnectionPool

from .settings import get_settings

_pool: AsyncConnectionPool | None = None


@dataclass(frozen=True)
class CurrentUser:
    id: UUID
    clerk_id: str
    email: str | None


async def get_pool() -> AsyncConnectionPool:
    global _pool

    if _pool is None:
        settings = get_settings()
        _pool = AsyncConnectionPool(
            conninfo=settings.database_conninfo,
            kwargs={"row_factory": rows.dict_row},
            min_size=1,
            max_size=5,
            open=False,
        )
        await _pool.open(wait=True)

    return _pool


async def close_pool() -> None:
    global _pool

    if _pool is not None:
        await _pool.close()
        _pool = None


@asynccontextmanager
async def connection() -> AsyncIterator[AsyncConnection]:
    pool = await get_pool()
    async with pool.connection() as conn:
        yield conn


async def get_or_create_user(clerk_id: str, email: str | None) -> CurrentUser:
    async with connection() as conn:
        async with conn.cursor() as cursor:
            await cursor.execute(
                "SELECT * FROM get_or_create_user(%s, %s)",
                (clerk_id, email),
            )
            row = await cursor.fetchone()

    if row is None:
        raise RuntimeError("get_or_create_user returned no user")

    return CurrentUser(
        id=row["user_id"],
        clerk_id=row["user_clerk_id"],
        email=row["user_email"],
    )


async def list_decks_for_user(user_id: UUID) -> list[dict]:
    async with connection() as conn:
        async with conn.cursor() as cursor:
            await cursor.execute(
                "SELECT list_user_decks(%s) AS decks",
                (user_id,),
            )
            deck_list_row = await cursor.fetchone()
            deck_rows = deck_list_row["decks"] if deck_list_row is not None else []

            decks = []
            for deck_row in deck_rows:
                await cursor.execute(
                    "SELECT get_deck_with_cards(%s, %s) AS deck",
                    (deck_row["id"], user_id),
                )
                row = await cursor.fetchone()
                if row is not None and row["deck"] is not None:
                    decks.append(_to_deck_payload(row["deck"]))

    return decks


def _to_deck_payload(deck: dict) -> dict:
    return {
        "id": str(deck["id"]),
        "name": deck["name"],
        "detail": deck.get("description"),
        "cards": [
            {
                "id": str(card["id"]),
                "front": card["front"],
                "back": card["back"],
                "order": index,
            }
            for index, card in enumerate(deck.get("cards", []))
        ],
    }
