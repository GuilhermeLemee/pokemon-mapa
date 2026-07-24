import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../lib/api";
import { animatedSpriteUrl, fetchPokemonTypes } from "../lib/pokeapi";
import { typeColor } from "../lib/typeChart";
import { TypeIcon } from "../lib/typeIcons";
import type { Pokemon } from "../lib/types";

const MAX_PARTY_SIZE = 6;
const RED = "#dc0a2d";

export function LaboratorioPage() {
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

  const moveToParty = async (pokemon: Pokemon) => {
    setError(null);
    try {
      await api.post(`/players/${player.uid}/pokemons/${pokemon.id}/party`, { in_party: true });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao mover pokémon.");
    }
  };

  return (
    <div className="space-y-6">
      {error && <p className="rounded-xl bg-white/90 p-3 text-sm font-medium text-red-500 shadow">{error}</p>}

      <div className="mb-1 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: `${RED}14`, color: RED }}>
          <LabIcon />
        </span>
        <h1 className="text-lg font-extrabold tracking-tight text-neutral-900">Laboratório</h1>
      </div>
      <p className="text-sm text-neutral-500">
        Os pokémons enviados para o Professor ficam guardados aqui até você chamá-los de volta para a Party.
      </p>

      {loading ? (
        <p className="text-sm text-neutral-400">Carregando...</p>
      ) : box.length === 0 ? (
        <p className="text-sm text-neutral-400">Nenhum pokémon no Laboratório.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {box.map((p) => (
            <LabMemberCard key={p.id} pokemon={p} partyFull={party.length >= MAX_PARTY_SIZE} onMoveToParty={() => moveToParty(p)} />
          ))}
        </div>
      )}
    </div>
  );
}

function LabMemberCard({
  pokemon,
  partyFull,
  onMoveToParty,
}: {
  pokemon: Pokemon;
  partyFull: boolean;
  onMoveToParty: () => void;
}) {
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
  const ring = typeColor(types[0]) ?? "#d4d4d8";

  const hpPercent = Math.max(0, Math.round((pokemon.current_hp / pokemon.max_hp) * 100));
  const xpPercent =
    pokemon.xp_to_next_level > 0 ? Math.max(0, Math.min(100, Math.round((pokemon.current_xp / pokemon.xp_to_next_level) * 100))) : 0;
  const fainted = pokemon.current_hp <= 0;
  const hpColor = hpPercent <= 20 ? "#e0392b" : hpPercent <= 50 ? "#f0b429" : "#4ece3a";

  return (
    <div className="flex flex-col items-center rounded-2xl border border-black/5 bg-white p-3 text-center shadow-[0_12px_30px_-16px_rgba(0,0,0,0.4)]">
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-neutral-50"
        style={{ boxShadow: `inset 0 0 0 3px ${ring}` }}
      >
        <img
          src={animatedSpriteUrl(pokemon.species)}
          alt={pokemon.nickname}
          loading="lazy"
          className="h-11 w-11 object-contain"
          style={{ filter: fainted ? "grayscale(1)" : "none", opacity: fainted ? 0.5 : 1 }}
        />
      </div>

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
        <div>
          <div className="flex justify-between text-[9px] font-bold text-neutral-400">
            <span>Vida</span>
            <span>
              {pokemon.current_hp}/{pokemon.max_hp}
            </span>
          </div>
          <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full transition-all" style={{ width: `${hpPercent}%`, background: hpColor }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[9px] font-bold text-neutral-400">
            <span>Experiência</span>
            <span>
              {pokemon.current_xp}/{pokemon.xp_to_next_level}
            </span>
          </div>
          <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full bg-sky-400 transition-all" style={{ width: `${xpPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex w-full flex-col gap-1.5">
        <Link
          to={`/pokemon/${pokemon.id}`}
          className="w-full rounded-full border-2 border-neutral-200 bg-white px-2 py-1 text-[11px] font-bold text-neutral-700 transition hover:border-neutral-800 hover:text-neutral-900"
        >
          Ver resumo
        </Link>
        <button
          onClick={onMoveToParty}
          disabled={partyFull}
          className="w-full rounded-full border-2 border-neutral-200 bg-white px-2 py-1 text-[11px] font-bold text-neutral-700 transition hover:border-neutral-800 hover:text-neutral-900 disabled:opacity-40 disabled:hover:border-neutral-200"
        >
          Chamar para a Party
        </button>
      </div>
    </div>
  );
}

function LabIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2v6.5L4.5 17a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L15 8.5V2" />
      <path d="M9 2h6" />
      <path d="M7.5 14h9" />
    </svg>
  );
}
