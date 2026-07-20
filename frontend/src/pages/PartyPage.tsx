import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../lib/api";
import type { Pokemon } from "../lib/types";
import { PokemonCard } from "../components/PokemonCard";

const MAX_PARTY_SIZE = 6;

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
      {error && <p className="text-sm text-red-400">{error}</p>}

      <section>
        <h1 className="mb-3 text-lg font-semibold text-accent-200">
          Party ({party.length}/{MAX_PARTY_SIZE})
        </h1>
        {loading ? (
          <p className="text-accent-500">Carregando...</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {party.map((p) => (
              <PokemonCard key={p.id} pokemon={p} uid={player.uid} onUpdated={load}>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => moveTo(p, false)}
                    className="rounded-full border-2 border-accent-500/40 px-3 py-1 text-xs font-medium text-accent-300 hover:bg-accent-300/10"
                  >
                    Mover para a caixa
                  </button>
                </div>
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

      <section id="caixa">
        <h2 className="mb-3 text-lg font-semibold text-accent-200">Caixa (PC Pokémon)</h2>
        {!loading && box.length === 0 ? (
          <p className="text-accent-500">Nenhum pokémon na caixa.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {box.map((p) => (
              <PokemonCard key={p.id} pokemon={p} uid={player.uid} onUpdated={load}>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => moveTo(p, true)}
                    disabled={party.length >= MAX_PARTY_SIZE}
                    className="rounded-full border-2 border-accent-500/40 px-3 py-1 text-xs font-medium text-accent-300 hover:bg-accent-300/10 disabled:opacity-40"
                  >
                    Mover para a party
                  </button>
                </div>
              </PokemonCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
