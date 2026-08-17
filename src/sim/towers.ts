// Tower placement & destruction. Combat behaviors live in sim/combat.ts.
// towerGrid maps grid cell -> tower index; only WALLS change the routing
// world (mines are walked over, weapons sit on unwalkable obstacle cells).

import {
  TOWER_DEFS, TOWER_UPGRADES, TowerKind, CELL, COLS, ROWS, AIM_MODE, clamp,
} from '../defs';
import { SPAWN_X, SPAWN_Y, GOAL_X, GOAL_Y } from './terrain';
import type { Game } from '../state';
import type { MetaMods } from '../meta/upgrades';

export interface Tower {
  kind: TowerKind;
  cx: number;
  cy: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  cd: number;
  angle: number;
  charges: number;   // mines
  rechargeT: number; // mines
  heat: number;      // gatling ramp 0..1
  lockT: number;     // lattice ramp seconds
  lockX: number;     // lattice lock position (indices don't survive ticks)
  lockY: number;
  upg: 0 | 1 | 2;    // 0 = stock, 1/2 = the chosen upgrade branch
  /** Committed facing, radians. 'dir' towers fire down this lane forever. */
  aim: number;
  /** Committed ground target for 'point' towers. */
  aimX: number;
  aimY: number;
  /**
   * False while the player is still choosing the angle: an unarmed tower does
   * not fire and can be cancelled for a full refund. Everything placed through
   * code (demo prebuild, harnesses, bots) is armed immediately with the
   * default aim below, so no caller has to know about aiming.
   */
  armed: boolean;
  /** True once the player has actually swung the angle — the coach reads it. */
  aimMoved: boolean;
}

/**
 * Default aim for a freshly placed tower: down the local flow, i.e. along the
 * road the horde will actually drive. Sampling the nearest routable cell keeps
 * this sane for weapons mounted on rims, whose own cell is unwalkable.
 */
export function defaultAim(g: Game, x: number, y: number): number {
  const f = g.field;
  let bx = 0, by = 0, found = false;
  for (let ring = 1; ring <= 4 && !found; ring++) {
    for (let oy = -ring; oy <= ring && !found; oy++) {
      for (let ox = -ring; ox <= ring && !found; ox++) {
        const cx = clamp(((x / CELL) | 0) + ox, 0, COLS - 1);
        const cy = clamp(((y / CELL) | 0) + oy, 0, ROWS - 1);
        const c = cy * COLS + cx;
        if (f.walk[c] !== 1) continue;
        const dx = f.dirX[c], dy = f.dirY[c];
        if (dx === 0 && dy === 0) continue;
        bx = dx; by = dy; found = true;
      }
    }
  }
  // Nothing routable nearby: face the fort rather than an arbitrary direction.
  if (!found) return Math.atan2(GOAL_Y - y, GOAL_X - x);
  return Math.atan2(by, bx);
}

/** Resolved stats for a tower after its upgrade branch is applied. */
/**
 * Resolve a tower's live stats: base def, its one-shot upgrade branch, and the
 * meta tree on top. EVERY consumer must read stats from here — combat reading
 * raw `def.*` is how tree nodes end up silently doing nothing, which CLAUDE.md
 * flags as a repeat failure. `m` is optional only so the inspector can preview
 * a tower without a run in progress.
 */
export function towerStats(t: Tower, m?: MetaMods) {
  const def = TOWER_DEFS[t.kind];
  const opt = t.upg ? TOWER_UPGRADES[t.kind]?.[t.upg - 1] : undefined;
  const k = m ? m.kind[t.kind] : undefined;
  const gDmg = m ? m.dmgMul : 1;
  const gRate = m ? m.rateMul : 1;
  const gSplash = m ? m.splashMul : 1;
  return {
    def,
    opt,
    range: def.range * (opt?.rangeMul ?? 1) + (m ? m.rangeAdd : 0) + (k?.rangeAdd ?? 0),
    rate: def.rate * (opt?.rateMul ?? 1) * gRate * (k?.rateMul ?? 1),
    hit: def.hit * (opt?.hitMul ?? 1) * gDmg * (k?.dmgMul ?? 1),
    hitMax: (def.hitMax ?? def.hit) * (opt?.hitMul ?? 1) * (opt?.hitMaxMul ?? 1)
      * gDmg * (k?.dmgMul ?? 1) * (k?.hitMaxMul ?? 1),
    splash: (def.splash ?? 0) * (opt?.splashMul ?? 1) * gSplash * (k?.splashMul ?? 1),
    chains: opt?.chains ?? def.chains ?? 0,
    salvo: (opt?.salvo ?? def.salvo ?? 1) + (k?.salvoAdd ?? 0),
    rampTime: (def.rampTime ?? 4) * (opt?.rampMul ?? 1) * (k?.rampMul ?? 1),
    recharge: (def.rechargeS ?? 8) * (opt?.rechargeMul ?? 1),
    maxCharges: (def.charges ?? 0) + (opt?.chargesAdd ?? 0) + (k?.chargesAdd ?? 0),
    threshIgnore: (opt?.threshIgnoreAll || (m?.pierceAll && !ENERGY.has(t.kind)))
      ? 9999 : (def.threshIgnore ?? 0),
    slowS: (def.slowS ?? 0) * (opt?.slowMul ?? 1) * (k?.slowMul ?? 1),
    hitFloor: opt?.hitFloor ?? 0,
    vsArmor: opt?.vsArmor ?? 1,
    cluster: opt?.cluster ?? 1,
    shatter: opt?.shatter ?? false,
    burnS: (def.burnS ?? 4) * (opt?.burnMul ?? 1) * (k?.burnMul ?? 1),
    preSpun: opt?.preSpun ?? 0,
  };
}

