from datetime import UTC, datetime

from fastapi import HTTPException, status
from google.cloud.firestore import Client

from app.models import (
    BattleRoom,
    BattleStatus,
    HealRequest,
    HealRequestStatus,
    Player,
    PlayerUpdate,
    Pokemon,
    Role,
    TrainerSide,
    WildSide,
)


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


def _side_from_dict(data: dict) -> TrainerSide | WildSide:
    if data.get("is_wild"):
        return WildSide(**data)
    return TrainerSide(**data)


class BattleRoomRepository:
    def __init__(self, db: Client):
        self._db = db

    def _rooms(self):
        return self._db.collection("battleRooms")

    def _to_model(self, doc) -> BattleRoom:
        data = doc.to_dict()
        return BattleRoom(
            id=doc.id,
            type=data["type"],
            status=data["status"],
            created_by=data["created_by"],
            side_a=_side_from_dict(data["side_a"]),
            side_b=_side_from_dict(data["side_b"]),
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
            finished_at=data.get("finished_at"),
        )

    def get(self, room_id: str) -> BattleRoom:
        doc = self._rooms().document(room_id).get()
        if not doc.exists:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Sala de batalha não encontrada")
        return self._to_model(doc)

    def list_for_user(self, uid: str, is_staff: bool) -> list[BattleRoom]:
        rooms = [self._to_model(doc) for doc in self._rooms().stream()]
        result = [
            room
            for room in rooms
            if room.side_a.uid == uid or (isinstance(room.side_b, TrainerSide) and room.side_b.uid == uid)
        ]
        if is_staff:
            # Staff precisa enxergar toda sala em andamento ou aguardando alguma
            # ação (aprovar/aceitar) pra poder aprovar e coordenar a partida,
            # mesmo quando não é um dos dois treinadores.
            coordinatable_statuses = (
                BattleStatus.PENDING_APPROVAL,
                BattleStatus.PENDING_ACCEPT,
                BattleStatus.ACTIVE,
            )
            extra = [room for room in rooms if room.status in coordinatable_statuses and room not in result]
            result.extend(extra)
        return result

    def create(self, room_id: str, room: BattleRoom) -> BattleRoom:
        now = datetime.now(UTC)
        data = room.model_dump(exclude={"id"}, mode="json")
        data["created_at"] = now
        data["updated_at"] = now
        self._rooms().document(room_id).set(data)
        return self.get(room_id)

    def update(self, room_id: str, updates: dict) -> BattleRoom:
        updates = {**updates, "updated_at": datetime.now(UTC)}
        doc_ref = self._rooms().document(room_id)
        if not doc_ref.get().exists:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Sala de batalha não encontrada")
        doc_ref.update(updates)
        return self.get(room_id)

    def delete(self, room_id: str) -> None:
        self._rooms().document(room_id).delete()

    def list_finished_for_user(self, uid: str) -> list[BattleRoom]:
        rooms = [self._to_model(doc) for doc in self._rooms().stream()]
        return [
            room
            for room in rooms
            if room.status in (BattleStatus.FINISHED, BattleStatus.DECLINED)
            and (room.side_a.uid == uid or (isinstance(room.side_b, TrainerSide) and room.side_b.uid == uid))
        ]


class HealRequestRepository:
    def __init__(self, db: Client):
        self._db = db

    def _requests(self):
        return self._db.collection("healRequests")

    def _to_model(self, doc) -> HealRequest:
        data = doc.to_dict()
        return HealRequest(
            id=doc.id,
            uid=data["uid"],
            status=data["status"],
            created_at=data.get("created_at"),
            updated_at=data.get("updated_at"),
        )

    def get(self, request_id: str) -> HealRequest:
        doc = self._requests().document(request_id).get()
        if not doc.exists:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Pedido de cura não encontrado")
        return self._to_model(doc)

    def list_for_user(self, uid: str, include_all_pending: bool) -> list[HealRequest]:
        requests = [self._to_model(doc) for doc in self._requests().stream()]
        result = [r for r in requests if r.uid == uid]
        if include_all_pending:
            pending = [r for r in requests if r.status == HealRequestStatus.PENDING and r not in result]
            result.extend(pending)
        return result

    def create(self, uid: str) -> HealRequest:
        now = datetime.now(UTC)
        doc_ref = self._requests().document()
        doc_ref.set({"uid": uid, "status": HealRequestStatus.PENDING.value, "created_at": now, "updated_at": now})
        return self.get(doc_ref.id)

    def update(self, request_id: str, status_value: HealRequestStatus) -> HealRequest:
        doc_ref = self._requests().document(request_id)
        if not doc_ref.get().exists:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Pedido de cura não encontrado")
        doc_ref.update({"status": status_value.value, "updated_at": datetime.now(UTC)})
        return self.get(request_id)
