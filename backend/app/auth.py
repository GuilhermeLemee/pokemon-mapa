from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth as firebase_auth

from app.firebase import get_auth_client
from app.models import STAFF_ROLES, Role

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    uid: str
    role: Role
    display_name: str | None


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentUser:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token de autenticação ausente")

    try:
        decoded = get_auth_client().verify_id_token(credentials.credentials)
    except firebase_auth.InvalidIdTokenError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido") from exc
    except firebase_auth.ExpiredIdTokenError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token expirado") from exc
    except firebase_auth.RevokedIdTokenError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token revogado") from exc

    raw_role = decoded.get("role", Role.JOGADOR.value)
    try:
        role = Role(raw_role)
    except ValueError:
        role = Role.JOGADOR

    return CurrentUser(uid=decoded["uid"], role=role, display_name=decoded.get("name"))


def require_staff(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if user.role not in STAFF_ROLES:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Requer admin ou co-mestre")
    return user


def require_admin(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if user.role != Role.ADMIN:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Requer admin")
    return user


def ensure_self_or_staff(uid: str, user: CurrentUser) -> None:
    """Checagem inline para rotas onde o próprio dono OU staff pode acessar."""
    if user.uid != uid and user.role not in STAFF_ROLES:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Sem permissão para acessar este jogador")
