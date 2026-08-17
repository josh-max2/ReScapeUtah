// The meta skill tree — a hub with four branches, bought with CHIPS between
// runs. Transcribed from `design/SKILLTREE_V2.md`, which is the owner's spec.
//
// TWO DELIBERATE DEPARTURES FROM THAT SPEC, both forced by continuous flow:
//
//  1. Wave gates became TIME gates. The spec gates deep nodes on "CLEAR W10";
//     there are no waves to clear, so gates read `save.bestTime` in seconds.
//  2. Every wave-shaped node was dropped rather than faked — Skip Ahead, Wave
//     Preview, Double or Nothing and Overtime all assume a wave you can call,
//     preview, or finish. So does the whole EMPLACEMENTS line, which existed to
//     make towers survivable against the Wrecker; that enemy is retired and
//     nothing else attacks a tower, so those nodes would have been dead weight.
//
// The bar for inclusion: a node ships only if its effect is READ somewhere in
// the sim. `scripts/tree.py` asserts that for every node — no decoration.

import { MetaMods, emptyMods } from './upgrades';

export type BranchId = 'command' | 'garage' | 'rulebook' | 'pitwall' | 'holdings';

export interface TreeNode {
  id: string;
  name: string;
  desc: string;          // player-facing; states the PER-RANK effect
  ranks: number;
  base: number;          // rank 1 price; rank n costs round(base * 1.5^(n-1))
  branch: BranchId;
  line: string;          // sub-cluster within the branch
  gate?: number;         // seconds of `bestTime` required before it can be bought
  /**
   * Priced in TOKENS instead of chips. Tokens only come from CLEARING tracks,
   * so these are earned by finishing something rather than by grinding time —
   * which is why they carry no `gate` as well: two gates on one node is
   * friction, not depth.
   */
  costTokens?: number;
  apply: (m: MetaMods, lvl: number) => void;
}

export interface Branch {
  id: BranchId;
  name: string;
  blurb: string;
}

export const BRANCHES: Branch[] = [
  { id: 'command', name: 'COMMAND', blurb: 'The hub. Universal, always open.' },
  { id: 'garage', name: 'GARAGE', blurb: 'The ten weapons.' },
  { id: 'rulebook', name: 'RULEBOOK', blurb: 'The horde and the damage rules.' },
  { id: 'pitwall', name: 'PIT WALL', blurb: 'The track, the strike, the tempo.' },
  { id: 'holdings', name: 'HOLDINGS', blurb: 'Money that makes money.' },
];

/** Gate thresholds in seconds held. STAGE_SECS is 24, so these are ~surge 8/11/13/16. */
const G = { early: 180, mid: 240, late: 300, deep: 360 };

const n = (
  id: string, name: string, desc: string, ranks: number, base: number,
  branch: BranchId, line: string, apply: TreeNode['apply'], gate?: number,
): TreeNode => ({ id, name, desc, ranks, base, branch, line, apply, gate });

/** A capstone: single rank, priced in tokens, no time gate. */
const cap = (
  id: string, name: string, desc: string, tokens: number,
  branch: BranchId, line: string, apply: TreeNode['apply'],
): TreeNode => ({
  id, name, desc, ranks: 1, base: 0, branch, line, apply, costTokens: tokens,
});

