import type { Pokemon } from "../lib/types";

export function PokemonCard({ pokemon, children }: { pokemon: Pokemon; children?: React.ReactNode }) {
  const hpPercent = Math.round((pokemon.current_hp / pokemon.max_hp) * 100);
  const xpPercent = Math.round((pokemon.current_xp / pokemon.xp_to_next_level) * 100);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold text-slate-900 dark:text-white">{pokemon.nickname}</h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">{pokemon.species}</span>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">Nível {pokemon.level}</p>

      <div className="mt-3 space-y-1">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>HP</span>
          <span>
            {pokemon.current_hp}/{pokemon.max_hp}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
          <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${hpPercent}%` }} />
        </div>
      </div>

      <div className="mt-2 space-y-1">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>XP</span>
          <span>
            {pokemon.current_xp}/{pokemon.xp_to_next_level}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
          <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${xpPercent}%` }} />
        </div>
      </div>

      {pokemon.moves.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {pokemon.moves.map((move) => (
            <span
              key={move}
              className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300"
            >
              {move}
            </span>
          ))}
        </div>
      )}

      {children}
    </div>
  );
}
