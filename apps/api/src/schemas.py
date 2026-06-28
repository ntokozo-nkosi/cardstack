from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


_camel_config = ConfigDict(populate_by_name=True)


class DeckCount(BaseModel):
    model_config = _camel_config

    cards: int
    due: int


class CollectionCount(BaseModel):
    model_config = _camel_config

    decks: int


class DeckSummary(BaseModel):
    model_config = _camel_config

    id: str
    name: str
    description: str | None = None
    created_at: datetime = Field(alias="createdAt")
    count: DeckCount = Field(alias="_count")


class Card(BaseModel):
    model_config = _camel_config

    id: str
    deck_id: str = Field(alias="deckId")
    front: str
    back: str
    created_at: datetime = Field(alias="createdAt")
    last_response: str | None = Field(default=None, alias="lastResponse")
    last_reviewed_at: datetime | None = Field(default=None, alias="lastReviewedAt")
    review_count: int = Field(default=0, alias="reviewCount")
    repetitions: int = 0
    ease_factor: float = Field(default=2.5, alias="easeFactor")
    interval_days: float = Field(default=0.0, alias="intervalDays")
    due_date: datetime | None = Field(default=None, alias="dueDate")
    is_new: bool = Field(default=True, alias="isNew")


class DeckDetail(BaseModel):
    model_config = _camel_config

    id: str
    name: str
    description: str | None = None
    created_at: datetime = Field(alias="createdAt")
    cards: list[Card]


class Collection(BaseModel):
    model_config = _camel_config

    id: str
    name: str
    description: str | None = None
    created_at: datetime = Field(alias="createdAt")
    count: CollectionCount = Field(alias="_count")


class CollectionDetail(BaseModel):
    model_config = _camel_config

    id: str
    name: str
    description: str | None = None
    created_at: datetime = Field(alias="createdAt")
    decks: list[DeckSummary]


class DeckCreate(BaseModel):
    name: str
    description: str | None = None


class DeckUpdate(BaseModel):
    name: str
    description: str | None = None


class CardCreate(BaseModel):
    front: str
    back: str


class CardUpdate(BaseModel):
    model_config = _camel_config

    front: str
    back: str
    deck_id: str | None = Field(default=None, alias="deckId")


class CollectionCreate(BaseModel):
    name: str
    description: str | None = None


class CollectionUpdate(BaseModel):
    name: str
    description: str | None = None


class AddDeckToCollection(BaseModel):
    model_config = _camel_config

    deck_id: str = Field(alias="deckId")