export const TREE: TreeNode[] = [
  // ---------------- COMMAND — universal, no prerequisite ----------------
  n('requisition', 'Requisition', '+40 starting gold', 6, 12, 'command', 'Universal',
    (m, l) => { m.startGold += 40 * l; }),
  n('fort', 'Reinforced Fort', '+60 fort HP', 6, 12, 'command', 'Universal',
    (m, l) => { m.baseHp += 60 * l; }),
  n('calibration', 'Calibration', '+3% damage, every tower', 5, 14, 'command', 'Universal',
    (m, l) => { m.dmgMul *= 1 + 0.03 * l; }),
  n('optics', 'Optics', '+6px range, every tower', 3, 16, 'command', 'Universal',
    (m, l) => { m.rangeAdd += 6 * l; }),

  // ---------------- GARAGE — the weapons ----------------
  n('workshop', 'Workshop Tools', '-5% tower build cost', 4, 16, 'garage', 'Root',
    (m, l) => { m.costMul *= Math.pow(0.95, l); }),

  n('acfeed', 'Autocannon Feed', 'Autocannon +6% rate of fire', 5, 10, 'garage', 'Ballistics',
    (m, l) => { m.kind.autocannon.rateMul *= 1 + 0.06 * l; }),
  n('barrel', 'Barrel Cooling', 'Gatling damage ceiling +8%', 4, 18, 'garage', 'Ballistics',
    (m, l) => { m.kind.gatling.hitMaxMul *= 1 + 0.08 * l; }),
  n('spinup', 'Spin-Up Motors', 'Gatling reaches its ceiling 15% sooner', 3, 16, 'garage', 'Ballistics',
    (m, l) => { m.kind.gatling.rampMul *= Math.pow(0.85, l); }),
  n('warhead', 'Warhead Density', 'Rocket Battery +10% damage', 4, 20, 'garage', 'Ballistics',
    (m, l) => { m.kind.rocket.dmgMul *= 1 + 0.10 * l; }),
  n('coils', 'Railgun Coils', 'Railgun +10% rate of fire', 3, 20, 'garage', 'Ballistics',
    (m, l) => { m.kind.railgun.rateMul *= 1 + 0.10 * l; }),
  cap('piercing', 'ARMOUR PIERCING', 'Kinetic towers ignore armor entirely', 2,
    'garage', 'Ballistics', (m) => { m.pierceAll = true; }),

  n('fuelmix', 'Fuel Mix', 'Flamethrower burn lasts +10% longer', 5, 12, 'garage', 'Energy',
    (m, l) => { m.kind.flame.burnMul *= 1 + 0.10 * l; }),
  n('capacitor', 'Capacitor Density', 'Tesla Coil +8% damage', 5, 16, 'garage', 'Energy',
    (m, l) => { m.kind.tesla.dmgMul *= 1 + 0.08 * l; }),
  n('focusing', 'Focusing Optics', 'Laser Lattice ramps 12% faster', 4, 20, 'garage', 'Energy',
    (m, l) => { m.kind.lattice.rampMul *= Math.pow(0.88, l); }),

  n('minedensity', 'Mine Density', '+1 Minefield charge', 4, 14, 'garage', 'Ordnance',
    (m, l) => { m.kind.mine.chargesAdd += l; }),
  n('shells', 'Shell Capacity', 'Mortar Pit +10% damage', 5, 16, 'garage', 'Ordnance',
    (m, l) => { m.kind.mortar.dmgMul *= 1 + 0.10 * l; }),
  cap('carpet', 'CARPET', 'Every Mortar volley fires a second shell', 2,
    'garage', 'Ordnance', (m) => { m.kind.mortar.salvoAdd += 1; }),

  // ---------------- RULEBOOK — the horde and the rules ----------------
  n('scrutineering', 'Scrutineering', '-3 enemy armor, globally', 3, 24, 'rulebook', 'Root',
    (m, l) => { m.threshCut += 3 * l; }),

  n('coolant', 'Coolant Volume', 'Cryo slow lasts 5% longer', 4, 14, 'rulebook', 'Damage rules',
    (m, l) => { m.kind.cryo.slowMul *= 1 + 0.05 * l; }),
  n('brittle', 'Brittle', 'Frozen targets take +5% more', 3, 18, 'rulebook', 'Damage rules',
    (m, l) => { m.frozenBonus += 0.05 * l; }),
  n('saturation', 'Saturation', '+6% blast radius on every AoE tower', 3, 20, 'rulebook', 'Damage rules',
    (m, l) => { m.splashMul *= 1 + 0.06 * l; }),
  n('immobilise', 'Immobilise', 'Slowed enemies take +8% more', 3, 26, 'rulebook', 'Damage rules',
    (m, l) => { m.immobBonus += 0.08 * l; }, G.early),

  n('bubble', 'Bubble Breaker', 'Shielder bubbles absorb 7% less', 3, 22, 'rulebook', 'Elites',
    (m, l) => { m.shieldCut += 0.07 * l; }),
  n('interdiction', 'Interdiction', 'Mender heal aura -30%', 2, 22, 'rulebook', 'Elites',
    (m, l) => { m.healCut += 0.30 * l; }),
  n('quota', 'Elite Quota', 'One fewer aura carrier per surge', 2, 60, 'rulebook', 'Elites',
    (m, l) => { m.auraCut += l; }, G.mid),

  n('coldstart', 'Cold Start', 'Enemies leave the rift at 60% speed for 2s', 3, 20, 'rulebook', 'The rift',
    (m, l) => { m.riftSlow += 2 * l; }),
  n('toll', 'Attrition Toll', '4 damage/s while still inside the rift', 3, 24, 'rulebook', 'The rift',
    (m, l) => { m.riftDps += 4 * l; }),

  cap('giantslayer', 'GIANT-SLAYER', '+40% damage to Titans and bosses', 2,
    'rulebook', 'Mass', (m) => { m.bossDmgMul *= 1.4; }),

  // ---------------- PIT WALL — track and tempo ----------------
  n('fastforward', 'Fast Forward', 'Unlock a faster speed step', 3, 10, 'pitwall', 'Root',
    (m, l) => { m.speedSteps += l; }),

  n('roadworks', 'Roadworks', 'Wall cost -4', 3, 12, 'pitwall', 'The track',
    (m, l) => { m.kind.wall.costMul *= Math.pow(0.84, l); }),
  n('rebar', 'Rebar', 'Wall HP +50% (matters once sealed)', 3, 14, 'pitwall', 'The track',
    (m, l) => { m.kind.wall.hpMul *= 1 + 0.5 * l; }),

  n('fullcourse', 'Full Course', 'Q-strike radius +15px', 3, 18, 'pitwall', 'Tempo',
    (m, l) => { m.strikeRadiusAdd += 15 * l; }),
  n('redreserve', 'Red Reserve', 'Q-strike cooldown -8%', 4, 18, 'pitwall', 'Tempo',
    (m, l) => { m.strikeCdMax *= Math.pow(0.92, l); }),
  n('secondwind', 'Second Wind', 'The Q-strike holds a second charge', 1, 110, 'pitwall', 'Tempo',
    (m) => { m.strikeCharges += 1; }, G.mid),
  n('dilation', 'Time Dilation', 'Auto-drop to 1x on a boss or under 25% fort HP', 1, 45, 'pitwall', 'Tempo',
    (m) => { m.autoSlow = true; }),

  n('pitlane', 'Pit Lane', 'Sell refund +10%', 2, 22, 'pitwall', 'Information',
    (m, l) => { m.sellMul = Math.min(0.85, m.sellMul + 0.10 * l); }),
  n('rangerings', 'Range Rings', 'Coverage rings stay up during the fight', 1, 30, 'pitwall', 'Information',
    (m) => { m.liveRings = true; }),

  // ---------------- HOLDINGS — the economy ----------------
  n('salvage', 'Salvage Yield', '+8% gold from kills', 5, 12, 'holdings', 'Root',
    (m, l) => { m.goldKillMul *= 1 + 0.08 * l; }),

  n('surgebonus', 'Surge Bonus', 'Surge bounty +12%', 4, 16, 'holdings', 'Earn',
    (m, l) => { m.bountyMul *= 1 + 0.12 * l; }),
  n('banked', 'Banked Salvage', 'Each surge pays 4% interest on unspent gold', 4, 20, 'holdings', 'Earn',
    (m, l) => { m.interest += 0.04 * l; }),
  n('titanbounty', 'Titan Bounty', 'Titans and bosses pay double gold', 1, 80, 'holdings', 'Earn',
    (m) => { m.bossGoldMul *= 2; }, G.mid),

  n('insurance', 'Insurance', 'Recover 4 gold each time a car leaks', 3, 18, 'holdings', 'Protect',
    (m, l) => { m.leakRefund += 4 * l; }),
  n('contingency', 'Contingency', 'Survive one otherwise-lethal leak per run', 1, 55, 'holdings', 'Protect',
    (m) => { m.contingency = true; }),

  n('futures', 'Futures', '+2 chips per minute held', 1, 90, 'holdings', 'Compound',
    (m) => { m.chipsPerMin += 2; }, G.mid),
  n('holdingsco', 'Holdings Co.', 'Bank 10% of unspent gold as chips at run end', 1, 150, 'holdings', 'Compound',
    (m) => { m.bankChips += 0.10; }, G.late),
  cap('principal', 'TEAM PRINCIPAL', 'Open every run with one weapon already built', 2,
    'holdings', 'Compound', (m) => { m.prebuilt = true; }),
];

