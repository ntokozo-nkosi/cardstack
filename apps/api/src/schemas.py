from pydantic import BaseModel


class Card(BaseModel):
    id: str
    front: str
    back: str
    order: int


class Deck(BaseModel):
    id: str
    name: str
    detail: str | None = None
    cards: list[Card]
