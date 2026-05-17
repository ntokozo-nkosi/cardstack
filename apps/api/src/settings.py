from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings
from pydantic_settings import SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = Field(..., alias="DATABASE_URL")
    clerk_secret_key: str = Field(..., alias="CLERK_SECRET_KEY")
    clerk_jwt_key: str | None = Field(default=None, alias="CLERK_JWT_KEY")
    clerk_authorized_parties: str | None = Field(default=None, alias="CLERK_AUTHORIZED_PARTIES")

    model_config = SettingsConfigDict(extra="ignore")

    @property
    def database_conninfo(self) -> str:
        if "sslmode=" in self.database_url:
            return self.database_url

        separator = "&" if "?" in self.database_url else "?"
        return f"{self.database_url}{separator}sslmode=require"

    @property
    def jwt_key(self) -> str | None:
        if self.clerk_jwt_key and self.clerk_jwt_key.strip():
            return self.clerk_jwt_key

        return None

    @property
    def authorized_parties(self) -> list[str] | None:
        if not self.clerk_authorized_parties:
            return None

        parties = [
            party.strip()
            for party in self.clerk_authorized_parties.split(",")
            if party.strip()
        ]
        return parties or None


@lru_cache
def get_settings() -> Settings:
    return Settings()
