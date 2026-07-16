export interface PokemonSpecies {
  id: number;
  name: string;
  displayName: string;
  spriteUrl: string;
}

const LIST_URL = "https://pokeapi.co/api/v2/pokemon?limit=2000";
const SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

let cache: PokemonSpecies[] | null = null;
let inflight: Promise<PokemonSpecies[]> | null = null;

function idFromUrl(url: string): number {
  const match = url.match(/\/pokemon\/(\d+)\//);
  return match ? Number(match[1]) : 0;
}

function capitalize(name: string): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function loadSpeciesList(): Promise<PokemonSpecies[]> {
  if (cache) return cache;
  if (inflight) return inflight;

  inflight = fetch(LIST_URL)
    .then((res) => res.json())
    .then((data: { results: { name: string; url: string }[] }) => {
      const species = data.results.map((entry) => {
        const id = idFromUrl(entry.url);
        return {
          id,
          name: entry.name,
          displayName: capitalize(entry.name),
          spriteUrl: `${SPRITE_BASE}/${id}.png`,
        };
      });
      cache = species;
      return species;
    });

  return inflight;
}

export async function searchSpecies(query: string, limit = 8): Promise<PokemonSpecies[]> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const species = await loadSpeciesList();
  const startsWith: PokemonSpecies[] = [];
  const contains: PokemonSpecies[] = [];

  for (const s of species) {
    if (s.name.startsWith(normalized)) startsWith.push(s);
    else if (s.name.includes(normalized)) contains.push(s);
    if (startsWith.length >= limit) break;
  }

  return [...startsWith, ...contains].slice(0, limit);
}

export function spriteUrlForName(name: string): string | null {
  if (!cache) return null;
  const normalized = name.trim().toLowerCase();
  const match = cache.find((s) => s.name === normalized);
  return match ? match.spriteUrl : null;
}
