import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { fetchLearnableMoves, type LearnableMove } from "../lib/pokeapi";
import type { Pokemon } from "../lib/types";

const MAX_MOVES = 8;

export function MoveEditor({ uid, pokemon, onUpdated }: { uid: string; pokemon: Pokemon; onUpdated: () => void }) {
  const [learnable, setLearnable] = useState<LearnableMove[]>([]);
  const [openSlot, setOpenSlot] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLearnableMoves(pokemon.species, pokemon.level).then((moves) => {
      if (!cancelled) setLearnable(moves);
    });
    return () => {
      cancelled = true;
    };
  }, [pokemon.species, pokemon.level]);

  const displayName = (slug: string) =>
    slug
      .split("-")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");

  const saveMoves = async (moves: string[]) => {
    setError(null);
    try {
      await api.post(`/players/${uid}/pokemons/${pokemon.id}/moves`, { moves });
      onUpdated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar ataques.");
    }
  };

  const setSlot = (index: number, moveName: string) => {
    const padded = [...pokemon.moves, ...Array(MAX_MOVES).fill("")].slice(0, MAX_MOVES);
    padded[index] = moveName;
    setOpenSlot(null);
    saveMoves(padded.filter((m) => m !== ""));
  };

  const clearSlot = (index: number) => {
    const next = pokemon.moves.filter((_, i) => i !== index);
    saveMoves(next);
  };

  const newlyLearned = learnable.filter(
    (m) => m.level === pokemon.level && !pokemon.moves.includes(m.name),
  );

  return (
    <div className="mt-3 border-t border-accent-500/15 pt-3">
      <p className="mb-2 text-xs font-medium text-accent-500">
        Golpes conhecidos ({pokemon.moves.length}/{MAX_MOVES})
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: MAX_MOVES }).map((_, i) => {
          const move = pokemon.moves[i];
          return (
            <div key={i} className="relative">
              <button
                onClick={() => setOpenSlot(openSlot === i ? null : i)}
                className="w-full rounded-lg border border-accent-500/20 px-2 py-1.5 text-left text-xs text-accent-200 hover:border-accent-300/40"
              >
                {move ? displayName(move) : "Vazio"}
              </button>
              {openSlot === i && (
                <div className="absolute z-10 mt-1 max-h-48 w-48 overflow-y-auto rounded-lg border border-accent-500/25 bg-bg-900/95 backdrop-blur-sm">
                  {move && (
                    <button
                      onClick={() => {
                        setOpenSlot(null);
                        clearSlot(i);
                      }}
                      className="block w-full px-3 py-1.5 text-left text-xs text-red-400 hover:bg-red-400/10"
                    >
                      Remover
                    </button>
                  )}
                  {learnable.length === 0 ? (
                    <p className="px-3 py-1.5 text-xs text-accent-500">Carregando...</p>
                  ) : (
                    learnable.map((m) => (
                      <button
                        key={m.name}
                        onClick={() => setSlot(i, m.name)}
                        disabled={pokemon.moves.includes(m.name)}
                        className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-accent-300/10 ${
                          pokemon.moves.includes(m.name) ? "text-accent-500/40" : "text-accent-200"
                        }`}
                      >
                        {m.displayName} (nv. {m.level})
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {newlyLearned.length > 0 && pokemon.moves.length >= MAX_MOVES && (
        <p className="mt-2 text-xs text-accent-300">
          Aprendeu {newlyLearned.map((m) => m.displayName).join(", ")} no nível {pokemon.level} — clique num slot
          acima pra substituir.
        </p>
      )}
      <p className="mt-2 text-xs text-accent-500">
        Numa batalha, escolha até 6 desses golpes pra usar naquela sala — dá pra mudar a cada batalha.
      </p>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
