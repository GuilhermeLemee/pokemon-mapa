from datetime import UTC, datetime

from fastapi import HTTPException, status
from google.cloud.firestore import Client

from app.models import Player, PlayerUpdate, Pokemon, Role


class PlayerRepository:
    def __init__(self, db: Client):
        self._db = db

    def _players(self):
        return self._db.collection("players")

    def get(self, uid: str) -> Player:
        doc = self._players().document(uid).get()
        if not doc.exists:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Jogador não encontrado")
        return Player(uid=doc.id, **doc.to_dict())

    def list_all(self) -> list[Player]:
        return [Player(uid=doc.id, **doc.to_dict()) for doc in self._players().stream()]

    def create(self, uid: str, display_name: str, role: Role) -> Player:
        now = datetime.now(UTC)
        data = {
            "display_name": display_name,
            "role": role.value,
            "coins": 0,
            "pokeballs": {"pokebola": 5, "superbola": 0, "ultrabola": 0},
            "badges": [],
            "created_at": now,
            "updated_at": now,
        }
        self._players().document(uid).set(data)
        return Player(uid=uid, **data)

    def update(self, uid: str, patch: PlayerUpdate) -> Player:
        updates = {k: v for k, v in patch.model_dump(exclude_unset=True).items() if v is not None}
        if not updates:
            return self.get(uid)
        updates["updated_at"] = datetime.now(UTC)
        doc_ref = self._players().document(uid)
        if not doc_ref.get().exists:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Jogador não encontrado")
        doc_ref.update(updates)
        return self.get(uid)

    def set_role(self, uid: str, role: Role) -> Player:
        doc_ref = self._players().document(uid)
        if not doc_ref.get().exists:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Jogador não encontrado")
        doc_ref.update({"role": role.value, "updated_at": datetime.now(UTC)})
        return self.get(uid)


class PokemonRepository:
    def __init__(self, db: Client):
        self._db = db

    def _pokemons(self, uid: str):
        return self._db.collection("players").document(uid).collection("pokemons")

    def _xp_log(self, uid: str):
        return self._db.collection("players").document(uid).collection("xpLog")

    def get(self, uid: str, pokemon_id: str) -> Pokemon:
        doc = self._pokemons(uid).document(pokemon_id).get()
        if not doc.exists:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Pokémon não encontrado")
        return Pokemon(id=doc.id, **doc.to_dict())

    def list_for_player(self, uid: str) -> list[Pokemon]:
        return [Pokemon(id=doc.id, **doc.to_dict()) for doc in self._pokemons(uid).stream()]

    def save(self, uid: str, pokemon: Pokemon) -> None:
        data = pokemon.model_dump(exclude={"id"})
        self._pokemons(uid).document(pokemon.id).set(data, merge=True)

    def log_xp_gain(self, uid: str, pokemon_id: str, xp_gained: int, applied_by: str, note: str | None) -> None:
        self._xp_log(uid).add(
            {
                "pokemon_id": pokemon_id,
                "xp_gained": xp_gained,
                "applied_by": applied_by,
                "note": note,
                "created_at": datetime.now(UTC),
            }
        )
