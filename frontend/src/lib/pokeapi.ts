export interface PokemonSpecies {
  id: number;
  name: string;
  displayName: string;
  spriteUrl: string;
}

const LIST_URL = "https://pokeapi.co/api/v2/pokemon?limit=2000";
const SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
const ANIMATED_SPRITE_BASE = "https://play.pokemonshowdown.com/sprites/ani";
const ANIMATED_BACK_SPRITE_BASE = "https://play.pokemonshowdown.com/sprites/ani-back";

let cache: PokemonSpecies[] | null = null;
let inflight: Promise<PokemonSpecies[]> | null = null;

export interface LearnableMove {
  name: string;
  displayName: string;
  level: number;
}

export interface BaseStat {
  name: string;
  value: number;
}

export interface PokemonInfo {
  id: number;
  types: string[];
  abilities: string[];
  heightM: number;
  weightKg: number;
  baseStats: BaseStat[];
}

interface SpeciesDetail {
  id: number;
  types: string[];
  abilities: string[];
  heightM: number;
  weightKg: number;
  baseStats: BaseStat[];
  learnableMoves: LearnableMove[];
}

const speciesDetailCache = new Map<string, Promise<SpeciesDetail>>();
const moveTypeCache = new Map<string, Promise<string | null>>();

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

export function animatedSpriteUrl(speciesSlug: string): string {
  const slug = speciesSlug.trim().toLowerCase().replace(/\s+/g, "-");
  return `${ANIMATED_SPRITE_BASE}/${slug}.gif`;
}

/** Sprite animada de costas (visão do treinador olhando o próprio pokémon). */
export function animatedBackSpriteUrl(speciesSlug: string): string {
  const slug = speciesSlug.trim().toLowerCase().replace(/\s+/g, "-");
  return `${ANIMATED_BACK_SPRITE_BASE}/${slug}.gif`;
}

function fetchSpeciesDetail(speciesSlug: string): Promise<SpeciesDetail> {
  const slug = speciesSlug.trim().toLowerCase().replace(/\s+/g, "-");
  if (!speciesDetailCache.has(slug)) {
    speciesDetailCache.set(
      slug,
      fetch(`https://pokeapi.co/api/v2/pokemon/${slug}`)
        .then((res) => res.json())
        .then(
          (data: {
            id: number;
            height: number;
            weight: number;
            moves: PokeApiMoveEntry[];
            types: { type: { name: string } }[];
            abilities: { ability: { name: string }; is_hidden: boolean }[];
            stats: { base_stat: number; stat: { name: string } }[];
          }) => {
            const byName = new Map<string, number>();
            for (const entry of data.moves) {
              const levelUpDetails = entry.version_group_details.filter(
                (d) => d.move_learn_method.name === "level-up",
              );
              if (levelUpDetails.length === 0) continue;
              const minLevel = Math.min(...levelUpDetails.map((d) => d.level_learned_at));
              const existing = byName.get(entry.move.name);
              if (existing === undefined || minLevel < existing) byName.set(entry.move.name, minLevel);
            }
            const learnableMoves = Array.from(byName.entries())
              .map(([name, moveLevel]) => ({ name, displayName: capitalize(name), level: moveLevel }))
              .sort((a, b) => a.level - b.level);
            const types = data.types.map((t) => t.type.name);
            const abilities = data.abilities.map((a) => capitalize(a.ability.name));
            const baseStats = data.stats.map((s) => ({ name: s.stat.name, value: s.base_stat }));
            return {
              id: data.id,
              types,
              abilities,
              heightM: data.height / 10,
              weightKg: data.weight / 10,
              baseStats,
              learnableMoves,
            };
          },
        ),
    );
  }
  return speciesDetailCache.get(slug)!;
}

export async function fetchLearnableMoves(speciesSlug: string, level: number): Promise<LearnableMove[]> {
  const { learnableMoves } = await fetchSpeciesDetail(speciesSlug);
  return learnableMoves.filter((m) => m.level <= level && m.level > 0);
}

export async function fetchPokemonTypes(speciesSlug: string): Promise<string[]> {
  try {
    const { types } = await fetchSpeciesDetail(speciesSlug);
    return types;
  } catch {
    return [];
  }
}

export async function fetchDexNumber(speciesSlug: string): Promise<number | null> {
  try {
    const { id } = await fetchSpeciesDetail(speciesSlug);
    return id;
  } catch {
    return null;
  }
}

export async function fetchPokemonInfo(speciesSlug: string): Promise<PokemonInfo | null> {
  try {
    const { id, types, abilities, heightM, weightKg, baseStats } = await fetchSpeciesDetail(speciesSlug);
    return { id, types, abilities, heightM, weightKg, baseStats };
  } catch {
    return null;
  }
}

export function fetchMoveType(moveSlug: string): Promise<string | null> {
  const slug = moveSlug.trim().toLowerCase().replace(/\s+/g, "-");
  if (!moveTypeCache.has(slug)) {
    moveTypeCache.set(
      slug,
      fetch(`https://pokeapi.co/api/v2/move/${slug}`)
        .then((res) => res.json())
        .then((data: { type: { name: string } }) => data.type.name)
        .catch(() => null),
    );
  }
  return moveTypeCache.get(slug)!;
}

interface PokeApiMoveEntry {
  move: { name: string };
  version_group_details: { level_learned_at: number; move_learn_method: { name: string } }[];
}
