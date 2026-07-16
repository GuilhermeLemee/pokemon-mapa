import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api, ApiError } from "../lib/api";
import { animatedSpriteUrl } from "../lib/pokeapi";
import { GLASS_CARD } from "../lib/ui";

interface StarterOption {
  species: string;
  displayName: string;
}

const GENERATIONS: { label: string; starters: StarterOption[] }[] = [
  {
    label: "Kanto",
    starters: [
      { species: "bulbasaur", displayName: "Bulbasaur" },
      { species: "charmander", displayName: "Charmander" },
      { species: "squirtle", displayName: "Squirtle" },
    ],
  },
  {
    label: "Johto",
    starters: [
      { species: "chikorita", displayName: "Chikorita" },
      { species: "cyndaquil", displayName: "Cyndaquil" },
      { species: "totodile", displayName: "Totodile" },
    ],
  },
  {
    label: "Hoenn",
    starters: [
      { species: "treecko", displayName: "Treecko" },
      { species: "torchic", displayName: "Torchic" },
      { species: "mudkip", displayName: "Mudkip" },
    ],
  },
  {
    label: "Sinnoh",
    starters: [
      { species: "turtwig", displayName: "Turtwig" },
      { species: "chimchar", displayName: "Chimchar" },
      { species: "piplup", displayName: "Piplup" },
    ],
  },
  {
    label: "Unova",
    starters: [
      { species: "snivy", displayName: "Snivy" },
      { species: "tepig", displayName: "Tepig" },
      { species: "oshawott", displayName: "Oshawott" },
    ],
  },
  {
    label: "Kalos",
    starters: [
      { species: "chespin", displayName: "Chespin" },
      { species: "fennekin", displayName: "Fennekin" },
      { species: "froakie", displayName: "Froakie" },
    ],
  },
  {
    label: "Alola",
    starters: [
      { species: "rowlet", displayName: "Rowlet" },
      { species: "litten", displayName: "Litten" },
      { species: "popplio", displayName: "Popplio" },
    ],
  },
  {
    label: "Galar",
    starters: [
      { species: "grookey", displayName: "Grookey" },
      { species: "scorbunny", displayName: "Scorbunny" },
      { species: "sobble", displayName: "Sobble" },
    ],
  },
  {
    label: "Paldea",
    starters: [
      { species: "sprigatito", displayName: "Sprigatito" },
      { species: "fuecoco", displayName: "Fuecoco" },
      { species: "quaxly", displayName: "Quaxly" },
    ],
  },
];

export function StarterSelectionPage() {
  const { player, refreshPlayer } = useAuth();
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const choose = async (species: string) => {
    if (!player) return;
    setSubmitting(species);
    setError(null);
    try {
      await api.post(`/players/${player.uid}/starter`, { species });
      await refreshPlayer();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao escolher o inicial.");
      setSubmitting(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className={`${GLASS_CARD} p-5 text-center`}>
        <h1 className="text-xl font-semibold text-accent-200">Escolha seu pokémon inicial</h1>
        <p className="mt-1 text-sm text-accent-500">
          Essa escolha é única — de qualquer região, nível 5. Escolha com cuidado!
        </p>
      </div>

      {error && <p className="text-center text-sm text-red-400">{error}</p>}

      <div className="space-y-5">
        {GENERATIONS.map((gen) => (
          <div key={gen.label}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent-500">{gen.label}</h2>
            <div className="grid grid-cols-3 gap-3">
              {gen.starters.map((s) => (
                <button
                  key={s.species}
                  onClick={() => choose(s.species)}
                  disabled={submitting !== null}
                  className={`${GLASS_CARD} flex flex-col items-center gap-1 p-3 hover:border-accent-300/40 disabled:opacity-50`}
                >
                  <img
                    src={animatedSpriteUrl(s.species)}
                    alt={s.displayName}
                    className="h-16 w-16 object-contain"
                    loading="lazy"
                  />
                  <span className="text-sm text-accent-200">
                    {submitting === s.species ? "Escolhendo..." : s.displayName}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
