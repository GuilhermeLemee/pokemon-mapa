import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HealCenterPanel } from "../components/HealCenterPanel";
import { ImageButton } from "../components/ImageButton";
import { PokemonSpeciesAutocomplete } from "../components/PokemonSpeciesAutocomplete";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../lib/api";
import { STAFF_ROLES, type BattleRoom, type Player, type Pokemon } from "../lib/types";

export const PANEL = "rounded-[28px] bg-neutral-900/85 ring-1 ring-white/10 shadow-2xl backdrop-blur-xl";
export const GHOST_INPUT =
  "w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-white/30 focus:ring-white/30";
export const GHOST_BUTTON =
  "rounded-full px-3 py-2 text-sm font-semibold text-white/70 ring-1 ring-white/15 hover:bg-white/10 hover:text-white transition";
export const RED_BUTTON =
  "rounded-full px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50";
const RED_BG = "linear-gradient(180deg,#e5153a,#c00822)";

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

  const clearHistory = async () => {
    try {
      await api.delete("/battles/finished");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao limpar histórico.");
    }
  };

  return (
    <div className={`${PANEL} space-y-6 p-5 sm:p-6`}>
      <HealCenterPanel />

      <section className="flex flex-wrap gap-3">
        <ChallengeForm onCreated={load} />
        {isStaff && <WildEncounterForm onCreated={load} />}
        <GymBattleStub />
      </section>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {loading ? (
        <p className="text-sm text-white/40">Carregando...</p>
      ) : (
        <>
          <RoomSection title="Pendentes" rooms={pending} emptyText="Nada pendente." />
          <RoomSection title="Em andamento" rooms={active} emptyText="Nenhuma batalha ativa." />
          <RoomSection
            title="Encerradas"
            rooms={finished}
            emptyText="Nenhuma batalha encerrada ainda."
            onClear={finished.length > 0 ? clearHistory : undefined}
          />
        </>
      )}
    </div>
  );
}

function RoomSection({
  title,
  rooms,
  emptyText,
  onClear,
}: {
  title: string;
  rooms: BattleRoom[];
  emptyText: string;
  onClear?: () => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-extrabold text-white">{title}</h2>
        {onClear && (
          <button onClick={onClear} className="text-xs font-medium text-white/40 hover:text-white/70">
            Limpar histórico
          </button>
        )}
      </div>
      {rooms.length === 0 ? (
        <p className="text-sm text-white/35">{emptyText}</p>
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
    <Link
      to={`/battles/${room.id}`}
      className="block rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-white/20"
    >
      <p className="text-xs font-medium text-white/40">{STATUS_LABEL[room.status]}</p>
      <p className="mt-1 text-sm text-white/90">
        {sideLabel(room.side_a)} <span className="text-white/40">vs</span> {sideLabel(room.side_b)}
      </p>
    </Link>
  );
}

function GymBattleStub() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <ImageButton
        src="/battle-buttons/button-gym.png"
        alt="Batalha de Ginásio"
        onClick={() => setOpen(true)}
      />
    );
  }

  return (
    <div className="w-full max-w-sm space-y-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <p className="text-sm font-semibold text-white">Batalha de Ginásio</p>
      <p className="text-sm text-white/50">Em breve — o catálogo de líderes de ginásio ainda não foi implementado.</p>
      <button onClick={() => setOpen(false)} className="px-3 text-sm text-white/40 hover:text-white/70">
        Fechar
      </button>
    </div>
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
      <ImageButton
        src="/battle-buttons/button-challenge.png"
        alt="Desafiar jogador"
        onClick={() => setOpen(true)}
      />
    );
  }

  return (
    <div className="w-full max-w-sm space-y-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <p className="text-sm font-semibold text-white">Desafiar jogador</p>
      <select value={myPokemonId} onChange={(e) => setMyPokemonId(e.target.value)} className={GHOST_INPUT}>
        <option value="" className="bg-neutral-900">Seu pokémon</option>
        {pokemons.filter((p) => p.in_party).map((p) => (
          <option key={p.id} value={p.id} className="bg-neutral-900">
            {p.nickname} (nv. {p.level})
          </option>
        ))}
      </select>
      <select value={opponentUid} onChange={(e) => setOpponentUid(e.target.value)} className={GHOST_INPUT}>
        <option value="" className="bg-neutral-900">Oponente</option>
        {players.map((p) => (
          <option key={p.uid} value={p.uid} className="bg-neutral-900">
            {p.display_name}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={submitting} className={`flex-1 ${RED_BUTTON}`} style={{ background: RED_BG }}>
          {submitting ? "Enviando..." : "Enviar desafio"}
        </button>
        <button onClick={() => setOpen(false)} className={GHOST_BUTTON}>
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
      <ImageButton
        src="/battle-buttons/button-wild.png"
        alt="Criar encontro selvagem"
        onClick={() => setOpen(true)}
      />
    );
  }

  return (
    <div className="w-full max-w-sm space-y-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      <p className="text-sm font-semibold text-white">Criar encontro selvagem</p>
      <select value={targetUid} onChange={(e) => setTargetUid(e.target.value)} className={GHOST_INPUT}>
        <option value="" className="bg-neutral-900">Participante</option>
        {players.map((p) => (
          <option key={p.uid} value={p.uid} className="bg-neutral-900">
            {p.display_name}
          </option>
        ))}
      </select>
      <select value={targetPokemonId} onChange={(e) => setTargetPokemonId(e.target.value)} className={GHOST_INPUT}>
        <option value="" className="bg-neutral-900">Pokémon do participante</option>
        {pokemons.filter((p) => p.in_party).map((p) => (
          <option key={p.id} value={p.id} className="bg-neutral-900">
            {p.nickname} (nv. {p.level})
          </option>
        ))}
      </select>
      <PokemonSpeciesAutocomplete value={wildSpecies} onChange={setWildSpecies} placeholder="Espécie selvagem" />
      <input
        type="number"
        min={1}
        placeholder="Nível do selvagem"
        value={wildLevel}
        onChange={(e) => setWildLevel(e.target.value)}
        className={GHOST_INPUT}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={submitting} className={`flex-1 ${RED_BUTTON}`} style={{ background: RED_BG }}>
          {submitting ? "Enviando..." : "Criar sala"}
        </button>
        <button onClick={() => setOpen(false)} className={GHOST_BUTTON}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
