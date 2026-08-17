// Core constants + data definitions. Pure data, no logic — safe to import anywhere.

export const CELL = 20;            // px per grid cell
export const COLS = 90;
export const ROWS = 51;
export const W = COLS * CELL;      // 1200
export const H = ROWS * CELL;      // 680
export const SPAWN_COLS = 2;       // enemies spawn inside the left band
export const BASE_COLS = 2;        // base occupies the right band
export const BASE_LINE_X = (COLS - BASE_COLS) * CELL;
export const DT = 1 / 60;          // fixed sim timestep (s)
export const MAX_ENEMIES = 20000;
export const WAVES_PER_RUN = 20;

export const clamp = (v: number, a: number, b: number): number =>
  v < a ? a : v > b ? b : v;

/**
 * Deck layer master switch (owner call 2026-08-16: the hand and the post-wave
 * draft took more than they gave). OFF hides the hand UI, stops all draws, and
 * stops the every-3rd-wave draft. The card SYSTEMS stay wired — typeMods just
 * sit at zero — so combat code is untouched and flipping this back on restores
 * everything. Do not delete sim/cards.ts or ui/hand.ts.
 */
export const CARDS_ENABLED = false;

// The horde lane: enemies spawn inside this band; grass verges lie outside it.
export const PATH_TOP = 120;
export const PATH_BOT = 560;

// Design tokens — see design/template.html (the visual contract).
export const PAL = {
  soil: '#8f7350', soilWorn: '#a08059', soilEdge: '#5d4936',
  verge: '#77803d', thicket: '#3a4a1c', thicket2: '#46561f',
  steel: '#4a5261', steelHi: '#707a8c', steelDark: '#343b47',
  fire: '#ffd977', fireHot: '#fff3c4',
  oil: '#14171e', oilSheen: '#3a4456', rubber: '#1c1c20',
  health: '#d43d2e', cyan: '#79d6d0', panelInk: '#efe9df',
} as const;

// ---------- Enemies ----------

/**
 * Enemy ability — the ONE thing this type does to change how the HORDE
 * behaves. Design rule (owner, 2026-08-16): players never target individual
 * units at horde scale, so variety must be visible mass behaviour, not stat
 * sheets. One idea per type, explainable in a sentence.
 */
export type EnemyAbility =
  | 'none'    // plain mass
  | 'split'   // bursts into swarmers on death — the mass multiplies
  | 'shield'  // aura: units inside take reduced damage
  | 'heal'    // aura: units inside regenerate
  | 'wreck'   // RETIRED — see WRECKER below; no live enemy uses this
  | 'surge'   // periodic speed bursts — outruns the kill zone
  // --- boss abilities: one big legible threat, one idea each ---
  | 'drop'    // periodically unloads fresh units from its ramp
  | 'protect' // while it lives, the whole horde takes far less damage
  | 'shed';   // sheds a burst of units every chunk of HP it loses

export interface EnemyDef {
  name: string;
  hp: number;       // base hp before wave scaling
  speed: number;    // top speed, px/s
  accel: number;    // px/s^2 toward top speed (braking is 2x this)
  turn: number;     // steering rate, rad/s at low speed — the "traction"
  r: number;        // radius (px)
  thresh: number;   // armor: flat damage reduction, floored at ARMOR_FLOOR
  dps: number;      // damage/s vs towers when breaching
  leak: number;     // damage to base on leak
  gold: number;     // in-run gold per kill
  cores: number;    // meta currency per kill
  cost: number;     // wave-budget cost
  color: string;
  nose: string;     // front-marker tint (car "hood")
  ability: EnemyAbility;
  auraR?: number;   // shield/heal radius (px)
  auraAmt?: number; // shield: damage multiplier inside Ã‚· heal: hp/s
  splitInto?: number; // split: which type index spawns
  splitCount?: number;
  boss?: boolean;     // gets a name banner + health bar, never wave-scaled down
  title?: string;     // display name for the boss bar
  blurb?: string;     // one-line threat description shown on arrival
  dropEvery?: number; // 'drop': seconds between unloads
  dropCount?: number;
  shedAt?: number;    // 'shed': fraction of max HP between bursts
}

/** Armor never zeroes a weapon — at worst it lands this fraction of its hit. */
export const ARMOR_FLOOR = 0.25;

