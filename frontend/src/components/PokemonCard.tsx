import type { Pokemon } from "../lib/types";
import { GLASS_CARD } from "../lib/ui";

export function PokemonCard({ pokemon, children }: { pokemon: Pokemon; children?: React.ReactNode }) {
  const hpPercent = Math.round((pokemon.current_hp / pokemon.max_hp) * 100);
  const xpPercent = Math.round((pokemon.current_xp / pokemon.xp_to_next_level) * 100);

  return (
    <div className={`${GLASS_CARD} p-4`}>
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold text-accent-200">{pokemon.nickname}</h3>
        <span className="text-xs text-accent-500">{pokemon.species}</span>
      </div>
      <p className="text-sm text-accent-500">Nível {pokemon.level}</p>

      <div className="mt-3 space-y-1">
        <div className="flex justify-between text-xs text-accent-500">
          <span>HP</span>
          <span>
            {pokemon.current_hp}/{pokemon.max_hp}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-bg-900">
          <div className="h-2 rounded-full bg-hp-500" style={{ width: `${hpPercent}%` }} />
        </div>
      </div>

      <div className="mt-2 space-y-1">
        <div className="flex justify-between text-xs text-accent-500">
          <span>XP</span>
          <span>
            {pokemon.current_xp}/{pokemon.xp_to_next_level}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-bg-900">
          <div className="h-2 rounded-full bg-accent-300" style={{ width: `${xpPercent}%` }} />
        </div>
      </div>

      {pokemon.moves.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {pokemon.moves.map((move) => (
            <span
              key={move}
              className="rounded-full bg-bg-900 px-2 py-0.5 text-xs text-accent-300 border border-accent-500/15"
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
