from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import CurrentUser, get_current_user, require_staff
from app.deps import get_heal_repo, get_pokemon_repo
from app.models import STAFF_ROLES, HealRequest, HealRequestStatus
from app.repository import HealRequestRepository, PokemonRepository

router = APIRouter(prefix="/heal-requests", tags=["heal-requests"])


@router.post("", response_model=HealRequest)
def create_heal_request(
    user: CurrentUser = Depends(get_current_user),
    heal_requests: HealRequestRepository = Depends(get_heal_repo),
) -> HealRequest:
    existing = [r for r in heal_requests.list_for_user(user.uid, include_all_pending=False) if r.status == HealRequestStatus.PENDING]
    if existing:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Você já tem um pedido de cura pendente")
    return heal_requests.create(user.uid)


@router.get("", response_model=list[HealRequest])
def list_heal_requests(
    user: CurrentUser = Depends(get_current_user),
    heal_requests: HealRequestRepository = Depends(get_heal_repo),
) -> list[HealRequest]:
    return heal_requests.list_for_user(user.uid, include_all_pending=user.role in STAFF_ROLES)


@router.post("/{request_id}/approve", response_model=HealRequest)
def approve_heal_request(
    request_id: str,
    _user: CurrentUser = Depends(require_staff),
    heal_requests: HealRequestRepository = Depends(get_heal_repo),
    pokemons: PokemonRepository = Depends(get_pokemon_repo),
) -> HealRequest:
    heal_request = heal_requests.get(request_id)
    if heal_request.status != HealRequestStatus.PENDING:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Pedido já foi respondido")

    for pokemon in pokemons.list_for_player(heal_request.uid):
        if pokemon.current_hp < pokemon.max_hp:
            pokemons.save(heal_request.uid, pokemon.model_copy(update={"current_hp": pokemon.max_hp}))

    return heal_requests.update(request_id, HealRequestStatus.APPROVED)


@router.post("/{request_id}/decline", response_model=HealRequest)
def decline_heal_request(
    request_id: str,
    _user: CurrentUser = Depends(require_staff),
    heal_requests: HealRequestRepository = Depends(get_heal_repo),
) -> HealRequest:
    heal_request = heal_requests.get(request_id)
    if heal_request.status != HealRequestStatus.PENDING:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Pedido já foi respondido")
    return heal_requests.update(request_id, HealRequestStatus.DECLINED)
