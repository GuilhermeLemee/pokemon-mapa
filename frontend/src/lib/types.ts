export type Role = "admin" | "co_mestre" | "jogador";

export const STAFF_ROLES: Role[] = ["admin", "co_mestre"];

export interface Pokeballs {
  pokebola: number;
  superbola: number;
  ultrabola: number;
}

export interface Player {
  uid: string;
  display_name: string;
  role: Role;
  coins: number;
  pokeballs: Pokeballs;
  badges: string[];
}

export interface Pokemon {
  id: string;
  nickname: string;
  species: string;
  level: number;
  current_xp: number;
  xp_to_next_level: number;
  current_hp: number;
  max_hp: number;
  moves: string[];
}

export interface ApplyXpResult {
  pokemon: Pokemon;
  levels_gained: number;
  leveled_up: boolean;
}
