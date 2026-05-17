from dataclasses import dataclass

from clerk_backend_api import AuthenticateRequestOptions
from clerk_backend_api import authenticate_request
from clerk_backend_api.security.types import AuthStatus
from fastapi import HTTPException
from fastapi import Request
from fastapi import status

from .db import CurrentUser
from .db import get_or_create_user
from .settings import get_settings


@dataclass(frozen=True)
class AuthenticatedUser:
    clerk_id: str
    db_user: CurrentUser


def get_current_user(request: Request) -> AuthenticatedUser:
    settings = get_settings()
    request_state = authenticate_request(
        request,
        AuthenticateRequestOptions(
            secret_key=settings.clerk_secret_key,
            jwt_key=settings.jwt_key,
            authorized_parties=settings.authorized_parties,
            accepts_token=["session_token"],
        ),
    )

    if request_state.status != AuthStatus.SIGNED_IN or request_state.payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing Clerk session token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    clerk_id = request_state.payload.get("sub")
    if not isinstance(clerk_id, str) or not clerk_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Clerk session token is missing a subject",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = request_state.payload.get("email")
    if not isinstance(email, str):
        email = None

    db_user = get_or_create_user(clerk_id=clerk_id, email=email)
    request.state.clerk_user_id = clerk_id
    request.state.db_user_id = str(db_user.id)
    return AuthenticatedUser(clerk_id=clerk_id, db_user=db_user)
