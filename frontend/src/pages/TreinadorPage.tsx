import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AvatarUpload } from "../components/AvatarUpload";
import { GymBadges } from "../components/GymBadges";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../lib/api";
import { animatedSpriteUrl, fetchPokemonTypes } from "../lib/pokeapi";
import { typeColor } from "../lib/typeChart";
import { TypeIcon } from "../lib/typeIcons";
import type { BattleRoom, HealRequest, Pokemon } from "../lib/types";

const MAX_PARTY_SIZE = 6;

const RED = "#dc0a2d";
const GREEN = "#4a9e70"; // verde das árvores do header
const GOLD = "#eab308"; // amarelo da moeda

const ROLE_LABEL: Record<string, string> = {
  admin: "Mestre",
  co_mestre: "Co-mestre",
  jogador: "Treinador",
};

function computeRecord(rooms: BattleRoom[], uid: string): { wins: number; losses: number } {
  let wins = 0;
  let losses = 0;
  for (const room of rooms) {
    if (room.status !== "finished") continue;
    const mySide = room.side_a.uid === uid ? room.side_a : "uid" in room.side_b && room.side_b.uid === uid ? room.side_b : null;
    const oppSide = mySide === room.side_a ? room.side_b : room.side_a;
    if (!mySide) continue;
    if (mySide.current_hp > 0 && oppSide.current_hp <= 0) wins += 1;
    else if (mySide.current_hp <= 0) losses += 1;
  }
  return { wins, losses };
}

