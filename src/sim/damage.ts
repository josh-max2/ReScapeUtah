// THE single damage gate. Every hit in the game goes through here so armor,
// the frozen multiplier and Shielder auras can never be missed at a call site.
// Burn DoT bypasses this by design (DoT ignores armor).
//
// Armor is SOFT (owner call 2026-08-16): it reduces damage but never below
// ARMOR_FLOOR of the hit, so a light weapon feels inefficient against heavy
// units without ever silently doing nothing — no invisible hard counters.

import { ENEMY_TYPES, ARMOR_FLOOR } from '../defs';
import type { Game } from '../state';

function multipliers(g: Game, j: number): number {
  const e = g.enemies;
  let m = 1;
  if (e.slow[j] > 0) m *= 1.3;   // frozen targets shatter easier
  if (e.shield[j] > 0) m *= e.shield[j]; // inside a Shielder bubble
  return m;
}

/**
 * Apply one hit to enemy j. Returns the damage actually dealt.
 * threshIgnore: how much of the target's armor this weapon punches through.
 */
export function dealHit(g: Game, j: number, hit: number, threshIgnore = 0): number {
  const e = g.enemies;
  const thresh = Math.max(0, ENEMY_TYPES[e.type[j]].thresh - threshIgnore);
  const eff = Math.max(hit * ARMOR_FLOOR, hit - thresh) * multipliers(g, j);
  if (eff <= 0) return 0;
  e.hp[j] -= eff;
  return eff;
}

/** Beam damage: 'hit' is per-second; armor applies at the per-second level. */
export function dealBeam(g: Game, j: number, dps: number, dt: number, threshIgnore = 0): number {
  const e = g.enemies;
  const thresh = Math.max(0, ENEMY_TYPES[e.type[j]].thresh - threshIgnore);
  const eff = Math.max(dps * ARMOR_FLOOR, dps - thresh) * multipliers(g, j);
  if (eff <= 0) return 0;
  const dmg = eff * dt;
  e.hp[j] -= dmg;
  return dmg;
}
