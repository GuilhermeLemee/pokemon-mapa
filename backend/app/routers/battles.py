from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import CurrentUser, get_current_user, require_staff
from app.deps import get_battle_repo, get_player_repo, get_pokemon_repo
from app.models import (
    STAFF_ROLES,
    ApproveBattleRequest,
    BattleActionResult,
    BattleRoom,
    BattleStatus,
    BattleType,
    CaptureRequest,
    CreateParticipantBattleRequest,
    CreateWildBattleRequest,
    HitRequest,
    MultiAttackRequest,
    PlayerUpdate,
    Pokemon,
    SwapRequest,
    TrainerSide,
    WildSide,
)
from app.repository import BattleRoomRepository, PlayerRepository, PokemonRepository
from app.rules.battle_engine import (
    damage_for_attack,
    damage_for_multi_hit,
    max_hp_for_level,
    xp_for_victory,
)
from app.rules.level_engine import apply_xp, xp_to_next_level_for

router = APIRouter(prefix="/battles", tags=["battles"])


def _hydrate_side(side: TrainerSide | WildSide, pokemons: PokemonRepository) -> dict:
    """Junta o lado da sala com a vida real do pokémon (fonte única de verdade
    pra lados de jogador; o selvagem já guarda a vida embutida)."""
    if isinstance(side, WildSide):
        return side.model_dump()
    pokemon = pokemons.get(side.uid, side.pokemon_id)
    return {
        "uid": side.uid,
        "pokemon_id": side.pokemon_id,
        "species": pokemon.species,
        "level": pokemon.level,
        "current_hp": pokemon.current_hp,
        "max_hp": pokemon.max_hp,
        "moves": pokemon.moves,
    }


def _hydrated_room(room: BattleRoom, pokemons: PokemonRepository) -> dict:
    hydrated_a = _hydrate_side(room.side_a, pokemons)
    hydrated_b = _hydrate_side(room.side_b, pokemons)
    suggested_xp = None
    if hydrated_a["current_hp"] <= 0:
        suggested_xp = xp_for_victory(hydrated_a["level"])
    elif hydrated_b["current_hp"] <= 0:
        suggested_xp = xp_for_victory(hydrated_b["level"])
    return {
        **room.model_dump(exclude={"side_a", "side_b"}),
        "side_a": hydrated_a,
        "side_b": hydrated_b,
        "suggested_xp": suggested_xp,
    }


def _ensure_participant_or_staff(room: BattleRoom, user: CurrentUser) -> None:
    is_participant = room.side_a.uid == user.uid or (
        isinstance(room.side_b, TrainerSide) and room.side_b.uid == user.uid
    )
    if not is_participant and user.role not in STAFF_ROLES:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Sem permissão para acessar esta sala")


def _side_key(room: BattleRoom, target: str) -> tuple[str, TrainerSide | WildSide]:
    return ("side_a", room.side_a) if target == "a" else ("side_b", room.side_b)


def _attacker_level(attacker_side: TrainerSide | WildSide, pokemons: PokemonRepository) -> int:
    if isinstance(attacker_side, WildSide):
        return attacker_side.level
    return pokemons.get(attacker_side.uid, attacker_side.pokemon_id).level


def _apply_damage_to_side(
    room_id: str,
    side_key: str,
    side: TrainerSide | WildSide,
    damage: int,
    battles: BattleRoomRepository,
    pokemons: PokemonRepository,
) -> None:
    if isinstance(side, WildSide):
        new_hp = max(0, side.current_hp - damage)
        battles.update(room_id, {side_key: {**side.model_dump(), "current_hp": new_hp}})
    else:
        pokemon = pokemons.get(side.uid, side.pokemon_id)
        new_hp = max(0, pokemon.current_hp - damage)
        pokemons.save(side.uid, pokemon.model_copy(update={"current_hp": new_hp}))


@router.post("/participant", response_model=BattleRoom)
def create_participant_battle(
    body: CreateParticipantBattleRequest,
    user: CurrentUser = Depends(get_current_user),
    battles: BattleRoomRepository = Depends(get_battle_repo),
    pokemons: PokemonRepository = Depends(get_pokemon_repo),
) -> BattleRoom:
    pokemons.get(user.uid, body.my_pokemon_id)  # valida que o pokémon existe e é seu
    room_id = battles._rooms().document().id
    room = BattleRoom(
        id=room_id,
        type=BattleType.PARTICIPANT,
        status=BattleStatus.PENDING_APPROVAL,
        created_by=user.uid,
        side_a=TrainerSide(uid=user.uid, pokemon_id=body.my_pokemon_id),
        side_b=TrainerSide(uid=body.opponent_uid, pokemon_id=""),
    )
    return battles.create(room_id, room)


