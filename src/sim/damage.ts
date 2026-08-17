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
  const mods = g.mods;
  let m = 1;
  // Frozen targets shatter easier. Brittle ADDS to the 1.3 rather than
  // multiplying it, so ranks read as the flat percentage the node promises.
  if (e.slow[j] > 0) m *= 1.3 + mods.frozenBonus;
  if (e.shield[j] > 0) {
    // Bubble Breaker erodes the bubble toward 1 (no reduction at all).
    m *= e.shield[j] + (1 - e.shield[j]) * Math.min(1, mods.shieldCut);
  }
  // Immobilise: anything actually crawling takes more. Reads the live speed,
  // so it fires for crowd-pressure and corner braking too, not just Cryo.
  if (mods.immobBonus > 0) {
    const top = ENEMY_TYPES[e.type[j]].speed;
    if (top > 0 && e.vel[j] < top * 0.3) m *= 1 + mods.immobBonus;
  }
  // Giant-Slayer: titans (type 7) and every boss (type >= 8).
  if (mods.bossDmgMul !== 1 && e.type[j] >= 7) m *= mods.bossDmgMul;
  return m;
}

/** Armor after Scrutineering and whatever the weapon punches through. */
function armor(g: Game, j: number, threshIgnore: number): number {
  const base = ENEMY_TYPES[g.enemies.type[j]].thresh - g.mods.threshCut;
  return Math.max(0, base - threshIgnore);
}

/**
 * Apply one hit to enemy j. Returns the damage actually dealt.
 * threshIgnore: how much of the target's armor this weapon punches through.
 */
export function dealHit(g: Game, j: number, hit: number, threshIgnore = 0): number {
  const e = g.enemies;
  const thresh = armor(g, j, threshIgnore);
  const eff = Math.max(hit * ARMOR_FLOOR, hit - thresh) * multipliers(g, j);
  if (eff <= 0) return 0;
  e.hp[j] -= eff;
  return eff;
}

/** Beam damage: 'hit' is per-second; armor applies at the per-second level. */
export function dealBeam(g: Game, j: number, dps: number, dt: number, threshIgnore = 0): number {
  const e = g.enemies;
  const thresh = armor(g, j, threshIgnore);
  const eff = Math.max(dps * ARMOR_FLOOR, dps - thresh) * multipliers(g, j);
  if (eff <= 0) return 0;
  const dmg = eff * dt;
  e.hp[j] -= dmg;
  return dmg;
}
