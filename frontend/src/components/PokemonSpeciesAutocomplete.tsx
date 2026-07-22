import { useEffect, useRef, useState } from "react";
import { searchSpecies, type PokemonSpecies } from "../lib/pokeapi";

const GHOST_INPUT =
  "w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white outline-none ring-1 ring-white/10 placeholder:text-white/30 focus:ring-white/30";

export function PokemonSpeciesAutocomplete({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (species: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<PokemonSpecies[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    let cancelled = false;
    if (!query.trim()) {
      setResults([]);
      return;
    }
    searchSpecies(query).then((matches) => {
      if (!cancelled) setResults(matches);
    });
    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className={GHOST_INPUT}
      />
      {open && results.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg bg-neutral-900/95 ring-1 ring-white/10 backdrop-blur-sm">
          {results.map((species) => (
            <li key={species.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(species.displayName);
                  setQuery(species.displayName);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10"
              >
                <img src={species.spriteUrl} alt="" className="h-8 w-8" loading="lazy" />
                {species.displayName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