// Seven archetypes, each ONE readable idea. Indices are referenced by
// splitInto and by the spawner — keep SWARMER at 0.
export const SWARMER = 0, RUNNER = 1, HAULER = 2, SPLITTER = 3,
  SHIELDER = 4, MENDER = 5, WRECKER = 6, TITAN = 7,
  BOSS_RIG = 8, BOSS_MARSHAL = 9, BOSS_SCRAPHEAP = 10;

/** The boss pool — one arrives per run. Rotating them is the variety hook. */
export const BOSS_TYPES = [BOSS_RIG, BOSS_MARSHAL, BOSS_SCRAPHEAP];

export const ENEMY_TYPES: EnemyDef[] = [
  // 0 SWARMER — the baseline flood: tiny, quick, dies to anything, arrives in
  // enormous numbers. Everything else is measured against this.
  { name: 'swarmer', hp: 4, speed: 58, accel: 95, turn: 3.4, r: 3.6, thresh: 0,
    dps: 5, leak: 1, gold: 0.8, cores: 0.2, cost: 1,
    color: '#3a6d26', nose: '#7fb35a', ability: 'none' },
  // 1 RUNNER — thin and very fast, with speed bursts; sprints clear of the
  // front line to test how DEEP your defence is, not how strong its face is.
  { name: 'runner', hp: 6, speed: 104, accel: 165, turn: 2.0, r: 3.2, thresh: 0,
    dps: 4, leak: 1, gold: 1.2, cores: 0.25, cost: 1.6,
    color: '#86a03c', nose: '#e8f2b0', ability: 'surge' },
  // 2 HAULER — big, slow, armoured. Soaks fire and shelters the mass behind it.
  { name: 'hauler', hp: 120, speed: 34, accel: 40, turn: 1.5, r: 7, thresh: 9,
    dps: 16, leak: 6, gold: 4.5, cores: 0.9, cost: 6,
    color: '#2f5a1d', nose: '#5e8f43', ability: 'none' },
  // 3 SPLITTER — bursts into four swarmers on death. Kill it without area
  // coverage and the mass VISIBLY multiplies in front of you.
  { name: 'splitter', hp: 46, speed: 44, accel: 55, turn: 1.9, r: 5.6, thresh: 2,
    dps: 9, leak: 3, gold: 3, cores: 0.6, cost: 4,
    color: '#7a8f2a', nose: '#d4e86a', ability: 'split',
    splitInto: 0, splitCount: 4 },
  // 4 SHIELDER — projects a bubble; everything inside takes far less damage.
  // Pop it and the surrounding mass melts. AoE finds it without targeting.
  { name: 'shielder', hp: 90, speed: 40, accel: 48, turn: 1.7, r: 6.4, thresh: 4,
    dps: 10, leak: 4, gold: 6, cores: 1.3, cost: 7,
    color: '#2a6b7a', nose: '#8fd8e8', ability: 'shield',
    auraR: 78, auraAmt: 0.42 },
  // 5 MENDER — heal aura; the horde shrugs off chip damage and demands burst.
  { name: 'mender', hp: 80, speed: 42, accel: 50, turn: 1.8, r: 6, thresh: 3,
    dps: 8, leak: 4, gold: 6, cores: 1.3, cost: 7,
    color: '#7a2a5e', nose: '#e89fd0', ability: 'heal',
    auraR: 84, auraAmt: 7 },
  // 6 WRECKER — RETIRED 2026-08-17 (owner call: "they just get stuck").
  // It steered straight at the nearest tower, but weapon towers mount on
  // UNWALKABLE rim cells, so the wrecker drove into the wall beside its target
  // and pressed there. No amount of frustration-fallback tuning fixed the root
  // cause: the thing it wants to reach is somewhere it cannot stand.
  // The slot is kept so TITAN and the bosses do not renumber (literal type
  // indices are used throughout the harnesses). Nothing spawns it: it is in no
  // wave mix and the 'wreck' steering branch is gone.
  { name: 'wrecker', hp: 150, speed: 46, accel: 60, turn: 1.6, r: 6.8, thresh: 6,
    dps: 46, leak: 2, gold: 7, cores: 1.6, cost: 9,
    color: '#8a3a1c', nose: '#e0864a', ability: 'wreck' },
  // 7 TITAN — the rare anchor; every 5th wave.
  { name: 'titan', hp: 1800, speed: 26, accel: 26, turn: 1.0, r: 11, thresh: 22,
    dps: 55, leak: 30, gold: 45, cores: 8, cost: 40,
    color: '#d9a441', nose: '#f2dfa8', ability: 'none' },

  // ---- BOSSES (index 8+). One big legible threat, one idea each. ----
  // 8 THE RIG — never really fights you; it unloads a fresh column every few
  // seconds. Kill it fast or drown in what it delivers.
  { name: 'rig', hp: 7000, speed: 20, accel: 18, turn: 0.7, r: 20, thresh: 30,
    dps: 60, leak: 40, gold: 90, cores: 40, cost: 0,
    color: '#7a4a1c', nose: '#e0a24a', ability: 'drop',
    boss: true, title: 'THE RIG', blurb: 'Unloads reinforcements — kill it fast',
    dropEvery: 2.6, dropCount: 5 },
  // 9 THE MARSHAL — while it lives the whole field is protected. You cannot
  // grind the wave down; you have to go through the boss.
  { name: 'marshal', hp: 9000, speed: 24, accel: 22, turn: 0.9, r: 19, thresh: 34,
    dps: 70, leak: 45, gold: 110, cores: 50, cost: 0,
    color: '#2a5a7a', nose: '#9fd8f0', ability: 'protect',
    boss: true, title: 'THE MARSHAL', blurb: 'Shields the entire horde — break it first',
    auraAmt: 0.3 },
  // 10 SCRAPHEAP — sheds a burst of wreckage every chunk of HP it loses, so
  // burning it down fast floods you and going slow lets the wave through.
  { name: 'scrapheap', hp: 6500, speed: 22, accel: 20, turn: 0.8, r: 21, thresh: 24,
    dps: 60, leak: 40, gold: 95, cores: 45, cost: 0,
    color: '#5a5a3a', nose: '#c9c26a', ability: 'shed',
    boss: true, title: 'SCRAPHEAP', blurb: 'Sheds wreckage as it breaks apart',
    shedAt: 0.12, dropCount: 7 },
];

