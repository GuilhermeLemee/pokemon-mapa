import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { Pokemon } from "../lib/types";
import { PokemonCard } from "../components/PokemonCard";

export function DashboardPage() {
  const { player } = useAuth();
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!player) return;
    api
      .get<Pokemon[]>(`/players/${player.uid}/pokemons`)
      .then(setPokemons)
      .finally(() => setLoading(false));
  }, [player]);

  if (!player) return null;

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-white dark:bg-slate-800 p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">{player.display_name}</h1>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Moedas" value={player.coins} />
          <Stat label="Pokébolas" value={player.pokeballs.pokebola} />
          <Stat label="Superbolas" value={player.pokeballs.superbola} />
          <Stat label="Ultrabolas" value={player.pokeballs.ultrabola} />
        </div>
        {player.badges.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Insígnias</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {player.badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full bg-amber-100 dark:bg-amber-900 px-3 py-1 text-xs text-amber-800 dark:text-amber-200"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Seus Pokémons</h2>
        {loading ? (
          <p className="text-slate-500 dark:text-slate-400">Carregando...</p>
        ) : pokemons.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">Nenhum pokémon capturado ainda.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {pokemons.map((p) => (
              <PokemonCard key={p.id} pokemon={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 p-3 text-center">
      <p className="text-lg font-semibold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
