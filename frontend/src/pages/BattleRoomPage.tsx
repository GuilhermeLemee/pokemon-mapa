import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../lib/api";
import { isMultiHitMove } from "../lib/multiHitMoves";
import { animatedSpriteUrl, fetchDexNumber, fetchLearnableMoves, fetchMoveType, fetchPokemonTypes } from "../lib/pokeapi";
import { isSuperEffective, typeColor } from "../lib/typeChart";
import { TypeIcon } from "../lib/typeIcons";
import { STAFF_ROLES, type BattleActionResult, type BattleRoom, type Player, type Pokemon } from "../lib/types";

const POLL_INTERVAL_MS = 5000;
const MAX_LOG_ENTRIES = 7;
const MAX_BATTLE_MOVES = 6;
const BALL_LABELS: Record<string, string> = {
  pokebola: "Pokébola",
  superbola: "Superbola",
  ultrabola: "Ultrabola",
};

function moveDisplayName(slug: string): string {
  return slug
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export function BattleRoomPage() {
  const { id } = useParams<{ id: string }>();
  const { player } = useAuth();
  const [room, setRoom] = useState<BattleRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const isStaff = player && STAFF_ROLES.includes(player.role);

  const pushLog = useCallback((msg: string) => {
    setLog((prev) => [msg, ...prev].slice(0, MAX_LOG_ENTRIES));
  }, []);

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

  if (error) return <p className="rounded-xl bg-white/90 p-4 text-sm font-medium text-red-500 shadow">{error}</p>;
  if (!room) return <p className="text-sm text-neutral-500">Carregando...</p>;

  const isWild = "is_wild" in room.side_b;
  const inBattle = room.status === "active" || room.status === "finished";

  const handleAction = async (action: () => Promise<void>) => {
    try {
      await action();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao executar ação.");
    }
  };

  return (
    <div className="space-y-4">
      {room.status === "pending_accept" && player?.uid === room.side_a.uid && (
        <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-white/90 p-4 shadow-lg">
          <p className="text-sm font-medium text-neutral-700">O mestre te convidou para essa batalha.</p>
          <div className="flex gap-2">
            <button
              className="rounded-full px-4 py-2 text-sm font-bold text-white"
              style={{ background: "linear-gradient(180deg,#e5153a,#c00822)" }}
              onClick={() => handleAction(() => api.post(`/battles/${room.id}/accept`, {}))}
            >
              Aceitar
            </button>
            <button
              className="rounded-full border-2 border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-600"
              onClick={() => handleAction(() => api.post(`/battles/${room.id}/decline`, {}))}
            >
              Recusar
            </button>
          </div>
        </div>
      )}

      {room.status === "pending_approval" && isStaff && <ApprovalPanel room={room} onDone={load} />}

      {inBattle && (
        <BattleCards room={room} isWild={isWild} isStaff={!!isStaff} onLog={pushLog} onError={setError} reload={load} />
      )}

      {inBattle && <BattleLog entries={log} />}
    </div>
  );
}

/* ======================= LAYOUT DE CARDS (ESTILO POKÉDEX) ======================= */

function BattleCards({
  room,
  isWild,
  isStaff,
  onLog,
  onError,
  reload,
}: {
  room: BattleRoom;
  isWild: boolean;
  isStaff: boolean;
  onLog: (msg: string) => void;
  onError: (msg: string) => void;
  reload: () => void;
}) {
  const { player } = useAuth();
  const a = useSideController({ room, side: "a", onLog, onError, reload });
  const b = useSideController({ room, side: "b", onLog, onError, reload });

  const viewerIsB = "uid" in room.side_b && room.side_b.uid === player?.uid;
  const playerCtrl = viewerIsB ? b : a;
  const oppCtrl = viewerIsB ? a : b;

  const finishBattle = async () => {
    try {
      const result = await api.post<BattleActionResult>(`/battles/${room.id}/finish`, {});
      if (result.xp_granted) {
        onLog(`Vitória! +${result.xp_granted} XP${result.leveled_up ? " — subiu de nível!" : ""}`);
      }
      reload();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Erro ao finalizar batalha.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <PokemonBattleCard ctrl={playerCtrl} room={room} isStaff={isStaff} reload={reload} onError={onError} onLog={onLog} isPlayerSide />
        <PokemonBattleCard ctrl={oppCtrl} room={room} isStaff={isStaff} reload={reload} onError={onError} onLog={onLog} isPlayerSide={false} />
      </div>

      {isStaff && room.status === "active" && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-black/5 bg-white/90 p-4 shadow">
          {isWild && <CapturePanel room={room} onDone={reload} onLog={onLog} onError={onError} />}
          {room.suggested_xp && (
            <div className="flex items-center gap-3">
              <p className="text-xs text-neutral-500">
                XP sugerido: <span className="font-bold text-neutral-800">{room.suggested_xp}</span>
              </p>
              <button
                onClick={finishBattle}
                className="rounded-full px-4 py-2 text-sm font-bold text-white"
                style={{ background: "linear-gradient(180deg,#e5153a,#c00822)" }}
              >
                Finalizar batalha
              </button>
            </div>
          )}
        </div>
      )}

      {room.status === "finished" && (
        <div className="rounded-2xl border border-black/5 bg-white/90 p-4 text-center text-sm font-semibold text-neutral-600 shadow">
          Batalha encerrada.
        </div>
      )}
    </div>
  );
}

const TABS: [string, string][] = [
  ["moves", "Moves"],
  ["about", "About"],
  ["stats", "Base Stats"],
  ["evo", "Evolution"],
];

function PokemonBattleCard({
  ctrl,
  room,
  isStaff,
  reload,
  onError,
  onLog,
  isPlayerSide,
}: {
  ctrl: SideController;
  room: BattleRoom;
  isStaff: boolean;
  reload: () => void;
  onError: (msg: string) => void;
  onLog: (msg: string) => void;
  isPlayerSide: boolean;
}) {
  const data = ctrl.data;
  const [types, setTypes] = useState<string[]>([]);
  const [dex, setDex] = useState<number | null>(null);
  const [tab, setTab] = useState<string>("moves");

  useEffect(() => {
    let cancelled = false;
    fetchPokemonTypes(data.species).then((t) => !cancelled && setTypes(t));
    fetchDexNumber(data.species).then((n) => !cancelled && setDex(n));
    return () => {
      cancelled = true;
    };
  }, [data.species]);

  const headerColor = typeColor(types[0]) ?? "#6b7280";
  const name = moveDisplayName(data.species);
  const fainted = data.current_hp <= 0;

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5">
      {/* header colorido pelo tipo */}
      <div className="relative overflow-hidden px-4 py-3" style={{ background: headerColor }}>
        <PokeballWatermark />
        <div className="relative flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <h2 className="truncate text-lg font-black text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,.28)" }}>
                {name}
              </h2>
              {dex != null && <span className="text-xs font-bold text-white/75">#{String(dex).padStart(3, "0")}</span>}
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {types.map((t) => (
                <TypeBadge key={t} type={t} />
              ))}
            </div>
            <div className="mt-2">
              <HpBar percent={ctrl.hpPercent} current={data.current_hp} max={data.max_hp} showExact={isPlayerSide} level={data.level} />
            </div>
            {ctrl.xpCurrent != null && ctrl.xpToNext != null && (
              <div className="mt-1.5">
                <XpBar level={data.level} current={ctrl.xpCurrent} toNext={ctrl.xpToNext} />
              </div>
            )}
          </div>
          <img
            src={animatedSpriteUrl(data.species)}
            alt={name}
            className="h-20 w-20 shrink-0 object-contain"
            loading="lazy"
            style={{
              filter: fainted ? "grayscale(1)" : "drop-shadow(0 6px 5px rgba(0,0,0,.3))",
              opacity: fainted ? 0.5 : 1,
            }}
          />
        </div>
      </div>

      {/* abas + conteúdo */}
      <div className="px-4 pt-2 pb-4">
        <div className="flex gap-1 border-b border-neutral-100">
          {TABS.map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`relative px-2.5 py-2 text-[12px] font-bold transition-colors ${
                tab === k ? "text-neutral-900" : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {label}
              {tab === k && <span className="absolute inset-x-1 -bottom-px h-0.5 rounded bg-neutral-900" />}
            </button>
          ))}
        </div>

        <div className="mt-3 min-h-[112px]">
          {tab === "moves" ? (
            <MovesTab ctrl={ctrl} room={room} isStaff={isStaff} onLog={onLog} onError={onError} reload={reload} />
          ) : (
            <PlaceholderTab label={TABS.find((t) => t[0] === tab)?.[1] ?? ""} />
          )}
        </div>

        {ctrl.isTrainer && ctrl.uid && (
          <PartyStrip
            room={room}
            side={ctrl.sideKey}
            uid={ctrl.uid}
            activePokemonId={"pokemon_id" in data ? data.pokemon_id : ""}
            canSwap={(isStaff || ctrl.isOwner) && room.status === "active" && fainted}
            onDone={reload}
            onError={onError}
          />
        )}
      </div>
    </div>
  );
}

function PokeballWatermark() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="pointer-events-none absolute -top-6 -right-6 h-32 w-32 opacity-15"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="46" fill="none" stroke="#fff" strokeWidth="6" />
      <line x1="4" y1="50" x2="96" y2="50" stroke="#fff" strokeWidth="6" />
      <circle cx="50" cy="50" r="14" fill="#fff" />
      <circle cx="50" cy="50" r="7" fill={"#fff"} stroke="#fff" strokeWidth="4" />
    </svg>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold text-white uppercase">{type}</span>
  );
}

function HpBar({
  percent,
  current,
  max,
  showExact,
  level,
}: {
  percent: number;
  current: number;
  max: number;
  showExact: boolean;
  level: number;
}) {
  const color = percent <= 20 ? "#e0392b" : percent <= 50 ? "#f7c948" : "#4ece3a";
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] font-bold text-white/90">
        <span>HP · Nv {level}</span>
        <span>{showExact ? `${current}/${max}` : `${percent}%`}</span>
      </div>
      <div className="mt-0.5 h-2.5 overflow-hidden rounded-full bg-black/25 ring-1 ring-white/20">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, background: color }} />
      </div>
    </div>
  );
}

/** Barra de XP com animação de "subir de nível": ao detectar que o nível
 * aumentou, enche até 100%, pisca e reinicia do 0 rumo ao valor novo —
 * igual ao efeito clássico dos jogos Pokémon. */
function XpBar({ level, current, toNext }: { level: number; current: number; toNext: number }) {
  const percent = toNext > 0 ? Math.max(0, Math.min(100, Math.round((current / toNext) * 100))) : 0;
  const prevRef = useRef<{ level: number; percent: number } | null>(null);
  const [displayPercent, setDisplayPercent] = useState(percent);
  const [instant, setInstant] = useState(true);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = { level, percent };

    if (!prev) {
      setInstant(true);
      setDisplayPercent(percent);
      return;
    }
    if (level > prev.level) {
      setInstant(false);
      setDisplayPercent(100);
      setFlash(false);
      const t1 = setTimeout(() => {
        setFlash(true);
        setInstant(true);
        setDisplayPercent(0);
      }, 550);
      const t2 = setTimeout(() => {
        setInstant(false);
        setDisplayPercent(percent);
      }, 650);
      const t3 = setTimeout(() => setFlash(false), 950);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
    setInstant(false);
    setDisplayPercent(percent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, percent]);

  return (
    <div>
      <div className="flex items-center justify-between text-[9px] font-bold text-sky-100/80">
        <span>XP{flash ? " · Subiu de nível!" : ""}</span>
        <span>
          {current}/{toNext}
        </span>
      </div>
      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-black/25 ring-1 ring-white/15">
        <div
          className={`h-full rounded-full bg-sky-400 ${instant ? "" : "transition-all duration-500 ease-out"} ${flash ? "animate-pulse" : ""}`}
          style={{ width: `${displayPercent}%` }}
        />
      </div>
    </div>
  );
}

function PlaceholderTab({ label }: { label: string }) {
  return (
    <div className="flex h-24 items-center justify-center rounded-2xl bg-neutral-50 text-sm font-medium text-neutral-400">
      {label} — em breve
    </div>
  );
}

/* Aba Moves: pílulas de ataque (estilo do print). Só o mestre aplica o dano. */
function MovesTab({
  ctrl,
  room,
  isStaff,
  onLog,
  onError,
  reload,
}: {
  ctrl: SideController;
  room: BattleRoom;
  isStaff: boolean;
  onLog: (msg: string) => void;
  onError: (msg: string) => void;
  reload: () => void;
}) {
  void onLog;
  void onError;
  void reload;
  // Turno: só ataca se ninguém atacou ainda (mestre escolhe quem começa) ou se
  // o último a atacar foi o adversário. Quem acabou de atacar espera a vez.
  const isMyTurn = room.last_attacker == null || room.last_attacker !== ctrl.sideKey;
  const canAttack = isStaff && room.status === "active" && ctrl.data.current_hp > 0 && isMyTurn;
  const waitingTurn = isStaff && room.status === "active" && ctrl.data.current_hp > 0 && !isMyTurn;

  if (ctrl.activeMoves.length === 0) {
    return <p className="py-4 text-center text-sm text-neutral-400">Sem ataques definidos.</p>;
  }

  return (
    <div className="space-y-2">
      {ctrl.pool.length > MAX_BATTLE_MOVES && canAttack && (
        <button
          ref={ctrl.pickerTriggerRef}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            ctrl.togglePicker();
          }}
          className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-800"
        >
          Escolher ataques da batalha ({ctrl.activeMoves.length}/{MAX_BATTLE_MOVES})
        </button>
      )}

      {ctrl.pickerOpen &&
        ctrl.pickerPos &&
        createPortal(
          <div
            onMouseDown={(e) => e.stopPropagation()}
            style={{ top: ctrl.pickerPos.top, left: ctrl.pickerPos.left }}
            className="fixed z-50 grid max-h-64 w-56 grid-cols-1 gap-1 overflow-y-auto rounded-xl bg-white p-2 text-left shadow-2xl ring-1 ring-black/10"
          >
            {ctrl.pool.map((move) => (
              <label key={move} className="flex items-center gap-2 text-xs font-medium text-neutral-700">
                <input
                  type="checkbox"
                  checked={ctrl.activeMoves.includes(move)}
                  onChange={() => ctrl.toggleActiveMove(move)}
                  disabled={!ctrl.activeMoves.includes(move) && ctrl.activeMoves.length >= MAX_BATTLE_MOVES}
                />
                {moveDisplayName(move)}
              </label>
            ))}
          </div>,
          document.body,
        )}

      <div className="grid grid-cols-2 gap-2">
        {ctrl.activeMoves.map((move) => (
          <MovePill
            key={move}
            name={moveDisplayName(move)}
            type={ctrl.moveTypes[move]}
            busy={ctrl.busyMove === move}
            active={ctrl.pendingMultiMove === move}
            disabled={!canAttack || ctrl.busyMove === move}
            onClick={() => canAttack && ctrl.handleMoveClick(move)}
          />
        ))}
      </div>

      {ctrl.pendingMultiMove && <MultiHitPopover ctrl={ctrl} move={ctrl.pendingMultiMove} />}

      {waitingTurn && (
        <p className="pt-1 text-[11px] font-semibold text-amber-600">Aguardando o adversário atacar…</p>
      )}
      {!isStaff && <p className="pt-1 text-[11px] text-neutral-400">Só o mestre aplica os ataques.</p>}
    </div>
  );
}

function MovePill({
  name,
  type,
  onClick,
  disabled,
  busy,
  active,
}: {
  name: string;
  type: string | null | undefined;
  onClick: () => void;
  disabled: boolean;
  busy: boolean;
  active: boolean;
}) {
  const color = typeColor(type) ?? "#9aa0a9";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex w-full min-w-0 items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1 text-left transition enabled:hover:brightness-[0.97] disabled:cursor-default disabled:opacity-70"
      style={{
        background: active ? `${color}2e` : "#e7e9ed",
        boxShadow: active ? `inset 0 0 0 2px ${color}` : "none",
      }}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ background: color, boxShadow: "inset 0 -2px 3px rgba(0,0,0,0.22)" }}
      >
        <TypeIcon type={type} className="h-5 w-5" />
      </span>
      <span className="min-w-0 truncate text-[12px] font-bold text-neutral-600">{busy ? "..." : name}</span>
    </button>
  );
}

function MultiHitPopover({ ctrl, move }: { ctrl: SideController; move: string }) {
  return (
    <div className="space-y-1.5 rounded-xl bg-neutral-50 p-2.5 ring-1 ring-black/5">
      <p className="text-[10px] font-bold text-neutral-700">{moveDisplayName(move)} — múltiplos golpes</p>
      <label className="flex items-center gap-1.5 text-[10px] font-medium text-neutral-600">
        <input type="checkbox" checked={ctrl.validated} onChange={(e) => ctrl.setValidated(e.target.checked)} />
        Validado no dado
      </label>
      <input
        type="number"
        min={0}
        value={ctrl.hitCount}
        onChange={(e) => ctrl.setHitCount(e.target.value)}
        placeholder="Nº de golpes"
        className="w-full rounded-lg border border-neutral-200 px-2 py-1 text-xs"
      />
      <button
        onClick={ctrl.applyMultiAttack}
        className="w-full rounded-lg py-1 text-xs font-bold text-white"
        style={{ background: "#dc0a2d" }}
      >
        Aplicar
      </button>
    </div>
  );
}

function PartyStrip({
  room,
  side,
  uid,
  activePokemonId,
  canSwap,
  onDone,
  onError,
}: {
  room: BattleRoom;
  side: "a" | "b";
  uid: string;
  activePokemonId: string;
  canSwap: boolean;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const [party, setParty] = useState<Pokemon[]>([]);

  useEffect(() => {
    api
      .get<Pokemon[]>(`/players/${uid}/pokemons`)
      .then((all) => setParty(all.filter((p) => p.in_party)))
      .catch(() => {});
  }, [uid, activePokemonId]);

  const slots: (Pokemon | null)[] = [...party, ...Array(6).fill(null)].slice(0, 6);

  const swap = async (pokemonId: string) => {
    try {
      await api.post(`/battles/${room.id}/swap`, { side, pokemon_id: pokemonId });
      onDone();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Erro ao trocar pokémon.");
    }
  };

  return (
    <div className="mt-3 border-t border-neutral-100 pt-3">
      <p className="mb-1.5 text-[10px] font-bold tracking-wide text-neutral-400 uppercase">
        Party{canSwap ? " · toque para trocar" : ""}
      </p>
      <div className="flex gap-1.5">
        {slots.map((p, i) =>
          p ? (
            <button
              key={p.id}
              disabled={!(canSwap && p.current_hp > 0 && p.id !== activePokemonId)}
              onClick={() => swap(p.id)}
              title={p.nickname}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
                p.id === activePokemonId
                  ? "border-neutral-800 bg-neutral-100"
                  : p.current_hp <= 0
                    ? "border-neutral-100 opacity-30 grayscale"
                    : "border-neutral-200"
              } ${canSwap && p.current_hp > 0 && p.id !== activePokemonId ? "cursor-pointer hover:border-neutral-800" : "cursor-default"}`}
            >
              <img src={animatedSpriteUrl(p.species)} alt={p.nickname} className="h-8 w-8 object-contain" loading="lazy" />
            </button>
          ) : (
            <div key={`empty-${i}`} className="h-11 w-11 shrink-0 rounded-xl border border-dashed border-neutral-200" />
          ),
        )}
      </div>
    </div>
  );
}

