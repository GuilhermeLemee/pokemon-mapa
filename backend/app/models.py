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
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PlayerUpdate(BaseModel):
    display_name: str | None = None
    coins: int | None = None
    pokeballs: Pokeballs | None = None
    badges: list[str] | None = None


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


class ApplyXpRequest(BaseModel):
    xp_gained: int = Field(gt=0, description="Experiência ganha na batalha, definida pelo mestre")
    note: str | None = Field(default=None, max_length=280)


class ApplyXpResult(BaseModel):
    pokemon: Pokemon
    levels_gained: int
    leveled_up: bool


class RoleChangeRequest(BaseModel):
    role: Role
