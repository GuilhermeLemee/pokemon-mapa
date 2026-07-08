import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import type { ApplyXpResult, Player, Pokemon } from "../lib/types";
import { PokemonCard } from "../components/PokemonCard";

export function AdminPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  useEffect(() => {
    api.get<Player[]>("/players").then(setPlayers);
  }, []);

  const selectedPlayer = players.find((p) => p.uid === selectedUid) ?? null;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
      <aside className="space-y-2">
        <h2 className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400">Jogadores</h2>
        {players.map((p) => (
          <button
            key={p.uid}
            onClick={() => setSelectedUid(p.uid)}
            className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
              p.uid === selectedUid
                ? "bg-indigo-600 text-white"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            {p.display_name}
          </button>
        ))}
      </aside>

      <section>
        {selectedPlayer ? (
          <PlayerXpPanel player={selectedPlayer} />
        ) : (
          <p className="text-slate-500 dark:text-slate-400">Selecione um jogador para lançar XP de batalha.</p>
        )}
      </section>
    </div>
  );
}

function PlayerXpPanel({ player }: { player: Player }) {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPokemons = () => {
    setLoading(true);
    api
      .get<Pokemon[]>(`/players/${player.uid}/pokemons`)
      .then(setPokemons)
      .finally(() => setLoading(false));
  };

  useEffect(loadPokemons, [player.uid]);

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
        Pokémons de {player.display_name}
      </h2>
      {loading ? (
        <p className="text-slate-500 dark:text-slate-400">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {pokemons.map((pokemon) => (
            <ApplyXpCard key={pokemon.id} uid={player.uid} pokemon={pokemon} onApplied={loadPokemons} />
          ))}
        </div>
      )}
    </div>
  );
}

function ApplyXpCard({
  uid,
  pokemon,
  onApplied,
}: {
  uid: string;
  pokemon: Pokemon;
  onApplied: () => void;
}) {
  const [xp, setXp] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    const xpValue = Number(xp);
    if (!xpValue || xpValue <= 0) {
      setError("Informe um valor de XP maior que zero.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setFeedback(null);
    try {
      const result = await api.post<ApplyXpResult>(`/players/${uid}/pokemons/${pokemon.id}/xp`, {
        xp_gained: xpValue,
        note: note || undefined,
      });
      setFeedback(
        result.leveled_up
          ? `Subiu ${result.levels_gained} nível(is)! Agora nível ${result.pokemon.level}.`
          : "XP aplicado.",
      );
      setXp("");
      setNote("");
      onApplied();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao aplicar XP.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PokemonCard pokemon={pokemon}>
      <div className="mt-3 space-y-2 border-t border-slate-100 dark:border-slate-700 pt-3">
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            placeholder="XP ganho"
            value={xp}
            onChange={(e) => setXp(e.target.value)}
            className="w-24 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-2 py-1 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500"
          />
          <input
            type="text"
            placeholder="Observação (opcional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent px-2 py-1 text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500"
          />
        </div>
        <button
          onClick={handleApply}
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {submitting ? "Aplicando..." : "Lançar XP"}
        </button>
        {feedback && <p className="text-xs text-emerald-600">{feedback}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </PokemonCard>
  );
}
