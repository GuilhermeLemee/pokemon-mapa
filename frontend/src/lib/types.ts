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
  in_party: boolean;
}

export interface ApplyXpResult {
  pokemon: Pokemon;
  levels_gained: number;
  leveled_up: boolean;
}

export type BattleType = "participant" | "wild";
export type BattleStatus = "pending_approval" | "pending_accept" | "active" | "finished" | "declined";

export interface TrainerSideHydrated {
  uid: string;
  pokemon_id: string;
  species: string;
  level: number;
  current_hp: number;
  max_hp: number;
}

export interface WildSideHydrated {
  is_wild: true;
  species: string;
  level: number;
  current_hp: number;
  max_hp: number;
}

export interface BattleRoom {
  id: string;
  type: BattleType;
  status: BattleStatus;
  created_by: string;
  side_a: TrainerSideHydrated;
  side_b: TrainerSideHydrated | WildSideHydrated;
  suggested_xp: number | null;
}

export interface BattleActionResult {
  room: BattleRoom;
  damage_dealt?: number | null;
  capture_success?: boolean | null;
}
