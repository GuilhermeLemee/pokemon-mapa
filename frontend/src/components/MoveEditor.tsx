import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api, ApiError } from "../lib/api";
import { fetchLearnableMoves, fetchMoveType, type LearnableMove } from "../lib/pokeapi";
import { typeColor } from "../lib/typeChart";
import type { Pokemon } from "../lib/types";

const MAX_MOVES = 8;

const THEMES = {
  dark: {
    border: "border-t border-accent-500/15",
    label: "text-accent-500",
    slot: "border border-accent-500/20 text-accent-200 hover:border-accent-300/40",
    slotEmpty: "border-dashed border-accent-500/30 text-accent-500",
    menu: "border border-accent-500/25 bg-bg-900/95 backdrop-blur-sm",
    menuItem: "hover:bg-accent-300/10 text-accent-200",
    menuMuted: "text-accent-500/40",
    note: "text-accent-300",
    hint: "text-accent-500",
  },
  light: {
    border: "border-t border-neutral-200",
    label: "text-neutral-500",
    slot: "border border-neutral-200 text-neutral-700 hover:border-neutral-400",
    slotEmpty: "border-dashed border-neutral-300 text-neutral-400",
    menu: "border border-neutral-200 bg-white shadow-xl",
    menuItem: "hover:bg-neutral-100 text-neutral-700",
    menuMuted: "text-neutral-300",
    note: "text-red-600",
    hint: "text-neutral-400",
  },
} as const;

export function MoveEditor({
  uid,
  pokemon,
  onUpdated,
  light,
}: {
  uid: string;
  pokemon: Pokemon;
  onUpdated: () => void;
  light?: boolean;
}) {
  const t = light ? THEMES.light : THEMES.dark;
  const [learnable, setLearnable] = useState<LearnableMove[]>([]);
  const [moveTypes, setMoveTypes] = useState<Record<string, string | null>>({});
  const [openSlot, setOpenSlot] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const triggerRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  useEffect(() => {
    let cancelled = false;
    fetchLearnableMoves(pokemon.species, pokemon.level).then((moves) => {
      if (!cancelled) setLearnable(moves);
    });
    return () => {
      cancelled = true;
    };
  }, [pokemon.species, pokemon.level]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(learnable.map((m) => fetchMoveType(m.name).then((t) => [m.name, t] as const))).then((pairs) => {
      if (!cancelled) setMoveTypes(Object.fromEntries(pairs));
    });
    return () => {
      cancelled = true;
    };
  }, [learnable]);

  useEffect(() => {
    if (openSlot === null) return;
    const handleClickOutside = () => {
      setOpenSlot(null);
      setMenuPos(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openSlot]);

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
    setMenuPos(null);
    saveMoves(padded.filter((m) => m !== ""));
  };

  const clearSlot = (index: number) => {
    const next = pokemon.moves.filter((_, i) => i !== index);
    saveMoves(next);
  };

  const toggleSlot = (index: number) => {
    if (openSlot === index) {
      setOpenSlot(null);
      setMenuPos(null);
      return;
    }
    const trigger = triggerRefs.current[index];
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX });
    }
    setOpenSlot(index);
  };

  const newlyLearned = learnable.filter(
    (m) => m.level === pokemon.level && !pokemon.moves.includes(m.name),
  );

  return (
    <div className={`mt-3 pt-3 ${t.border}`}>
      <p className={`mb-2 text-xs font-medium ${t.label}`}>
        Golpes conhecidos ({pokemon.moves.length}/{MAX_MOVES})
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: MAX_MOVES }).map((_, i) => {
          const move = pokemon.moves[i];
          const color = move ? typeColor(moveTypes[move]) : undefined;
          return (
            <div key={i}>
              <button
                ref={(el) => {
                  triggerRefs.current[i] = el;
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSlot(i);
                }}
                style={color ? { borderColor: color, color } : undefined}
                className={`w-full rounded-lg px-2 py-1.5 text-left text-xs ${move ? t.slot : t.slotEmpty}`}
              >
                {move ? displayName(move) : "Vazio"}
              </button>
            </div>
          );
        })}
      </div>

      {openSlot !== null &&
        menuPos &&
        createPortal(
          <div
            onMouseDown={(e) => e.stopPropagation()}
            style={{ top: menuPos.top, left: menuPos.left }}
            className={`fixed z-50 max-h-48 w-48 overflow-y-auto rounded-lg ${t.menu}`}
          >
            {pokemon.moves[openSlot] && (
              <button
                onClick={() => clearSlot(openSlot)}
                className="block w-full px-3 py-1.5 text-left text-xs text-red-500 hover:bg-red-500/10"
              >
                Remover
              </button>
            )}
            {learnable.length === 0 ? (
              <p className={`px-3 py-1.5 text-xs ${t.hint}`}>Carregando...</p>
            ) : (
              learnable.map((m) => {
                const color = typeColor(moveTypes[m.name]);
                const known = pokemon.moves.includes(m.name);
                return (
                  <button
                    key={m.name}
                    onClick={() => setSlot(openSlot, m.name)}
                    disabled={known}
                    style={!known && color ? { color } : undefined}
                    className={`block w-full px-3 py-1.5 text-left text-xs ${t.menuItem} ${known ? t.menuMuted : ""}`}
                  >
                    {m.displayName} (nv. {m.level})
                  </button>
                );
              })
            )}
          </div>,
          document.body,
        )}

      {newlyLearned.length > 0 && pokemon.moves.length >= MAX_MOVES && (
        <p className={`mt-2 text-xs ${t.note}`}>
          Aprendeu {newlyLearned.map((m) => m.displayName).join(", ")} no nível {pokemon.level} — clique num slot
          acima pra substituir.
        </p>
      )}
      <p className={`mt-2 text-xs ${t.hint}`}>
        Numa batalha, escolha até 6 desses golpes pra usar naquela sala — dá pra mudar a cada batalha.
      </p>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
