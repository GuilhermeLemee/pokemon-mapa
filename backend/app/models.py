from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class Role(StrEnum):
    ADMIN = "admin"
    CO_MESTRE = "co_mestre"
    JOGADOR = "jogador"


STAFF_ROLES = {Role.ADMIN, Role.CO_MESTRE}


class Pokeballs(BaseModel):
    pokebola: int = 0
    superbola: int = 0
    ultrabola: int = 0


class Player(BaseModel):
    uid: str
    display_name: str
    role: Role
    coins: int = 0
    pokeballs: Pokeballs = Field(default_factory=Pokeballs)
    badges: list[str] = Field(default_factory=list)
    starter_chosen: bool = False
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PlayerUpdate(BaseModel):
    display_name: str | None = None
    coins: int | None = None
    pokeballs: Pokeballs | None = None
    badges: list[str] | None = None
    starter_chosen: bool | None = None


class Pokemon(BaseModel):
    id: str
    nickname: str
    species: str
    level: int = 1
    current_xp: int = 0
    xp_to_next_level: int = 100
    current_hp: int
    max_hp: int
    moves: list[str] = Field(default_factory=list)
    caught_at: datetime | None = None
    in_party: bool = True


class PartyUpdateRequest(BaseModel):
    in_party: bool


class ChooseStarterRequest(BaseModel):
    species: str


class MoveSetRequest(BaseModel):
    """Até 8 golpes conhecidos (o "pool" do pokémon); o conjunto de até 6 usados
    numa batalha específica é escolhido à parte, na sala de batalha."""

    moves: list[str] = Field(max_length=8)


class ApplyXpRequest(BaseModel):
    xp_gained: int = Field(gt=0, description="Experiência ganha na batalha, definida pelo mestre")
    note: str | None = Field(default=None, max_length=280)


class ApplyXpResult(BaseModel):
    pokemon: Pokemon
    levels_gained: int
    leveled_up: bool


class RoleChangeRequest(BaseModel):
    role: Role


class BattleType(StrEnum):
    PARTICIPANT = "participant"
    WILD = "wild"


class BattleStatus(StrEnum):
    PENDING_APPROVAL = "pending_approval"
    PENDING_ACCEPT = "pending_accept"
    ACTIVE = "active"
    FINISHED = "finished"
    DECLINED = "declined"


class TrainerSide(BaseModel):
    uid: str
    pokemon_id: str


class WildSide(BaseModel):
    is_wild: bool = True
    species: str
    level: int
    current_hp: int
    max_hp: int


class BattleRoom(BaseModel):
    id: str
    type: BattleType
    status: BattleStatus
    created_by: str
    side_a: TrainerSide
    side_b: TrainerSide | WildSide
    created_at: datetime | None = None
    updated_at: datetime | None = None
    finished_at: datetime | None = None


class CreateParticipantBattleRequest(BaseModel):
    my_pokemon_id: str
    opponent_uid: str


class CreateWildBattleRequest(BaseModel):
    target_uid: str
    target_pokemon_id: str
    wild_species: str
    wild_level: int = Field(gt=0)


class ApproveBattleRequest(BaseModel):
    opponent_pokemon_id: str


class HitRequest(BaseModel):
    target: str = Field(pattern="^[ab]$")
    advantage: bool = False


class MultiAttackRequest(BaseModel):
    target: str = Field(pattern="^[ab]$")
    validated: bool
    hit_count: int = Field(ge=0, default=0)


class CaptureRequest(BaseModel):
    ball_type: str = Field(pattern="^(pokebola|superbola|ultrabola)$")
    success: bool


class SwapRequest(BaseModel):
    side: str = Field(pattern="^[ab]$")
    pokemon_id: str


class BattleActionResult(BaseModel):
    room: BattleRoom
    damage_dealt: int | None = None
    capture_success: bool | None = None
    xp_granted: int | None = None
    leveled_up: bool | None = None


class HealRequestStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    DECLINED = "declined"


class HealRequest(BaseModel):
    id: str
    uid: str
    status: HealRequestStatus
    created_at: datetime | None = None
    updated_at: datetime | None = None