export const NODE_BY_ID = new Map(TREE.map((t) => [t.id, t]));

/** Price of the NEXT rank given current level. Flat for single-rank nodes. */
export function nodeCost(node: TreeNode, lvl: number): number {
  if (node.costTokens) return node.costTokens;
  return Math.round(node.base * Math.pow(1.5, lvl));
}

/** Chips already sunk into a node — the refund basis for a respec. */
export function nodeSpent(node: TreeNode, lvl: number): number {
  if (node.costTokens) return 0; // token nodes refund tokens, not chips
  let sum = 0;
  for (let i = 0; i < lvl; i++) sum += nodeCost(node, i);
  return sum;
}

export function isGated(node: TreeNode, bestTime: number): boolean {
  return node.gate !== undefined && bestTime < node.gate;
}

/** Total chips sunk into the whole tree — what a respec hands back. */
export function treeSpent(owned: Record<string, number>): number {
  let sum = 0;
  for (const node of TREE) sum += nodeSpent(node, owned[node.id] ?? 0);
  return sum;
}

/** Tokens sunk into the tree — refunded separately by a respec. */
export function tokensSpent(owned: Record<string, number>): number {
  let sum = 0;
  for (const node of TREE) {
    if (node.costTokens && (owned[node.id] ?? 0) > 0) sum += node.costTokens;
  }
  return sum;
}

/**
 * Resolve owned ranks into the modifier bundle the run reads. Order is the
 * TREE order and every node is multiplicative or additive into its own field,
 * so purchase order can never change the result.
 */
export function computeMods(owned: Record<string, number>): MetaMods {
  const m = emptyMods();
  for (const node of TREE) {
    const lvl = owned[node.id] ?? 0;
    if (lvl > 0) node.apply(m, Math.min(lvl, node.ranks));
  }
  return m;
}
