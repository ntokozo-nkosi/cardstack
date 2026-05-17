from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from uuid import UUID

from psycopg import rows
from psycopg_pool import ConnectionPool

from .settings import get_settings

_pool: ConnectionPool | None = None


@dataclass(frozen=True)
class CurrentUser:
    id: UUID
    clerk_id: str
    email: str | None


def get_pool() -> ConnectionPool:
    global _pool

    if _pool is None:
        settings = get_settings()
        _pool = ConnectionPool(
            conninfo=settings.database_conninfo,
            kwargs={"row_factory": rows.dict_row},
            min_size=1,
            max_size=5,
            open=True,
        )

    return _pool


def close_pool() -> None:
    global _pool

    if _pool is not None:
        _pool.close()
        _pool = None


@contextmanager
def connection() -> Iterator:
    with get_pool().connection() as conn:
        yield conn


def get_or_create_user(clerk_id: str, email: str | None) -> CurrentUser:
    with connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM get_or_create_user(%s, %s)",
                (clerk_id, email),
            )
            row = cursor.fetchone()

    if row is None:
        raise RuntimeError("get_or_create_user returned no user")

    return CurrentUser(
        id=row["user_id"],
        clerk_id=row["user_clerk_id"],
        email=row["user_email"],
    )


def list_decks_for_user(user_id: UUID) -> list[dict]:
    with connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT
                  d.id AS deck_id,
                  d.name AS deck_name,
                  d.description AS deck_detail,
                  d.created_at AS deck_created_at,
                  c.id AS card_id,
                  c.front AS card_front,
                  c.back AS card_back,
                  c.created_at AS card_created_at
                FROM decks d
                LEFT JOIN cards c ON c.deck_id = d.id
                WHERE d.user_id = %s
                ORDER BY d.created_at DESC, c.created_at ASC, c.id ASC
                """,
                (user_id,),
            )
            rows_by_card = cursor.fetchall()

    decks: dict[str, dict] = {}
    for row in rows_by_card:
        deck_id = str(row["deck_id"])
        deck = decks.setdefault(
            deck_id,
            {
                "id": deck_id,
                "name": row["deck_name"],
                "detail": row["deck_detail"],
                "cards": [],
            },
        )

        if row["card_id"] is None:
            continue

        deck["cards"].append(
            {
                "id": str(row["card_id"]),
                "front": row["card_front"],
                "back": row["card_back"],
                "order": len(deck["cards"]),
            }
        )

    return list(decks.values())
