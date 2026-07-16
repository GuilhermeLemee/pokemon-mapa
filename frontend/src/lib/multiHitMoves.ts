export const MULTI_HIT_MOVES = new Set([
  "double-slap",
  "comet-punch",
  "fury-attack",
  "metal-claw",
  "fury-swipes",
  "icicle-spear",
  "bullet-seed",
  "rock-blast",
  "scale-shot",
  "barrage",
  "pin-missile",
  "water-shuriken",
  "double-kick",
  "triple-kick",
  "surging-strikes",
  "triple-axel",
  "population-bomb",
]);

export function isMultiHitMove(moveSlug: string): boolean {
  return MULTI_HIT_MOVES.has(moveSlug.trim().toLowerCase());
}
