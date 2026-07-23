import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MoveEditor } from "../components/MoveEditor";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { animatedSpriteUrl, fetchPokemonInfo, type PokemonInfo } from "../lib/pokeapi";
import { typeColor } from "../lib/typeChart";
import type { Pokemon } from "../lib/types";

const RED = "#dc0a2d";

const STAT_LABELS: Record<string, string> = {
  hp: "Vida",
  attack: "Ataque",
  defense: "Defesa",
  "special-attack": "Ataque Especial",
  "special-defense": "Defesa Especial",
  speed: "Velocidade",
};

export function PokemonSummaryPage() {
  const { id } = useParams<{ id: string }>();
  const { player } = useAuth();
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [info, setInfo] = useState<PokemonInfo | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = () => {
    if (!player || !id) return;
    api.get<Pokemon[]>(`/players/${player.uid}/pokemons`).then((all) => {
      const found = all.find((p) => p.id === id) ?? null;
      setPokemon(found);
      if (!found) setNotFound(true);
    });
  };

  useEffect(load, [player, id]);

  useEffect(() => {
    if (!pokemon) return;
    fetchPokemonInfo(pokemon.species).then(setInfo);
  }, [pokemon?.species]);

  if (!player) return null;

  if (notFound) {
    return (
      <div className="rounded-3xl border border-black/5 bg-white p-6 text-center shadow">
        <p className="text-sm text-neutral-500">Pokémon não encontrado.</p>
        <Link to="/" className="mt-3 inline-block text-sm font-bold text-red-600">
          ← Voltar para o Treinador
        </Link>
      </div>
    );
  }

  if (!pokemon) return <p className="text-sm text-neutral-500">Carregando...</p>;

  const hpPercent = Math.max(0, Math.round((pokemon.current_hp / pokemon.max_hp) * 100));
  const xpPercent =
    pokemon.xp_to_next_level > 0
      ? Math.max(0, Math.min(100, Math.round((pokemon.current_xp / pokemon.xp_to_next_level) * 100)))
      : 0;
  const hpColor = hpPercent <= 20 ? "#e0392b" : hpPercent <= 50 ? "#f0b429" : "#4ece3a";
  const types = info?.types ?? [];
  const statTotal = info ? info.baseStats.reduce((sum, s) => sum + s.value, 0) : 0;

  return (
    <div className="space-y-4">
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-bold text-neutral-500 hover:text-neutral-800">
        ← Voltar
      </Link>

      {/* ===== Card estilo pokébola ===== */}
      <div className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.5)]">
        {/* metade de cima da pokébola (vermelha) */}
        <div className="relative px-5 pt-5 pb-12 text-center" style={{ background: `linear-gradient(180deg,#e5153a,#c00822)` }}>
          <PokeballWatermark />
          <img
            src={animatedSpriteUrl(pokemon.species)}
            alt={pokemon.nickname}
            className="relative mx-auto h-28 w-28 object-contain"
            style={{ filter: "drop-shadow(0 10px 8px rgba(0,0,0,.35))" }}
          />
          <div className="relative mt-1 flex items-center justify-center gap-2">
            <h1 className="text-2xl font-black text-white" style={{ textShadow: "0 1px 3px rgba(0,0,0,.3)" }}>
              {pokemon.nickname}
            </h1>
            {info && <span className="text-sm font-bold text-white/70">#{String(info.id).padStart(3, "0")}</span>}
          </div>
          <p className="relative text-xs font-medium text-white/70 capitalize">{pokemon.species}</p>
          <div className="relative mt-2 flex items-center justify-center gap-1.5">
            <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-black" style={{ color: RED }}>
              Nível {pokemon.level}
            </span>
            {types.map((t) => (
              <span
                key={t}
                className="rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white uppercase ring-1 ring-white/40"
                style={{ background: `${typeColor(t) ?? "#888"}` }}
              >
                {t}
              </span>
            ))}
          </div>

          {/* equador da pokébola */}
          <div className="absolute inset-x-0 bottom-0 h-2.5" style={{ background: "#1b1b1b" }} />
          <div className="absolute bottom-0 left-1/2 z-10 h-11 w-11 -translate-x-1/2 translate-y-1/2 rounded-full bg-white shadow-md ring-4 ring-[#1b1b1b]" />
        </div>

        {/* metade de baixo (branca) */}
        <div className="px-5 pt-9 pb-5">
          {/* HP + XP */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Bar label="Vida" value={`${pokemon.current_hp}/${pokemon.max_hp}`} percent={hpPercent} color={hpColor} />
            <Bar
              label="Experiência"
              value={`${pokemon.current_xp}/${pokemon.xp_to_next_level}`}
              percent={xpPercent}
              color="#38bdf8"
            />
          </div>

          {/* Estatísticas base */}
          <SectionTitle>Estatísticas base</SectionTitle>
          {info ? (
            <div className="space-y-1.5">
              {info.baseStats.map((s) => (
                <StatRow key={s.name} label={STAT_LABELS[s.name] ?? s.name} value={s.value} />
              ))}
              <div className="flex items-center justify-between pt-1 text-sm font-black text-neutral-900">
                <span>Total</span>
                <span style={{ color: RED }}>{statTotal}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-400">Carregando estatísticas...</p>
          )}

          {/* Ficha */}
          <SectionTitle>Ficha</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Fact label="Altura" value={info ? `${info.heightM.toFixed(1)} m` : "—"} />
            <Fact label="Peso" value={info ? `${info.weightKg.toFixed(1)} kg` : "—"} />
            <Fact label="Habilidades" value={info && info.abilities.length ? info.abilities.join(", ") : "—"} wide />
          </div>

          {/* Golpes */}
          <SectionTitle>Golpes</SectionTitle>
          <MoveEditor uid={player.uid} pokemon={pokemon} onUpdated={load} light />
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-5 mb-2.5 flex items-center gap-2 text-[11px] font-black tracking-wider uppercase" style={{ color: RED }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: RED }} />
      {children}
    </h2>
  );
}

function Bar({ label, value, percent, color }: { label: string; value: string; percent: number; color: string }) {
  return (
    <div className="rounded-2xl bg-neutral-50 p-3">
      <div className="flex justify-between text-[11px] font-bold text-neutral-500">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-neutral-200">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, background: color }} />
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  const percent = Math.min(100, Math.round((value / 200) * 100));
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-[11px] font-bold text-neutral-500">{label}</span>
      <span className="w-8 shrink-0 text-right text-xs font-black text-neutral-800">{value}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full rounded-full" style={{ width: `${percent}%`, background: RED }} />
      </div>
    </div>
  );
}

function Fact({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-2xl bg-neutral-50 p-3 ${wide ? "col-span-2" : ""}`}>
      <p className="text-[10px] font-bold tracking-wide text-neutral-400 uppercase">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-neutral-800 capitalize">{value}</p>
    </div>
  );
}

function PokeballWatermark() {
  return (
    <svg viewBox="0 0 100 100" className="pointer-events-none absolute top-1/2 left-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 opacity-10" aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="none" stroke="#fff" strokeWidth="5" />
      <line x1="4" y1="50" x2="96" y2="50" stroke="#fff" strokeWidth="5" />
      <circle cx="50" cy="50" r="15" fill="none" stroke="#fff" strokeWidth="5" />
    </svg>
  );
}
