import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../lib/api";
import { STAFF_ROLES, type BattleRoom, type Player, type Pokemon } from "../lib/types";
import { ACCENT_BUTTON, FIELD_INPUT, GLASS_CARD } from "../lib/ui";

const STATUS_LABEL: Record<BattleRoom["status"], string> = {
  pending_approval: "Aguardando aprovação do mestre",
  pending_accept: "Aguardando você aceitar",
  active: "Em andamento",
  finished: "Finalizada",
  declined: "Recusada",
};

export function BattlesPage() {
  const { player } = useAuth();
  const [rooms, setRooms] = useState<BattleRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isStaff = player && STAFF_ROLES.includes(player.role);

  const load = () => {
    setLoading(true);
    api
      .get<BattleRoom[]>("/battles")
      .then(setRooms)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erro ao carregar batalhas."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (!player) return null;

  const pending = rooms.filter(
    (r) =>
      (r.status === "pending_approval" && isStaff) ||
      (r.status === "pending_accept" && r.side_a.uid === player.uid),
  );
  const active = rooms.filter((r) => r.status === "active");
  const finished = rooms.filter((r) => r.status === "finished" || r.status === "declined");

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap gap-3">
        <ChallengeForm onCreated={load} />
        {isStaff && <WildEncounterForm onCreated={load} />}
      </section>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading ? (
        <p className="text-accent-500">Carregando...</p>
      ) : (
        <>
          <RoomSection title="Pendentes" rooms={pending} emptyText="Nada pendente." />
          <RoomSection title="Em andamento" rooms={active} emptyText="Nenhuma batalha ativa." />
          <RoomSection title="Encerradas" rooms={finished} emptyText="Nenhuma batalha encerrada ainda." />
        </>
      )}
    </div>
  );
}

function RoomSection({ title, rooms, emptyText }: { title: string; rooms: BattleRoom[]; emptyText: string }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-accent-200">{title}</h2>
      {rooms.length === 0 ? (
        <p className="text-sm text-accent-500">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </section>
  );
}

function sideLabel(side: BattleRoom["side_a"] | BattleRoom["side_b"]): string {
  return "is_wild" in side ? `${side.species} selvagem (nv. ${side.level})` : `${side.species} (nv. ${side.level})`;
}

function RoomCard({ room }: { room: BattleRoom }) {
  return (
    <Link to={`/battles/${room.id}`} className={`${GLASS_CARD} block p-4 hover:border-accent-300/40`}>
      <p className="text-xs text-accent-500">{STATUS_LABEL[room.status]}</p>
      <p className="mt-1 text-sm text-accent-200">
        {sideLabel(room.side_a)} <span className="text-accent-500">vs</span> {sideLabel(room.side_b)}
      </p>
    </Link>
  );
}

function ChallengeForm({ onCreated }: { onCreated: () => void }) {
  const { player } = useAuth();
  const [open, setOpen] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [myPokemonId, setMyPokemonId] = useState("");
  const [opponentUid, setOpponentUid] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !player) return;
    api.get<Player[]>("/players").then((all) => setPlayers(all.filter((p) => p.uid !== player.uid)));
    api.get<Pokemon[]>(`/players/${player.uid}/pokemons`).then(setPokemons);
  }, [open, player]);

  const handleSubmit = async () => {
    if (!myPokemonId || !opponentUid) {
      setError("Escolha seu pokémon e o oponente.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/battles/participant", { my_pokemon_id: myPokemonId, opponent_uid: opponentUid });
      setOpen(false);
      setMyPokemonId("");
      setOpponentUid("");
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao desafiar.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className={ACCENT_BUTTON}>
        Desafiar jogador
      </button>
    );
  }

  return (
    <div className={`${GLASS_CARD} w-full max-w-sm space-y-3 p-4`}>
      <p className="text-sm font-medium text-accent-200">Desafiar jogador</p>
      <select value={myPokemonId} onChange={(e) => setMyPokemonId(e.target.value)} className={FIELD_INPUT}>
        <option value="">Seu pokémon</option>
        {pokemons.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nickname} (nv. {p.level})
          </option>
        ))}
      </select>
      <select value={opponentUid} onChange={(e) => setOpponentUid(e.target.value)} className={FIELD_INPUT}>
        <option value="">Oponente</option>
        {players.map((p) => (
          <option key={p.uid} value={p.uid}>
            {p.display_name}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={submitting} className={`flex-1 ${ACCENT_BUTTON}`}>
          {submitting ? "Enviando..." : "Enviar desafio"}
        </button>
        <button onClick={() => setOpen(false)} className="px-3 text-sm text-accent-500 hover:text-accent-300">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function WildEncounterForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [targetUid, setTargetUid] = useState("");
  const [targetPokemonId, setTargetPokemonId] = useState("");
  const [wildSpecies, setWildSpecies] = useState("");
  const [wildLevel, setWildLevel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    api.get<Player[]>("/players").then(setPlayers);
  }, [open]);

  useEffect(() => {
    if (!targetUid) {
      setPokemons([]);
      return;
    }
    api.get<Pokemon[]>(`/players/${targetUid}/pokemons`).then(setPokemons);
  }, [targetUid]);

  const handleSubmit = async () => {
    const level = Number(wildLevel);
    if (!targetUid || !targetPokemonId || !wildSpecies || !level || level <= 0) {
      setError("Preencha todos os campos.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/battles/wild", {
        target_uid: targetUid,
        target_pokemon_id: targetPokemonId,
        wild_species: wildSpecies,
        wild_level: level,
      });
      setOpen(false);
      setTargetUid("");
      setTargetPokemonId("");
      setWildSpecies("");
      setWildLevel("");
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao criar encontro.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className={ACCENT_BUTTON}>
        Criar encontro selvagem
      </button>
    );
  }

  return (
    <div className={`${GLASS_CARD} w-full max-w-sm space-y-3 p-4`}>
      <p className="text-sm font-medium text-accent-200">Criar encontro selvagem</p>
      <select value={targetUid} onChange={(e) => setTargetUid(e.target.value)} className={FIELD_INPUT}>
        <option value="">Participante</option>
        {players.map((p) => (
          <option key={p.uid} value={p.uid}>
            {p.display_name}
          </option>
        ))}
      </select>
      <select value={targetPokemonId} onChange={(e) => setTargetPokemonId(e.target.value)} className={FIELD_INPUT}>
        <option value="">Pokémon do participante</option>
        {pokemons.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nickname} (nv. {p.level})
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Espécie selvagem"
        value={wildSpecies}
        onChange={(e) => setWildSpecies(e.target.value)}
        className={FIELD_INPUT}
      />
      <input
        type="number"
        min={1}
        placeholder="Nível do selvagem"
        value={wildLevel}
        onChange={(e) => setWildLevel(e.target.value)}
        className={FIELD_INPUT}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={submitting} className={`flex-1 ${ACCENT_BUTTON}`}>
          {submitting ? "Enviando..." : "Criar sala"}
        </button>
        <button onClick={() => setOpen(false)} className="px-3 text-sm text-accent-500 hover:text-accent-300">
          Cancelar
        </button>
      </div>
    </div>
  );
}