/**
 * ARMOUR PIERCING is a KINETIC capstone — the Lattice is energy, and its own
 * Piercing Optics branch must stay a live decision (design bible, de-dupe rule).
 */
const ENERGY: ReadonlySet<TowerKind> = new Set(['flame', 'tesla', 'lattice']);

/** What this tower costs to build right now, meta discounts included. */
export function towerCost(g: Game, kind: TowerKind): number {
  return Math.max(1, Math.round(
    TOWER_DEFS[kind].cost * g.mods.costMul * g.mods.kind[kind].costMul));
}

export function canPlace(g: Game, cx: number, cy: number, kind: TowerKind): boolean {
  if (cx < 0 || cx >= COLS || cy < 0 || cy >= ROWS) return false;
  const c = cy * COLS + cx;
  if (g.towerGrid[c] !== -1) return false; // occupied (mines don't set blocked)
  // Keep the rift mouth and the fort clear.
  const x = cx * CELL + CELL / 2;
  const y = cy * CELL + CELL / 2;
  const sdx = x - SPAWN_X, sdy = y - SPAWN_Y;
  if (sdx * sdx + sdy * sdy < 80 * 80) return false;
  const gdx = x - GOAL_X, gdy = y - GOAL_Y;
  if (gdx * gdx + gdy * gdy < 90 * 90) return false;
  // Weapons mount ON the obstacles (rocks/forest the horde can't cross);
  // ground pieces (walls, mines) go on the open road they affect.
  const onGround = g.field.walk[c] === 1;
  return TOWER_DEFS[kind].ground ? onGround : !onGround;
}

/** Returns the new tower's index, or -1 if it could not be placed. */
export function placeTower(g: Game, kind: TowerKind, cx: number, cy: number): number {
  const def = TOWER_DEFS[kind];
  const price = towerCost(g, kind);
  if (!canPlace(g, cx, cy, kind) || g.gold < price) return -1;
  g.gold -= price;
  const c = cy * COLS + cx;
  // Plating card stacks: +50% per level (walls +100%), then meta (Rebar).
  const hp = def.hp * Math.pow(kind === 'wall' ? 2 : 1.5, g.typeMods[kind].hp)
    * g.mods.kind[kind].hpMul;
  const t: Tower = {
    kind, cx, cy,
    x: cx * CELL + CELL / 2,
    y: cy * CELL + CELL / 2,
    hp,
    maxHp: hp,
    cd: 0,
    angle: Math.PI, // face the horde
    charges: def.charges ?? 0,
    rechargeT: 0,
    heat: 0,
    lockT: 0,
    lockX: -1,
    lockY: -1,
    upg: 0,
    aim: 0,
    aimX: 0,
    aimY: 0,
    armed: true,
    aimMoved: false,
  };
  t.aim = defaultAim(g, t.x, t.y);
  // Point weapons default to a spot down-flow inside their band.
  const reach = AIM_MODE[kind] === 'point'
    ? Math.max(def.minRange ?? 0, def.range * 0.6) : def.range;
  t.aimX = t.x + Math.cos(t.aim) * reach;
  t.aimY = t.y + Math.sin(t.aim) * reach;
  g.towers.push(t);
  g.towerGrid[c] = g.towers.length - 1;
  if (kind === 'wall') {
    g.field.blocked[c] = 1;
    g.field.wallCell[c] = 1;
    g.field.compute();
  } else if (!def.ground) {
    g.field.blocked[c] = 1; // occupancy only; cell was never routable
  }
  return g.towers.length - 1;
}

/** Commit a tower to one upgrade branch. One-shot: no re-specs, no both. */
export function upgradeTower(g: Game, ti: number, branch: 1 | 2): boolean {
  const t = g.towers[ti];
  if (!t || t.upg !== 0) return false;
  const opts = TOWER_UPGRADES[t.kind];
  if (!opts) return false;
  const opt = opts[branch - 1];
  if (g.gold < opt.cost) return false;
  g.gold -= opt.cost;
  t.upg = branch;
  // Plating-style HP bump so an upgraded emplacement is visibly sturdier.
  t.maxHp *= 1.25;
  t.hp = Math.min(t.maxHp, t.hp * 1.25);
  if (opt.chargesAdd) t.charges += opt.chargesAdd;
  if (opt.preSpun) t.heat = Math.max(t.heat, opt.preSpun);
  return true;
}

/** Refund and remove a tower. Partial refund so placement still matters. */
export function sellTower(g: Game, ti: number): number {
  const t = g.towers[ti];
  if (!t) return 0;
  const def = TOWER_DEFS[t.kind];
  const opt = t.upg ? TOWER_UPGRADES[t.kind]?.[t.upg - 1] : undefined;
  const paid = towerCost(g, t.kind) + (opt?.cost ?? 0);
  const refund = Math.floor(paid * g.mods.sellMul);
  g.gold += refund;
  destroyTower(g, ti);
  return refund;
}

export function destroyTower(g: Game, ti: number): void {
  const t = g.towers[ti];
  const c = t.cy * COLS + t.cx;
  const wasWall = t.kind === 'wall';
  g.field.blocked[c] = 0;
  g.field.wallCell[c] = 0;
  g.towerGrid[c] = -1;
  g.effects.push({ kind: 'boom', x: t.x, y: t.y, r: 26, t: 0, ttl: 0.4, color: '#f87171' });
  // Swap-remove; fix the moved tower's grid entry.
  const last = g.towers.length - 1;
  if (ti !== last) {
    const moved = g.towers[last];
    g.towers[ti] = moved;
    g.towerGrid[moved.cy * COLS + moved.cx] = ti;
  }
  g.towers.pop();
  if (wasWall) g.field.compute(); // only walls affect routing
}
