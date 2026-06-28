from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status

from ..auth import AuthenticatedUser, get_current_user
from ..db import (
    create_card,
    delete_card,
    get_deck,
    list_cards,
    update_card,
)
from ..schemas import Card, CardCreate, CardUpdate

router = APIRouter(prefix="/v1", tags=["cards"])


@router.get("/cards", response_model=list[Card], response_model_by_alias=True)
async def list_user_cards(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> list[Card]:
    rows = await list_cards(current_user.db_user.id)
    return [Card.model_validate(row) for row in rows]


@router.get(
    "/decks/{deck_id}/cards",
    response_model=list[Card],
    response_model_by_alias=True,
)
async def list_cards_in_deck(
    deck_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> list[Card]:
    deck = await get_deck(deck_id, current_user.db_user.id)
    if deck is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")
    return [Card.model_validate(card) for card in deck.get("cards", [])]


@router.post(
    "/decks/{deck_id}/cards",
    response_model=Card,
    response_model_by_alias=True,
    status_code=status.HTTP_201_CREATED,
)
async def create_card_in_deck(
    deck_id: UUID,
    payload: CardCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> Card:
    row = await create_card(deck_id, current_user.db_user.id, payload.front, payload.back)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")
    return Card.model_validate(row)


@router.put("/cards/{card_id}", response_model=Card, response_model_by_alias=True)
async def update_user_card(
    card_id: UUID,
    payload: CardUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> Card:
    new_deck = UUID(payload.deck_id) if payload.deck_id else None
    row = await update_card(
        card_id,
        current_user.db_user.id,
        payload.front,
        payload.back,
        new_deck_id=new_deck,
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    return Card.model_validate(row)


@router.delete("/cards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_card(
    card_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> Response:
    deleted = await delete_card(card_id, current_user.db_user.id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Card not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
