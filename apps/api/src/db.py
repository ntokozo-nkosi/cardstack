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


async def _scalar(sql: str, params: tuple) -> object:
    async with connection() as conn:
        async with conn.cursor() as cursor:
            await cursor.execute(sql, params)
            row = await cursor.fetchone()
    if row is None:
        return None
    return next(iter(row.values()))


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


# ---------- Decks ----------


async def list_decks(user_id: UUID) -> list[dict]:
    decks = await _scalar("SELECT list_user_decks(%s)", (user_id,))
    return decks or []


async def get_deck(deck_id: UUID, user_id: UUID) -> dict | None:
    return await _scalar("SELECT get_deck_with_cards(%s, %s)", (deck_id, user_id))


async def create_deck(user_id: UUID, name: str, description: str | None) -> dict:
    deck = await _scalar("SELECT create_deck(%s, %s, %s)", (user_id, name, description))
    if deck is None:
        raise RuntimeError("create_deck returned no row")
    return deck


async def update_deck(deck_id: UUID, user_id: UUID, name: str, description: str | None) -> dict | None:
    return await _scalar(
        "SELECT update_deck_if_owned(%s, %s, %s, %s)",
        (deck_id, user_id, name, description),
    )


async def delete_deck(deck_id: UUID, user_id: UUID) -> bool:
    result = await _scalar("SELECT delete_deck_if_owned(%s, %s)", (deck_id, user_id))
    return bool(result)


# ---------- Cards ----------


async def list_cards(user_id: UUID) -> list[dict]:
    cards = await _scalar("SELECT get_all_user_cards(%s)", (user_id,))
    return cards or []


async def create_card(deck_id: UUID, user_id: UUID, front: str, back: str) -> dict | None:
    return await _scalar(
        "SELECT create_card_if_owned(%s, %s, %s, %s)",
        (deck_id, user_id, front, back),
    )


async def update_card(
    card_id: UUID,
    user_id: UUID,
    front: str,
    back: str,
    new_deck_id: UUID | None = None,
) -> dict | None:
    # update_card_if_owned has two overloads: 4-arg (no transfer) and 5-arg (with target deck).
    # The 5-arg version is defined in migration 20251222151521_transfer_card.sql and accepts
    # NULL for p_new_deck_id to mean "keep the same deck".
    async with connection() as conn:
        async with conn.cursor() as cursor:
            await cursor.execute(
                "SELECT * FROM update_card_if_owned(%s, %s, %s, %s, %s)",
                (card_id, user_id, front, back, new_deck_id),
            )
            row = await cursor.fetchone()

    if row is None or row.get("id") is None:
        return None

    return {
        "id": str(row["id"]),
        "deckId": str(row["deck_id"]),
        "front": row["front"],
        "back": row["back"],
        "createdAt": row["created_at"],
    }


async def delete_card(card_id: UUID, user_id: UUID) -> bool:
    result = await _scalar("SELECT delete_card_if_owned(%s, %s)", (card_id, user_id))
    return bool(result)


# ---------- Collections ----------


async def list_collections(user_id: UUID) -> list[dict]:
    collections = await _scalar("SELECT list_user_collections(%s)", (user_id,))
    return collections or []


async def get_collection(collection_id: UUID, user_id: UUID) -> dict | None:
    return await _scalar(
        "SELECT get_collection_with_decks(%s, %s)",
        (collection_id, user_id),
    )


async def create_collection(user_id: UUID, name: str, description: str | None) -> dict:
    collection = await _scalar(
        "SELECT create_collection(%s, %s, %s)",
        (user_id, name, description),
    )
    if collection is None:
        raise RuntimeError("create_collection returned no row")
    return collection


async def update_collection(
    collection_id: UUID,
    user_id: UUID,
    name: str,
    description: str | None,
) -> dict | None:
    return await _scalar(
        "SELECT update_collection_if_owned(%s, %s, %s, %s)",
        (collection_id, user_id, name, description),
    )


async def delete_collection(collection_id: UUID, user_id: UUID) -> bool:
    result = await _scalar(
        "SELECT delete_collection_if_owned(%s, %s)",
        (collection_id, user_id),
    )
    return bool(result)


# ---------- Collection membership ----------


async def add_deck_to_collection(collection_id: UUID, deck_id: UUID, user_id: UUID) -> str:
    return await _scalar(
        "SELECT add_deck_to_collection_if_owned(%s, %s, %s)",
        (collection_id, deck_id, user_id),
    )


async def remove_deck_from_collection(collection_id: UUID, deck_id: UUID, user_id: UUID) -> str:
    return await _scalar(
        "SELECT remove_deck_from_collection_if_owned(%s, %s, %s)",
        (collection_id, deck_id, user_id),
    )
