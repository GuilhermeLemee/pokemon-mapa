from fastapi import APIRouter, Depends

from app.auth import CurrentUser, get_current_user
from app.deps import get_player_repo
from app.models import Player
from app.repository import PlayerRepository

router = APIRouter(tags=["me"])


@router.get("/me", response_model=Player)
def read_me(
    user: CurrentUser = Depends(get_current_user),
    players: PlayerRepository = Depends(get_player_repo),
) -> Player:
    return players.get(user.uid)