// Per-car size buckets (visual + collision variance within a type).
export const SIZE_MULS = [0.85, 1, 1.2] as const;

// ---------- Towers ----------

export type TowerKind =
  | 'autocannon' | 'flame' | 'mortar' | 'cryo' | 'tesla' | 'gatling'
  | 'rocket' | 'railgun' | 'lattice' | 'mine' | 'wall';

export interface TowerDef {
  name: string;
  cost: number;
  hp: number;
  range: number;       // px (spec tiles x20)
  rate: number;        // shots/s (0 = continuous beam or passive)
  hit: number;         // damage per hit (per second for beams)
  color: string;
  hotkey: string;
  desc: string;
  ground?: boolean;    // places on open ground (mine, wall) instead of obstacles
  splash?: number;     // AoE radius px
  minRange?: number;   // can't hit closer than this (mortar)
  coneDeg?: number;    // cone weapons (flamethrower)
  chains?: number;     // tesla chain count
  chainFalloff?: number;
  salvo?: number;      // rockets per volley
  hitMax?: number;     // ramp weapons: hit at full ramp
  rampTime?: number;   // seconds to full ramp
  charges?: number;    // mine charges
  rechargeS?: number;  // mine recharge seconds
  beam?: 'pierce' | 'lock';
  threshIgnore?: number;
  stunS?: number;
  slowS?: number;
  burnS?: number;
}

