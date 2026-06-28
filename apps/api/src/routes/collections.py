from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status

from ..auth import AuthenticatedUser, get_current_user
from ..db import (
    add_deck_to_collection,
    create_collection,
    delete_collection,
    get_collection,
    list_collections,
    remove_deck_from_collection,
    update_collection,
)
from ..schemas import (
    AddDeckToCollection,
    Collection,
    CollectionCreate,
    CollectionDetail,
    CollectionUpdate,
)

router = APIRouter(prefix="/v1/collections", tags=["collections"])


@router.get("", response_model=list[Collection], response_model_by_alias=True)
async def list_user_collections(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> list[Collection]:
    rows = await list_collections(current_user.db_user.id)
    return [Collection.model_validate(row) for row in rows]


@router.post(
    "",
    response_model=Collection,
    response_model_by_alias=True,
    status_code=status.HTTP_201_CREATED,
)
async def create_user_collection(
    payload: CollectionCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> Collection:
    row = await create_collection(current_user.db_user.id, payload.name, payload.description)
    return Collection.model_validate(row)


@router.get(
    "/{collection_id}",
    response_model=CollectionDetail,
    response_model_by_alias=True,
)
async def get_user_collection(
    collection_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> CollectionDetail:
    row = await get_collection(collection_id, current_user.db_user.id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")
    return CollectionDetail.model_validate(row)


@router.put(
    "/{collection_id}",
    response_model=Collection,
    response_model_by_alias=True,
)
async def update_user_collection(
    collection_id: UUID,
    payload: CollectionUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> Collection:
    row = await update_collection(
        collection_id,
        current_user.db_user.id,
        payload.name,
        payload.description,
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")
    return Collection.model_validate(row)


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_collection(
    collection_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> Response:
    deleted = await delete_collection(collection_id, current_user.db_user.id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{collection_id}/decks", status_code=status.HTTP_204_NO_CONTENT)
async def add_deck_to_user_collection(
    collection_id: UUID,
    payload: AddDeckToCollection,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> Response:
    result = await add_deck_to_collection(
        collection_id,
        UUID(payload.deck_id),
        current_user.db_user.id,
    )
    if result == "COLLECTION_NOT_FOUND":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")
    if result == "DECK_NOT_FOUND":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Deck not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete(
    "/{collection_id}/decks/{deck_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_deck_from_user_collection(
    collection_id: UUID,
    deck_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> Response:
    result = await remove_deck_from_collection(
        collection_id,
        deck_id,
        current_user.db_user.id,
    )
    if result == "COLLECTION_NOT_FOUND":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
