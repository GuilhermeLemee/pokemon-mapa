import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../lib/api";
import type { Pokemon } from "../lib/types";
import { PokemonCard } from "../components/PokemonCard";
import { GLASS_CARD } from "../lib/ui";

const MAX_PARTY_SIZE = 6;

export function DashboardPage() {
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
      <section className={`${GLASS_CARD} p-5`}>
        <h1 className="text-xl font-semibold text-accent-200">{player.display_name}</h1>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Moedas" value={player.coins} />
          <Stat label="Pokébolas" value={player.pokeballs.pokebola} />
          <Stat label="Superbolas" value={player.pokeballs.superbola} />
          <Stat label="Ultrabolas" value={player.pokeballs.ultrabola} />
        </div>
        {player.badges.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-accent-500">Insígnias</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {player.badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full bg-accent-300/10 border border-accent-300/25 px-3 py-1 text-xs text-accent-300"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-accent-200">
          Party ({party.length}/{MAX_PARTY_SIZE})
        </h2>
        {loading ? (
          <p className="text-accent-500">Carregando...</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {party.map((p) => (
              <PokemonCard key={p.id} pokemon={p}>
                <button
                  onClick={() => moveTo(p, false)}
                  className="mt-3 text-xs text-accent-500 hover:text-accent-300"
                >
                  Mover para a caixa
                </button>
              </PokemonCard>
            ))}
            {Array.from({ length: MAX_PARTY_SIZE - party.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-accent-500/25 text-sm text-accent-500"
              >
                Vazio
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-accent-200">Caixa</h2>
        {!loading && box.length === 0 ? (
          <p className="text-accent-500">Nenhum pokémon na caixa.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {box.map((p) => (
              <PokemonCard key={p.id} pokemon={p}>
                <button
                  onClick={() => moveTo(p, true)}
                  disabled={party.length >= MAX_PARTY_SIZE}
                  className="mt-3 text-xs text-accent-500 hover:text-accent-300 disabled:opacity-40"
                >
                  Mover para a party
                </button>
              </PokemonCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-accent-500/15 bg-bg-900/50 p-3 text-center">
      <p className="text-lg font-semibold text-accent-200">{value}</p>
      <p className="text-xs text-accent-500">{label}</p>
    </div>
  );
}
