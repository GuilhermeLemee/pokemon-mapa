/** É super efetivo contra — tabela padrão (geração 6+), só a relação de
 * vantagem (2x). Não modelamos resistência/imunidade: o sistema da mesa é
 * binário (normal ou vantagem), então só precisamos saber "é forte contra". */
export const SUPER_EFFECTIVE: Record<string, string[]> = {
  normal: [],
  fire: ["grass", "ice", "bug", "steel"],
  water: ["fire", "ground", "rock"],
  electric: ["water", "flying"],
  grass: ["water", "ground", "rock"],
  ice: ["grass", "ground", "flying", "dragon"],
  fighting: ["normal", "ice", "rock", "dark", "steel"],
  poison: ["grass", "fairy"],
  ground: ["fire", "electric", "poison", "rock", "steel"],
  flying: ["grass", "fighting", "bug"],
  psychic: ["fighting", "poison"],
  bug: ["grass", "psychic", "dark"],
  rock: ["fire", "ice", "flying", "bug"],
  ghost: ["ghost", "psychic"],
  dragon: ["dragon"],
  dark: ["ghost", "psychic"],
  steel: ["ice", "rock", "fairy"],
  fairy: ["fighting", "dragon", "dark"],
};

/** True se o tipo do golpe é super efetivo contra qualquer um dos tipos do
 * defensor (times duplos: OR simples, sem multiplicar as duas relações). */
export function isSuperEffective(moveType: string, defenderTypes: string[]): boolean {
  const strengths = SUPER_EFFECTIVE[moveType.toLowerCase()];
  if (!strengths) return false;
  return defenderTypes.some((t) => strengths.includes(t.toLowerCase()));
}

export const TYPE_COLORS: Record<string, string> = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  electric: "#F8D030",
  grass: "#78C850",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC",
};

export function typeColor(typeName: string | null | undefined): string | undefined {
  if (!typeName) return undefined;
  return TYPE_COLORS[typeName.toLowerCase()];
}