export const TOWER_DEFS: Record<TowerKind, TowerDef> = {
  autocannon: { name: 'Autocannon',  cost: 40,  hp: 80,  range: 100, rate: 3.33, hit: 8,   color: '#9aa5b8', hotkey: '1', desc: 'Workhorse volume fire — bounces off armor' },
  flame:      { name: 'Flamethrower', cost: 60, hp: 90,  range: 90,  rate: 3,    hit: 5,   coneDeg: 90, burnS: 4, color: '#d9642e', hotkey: '2', desc: 'Short cone; sets the horde Burning (DoT ignores armor)' },
  mortar:     { name: 'Mortar Pit',  cost: 85,  hp: 100, range: 280, rate: 0.5,  hit: 60,  splash: 50, minRange: 80, color: '#c8825a', hotkey: '3', desc: 'Indirect AoE; blind up close, shells lead & can miss' },
  cryo:       { name: 'Cryo Sprayer', cost: 70, hp: 90,  range: 100, rate: 2,    hit: 4,   splash: 100, slowS: 3, color: '#79d6d0', hotkey: '4', desc: 'Freezes everything near: -40% speed, +30% damage taken' },
  tesla:      { name: 'Tesla Coil',  cost: 100, hp: 100, range: 120, rate: 0.8,  hit: 45,  chains: 4, chainFalloff: 0.7, stunS: 0.5, color: '#7fd0e8', hotkey: '5', desc: 'Chain lightning, cannot miss; stutters the primary target' },
  gatling:    { name: 'Gatling Nest', cost: 110, hp: 110, range: 120, rate: 4,   hit: 5,   hitMax: 22, rampTime: 4, color: '#b0a08a', hotkey: '6', desc: 'Spin-up sustained fire; resets when it loses its target' },
  rocket:     { name: 'Rocket Battery', cost: 125, hp: 110, range: 200, rate: 0.2, hit: 55, salvo: 4, color: '#d98a8a', hotkey: '7', desc: 'Homing salvo at the 4 beefiest targets; overkills small fry' },
  railgun:    { name: 'Railgun',     cost: 130, hp: 110, range: 240, rate: 0.2,  hit: 200, beam: 'pierce', color: '#8fb7c9', hotkey: '8', desc: 'Slow, brutal, pierces everything in a line — the armor answer' },
  lattice:    { name: 'Laser Lattice', cost: 150, hp: 100, range: 180, rate: 0,  hit: 25,  hitMax: 120, rampTime: 6, beam: 'lock', threshIgnore: 15, color: '#b9a6d8', hotkey: '9', desc: 'Single-target execution beam, ramps while locked' },
  mine:       { name: 'Minefield',   cost: 45,  hp: 60,  range: 30,  rate: 0,    hit: 90,  splash: 30, charges: 6, rechargeS: 8, ground: true, color: '#c9a13b', hotkey: '0', desc: 'Placed ON the road; 6 contact charges, slow recharge' },
  // Effectively indestructible while any open route to the fort exists —
  // sealing the track makes the horde chew through (see flowfield wall cost).
  wall:       { name: 'Wall',        cost: 25,  hp: 1200, range: 0,  rate: 0,    hit: 0,   ground: true, color: '#8a93a5', hotkey: 'W', desc: 'Blocks the road; horde breaks it only if fully sealed' },
};

/**
 * How a tower is aimed (owner-directed 2026-08-16). Towers do NOT acquire
 * their own targets any more — the player commits a facing or a target area
 * at placement time and the tower holds it. Angling the line IS the strategy.
 *   dir   - fires down a fixed lane; whatever walks into the lane gets hit
 *   point - services a fixed ground area within range
 *   none  - no aim (walls, mines)
 * Chain/splash physics still use proximity: the ban is on a tower CHOOSING
 * whom to shoot, not on a tesla arc finding its next hop.
 */
export type AimMode = 'dir' | 'point' | 'none';

export const AIM_MODE: Record<TowerKind, AimMode> = {
  autocannon: 'dir',
  flame: 'dir',
  gatling: 'dir',
  railgun: 'dir',
  lattice: 'dir',
  mortar: 'point',
  cryo: 'point',
  tesla: 'point',
  rocket: 'point',
  mine: 'none',
  wall: 'none',
};

/** Half-width of a directional tower's firing lane, px. */
export const LANE_HALF = 26;

export const TOWER_KINDS: TowerKind[] = [
  'autocannon', 'flame', 'mortar', 'cryo', 'tesla', 'gatling',
  'rocket', 'railgun', 'lattice', 'mine', 'wall',
];

/**
 * Per-tower upgrade BRANCH (owner spec). Each weapon offers two mutually
 * exclusive options — you commit, you don't buy both. Fields listed here
 * override the TowerDef; `tag` drives the visual change (Isaac rule: every
 * upgrade must be visible on the tower).
 */
