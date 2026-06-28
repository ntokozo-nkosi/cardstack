from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status

from ..auth import AuthenticatedUser, get_current_user
from ..db import (
    create_deck,
    delete_deck,
    get_deck,
    list_decks,
    update_deck,
)
from ..schemas import DeckCreate, DeckDetail, DeckSummary, DeckUpdate

router = APIRouter(prefix="/v1/decks", tags=["decks"])


@router.get("", response_model=list[DeckSummary], response_model_by_alias=True)
async def list_user_decks(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> list[DeckSummary]:
    rows = await list_decks(current_user.db_user.id)
    return [DeckSummary.model_validate(row) for row in rows]


@router.post(
    "",
    response_model=DeckSummary,
    response_model_by_alias=True,
    status_code=status.HTTP_201_CREATED,
)
async def create_user_deck(
    payload: DeckCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> DeckSummary:
    row = await create_deck(current_user.db_user.id, payload.name, payload.description)
    return DeckSummary.model_validate(row)


@router.get(
    "/{deck_id}",
    response_model=DeckDetail,
    response_model_by_alias=True,
)
async def get_user_deck(
    deck_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> DeckDetail:
    row = await get_deck(deck_id, current_user.db_user.id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")
    return DeckDetail.model_validate(row)


@router.put(
    "/{deck_id}",
    response_model=DeckSummary,
    response_model_by_alias=True,
)
async def update_user_deck(
    deck_id: UUID,
    payload: DeckUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> DeckSummary:
    row = await update_deck(deck_id, current_user.db_user.id, payload.name, payload.description)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")
    return DeckSummary.model_validate(row)


@router.delete("/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_deck(
    deck_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> Response:
    deleted = await delete_deck(deck_id, current_user.db_user.id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
