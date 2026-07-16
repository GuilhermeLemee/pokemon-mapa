import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../lib/api";
import { STAFF_ROLES, type BattleActionResult, type BattleRoom, type Pokemon } from "../lib/types";
import { ACCENT_BUTTON, FIELD_INPUT, GLASS_CARD } from "../lib/ui";

const POLL_INTERVAL_MS = 5000;

export function BattleRoomPage() {
  const { id } = useParams<{ id: string }>();
  const { player } = useAuth();
  const [room, setRoom] = useState<BattleRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isStaff = player && STAFF_ROLES.includes(player.role);

  const load = useCallback(() => {
    if (!id) return;
    api
      .get<BattleRoom>(`/battles/${id}`)
      .then(setRoom)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erro ao carregar sala."));
  }, [id]);

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      if (room?.status === "active") load();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load, room?.status]);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!room) return <p className="text-accent-500">Carregando...</p>;

  const isWild = "is_wild" in room.side_b;

  const handleAction = async (action: () => Promise<void>) => {
    setFeedback(null);
    try {
      await action();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao executar ação.");
    }
  };

  return (
    <div className="space-y-6">
      {room.status === "pending_accept" && player?.uid === room.side_a.uid && (
        <div className={`${GLASS_CARD} flex items-center justify-between p-4`}>
          <p className="text-sm text-accent-200">O mestre te convidou para essa batalha.</p>
          <div className="flex gap-2">
            <button
              className={ACCENT_BUTTON}
              onClick={() => handleAction(() => api.post(`/battles/${room.id}/accept`, {}))}
            >
              Aceitar
            </button>
            <button
              className="rounded-lg border border-red-400/40 px-3 py-2 text-sm text-red-400"
              onClick={() => handleAction(() => api.post(`/battles/${room.id}/decline`, {}))}
            >
              Recusar
            </button>
          </div>
        </div>
      )}

      {room.status === "pending_approval" && isStaff && (
        <ApprovalPanel room={room} onDone={load} />
      )}

      {feedback && <p className="text-sm text-emerald-400">{feedback}</p>}

      <div className={`${GLASS_CARD} p-5`}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SideCard
            room={room}
            side="a"
            isStaff={!!isStaff}
            onDamage={setFeedback}
            onError={setError}
            reload={load}
          />
          <SideCard
            room={room}
            side="b"
            isStaff={!!isStaff}
            onDamage={setFeedback}
            onError={setError}
            reload={load}
          />
        </div>

        {isStaff && room.status === "active" && (
          <div className="mt-6 border-t border-accent-500/15 pt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MultiAttackPanel room={room} onDone={load} onFeedback={setFeedback} onError={setError} />
            {isWild && <CapturePanel room={room} onDone={load} onFeedback={setFeedback} onError={setError} />}
          </div>
        )}

        {isStaff && room.status === "active" && room.suggested_xp && (
          <div className="mt-4 flex items-center justify-between border-t border-accent-500/15 pt-4">
            <p className="text-sm text-accent-300">XP sugerido para o vencedor: {room.suggested_xp}</p>
            <button
              className="text-sm text-accent-300 hover:text-accent-200 hover:underline"
              onClick={() => handleAction(() => api.post(`/battles/${room.id}/finish`, {}))}
            >
              Finalizar batalha
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function sideDisplay(side: BattleRoom["side_a"] | BattleRoom["side_b"]) {
  if ("is_wild" in side) {
    return { title: "Selvagem", subtitle: `${side.species} · nv. ${side.level}` };
  }
  return { title: "Treinador", subtitle: `${side.species} · nv. ${side.level}` };
}

function SideCard({
  room,
  side,
  isStaff,
  onDamage,
  onError,
  reload,
}: {
  room: BattleRoom;
  side: "a" | "b";
  isStaff: boolean;
  onDamage: (msg: string) => void;
  onError: (msg: string) => void;
  reload: () => void;
}) {
  const data = side === "a" ? room.side_a : room.side_b;
  const { title, subtitle } = sideDisplay(data);
  const hpPercent = Math.round((data.current_hp / data.max_hp) * 100);
  const [choosingAttack, setChoosingAttack] = useState(false);
  const isTrainer = !("is_wild" in data);

  const applyHit = async (advantage: boolean) => {
    setChoosingAttack(false);
    try {
      const result = await api.post<BattleActionResult>(`/battles/${room.id}/hit`, {
        target: side,
        advantage,
      });
      onDamage(`${result.damage_dealt} de dano em ${title.toLowerCase()}.`);
      reload();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Erro ao aplicar dano.");
    }
  };

  return (
    <div className="rounded-lg border border-accent-500/15 bg-bg-900/40 p-4 text-center">
      <p className="text-xs text-accent-500">{title}</p>
      <p className="mb-2 font-semibold text-accent-200">{subtitle}</p>
      <div className="h-2 w-full rounded-full bg-bg-900">
        <div
          className={`h-2 rounded-full ${hpPercent <= 34 ? "bg-red-500" : "bg-hp-500"}`}
          style={{ width: `${hpPercent}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-accent-500">
        {data.current_hp} / {data.max_hp} vida
      </p>

      {isStaff && room.status === "active" && data.current_hp > 0 && (
        <>
          <button
            onClick={() => setChoosingAttack((v) => !v)}
            className="mx-auto mt-3 flex h-12 w-12 items-center justify-center rounded-full border border-accent-500/25 text-accent-300 hover:border-accent-300"
            aria-label={`${title} recebeu ataque`}
          >
            ⚔
          </button>
          {choosingAttack && (
            <div className="mt-2 flex justify-center gap-2">
              <button onClick={() => applyHit(false)} className="rounded-lg border border-accent-500/25 px-2 py-1 text-xs text-accent-300">
                Normal
              </button>
              <button onClick={() => applyHit(true)} className="rounded-lg border border-red-400/40 px-2 py-1 text-xs text-red-400">
                Vantagem
              </button>
            </div>
          )}
        </>
      )}

      {isStaff && room.status === "active" && data.current_hp <= 0 && isTrainer && "uid" in data && (
        <SwapPanel room={room} side={side} uid={data.uid} onDone={reload} onError={onError} />
      )}
    </div>
  );
}

function SwapPanel({
  room,
  side,
  uid,
  onDone,
  onError,
}: {
  room: BattleRoom;
  side: "a" | "b";
  uid: string;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    api
      .get<Pokemon[]>(`/players/${uid}/pokemons`)
      .then((all) => setPokemons(all.filter((p) => p.current_hp > 0 && p.in_party)));
  }, [open, uid]);

  const doSwap = async (pokemonId: string) => {
    try {
      await api.post(`/battles/${room.id}/swap`, { side, pokemon_id: pokemonId });
      setOpen(false);
      onDone();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Erro ao trocar pokémon.");
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mx-auto mt-3 flex h-12 w-12 items-center justify-center rounded-full border border-accent-300/40 text-accent-300"
        aria-label="Trocar pokémon"
      >
        ⟳
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-1">
      {pokemons.length === 0 ? (
        <p className="text-xs text-accent-500">Sem pokémons disponíveis.</p>
      ) : (
        pokemons.map((p) => (
          <button
            key={p.id}
            onClick={() => doSwap(p.id)}
            className="block w-full rounded-lg border border-accent-500/15 px-2 py-1 text-xs text-accent-300 hover:border-accent-300/40"
          >
            {p.nickname} (nv. {p.level})
          </button>
        ))
      )}
    </div>
  );
}

function MultiAttackPanel({
  room,
  onDone,
  onFeedback,
  onError,
}: {
  room: BattleRoom;
  onDone: () => void;
  onFeedback: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [target, setTarget] = useState<"a" | "b">("b");
  const [validated, setValidated] = useState(true);
  const [hitCount, setHitCount] = useState("1");

  const submit = async () => {
    try {
      const result = await api.post<BattleActionResult>(`/battles/${room.id}/multi-attack`, {
        target,
        validated,
        hit_count: Number(hitCount),
      });
      onFeedback(validated ? `Ataque múltiplo: ${result.damage_dealt} de dano.` : "Ataque múltiplo falhou na validação.");
      onDone();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Erro no ataque múltiplo.");
    }
  };

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-accent-200">Ataque múltiplo</p>
      <div className="space-y-2">
        <select value={target} onChange={(e) => setTarget(e.target.value as "a" | "b")} className={`${FIELD_INPUT} text-sm`}>
          <option value="a">Alvo: {sideDisplay(room.side_a).title}</option>
          <option value="b">Alvo: {sideDisplay(room.side_b).title}</option>
        </select>
        <label className="flex items-center gap-2 text-xs text-accent-500">
          <input type="checkbox" checked={validated} onChange={(e) => setValidated(e.target.checked)} />
          Validado no dado
        </label>
        <input
          type="number"
          min={0}
          value={hitCount}
          onChange={(e) => setHitCount(e.target.value)}
          placeholder="Número de golpes"
          className={`${FIELD_INPUT} text-sm`}
        />
        <button onClick={submit} className={`w-full text-sm ${ACCENT_BUTTON}`}>
          Aplicar
        </button>
      </div>
    </div>
  );
}

function CapturePanel({
  room,
  onDone,
  onFeedback,
  onError,
}: {
  room: BattleRoom;
  onDone: () => void;
  onFeedback: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [roundsWon, setRoundsWon] = useState("0");

  const submit = async () => {
    try {
      const result = await api.post<BattleActionResult>(`/battles/${room.id}/capture`, {
        rounds_won: Number(roundsWon),
      });
      onFeedback(result.capture_success ? "Captura bem-sucedida!" : "Captura falhou.");
      onDone();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Erro na tentativa de captura.");
    }
  };

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-accent-200">Captura</p>
      <p className="mb-2 text-xs text-accent-500">≥35% de vida: vencer as 3 rodadas · &lt;35%: vencer 2 de 3</p>
      <select value={roundsWon} onChange={(e) => setRoundsWon(e.target.value)} className={`${FIELD_INPUT} text-sm mb-2`}>
        <option value="0">0 rodadas vencidas</option>
        <option value="1">1 rodada vencida</option>
        <option value="2">2 rodadas vencidas</option>
        <option value="3">3 rodadas vencidas</option>
      </select>
      <button onClick={submit} className={`w-full text-sm ${ACCENT_BUTTON}`}>
        Tentar captura
      </button>
    </div>
  );
}

function ApprovalPanel({ room, onDone }: { room: BattleRoom; onDone: () => void }) {
  const opponentUid = "uid" in room.side_b ? room.side_b.uid : "";
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [pokemonId, setPokemonId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!opponentUid) return;
    api.get<Pokemon[]>(`/players/${opponentUid}/pokemons`).then(setPokemons);
  }, [opponentUid]);

  const approve = async () => {
    if (!pokemonId) {
      setError("Escolha o pokémon do oponente.");
      return;
    }
    try {
      await api.post(`/battles/${room.id}/approve`, { opponent_pokemon_id: pokemonId });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao aprovar.");
    }
  };

  return (
    <div className={`${GLASS_CARD} space-y-2 p-4`}>
      <p className="text-sm text-accent-200">Aprovar batalha — escolha o pokémon do oponente</p>
      <select value={pokemonId} onChange={(e) => setPokemonId(e.target.value)} className={FIELD_INPUT}>
        <option value="">Pokémon do oponente</option>
        {pokemons.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nickname} (nv. {p.level})
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button onClick={approve} className={ACCENT_BUTTON}>
        Aprovar e iniciar
      </button>
    </div>
  );
}