export interface UpgradeOpt {
  name: string;
  desc: string;
  cost: number;
  tag: string;                 // art hook
  rateMul?: number;
  hitMul?: number;
  rangeMul?: number;
  splashMul?: number;
  chains?: number;
  salvo?: number;
  rampMul?: number;            // ramp time multiplier (lower = faster)
  hitMaxMul?: number;
  hitFloor?: number;           // gatling: minimum per-shot hit
  rechargeMul?: number;
  chargesAdd?: number;
  threshIgnoreAll?: boolean;
  burnMul?: number;            // napalm: burn duration multiplier
  shatter?: boolean;           // frozen kills detonate
  cluster?: number;            // mortar: N smaller impacts
  slowMul?: number;            // cryo: stronger slow
  vsArmor?: number;            // bonus multiplier against armored targets
  preSpun?: number;            // gatling: starting heat 0..1
}

export const TOWER_UPGRADES: Partial<Record<TowerKind, [UpgradeOpt, UpgradeOpt]>> = {
  autocannon: [
    { name: 'Twin-Linked', desc: 'Doubles rate of fire', cost: 45, tag: 'twin', rateMul: 2 },
    { name: 'Long Barrel', desc: '+60% range, +50% damage', cost: 45, tag: 'long', rangeMul: 1.6, hitMul: 1.5 },
  ],
  flame: [
    { name: 'Napalm', desc: 'Fire clings — burn lasts 3x longer', cost: 65, tag: 'napalm', burnMul: 3 },
    { name: 'Pressure Feed', desc: '+70% cone reach', cost: 65, tag: 'pressure', rangeMul: 1.7 },
  ],
  mortar: [
    { name: 'Cluster Shell', desc: 'Three smaller impacts instead of one', cost: 90, tag: 'cluster', cluster: 3, hitMul: 0.5 },
    { name: 'Heavy Ordnance', desc: '+85% damage, +40% blast radius', cost: 90, tag: 'heavy', hitMul: 1.85, splashMul: 1.4 },
  ],
  cryo: [
    { name: 'Deep Freeze', desc: 'Much stronger slow', cost: 75, tag: 'deep', slowMul: 1.5 },
    { name: 'Shatter', desc: 'Frozen kills detonate for area damage', cost: 75, tag: 'shatter', shatter: true },
  ],
  tesla: [
    { name: 'Arc Extender', desc: 'Chains to 7 targets', cost: 105, tag: 'arc', chains: 7 },
    { name: 'Overload', desc: '+80% damage, chains only 2', cost: 105, tag: 'overload', hitMul: 1.8, chains: 2 },
  ],
  gatling: [
    { name: 'Pre-Spun', desc: 'Starts at half spin-up', cost: 115, tag: 'prespun', preSpun: 0.5 },
    { name: 'Depleted Rounds', desc: 'Heavy minimum damage — bites armor', cost: 115, tag: 'depleted', hitFloor: 16 },
  ],
  rocket: [
    { name: 'Swarm Pod', desc: '8 smaller rockets per salvo', cost: 130, tag: 'swarm', salvo: 8, hitMul: 0.55 },
    { name: 'Bunker Buster', desc: '2 heavy rockets, double vs armor', cost: 130, tag: 'buster', salvo: 2, hitMul: 2, vsArmor: 2 },
  ],
  railgun: [
    { name: 'Overcharge', desc: '+70% damage, slower cycle', cost: 135, tag: 'overcharge', hitMul: 1.7, rateMul: 0.7 },
    { name: 'Capacitor Bank', desc: '+45% rate of fire', cost: 135, tag: 'capacitor', rateMul: 1.45 },
  ],
  lattice: [
    { name: 'Focusing Array', desc: 'Reaches full power in a third of the time', cost: 155, tag: 'focus', rampMul: 0.34 },
    { name: 'Piercing Optics', desc: 'Ignores armor entirely', cost: 155, tag: 'pierce', threshIgnoreAll: true },
  ],
  mine: [
    { name: 'Shaped Charge', desc: 'Double damage, tighter blast', cost: 50, tag: 'shaped', hitMul: 2, splashMul: 0.55 },
    { name: 'Rapid Deploy', desc: 'Recharges twice as fast, +3 charges', cost: 50, tag: 'rapid', rechargeMul: 0.5, chargesAdd: 3 },
  ],
};

// ---------- Ability ----------

export const STRIKE_DMG = 500;
export const STRIKE_RADIUS = 70;
