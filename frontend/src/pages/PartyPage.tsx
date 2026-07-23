import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../lib/api";
import { animatedSpriteUrl, fetchPokemonTypes } from "../lib/pokeapi";
import { typeColor } from "../lib/typeChart";
import type { Pokemon } from "../lib/types";

const MAX_PARTY_SIZE = 6;
const RED = "#dc0a2d";

export function PartyPage() {
  const { player } = useAuth();
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!player) return;
    api
      .get<Pokemon[]>(`/players/${player.uid}/pokemons`)
      .then(setPokemons)
      .finally(() => setLoading(false));
  };

  useEffect(load, [player]);

  if (!player) return null;

  const party = pokemons.filter((p) => p.in_party);
  const box = pokemons.filter((p) => !p.in_party);

  const moveTo = async (pokemon: Pokemon, inParty: boolean) => {
    setError(null);
    try {
      await api.post(`/players/${player.uid}/pokemons/${pokemon.id}/party`, { in_party: inParty });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao mover pokémon.");
    }
  };

  return (
    <div className="space-y-6">
      {error && <p className="rounded-xl bg-white/90 p-3 text-sm font-medium text-red-500 shadow">{error}</p>}

      <section>
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: `${RED}14`, color: RED }}>
            <PokeballIcon />
          </span>
          <h1 className="text-lg font-extrabold tracking-tight text-neutral-900">
            Party <span className="text-neutral-400">({party.length}/{MAX_PARTY_SIZE})</span>
          </h1>
        </div>

        {loading ? (
          <p className="text-sm text-neutral-400">Carregando...</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {party.map((p) => (
              <PartyMemberCard key={p.id} pokemon={p} moveLabel="Mover p/ caixa" onMove={() => moveTo(p, false)} />
            ))}
            {Array.from({ length: MAX_PARTY_SIZE - party.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex min-h-[112px] items-center justify-center rounded-3xl border-2 border-dashed border-neutral-200 text-sm font-medium text-neutral-300"
              >
                Vazio
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="caixa">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: `${RED}14`, color: RED }}>
            <BoxIcon />
          </span>
          <h2 className="text-lg font-extrabold tracking-tight text-neutral-900">Caixa (PC Pokémon)</h2>
        </div>
        {!loading && box.length === 0 ? (
          <p className="text-sm text-neutral-400">Nenhum pokémon na caixa.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {box.map((p) => (
              <PartyMemberCard
                key={p.id}
                pokemon={p}
                moveLabel="Mover p/ party"
                moveDisabled={party.length >= MAX_PARTY_SIZE}
                onMove={() => moveTo(p, true)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PartyMemberCard({
  pokemon,
  moveLabel,
  moveDisabled,
  onMove,
}: {
  pokemon: Pokemon;
  moveLabel: string;
  moveDisabled?: boolean;
  onMove: () => void;
}) {
  const [ring, setRing] = useState<string>("#d4d4d8");
  useEffect(() => {
    let cancelled = false;
    fetchPokemonTypes(pokemon.species).then((types) => {
      if (!cancelled) setRing(typeColor(types[0]) ?? "#d4d4d8");
    });
    return () => {
      cancelled = true;
    };
  }, [pokemon.species]);

  const hpPercent = Math.max(0, Math.round((pokemon.current_hp / pokemon.max_hp) * 100));
  const xpPercent =
    pokemon.xp_to_next_level > 0 ? Math.max(0, Math.min(100, Math.round((pokemon.current_xp / pokemon.xp_to_next_level) * 100))) : 0;
  const xpLeft = Math.max(0, pokemon.xp_to_next_level - pokemon.current_xp);
  const fainted = pokemon.current_hp <= 0;
  const hpColor = hpPercent <= 20 ? "#e0392b" : hpPercent <= 50 ? "#f0b429" : "#4ece3a";

  return (
    <Link
      to={`/pokemon/${pokemon.id}`}
      className="group block rounded-3xl border border-black/5 bg-white p-4 shadow-[0_12px_30px_-16px_rgba(0,0,0,0.4)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-16px_rgba(0,0,0,0.45)]"
    >
      <div className="flex items-center gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-neutral-50"
          style={{ boxShadow: `inset 0 0 0 3px ${ring}` }}
        >
          <img
            src={animatedSpriteUrl(pokemon.species)}
            alt={pokemon.nickname}
            loading="lazy"
            className="h-12 w-12 object-contain"
            style={{ filter: fainted ? "grayscale(1)" : "none", opacity: fainted ? 0.5 : 1 }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate font-black text-neutral-900">{pokemon.nickname}</h3>
            <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-black text-white" style={{ background: RED }}>
              Lv {pokemon.level}
            </span>
          </div>
          <p className="truncate text-[11px] font-medium text-neutral-400 capitalize">{pokemon.species}</p>

          <div className="mt-2">
            <div className="flex justify-between text-[10px] font-bold text-neutral-400">
              <span>HP</span>
              <span>
                {pokemon.current_hp}/{pokemon.max_hp}
              </span>
            </div>
            <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-neutral-100">
              <div className="h-full rounded-full transition-all" style={{ width: `${hpPercent}%`, background: hpColor }} />
            </div>
          </div>

          <div className="mt-1.5">
            <div className="flex justify-between text-[10px] font-bold text-neutral-400">
              <span>XP</span>
              <span>faltam {xpLeft}</span>
            </div>
            <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-neutral-100">
              <div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: `${xpPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-neutral-400 group-hover:text-neutral-600">Ver resumo →</span>
        <button
          onClick={(e) => {
            e.preventDefault();
            if (!moveDisabled) onMove();
          }}
          disabled={moveDisabled}
          className="rounded-full border-2 border-neutral-200 px-3 py-1 text-[11px] font-bold text-neutral-600 transition hover:border-neutral-800 hover:text-neutral-900 disabled:opacity-40 disabled:hover:border-neutral-200"
        >
          {moveLabel}
        </button>
      </div>
    </Link>
  );
}

function PokeballIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h6" />
      <path d="M15 12h6" />
      <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8l9-4 9 4-9 4-9-4Z" />
      <path d="M3 8v8l9 4 9-4V8" />
      <path d="M12 12v8" />
    </svg>
  );
}