export function TreinadorPage() {
  const { player } = useAuth();
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [record, setRecord] = useState({ wins: 0, losses: 0 });
  const [healRequests, setHealRequests] = useState<HealRequest[]>([]);
  const [healSubmitting, setHealSubmitting] = useState(false);
  const [healError, setHealError] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  const loadPokemons = () => {
    if (!player) return;
    api.get<Pokemon[]>(`/players/${player.uid}/pokemons`).then(setPokemons);
  };

  useEffect(() => {
    if (!player) return;
    loadPokemons();
    api.get<BattleRoom[]>("/battles").then((rooms) => setRecord(computeRecord(rooms, player.uid)));
    api.get<HealRequest[]>("/heal-requests").then(setHealRequests);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  if (!player) return null;

  const roleLabel = ROLE_LABEL[player.role] ?? player.role;
  const party = pokemons.filter((p) => p.in_party);
  const partyCount = party.length;
  const totalBalls = player.pokeballs.pokebola + player.pokeballs.superbola + player.pokeballs.ultrabola;
  const recent = [...pokemons]
    .sort((a, b) => (b.caught_at ?? "").localeCompare(a.caught_at ?? ""))
    .slice(0, 4);
  const healPending = healRequests.some((r) => r.uid === player.uid && r.status === "pending");

  const sendToProfessor = async (pokemon: Pokemon) => {
    setMoveError(null);
    try {
      await api.post(`/players/${player.uid}/pokemons/${pokemon.id}/party`, { in_party: false });
      loadPokemons();
    } catch (err) {
      setMoveError(err instanceof ApiError ? err.message : "Erro ao enviar pokémon para o Professor.");
    }
  };

  const requestHeal = async () => {
    setHealSubmitting(true);
    setHealError(null);
    try {
      await api.post("/heal-requests", {});
      const requests = await api.get<HealRequest[]>("/heal-requests");
      setHealRequests(requests);
    } catch (err) {
      setHealError(err instanceof ApiError ? err.message : "Erro ao solicitar cura.");
    } finally {
      setHealSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ==================== HERO ==================== */}
      <div className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)]">
        <div className="relative h-56 bg-cover bg-center sm:h-64" style={{ backgroundImage: "url(/header.jpg)" }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
        </div>

        <div className="flex flex-col gap-6 p-5 sm:flex-row sm:p-6">
          {/* ---- coluna esquerda: avatar + retângulo vertical de informações ---- */}
          <div className="-mt-24 flex w-full shrink-0 flex-col items-center sm:-mt-28 sm:w-52">
            <AvatarUpload uid={player.uid} avatarUrl={player.avatar_data_url} />
            <div className="mt-4 grid w-full max-w-52 grid-cols-2 gap-px overflow-hidden rounded-3xl border border-black/5 bg-black/5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.3)]">
              <StatRow
                icon={<TrophyIcon />}
                label="Vitórias / Derrotas"
                value={
                  <>
                    <span style={{ color: GREEN }}>{record.wins}V</span>
                    <span className="text-neutral-300"> · </span>
                    <span style={{ color: RED }}>{record.losses}D</span>
                  </>
                }
              />
              <StatRow icon={<PokeballStatIcon />} label="Pokébolas" value={totalBalls} />
              <StatRow icon={<InsigniaIcon />} label="Insígnias" value={`${player.badges.length}/8`} />
              <StatRow icon={<CoinIcon />} label="Pokémon Coin" value={player.coins} valueColor={GOLD} />
            </div>
          </div>

          {/* ---- coluna direita: identidade + ações + sobre ---- */}
          <div className="min-w-0 flex-1 sm:pt-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-3xl font-black tracking-tight text-neutral-900">{player.display_name}</h1>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                style={{ backgroundColor: `${RED}1a`, color: RED }}
              >
                {roleLabel}
              </span>
            </div>
            <p className="mt-1.5 text-sm font-medium text-neutral-500">
              {partyCount} pokémon no time · {pokemons.length} capturado(s)
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11Z" strokeLinejoin="round" />
                <circle cx="12" cy="10" r="2.4" />
              </svg>
              Região de Kanto
            </p>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <ActionButton to="/pokedex" label="Pokédex" />
              <ActionButton to="/laboratorio" label="Laboratório" />
              <button
                type="button"
                onClick={requestHeal}
                disabled={healSubmitting || healPending}
                className="rounded-full px-4 py-2 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: healPending ? "#9ca3af" : "linear-gradient(180deg,#e5153a,#c00822)",
                  boxShadow: healPending
                    ? "none"
                    : "inset 0 1px 0 rgba(255,255,255,0.35), 0 6px 14px -4px rgba(220,10,45,0.6)",
                }}
              >
                {healPending ? "Cura solicitada · aguardando" : healSubmitting ? "Enviando..." : "Pokémon Center"}
              </button>
            </div>
            {healError && <p className="mt-2 text-xs font-medium text-red-500">{healError}</p>}

            <div className="mt-5 rounded-2xl bg-neutral-50 p-4">
              <h2 className="mb-1 text-sm font-extrabold tracking-tight text-neutral-900">Sobre</h2>
              <p className="text-sm leading-relaxed text-neutral-600">
                {roleLabel} com {player.badges.length} insígnia(s) e {pokemons.length} pokémon capturado(s) ao todo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== PARTY ==================== */}
      <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.35)]">
        <SectionHeader icon={<PartyIcon />} title="Party" />
        {moveError && <p className="mb-3 text-xs font-medium text-red-500">{moveError}</p>}
        <div className="grid grid-cols-2 gap-3">
          {party.map((p) => (
            <PartySlotCard key={p.id} pokemon={p} onSendToProfessor={() => sendToProfessor(p)} />
          ))}
          {Array.from({ length: MAX_PARTY_SIZE - party.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex min-h-[168px] items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 text-sm font-medium text-neutral-300"
            >
              Vazio
            </div>
          ))}
        </div>
      </div>

      {/* ==================== RECENTES + INSÍGNIAS ==================== */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.35)]">
          <SectionHeader icon={<ClockIcon />} title="Pokémons recentes" />
          {recent.length === 0 ? (
            <p className="text-sm text-neutral-400">Nenhum pokémon capturado ainda.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {recent.map((p) => (
                <div key={p.id} className="flex items-center gap-2 rounded-2xl bg-neutral-50 p-2.5">
                  <img src={animatedSpriteUrl(p.species)} alt={p.nickname} className="h-10 w-10 object-contain" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-neutral-800">{p.nickname}</p>
                    <p className="text-xs text-neutral-500">Nível {p.level}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.35)]">
          <SectionHeader icon={<InsigniaOutlineIcon />} title="Insígnias" />
          <GymBadges earned={player.badges} />
        </div>
      </div>
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
  valueColor = RED,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  valueColor?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 bg-white px-2 py-3 text-center">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center">{icon}</span>
      <p className="text-base font-black leading-none" style={{ color: valueColor }}>
        {value}
      </p>
      <p className="text-[9px] leading-tight font-semibold tracking-wide text-neutral-400 uppercase">{label}</p>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${RED}14`, color: RED }}
      >
        {icon}
      </span>
      <h2 className="text-base font-extrabold tracking-tight text-neutral-900">{title}</h2>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

function InsigniaOutlineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <polygon points="8.5,2.5 15.5,2.5 21.5,8.5 21.5,15.5 15.5,21.5 8.5,21.5 2.5,15.5 2.5,8.5" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

// Troféu estilo Mario Kart: taça dourada com alças, base e estrela
function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="27" height="27">
      <path d="M6 3h12v3a6 6 0 0 1-12 0V3Z" fill="#f6c915" stroke="#9c6b0a" strokeWidth="1" strokeLinejoin="round" />
      <path d="M6 4C2 4 2 9 6.6 9.3" fill="none" stroke="#f6c915" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 4c4 0 4 5-.6 5.3" fill="none" stroke="#f6c915" strokeWidth="2" strokeLinecap="round" />
      <rect x="11" y="11.3" width="2" height="4" fill="#f6c915" />
      <path d="M7.6 20.5a4.4 4.4 0 0 1 8.8 0Z" fill="#f6c915" stroke="#9c6b0a" strokeWidth="1" strokeLinejoin="round" />
      <rect x="6.9" y="20" width="10.2" height="2.3" rx="1.1" fill="#e0a800" />
      <path d="M12 4.5l.66 1.4 1.54.2-1.12 1.05.28 1.53L12 8.96l-1.36.72.28-1.53L9.8 7.1l1.54-.2z" fill="#fff6d6" />
    </svg>
  );
}

// Insígnia estilo gym badge: octógono vermelho com estrela branca
function InsigniaIcon() {
  return (
    <svg viewBox="0 0 24 24" width="27" height="27">
      <polygon
        points="8.2,2 15.8,2 22,8.2 22,15.8 15.8,22 8.2,22 2,15.8 2,8.2"
        fill={RED}
        stroke="#8f0a20"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      <polygon points="9.5,6 14.5,6 18,9.5 18,14.5 14.5,18 9.5,18 6,14.5 6,9.5" fill="#fff" opacity="0.16" />
      <polygon
        points="12,7.2 13.12,10.46 16.57,10.52 13.81,12.59 14.82,15.88 12,13.9 9.18,15.88 10.19,12.59 7.43,10.52 10.88,10.46"
        fill="#fff"
      />
    </svg>
  );
}

function PokeballStatIcon() {
  return (
    <svg viewBox="0 0 24 24" width="27" height="27">
      <circle cx="12" cy="12" r="10" fill="#fff" stroke="#1b1b1b" strokeWidth="1.6" />
      <path d="M2 12a10 10 0 0 1 20 0Z" fill={RED} stroke="#1b1b1b" strokeWidth="1.6" />
      <line x1="2" y1="12" x2="22" y2="12" stroke="#1b1b1b" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.4" fill="#fff" stroke="#1b1b1b" strokeWidth="1.6" />
    </svg>
  );
}

function CoinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="27" height="27">
      <circle cx="12" cy="12" r="10" fill={GOLD} stroke="#a9720a" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="6.6" fill="none" stroke="#a9720a" strokeWidth="1.4" opacity="0.5" />
      <path
        d="M12 8.2l1.15 2.5 2.7.28-2.03 1.83.58 2.66L12 16.1l-2.4 1.37.58-2.66L8.15 11l2.7-.28z"
        fill="#fff6d6"
      />
    </svg>
  );
}

function ActionButton({ to, label, variant = "solid" }: { to: string; label: string; variant?: "solid" | "ghost" }) {
  if (variant === "ghost") {
    return (
      <Link
        to={to}
        className="rounded-full border-2 border-neutral-200 bg-white px-4 py-2 text-sm font-bold text-neutral-700 transition hover:border-neutral-800 hover:text-neutral-900"
      >
        {label}
      </Link>
    );
  }
  return (
    <Link
      to={to}
      className="rounded-full px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
      style={{
        background: "linear-gradient(180deg,#e5153a,#c00822)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 6px 14px -4px rgba(220,10,45,0.6)",
      }}
    >
      {label}
    </Link>
  );
}

function PartyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8.5" cy="8" r="3" />
      <circle cx="16.5" cy="9.5" r="2.4" />
      <path d="M3.5 20v-1.2A4.8 4.8 0 0 1 8.3 14h.4a4.8 4.8 0 0 1 4.8 4.8V20" />
      <path d="M14.8 14.6a4 4 0 0 1 4.7 3.9V20" />
    </svg>
  );
}

function PartySlotCard({ pokemon, onSendToProfessor }: { pokemon: Pokemon; onSendToProfessor: () => void }) {
  const [types, setTypes] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetchPokemonTypes(pokemon.species).then((t) => {
      if (!cancelled) setTypes(t);
    });
    return () => {
      cancelled = true;
    };
  }, [pokemon.species]);

  const hpPercent = Math.max(0, Math.round((pokemon.current_hp / pokemon.max_hp) * 100));
  const xpPercent =
    pokemon.xp_to_next_level > 0
      ? Math.max(0, Math.min(100, Math.round((pokemon.current_xp / pokemon.xp_to_next_level) * 100)))
      : 0;
  const fainted = pokemon.current_hp <= 0;
  const hpColor = hpPercent <= 20 ? "#e0392b" : hpPercent <= 50 ? "#f0b429" : "#4ece3a";

  return (
    <div className="flex flex-col items-center rounded-2xl border border-black/5 bg-neutral-50 p-3 text-center">
      <img
        src={animatedSpriteUrl(pokemon.species)}
        alt={pokemon.nickname}
        className="h-14 w-14 object-contain"
        style={{ filter: fainted ? "grayscale(1)" : "none", opacity: fainted ? 0.5 : 1 }}
      />
      <p className="mt-1 w-full truncate text-sm font-black text-neutral-900">{pokemon.nickname}</p>
      <div className="mt-0.5 flex items-center gap-1.5">
        <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black text-white" style={{ background: RED }}>
          Nível {pokemon.level}
        </span>
        {types.map((t) => (
          <span
            key={t}
            title={t}
            className="flex h-5 w-5 items-center justify-center rounded-full"
            style={{ background: typeColor(t) ?? "#9aa0a9", boxShadow: "inset 0 -1px 2px rgba(0,0,0,0.22)" }}
          >
            <TypeIcon type={t} className="h-3.5 w-3.5" />
          </span>
        ))}
      </div>

      <div className="mt-2 w-full space-y-1">
        <MiniBar label="Vida" value={`${pokemon.current_hp}/${pokemon.max_hp}`} percent={hpPercent} color={hpColor} />
        <MiniBar label="Experiência" value={`${pokemon.current_xp}/${pokemon.xp_to_next_level}`} percent={xpPercent} color="#38bdf8" />
      </div>

      <div className="mt-2.5 flex w-full flex-col gap-1.5">
        <Link
          to={`/pokemon/${pokemon.id}`}
          className="w-full rounded-full border-2 border-neutral-200 bg-white px-2 py-1 text-[11px] font-bold text-neutral-700 transition hover:border-neutral-800 hover:text-neutral-900"
        >
          Ver resumo
        </Link>
        <button
          onClick={onSendToProfessor}
          className="w-full rounded-full border-2 border-neutral-200 bg-white px-2 py-1 text-[11px] font-bold text-neutral-700 transition hover:border-neutral-800 hover:text-neutral-900"
        >
          Enviar para Professor
        </button>
      </div>
    </div>
  );
}

function MiniBar({ label, value, percent, color }: { label: string; value: string; percent: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-[9px] font-bold text-neutral-400">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-neutral-200">
        <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, background: color }} />
      </div>
    </div>
  );
}