@router.post("/wild", response_model=BattleRoom)
def create_wild_battle(
    body: CreateWildBattleRequest,
    user: CurrentUser = Depends(require_staff),
    battles: BattleRoomRepository = Depends(get_battle_repo),
    pokemons: PokemonRepository = Depends(get_pokemon_repo),
) -> BattleRoom:
    pokemons.get(body.target_uid, body.target_pokemon_id)
    wild_max_hp = max_hp_for_level(body.wild_level)
    room_id = battles._rooms().document().id
    room = BattleRoom(
        id=room_id,
        type=BattleType.WILD,
        status=BattleStatus.PENDING_ACCEPT,
        created_by=user.uid,
        side_a=TrainerSide(uid=body.target_uid, pokemon_id=body.target_pokemon_id),
        side_b=WildSide(species=body.wild_species, level=body.wild_level, current_hp=wild_max_hp, max_hp=wild_max_hp),
    )
    return battles.create(room_id, room)


@router.get("", response_model=list[BattleRoom])
def list_battles(
    user: CurrentUser = Depends(get_current_user),
    battles: BattleRoomRepository = Depends(get_battle_repo),
) -> list[BattleRoom]:
    return battles.list_for_user(user.uid, include_pending_approval=user.role in STAFF_ROLES)


@router.delete("/finished", status_code=status.HTTP_204_NO_CONTENT)
def clear_finished_battles(
    user: CurrentUser = Depends(get_current_user),
    battles: BattleRoomRepository = Depends(get_battle_repo),
) -> None:
    for room in battles.list_finished_for_user(user.uid):
        battles.delete(room.id)


@router.get("/{room_id}")
def get_battle(
    room_id: str,
    user: CurrentUser = Depends(get_current_user),
    battles: BattleRoomRepository = Depends(get_battle_repo),
    pokemons: PokemonRepository = Depends(get_pokemon_repo),
) -> dict:
    room = battles.get(room_id)
    _ensure_participant_or_staff(room, user)
    return _hydrated_room(room, pokemons)


@router.post("/{room_id}/approve", response_model=BattleRoom)
def approve_battle(
    room_id: str,
    body: ApproveBattleRequest,
    _user: CurrentUser = Depends(require_staff),
    battles: BattleRoomRepository = Depends(get_battle_repo),
    pokemons: PokemonRepository = Depends(get_pokemon_repo),
) -> BattleRoom:
    room = battles.get(room_id)
    if room.status != BattleStatus.PENDING_APPROVAL or not isinstance(room.side_b, TrainerSide):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Sala não está aguardando aprovação")
    pokemons.get(room.side_b.uid, body.opponent_pokemon_id)
    return battles.update(
        room_id,
        {
            "status": BattleStatus.ACTIVE.value,
            "side_b": {"uid": room.side_b.uid, "pokemon_id": body.opponent_pokemon_id},
        },
    )


@router.post("/{room_id}/accept", response_model=BattleRoom)
def accept_battle(
    room_id: str,
    user: CurrentUser = Depends(get_current_user),
    battles: BattleRoomRepository = Depends(get_battle_repo),
) -> BattleRoom:
    room = battles.get(room_id)
    if room.status != BattleStatus.PENDING_ACCEPT or room.side_a.uid != user.uid:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Sala não está aguardando seu aceite")
    return battles.update(room_id, {"status": BattleStatus.ACTIVE.value})


@router.post("/{room_id}/decline", response_model=BattleRoom)
def decline_battle(
    room_id: str,
    user: CurrentUser = Depends(get_current_user),
    battles: BattleRoomRepository = Depends(get_battle_repo),
) -> BattleRoom:
    room = battles.get(room_id)
    if room.status != BattleStatus.PENDING_ACCEPT or room.side_a.uid != user.uid:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Sala não está aguardando seu aceite")
    return battles.update(room_id, {"status": BattleStatus.DECLINED.value})


@router.post("/{room_id}/hit", response_model=BattleActionResult)
def hit(
    room_id: str,
    body: HitRequest,
    _user: CurrentUser = Depends(require_staff),
    battles: BattleRoomRepository = Depends(get_battle_repo),
    pokemons: PokemonRepository = Depends(get_pokemon_repo),
) -> BattleActionResult:
    room = battles.get(room_id)
    if room.status != BattleStatus.ACTIVE:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Sala não está ativa")

    target_key, target_side = _side_key(room, body.target)
    _, attacker_side = _side_key(room, "b" if body.target == "a" else "a")
    damage = damage_for_attack(_attacker_level(attacker_side, pokemons), body.advantage)
    _apply_damage_to_side(room_id, target_key, target_side, damage, battles, pokemons)

    return BattleActionResult(room=battles.get(room_id), damage_dealt=damage)


@router.post("/{room_id}/multi-attack", response_model=BattleActionResult)
def multi_attack(
    room_id: str,
    body: MultiAttackRequest,
    _user: CurrentUser = Depends(require_staff),
    battles: BattleRoomRepository = Depends(get_battle_repo),
    pokemons: PokemonRepository = Depends(get_pokemon_repo),
) -> BattleActionResult:
    room = battles.get(room_id)
    if room.status != BattleStatus.ACTIVE:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Sala não está ativa")

    if not body.validated:
        return BattleActionResult(room=room, damage_dealt=0)

    target_key, target_side = _side_key(room, body.target)
    _, attacker_side = _side_key(room, "b" if body.target == "a" else "a")
    damage = damage_for_multi_hit(_attacker_level(attacker_side, pokemons), body.hit_count)
    _apply_damage_to_side(room_id, target_key, target_side, damage, battles, pokemons)

    return BattleActionResult(room=battles.get(room_id), damage_dealt=damage)