/* ============================ CONTROLLER ============================ */

interface SideController {
  sideKey: "a" | "b";
  data: BattleRoom["side_a"] | BattleRoom["side_b"];
  hpPercent: number;
  isTrainer: boolean;
  isOwner: boolean;
  uid: string | null;
  xpCurrent: number | null;
  xpToNext: number | null;
  pool: string[];
  activeMoves: string[];
  moveTypes: Record<string, string | null>;
  pickerOpen: boolean;
  pickerPos: { top: number; left: number } | null;
  pickerTriggerRef: RefObject<HTMLButtonElement | null>;
  togglePicker: () => void;
  toggleActiveMove: (move: string) => void;
  handleMoveClick: (move: string) => void;
  busyMove: string | null;
  pendingMultiMove: string | null;
  hitCount: string;
  setHitCount: (v: string) => void;
  validated: boolean;
  setValidated: (v: boolean) => void;
  applyMultiAttack: () => void;
}

function useSideMoves(data: BattleRoom["side_a"] | BattleRoom["side_b"]): string[] {
  const [wildMoves, setWildMoves] = useState<string[]>([]);
  const isWildSide = "is_wild" in data;

  useEffect(() => {
    if (!isWildSide) return;
    let cancelled = false;
    fetchLearnableMoves(data.species, data.level).then((moves) => {
      if (!cancelled) setWildMoves(moves.slice(-6).map((m) => m.name));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWildSide, data.species, data.level]);

  if (isWildSide) return wildMoves;
  return "moves" in data ? data.moves : [];
}

function useSideController({
  room,
  side,
  onLog,
  onError,
  reload,
}: {
  room: BattleRoom;
  side: "a" | "b";
  onLog: (msg: string) => void;
  onError: (msg: string) => void;
  reload: () => void;
}): SideController {
  const { player } = useAuth();
  const data = side === "a" ? room.side_a : room.side_b;
  const opponentData = side === "a" ? room.side_b : room.side_a;
  const hpPercent = Math.max(0, Math.round((data.current_hp / data.max_hp) * 100));
  const isTrainer = !("is_wild" in data);
  const uid = isTrainer && "uid" in data ? data.uid : null;
  const isOwner = isTrainer && uid === player?.uid;
  const pool = useSideMoves(data);
  const pokemonId = "pokemon_id" in data ? data.pokemon_id : "";

  const [xp, setXp] = useState<{ current: number; toNext: number } | null>(null);
  useEffect(() => {
    if (!uid || !pokemonId) {
      setXp(null);
      return;
    }
    let cancelled = false;
    api
      .get<Pokemon[]>(`/players/${uid}/pokemons`)
      .then((all) => {
        const p = all.find((x) => x.id === pokemonId);
        if (!cancelled && p) setXp({ current: p.current_xp, toNext: p.xp_to_next_level });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [uid, pokemonId, data.level, data.current_hp, room.status]);

  const [activeMoves, setActiveMoves] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number } | null>(null);
  const pickerTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [pendingMultiMove, setPendingMultiMove] = useState<string | null>(null);
  const [hitCount, setHitCount] = useState("1");
  const [validated, setValidated] = useState(true);
  const [busyMove, setBusyMove] = useState<string | null>(null);
  const [moveTypes, setMoveTypes] = useState<Record<string, string | null>>({});

  useEffect(() => {
    setActiveMoves((prev) => {
      const stillValid = prev.filter((m) => pool.includes(m));
      return stillValid.length > 0 ? stillValid : pool.slice(0, MAX_BATTLE_MOVES);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool.join("|")]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(activeMoves.map((m) => fetchMoveType(m).then((t) => [m, t] as const))).then((pairs) => {
      if (!cancelled) setMoveTypes(Object.fromEntries(pairs));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMoves.join("|")]);

  useEffect(() => {
    if (!pickerOpen) return;
    const close = () => {
      setPickerOpen(false);
      setPickerPos(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [pickerOpen]);

  const toggleActiveMove = (move: string) => {
    setActiveMoves((prev) => {
      if (prev.includes(move)) return prev.filter((m) => m !== move);
      if (prev.length >= MAX_BATTLE_MOVES) return prev;
      return [...prev, move];
    });
  };

  const togglePicker = () => {
    if (pickerOpen) {
      setPickerOpen(false);
      setPickerPos(null);
      return;
    }
    const trigger = pickerTriggerRef.current;
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      setPickerPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX });
    }
    setPickerOpen(true);
  };

  const targetSide = side === "a" ? "b" : "a";
  const targetTitle = "is_wild" in opponentData ? "selvagem" : "oponente";

  const applySingleHit = async (move: string) => {
    setBusyMove(move);
    let advantage = false;
    try {
      const moveType = await fetchMoveType(move);
      if (moveType) {
        const defenderTypes = await fetchPokemonTypes(opponentData.species);
        advantage = isSuperEffective(moveType, defenderTypes);
      }
    } catch {
      advantage = false;
    }
    try {
      const result = await api.post<BattleActionResult>(`/battles/${room.id}/hit`, { target: targetSide, advantage });
      onLog(
        `${moveDisplayName(move)}: ${result.damage_dealt} de dano no ${targetTitle}${advantage ? " (super efetivo!)" : ""}.`,
      );
      reload();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Erro ao aplicar dano.");
    } finally {
      setBusyMove(null);
    }
  };

  const applyMultiAttack = async () => {
    if (!pendingMultiMove) return;
    const move = pendingMultiMove;
    try {
      const result = await api.post<BattleActionResult>(`/battles/${room.id}/multi-attack`, {
        target: targetSide,
        validated,
        hit_count: Number(hitCount),
      });
      onLog(
        validated
          ? `${moveDisplayName(move)}: ${result.damage_dealt} de dano no ${targetTitle}.`
          : `${moveDisplayName(move)} falhou na validação.`,
      );
      setPendingMultiMove(null);
      reload();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Erro no ataque múltiplo.");
    }
  };

  const handleMoveClick = (move: string) => {
    if (isMultiHitMove(move)) {
      setPendingMultiMove((prev) => (prev === move ? null : move));
      setHitCount("1");
      setValidated(true);
    } else {
      applySingleHit(move);
    }
  };

  return {
    sideKey: side,
    data,
    hpPercent,
    isTrainer,
    isOwner,
    uid,
    xpCurrent: xp?.current ?? null,
    xpToNext: xp?.toNext ?? null,
    pool,
    activeMoves,
    moveTypes,
    pickerOpen,
    pickerPos,
    pickerTriggerRef,
    togglePicker,
    toggleActiveMove,
    handleMoveClick,
    busyMove,
    pendingMultiMove,
    hitCount,
    setHitCount,
    validated,
    setValidated,
    applyMultiAttack,
  };
}

/* ============================ PAINÉIS ============================ */

function BattleLog({ entries }: { entries: string[] }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white/90 p-3 shadow">
      <p className="mb-2 text-[11px] font-bold tracking-wide text-neutral-500 uppercase">Log de batalha</p>
      {entries.length === 0 ? (
        <p className="text-xs text-neutral-400">Nenhuma ação ainda.</p>
      ) : (
        <ul className="space-y-1">
          {entries.map((entry, i) => (
            <li key={i} className="border-b border-black/5 pb-1 text-xs text-neutral-600 last:border-0">
              {entry}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CapturePanel({
  room,
  onDone,
  onLog,
  onError,
}: {
  room: BattleRoom;
  onDone: () => void;
  onLog: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [trainer, setTrainer] = useState<Player | null>(null);
  const [ballType, setBallType] = useState<"pokebola" | "superbola" | "ultrabola">("pokebola");
  const [submitting, setSubmitting] = useState(false);

  const loadTrainer = useCallback(() => {
    api.get<Player>(`/players/${room.side_a.uid}`).then(setTrainer);
  }, [room.side_a.uid]);

  useEffect(() => {
    if (open) loadTrainer();
  }, [open, loadTrainer]);

  const submit = async (success: boolean) => {
    setSubmitting(true);
    try {
      const result = await api.post<BattleActionResult>(`/battles/${room.id}/capture`, { ball_type: ballType, success });
      onLog(result.capture_success ? "Captura bem-sucedida!" : "Captura falhou.");
      loadTrainer();
      onDone();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Erro na tentativa de captura.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="self-start rounded-full px-4 py-2 text-sm font-bold text-white"
        style={{ background: "linear-gradient(180deg,#e5153a,#c00822)" }}
      >
        Captura
      </button>
    );
  }

  const available = trainer?.pokeballs[ballType] ?? 0;

  return (
    <div className="w-full max-w-sm space-y-3 rounded-2xl border border-black/5 bg-white p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-neutral-800">Captura</p>
        <button onClick={() => setOpen(false)} className="text-xs font-medium text-neutral-400 hover:text-neutral-600">
          Fechar
        </button>
      </div>
      <p className="text-xs text-neutral-500">≥35% de vida: vencer as 3 rodadas · &lt;35%: vencer 2 de 3</p>

      <select
        value={ballType}
        onChange={(e) => setBallType(e.target.value as typeof ballType)}
        className="w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-sm"
      >
        {(["pokebola", "superbola", "ultrabola"] as const).map((type) => (
          <option key={type} value={type}>
            {BALL_LABELS[type]} ({trainer?.pokeballs[type] ?? "..."})
          </option>
        ))}
      </select>

      <div className="flex gap-3">
        <button
          onClick={() => submit(true)}
          disabled={submitting || available <= 0}
          className="flex-1 rounded-full py-2 text-sm font-bold text-white disabled:opacity-50"
          style={{ background: "linear-gradient(180deg,#e5153a,#c00822)" }}
        >
          Sucesso
        </button>
        <button
          onClick={() => submit(false)}
          disabled={submitting || available <= 0}
          className="flex-1 rounded-full border-2 border-neutral-200 py-2 text-sm font-semibold text-neutral-600 disabled:opacity-50"
        >
          Falha
        </button>
      </div>
      {available <= 0 && <p className="text-xs text-red-500">Sem {BALL_LABELS[ballType].toLowerCase()} disponível.</p>}
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
    <div className="space-y-2 rounded-2xl border border-black/5 bg-white/90 p-4 shadow-lg">
      <p className="text-sm font-semibold text-neutral-700">Aprovar batalha — escolha o pokémon do oponente</p>
      <select
        value={pokemonId}
        onChange={(e) => setPokemonId(e.target.value)}
        className="w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-sm"
      >
        <option value="">Pokémon do oponente</option>
        {pokemons.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nickname} (nv. {p.level})
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        onClick={approve}
        className="rounded-full px-4 py-2 text-sm font-bold text-white"
        style={{ background: "linear-gradient(180deg,#e5153a,#c00822)" }}
      >
        Aprovar e iniciar
      </button>
    </div>
  );
}
