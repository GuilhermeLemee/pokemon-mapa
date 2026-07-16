import { animatedSpriteUrl } from "../lib/pokeapi";
import type { Pokemon } from "../lib/types";
import { GLASS_CARD } from "../lib/ui";
import { MoveEditor } from "./MoveEditor";

export function PokemonCard({
  pokemon,
  uid,
  onUpdated,
  children,
}: {
  pokemon: Pokemon;
  uid?: string;
  onUpdated?: () => void;
  children?: React.ReactNode;
}) {
  const hpPercent = Math.round((pokemon.current_hp / pokemon.max_hp) * 100);
  const xpPercent = Math.round((pokemon.current_xp / pokemon.xp_to_next_level) * 100);
  const sprite = animatedSpriteUrl(pokemon.species);

  return (
    <div className={`${GLASS_CARD} p-4`}>
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <img src={sprite} alt="" className="h-12 w-12 object-contain" loading="lazy" />
          <h3 className="font-semibold text-accent-200">{pokemon.nickname}</h3>
        </div>
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

      {uid && <MoveEditor uid={uid} pokemon={pokemon} onUpdated={onUpdated ?? (() => {})} />}

      {children}
    </div>
  );
}
