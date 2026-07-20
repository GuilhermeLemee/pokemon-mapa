from fastapi import APIRouter, Depends

from fastapi import HTTPException

from app.auth import CurrentUser, ensure_self_or_staff, get_current_user, require_staff
from app.deps import get_pokemon_repo, get_player_repo
from app.models import (
    ApplyXpRequest,
    ApplyXpResult,
    AvatarUploadRequest,
    ChooseStarterRequest,
    MoveSetRequest,
    PartyUpdateRequest,
    Player,
    PlayerUpdate,
    Pokemon,
)
from app.repository import PlayerRepository, PokemonRepository
from app.rules.battle_engine import max_hp_for_level
from app.rules.level_engine import apply_xp, xp_to_next_level_for
from app.rules.roster import PartyFullError, assert_can_join_party
from app.rules.starters import InvalidStarterError, assert_valid_starter

router = APIRouter(prefix="/players", tags=["players"])


@router.get("", response_model=list[Player])
def list_players(
    _user: CurrentUser = Depends(get_current_user),
    players: PlayerRepository = Depends(get_player_repo),
) -> list[Player]:
    # Qualquer jogador autenticado pode ver a lista (não só staff) — necessário
    # para escolher um oponente ao desafiar alguém para batalha. Grupo pequeno
    # e de confiança (mesa de RPG entre amigos), sem dado sensível exposto.
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


@router.post("/{uid}/avatar", response_model=Player)
def update_avatar(
    uid: str,
    body: AvatarUploadRequest,
    user: CurrentUser = Depends(get_current_user),
    players: PlayerRepository = Depends(get_player_repo),
) -> Player:
    ensure_self_or_staff(uid, user)
    return players.update(uid, PlayerUpdate(avatar_data_url=body.data_url))


@router.get("/{uid}/pokemons", response_model=list[Pokemon])
def list_pokemons(
    uid: str,
    user: CurrentUser = Depends(get_current_user),
    pokemons: PokemonRepository = Depends(get_pokemon_repo),
) -> list[Pokemon]:
    ensure_self_or_staff(uid, user)
    return pokemons.list_for_player(uid)


STARTER_LEVEL = 5


@router.post("/{uid}/starter", response_model=Pokemon)
def choose_starter(
    uid: str,
    body: ChooseStarterRequest,
    user: CurrentUser = Depends(get_current_user),
    players: PlayerRepository = Depends(get_player_repo),
    pokemons: PokemonRepository = Depends(get_pokemon_repo),
) -> Pokemon:
    ensure_self_or_staff(uid, user)
    player = players.get(uid)
    if player.starter_chosen:
        raise HTTPException(status_code=400, detail="Você já escolheu seu pokémon inicial.")
    try:
        assert_valid_starter(body.species)
    except InvalidStarterError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    max_hp = max_hp_for_level(STARTER_LEVEL)
    new_pokemon_id = pokemons._pokemons(uid).document().id
    starter = Pokemon(
        id=new_pokemon_id,
        nickname=body.species,
        species=body.species,
        level=STARTER_LEVEL,
        current_xp=0,
        xp_to_next_level=xp_to_next_level_for(STARTER_LEVEL),
        current_hp=max_hp,
        max_hp=max_hp,
        in_party=True,
    )
    pokemons.save(uid, starter)
    players.update(uid, PlayerUpdate(starter_chosen=True))
    return starter


@router.post("/{uid}/pokemons/{pokemon_id}/party", response_model=Pokemon)
def update_pokemon_party(
    uid: str,
    pokemon_id: str,
    body: PartyUpdateRequest,
    user: CurrentUser = Depends(get_current_user),
    pokemons: PokemonRepository = Depends(get_pokemon_repo),
) -> Pokemon:
    ensure_self_or_staff(uid, user)
    pokemon = pokemons.get(uid, pokemon_id)
    if body.in_party and not pokemon.in_party:
        current_count = sum(1 for p in pokemons.list_for_player(uid) if p.in_party)
        try:
            assert_can_join_party(current_count)
        except PartyFullError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
    pokemon.in_party = body.in_party
    pokemons.save(uid, pokemon)
    return pokemon


@router.post("/{uid}/pokemons/{pokemon_id}/moves", response_model=Pokemon)
def update_pokemon_moves(
    uid: str,
    pokemon_id: str,
    body: MoveSetRequest,
    user: CurrentUser = Depends(get_current_user),
    pokemons: PokemonRepository = Depends(get_pokemon_repo),
) -> Pokemon:
    ensure_self_or_staff(uid, user)
    pokemon = pokemons.get(uid, pokemon_id)
    pokemon.moves = body.moves
    pokemons.save(uid, pokemon)
    return pokemon


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
