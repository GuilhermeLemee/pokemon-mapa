from fastapi import APIRouter, Depends

from app.auth import CurrentUser, require_admin
from app.deps import get_player_repo
from app.firebase import get_auth_client
from app.models import Player, RoleChangeRequest
from app.repository import PlayerRepository

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/users/{uid}/role", response_model=Player)
def change_role(
    uid: str,
    body: RoleChangeRequest,
    _user: CurrentUser = Depends(require_admin),
    players: PlayerRepository = Depends(get_player_repo),
) -> Player:
    get_auth_client().set_custom_user_claims(uid, {"role": body.role.value})
    return players.set_role(uid, body.role)
