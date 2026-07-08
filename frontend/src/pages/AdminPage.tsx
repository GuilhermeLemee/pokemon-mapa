import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import type { ApplyXpResult, Player, Pokemon } from "../lib/types";
import { PokemonCard } from "../components/PokemonCard";
import { ACCENT_BUTTON, FIELD_INPUT } from "../lib/ui";

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
        <h2 className="text-sm font-semibold uppercase text-accent-500">Jogadores</h2>
        {players.map((p) => (
          <button
            key={p.uid}
            onClick={() => setSelectedUid(p.uid)}
            className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              p.uid === selectedUid
                ? "bg-accent-300 text-bg-950"
                : "border border-accent-500/15 bg-bg-900/50 text-accent-300 hover:border-accent-300/40"
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
          <p className="text-accent-500">Selecione um jogador para lançar XP de batalha.</p>
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
      <h2 className="mb-3 text-lg font-semibold text-accent-200">Pokémons de {player.display_name}</h2>
      {loading ? (
        <p className="text-accent-500">Carregando...</p>
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
      <div className="mt-3 space-y-2 border-t border-accent-500/15 pt-3">
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            placeholder="XP ganho"
            value={xp}
            onChange={(e) => setXp(e.target.value)}
            className={`w-24 text-sm ${FIELD_INPUT}`}
          />
          <input
            type="text"
            placeholder="Observação (opcional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`flex-1 text-sm ${FIELD_INPUT}`}
          />
        </div>
        <button onClick={handleApply} disabled={submitting} className={`w-full py-1.5 text-sm ${ACCENT_BUTTON}`}>
          {submitting ? "Aplicando..." : "Lançar XP"}
        </button>
        {feedback && <p className="text-xs text-emerald-400">{feedback}</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </PokemonCard>
  );
}
