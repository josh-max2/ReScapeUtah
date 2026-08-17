// Meta modifier SHAPE. The nodes that fill it live in `tree.ts`; this file is
// types plus a zeroed baseline, so `tree.ts` can import the shape without a
// circular dependency back through the node data.
//
// Every field here must be READ somewhere in the sim. A modifier nothing
// consumes is a tree node that silently does nothing, which is the specific
// failure this project has hit before (see the towerStats note in CLAUDE.md).
// `scripts/tree.py` asserts each one moves a real number.

import { TOWER_KINDS, TowerKind } from '../defs';

/** Per-weapon modifiers. Applied in `towerStats`, never read as raw `def.*`. */
export interface KindMods {
  dmgMul: number;
  rateMul: number;
  rangeAdd: number;
  hitMaxMul: number;   // gatling / lattice ramp ceiling
  rampMul: number;     // <1 = reaches the ceiling sooner
  chargesAdd: number;  // minefield
  burnMul: number;     // flame DoT duration
  slowMul: number;     // cryo
  splashMul: number;
  salvoAdd: number;    // extra projectiles per volley
  hpMul: number;       // walls, mainly
  costMul: number;
}

export interface MetaMods {
  // --- global ---
  dmgMul: number;
  rateMul: number;
  rangeAdd: number;
  baseHp: number;
  startGold: number;
  costMul: number;
  sellMul: number;
  cannon: boolean;
  laser: boolean;

  // --- the Q-strike ---
  strikeCdMax: number;
  strikeRadiusAdd: number;
  strikeCharges: number;

  // --- economy ---
  goldKillMul: number;
  bountyMul: number;
  interest: number;     // fraction of unspent gold paid per surge
  leakRefund: number;   // gold back per leaked car
  bossGoldMul: number;
  chipsPerMin: number;  // chips per minute held, paid at run end
  bankChips: number;    // fraction of unspent gold converted to chips at run end

  // --- damage rules ---
  threshCut: number;    // flat reduction of every enemy's armor Threshold
  frozenBonus: number;  // ADDED to the frozen x1.3
  splashMul: number;
  slowMul: number;
  immobBonus: number;   // extra damage to enemies under 30% speed
  bossDmgMul: number;
  pierceAll: boolean;   // kinetic weapons ignore Threshold

  // --- the horde ---
  shieldCut: number;    // shielder bubble absorbs this much less
  healCut: number;      // mender aura strength cut
  auraCut: number;      // fewer aura carriers per surge
  riftSlow: number;     // seconds held at 60% speed leaving the rift
  riftDps: number;      // damage per second while still inside the rift band

  // --- run rules ---
  speedSteps: number;   // extra speed steps unlocked past 10x
  contingency: boolean; // survive one otherwise-lethal leak at 1 HP
  prebuilt: boolean;    // open with one weapon already placed
  liveRings: boolean;   // coverage rings stay up during combat
  autoSlow: boolean;    // drop to 1x on a boss or under 25% fort HP

  kind: Record<TowerKind, KindMods>;
}

function zeroKind(): KindMods {
  return {
    dmgMul: 1, rateMul: 1, rangeAdd: 0, hitMaxMul: 1, rampMul: 1,
    chargesAdd: 0, burnMul: 1, slowMul: 1, splashMul: 1, salvoAdd: 0,
    hpMul: 1, costMul: 1,
  };
}

/** A run with an empty tree. Every node's effect is measured against this. */
export function emptyMods(): MetaMods {
  const kind = {} as Record<TowerKind, KindMods>;
  for (const k of TOWER_KINDS) kind[k] = zeroKind();
  return {
    dmgMul: 1, rateMul: 1, rangeAdd: 0, baseHp: 400, startGold: 350,
    costMul: 1, sellMul: 0.6, cannon: true, laser: true,
    strikeCdMax: 30, strikeRadiusAdd: 0, strikeCharges: 1,
    goldKillMul: 1, bountyMul: 1, interest: 0, leakRefund: 0,
    bossGoldMul: 1, chipsPerMin: 0, bankChips: 0,
    threshCut: 0, frozenBonus: 0, splashMul: 1, slowMul: 1,
    immobBonus: 0, bossDmgMul: 1, pierceAll: false,
    shieldCut: 0, healCut: 0, auraCut: 0, riftSlow: 0, riftDps: 0,
    speedSteps: 0, contingency: false, prebuilt: false,
    liveRings: false, autoSlow: false,
    kind,
  };
}
