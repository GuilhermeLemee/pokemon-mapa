from fastapi import APIRouter, Depends

from app.auth import CurrentUser, ensure_self_or_staff, get_current_user, require_staff
from app.deps import get_pokemon_repo, get_player_repo
from app.models import ApplyXpRequest, ApplyXpResult, Player, PlayerUpdate, Pokemon
from app.repository import PlayerRepository, PokemonRepository
from app.rules.level_engine import apply_xp

router = APIRouter(prefix="/players", tags=["players"])


@router.get("", response_model=list[Player])
def list_players(
    _user: CurrentUser = Depends(require_staff),
    players: PlayerRepository = Depends(get_player_repo),
) -> list[Player]:
    return players.list_all()


@router.get("/{uid}", response_model=Player)
def get_player(
    uid: str,
    user: CurrentUser = Depends(get_current_user),
    players: PlayerRepository = Depends(get_player_repo),
) -> Player:
    ensure_self_or_staff(uid, user)
    return players.get(uid)


@router.patch("/{uid}", response_model=Player)
def update_player(
    uid: str,
    patch: PlayerUpdate,
    _user: CurrentUser = Depends(require_staff),
    players: PlayerRepository = Depends(get_player_repo),
) -> Player:
    return players.update(uid, patch)


@router.get("/{uid}/pokemons", response_model=list[Pokemon])
def list_pokemons(
    uid: str,
    user: CurrentUser = Depends(get_current_user),
    pokemons: PokemonRepository = Depends(get_pokemon_repo),
) -> list[Pokemon]:
    ensure_self_or_staff(uid, user)
    return pokemons.list_for_player(uid)


@router.post("/{uid}/pokemons/{pokemon_id}/xp", response_model=ApplyXpResult)
def apply_pokemon_xp(
    uid: str,
    pokemon_id: str,
    body: ApplyXpRequest,
    user: CurrentUser = Depends(require_staff),
    pokemons: PokemonRepository = Depends(get_pokemon_repo),
) -> ApplyXpResult:
    pokemon = pokemons.get(uid, pokemon_id)
    result = apply_xp(pokemon, body.xp_gained)
    pokemons.save(uid, result.pokemon)
    pokemons.log_xp_gain(uid, pokemon_id, body.xp_gained, applied_by=user.uid, note=body.note)
    return ApplyXpResult(
        pokemon=result.pokemon,
        levels_gained=result.levels_gained,
        leveled_up=result.leveled_up,
    )
