from google.cloud.firestore import Client

from app.firebase import get_firestore_client
from app.repository import BattleRoomRepository, PlayerRepository, PokemonRepository


def get_db() -> Client:
    return get_firestore_client()


def get_player_repo() -> PlayerRepository:
    return PlayerRepository(get_db())


def get_pokemon_repo() -> PokemonRepository:
    return PokemonRepository(get_db())


def get_battle_repo() -> BattleRoomRepository:
    return BattleRoomRepository(get_db())