@router.post("/{room_id}/capture", response_model=BattleActionResult)
def capture(
    room_id: str,
    body: CaptureRequest,
    _user: CurrentUser = Depends(require_staff),
    battles: BattleRoomRepository = Depends(get_battle_repo),
    pokemons: PokemonRepository = Depends(get_pokemon_repo),
    players: PlayerRepository = Depends(get_player_repo),
) -> BattleActionResult:
    room = battles.get(room_id)
    if room.status != BattleStatus.ACTIVE or not isinstance(room.side_b, WildSide):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Captura só é possível contra um pokémon selvagem ativo")

    wild = room.side_b
    if wild.current_hp <= 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Esse pokémon não pode ser capturado agora")

    player = players.get(room.side_a.uid)
    available = getattr(player.pokeballs, body.ball_type)
    if available <= 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Sem {body.ball_type} disponível")
    new_pokeballs = player.pokeballs.model_copy(update={body.ball_type: available - 1})
    players.update(room.side_a.uid, PlayerUpdate(pokeballs=new_pokeballs))

    success = body.success
    if success:
        new_pokemon_id = pokemons._pokemons(room.side_a.uid).document().id
        captured = Pokemon(
            id=new_pokemon_id,
            nickname=wild.species,
            species=wild.species,
            level=wild.level,
            current_xp=0,
            xp_to_next_level=xp_to_next_level_for(wild.level),
            current_hp=wild.current_hp,
            max_hp=wild.max_hp,
        )
        pokemons.save(room.side_a.uid, captured)
        battles.update(room_id, {"status": BattleStatus.FINISHED.value})

    return BattleActionResult(room=battles.get(room_id), capture_success=success)


@router.post("/{room_id}/swap", response_model=BattleRoom)
def swap(
    room_id: str,
    body: SwapRequest,
    user: CurrentUser = Depends(get_current_user),
    battles: BattleRoomRepository = Depends(get_battle_repo),
    pokemons: PokemonRepository = Depends(get_pokemon_repo),
) -> BattleRoom:
    room = battles.get(room_id)
    if room.status != BattleStatus.ACTIVE:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Sala não está ativa")

    side_key, side = _side_key(room, body.side)
    if not isinstance(side, TrainerSide):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Só é possível trocar o pokémon de um treinador")
    if user.uid != side.uid and user.role not in STAFF_ROLES:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Só o dono do pokémon (ou o mestre) pode trocar")

    current_pokemon = pokemons.get(side.uid, side.pokemon_id)
    if current_pokemon.current_hp > 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Só é possível trocar quando o pokémon atual está com 0 de vida")

    new_pokemon = pokemons.get(side.uid, body.pokemon_id)
    if new_pokemon.current_hp <= 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "O pokémon escolhido também está sem vida")

    return battles.update(room_id, {side_key: {"uid": side.uid, "pokemon_id": body.pokemon_id}})


def _grant_victory_xp(
    winner: TrainerSide, defeated_level: int, pokemons: PokemonRepository, applied_by: str
) -> tuple[int, bool]:
    pokemon = pokemons.get(winner.uid, winner.pokemon_id)
    xp = xp_for_victory(defeated_level)
    result = apply_xp(pokemon, xp)
    pokemons.save(winner.uid, result.pokemon)
    pokemons.log_xp_gain(winner.uid, winner.pokemon_id, xp, applied_by=applied_by, note="Vitória em batalha")
    return xp, result.leveled_up


@router.post("/{room_id}/finish", response_model=BattleActionResult)
def finish(
    room_id: str,
    user: CurrentUser = Depends(require_staff),
    battles: BattleRoomRepository = Depends(get_battle_repo),
    pokemons: PokemonRepository = Depends(get_pokemon_repo),
) -> BattleActionResult:
    room = battles.get(room_id)
    hydrated = _hydrated_room(room, pokemons)
    xp_granted: int | None = None
    leveled_up: bool | None = None

    if hydrated["side_a"]["current_hp"] <= 0 and isinstance(room.side_b, TrainerSide):
        xp_granted, leveled_up = _grant_victory_xp(room.side_b, hydrated["side_a"]["level"], pokemons, user.uid)
    elif hydrated["side_b"]["current_hp"] <= 0 and isinstance(room.side_a, TrainerSide):
        xp_granted, leveled_up = _grant_victory_xp(room.side_a, hydrated["side_b"]["level"], pokemons, user.uid)

    battles.update(room_id, {"status": BattleStatus.FINISHED.value, "finished_at": datetime.now(UTC)})
    return BattleActionResult(room=battles.get(room_id), xp_granted=xp_granted, leveled_up=leveled_up)
