// All tower combat behaviors. Every point of damage flows through sim/damage
// (armor Threshold + frozen multiplier); burn DoT is applied via status only.

import {
  TOWER_DEFS, ENEMY_TYPES, SIZE_MULS, CELL, COLS, ROWS, clamp, AIM_MODE, LANE_HALF,
} from '../defs';
import type { Game } from '../state';
import { dealHit, dealBeam } from './damage';
import { destroyTower, towerStats, Tower } from './towers';

function distSeg2(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const abx = bx - ax, aby = by - ay;
  const t = clamp(((px - ax) * abx + (py - ay) * aby) / (abx * abx + aby * aby || 1), 0, 1);
  const dx = px - (ax + abx * t);
  const dy = py - (ay + aby * t);
  return dx * dx + dy * dy;
}

/**
 * First living enemy inside a tower's fixed firing lane — the one a bullet
 * fired down `t.aim` would meet first. Towers no longer pick whom to shoot;
 * they hold a line and hit whatever walks into it.
 */
function findInLane(g: Game, t: Tower, range: number, minR = 0): number {
  const e = g.enemies;
  const dx = Math.cos(t.aim), dy = Math.sin(t.aim);
  let best = -1;
  let bestAlong = Infinity;
  g.hash.query(t.x + dx * range * 0.5, t.y + dy * range * 0.5,
    range * 0.5 + LANE_HALF + 12, (j) => {
      if (e.hp[j] <= 0) return;
      const rx = e.x[j] - t.x, ry = e.y[j] - t.y;
      const along = rx * dx + ry * dy;             // distance down the lane
      if (along < minR || along > range) return;
      const perp = Math.abs(rx * dy - ry * dx);    // offset from the centreline
      if (perp > LANE_HALF) return;
      if (along < bestAlong) { bestAlong = along; best = j; }
    });
  return best;
}

/**
 * First living enemy inside a cone weapon's committed wedge. Cone weapons must
 * gate on their own footprint, not on the narrow lane the projectile weapons
 * use — see the flame case for what mismatching those two costs.
 */
function firstInCone(g: Game, t: Tower, range: number, half: number): number {
  const e = g.enemies;
  const r2 = range * range;
  let best = -1;
  g.hash.query(t.x, t.y, range + 8, (k) => {
    if (best >= 0 || e.hp[k] <= 0) return;
    const dx = e.x[k] - t.x, dy = e.y[k] - t.y;
    if (dx * dx + dy * dy > r2) return;
    let da = Math.atan2(dy, dx) - t.aim;
    if (da > Math.PI) da -= Math.PI * 2;
    else if (da < -Math.PI) da += Math.PI * 2;
    if (da >= -half && da <= half) best = k;
  });
  return best;
}

/** A point tower's committed ground target, clamped into its usable band. */
function aimPoint(t: Tower, range: number, minR: number): { x: number; y: number } {
  const dx = t.aimX - t.x, dy = t.aimY - t.y;
  const d = Math.hypot(dx, dy) || 1;
  const cl = clamp(d, minR, range);
  return { x: t.x + (dx / d) * cl, y: t.y + (dy / d) * cl };
}

/**
 * Nearest living enemy to a point. Used to decide whether a point weapon has
 * anything worth servicing, and for chain/splash hops — the ban is on a tower
 * CHOOSING its target, not on an arc finding its next link.
 */
function nearestTo(g: Game, x: number, y: number, r: number): number {
  const e = g.enemies;
  let best = -1;
  let bd = r * r;
  g.hash.query(x, y, r, (j) => {
    if (e.hp[j] <= 0) return;
    const dx = e.x[j] - x, dy = e.y[j] - y;
    const d2 = dx * dx + dy * dy;
    if (d2 < bd) { bd = d2; best = j; }
  });
  return best;
}

/** Lowest-flow-cost (furthest along) living enemy within [minR, maxR] of (x,y). */
function findTarget(g: Game, x: number, y: number, maxR: number, minR = 0): number {
  const e = g.enemies;
  let best = -1;
  let bestCost = Infinity;
  const r2 = maxR * maxR;
  const m2 = minR * minR;
  g.hash.query(x, y, maxR + 10, (j) => {
    if (e.hp[j] <= 0) return;
    const dx = e.x[j] - x, dy = e.y[j] - y;
    const d2 = dx * dx + dy * dy;
    if (d2 > r2 || d2 < m2) return;
    const cx = clamp((e.x[j] / CELL) | 0, 0, COLS - 1);
    const cy = clamp((e.y[j] / CELL) | 0, 0, ROWS - 1);
    const fc = g.field.cost[cy * COLS + cx];
    if (fc < bestCost) {
      bestCost = fc;
      best = j;
    }
  });
  return best;
}

function fx(g: Game, kind: 'tracer' | 'boom' | 'flash' | 'smoke' | 'arc' | 'rail' | 'shock',
  x: number, y: number, o: { x2?: number; y2?: number; r?: number; ttl?: number; color?: string } = {}): void {
  if (g.effects.length > 500) return;
  g.effects.push({ kind, x, y, x2: o.x2, y2: o.y2, r: o.r, t: 0, ttl: o.ttl ?? 0.3, color: o.color ?? '#ffd977' });
}

/**
 * Shockwave: shove everything in radius directly away from the blast.
 * Heavier cars resist — mass is the size bucket plus the archetype's radius,
 * so a swarmer gets thrown and a titan barely rocks. The impulse is queued on
 * the enemy and consumed by the movement integrator, never written to x/y
 * here: a direct position write would skip wall repel and punch cars through
 * thin barriers into the off-track pockets that strand them.
 */
export function shove(g: Game, x: number, y: number, r: number, power: number): void {
  const e = g.enemies;
  const r2 = r * r;
  g.hash.query(x, y, r, (j) => {
    if (e.hp[j] <= 0) return;
    const dx = e.x[j] - x, dy = e.y[j] - y;
    const d2 = dx * dx + dy * dy;
    if (d2 > r2) return;
    const d = Math.sqrt(d2) || 0.001;
    // Full strength at the centre, nothing at the rim.
    const falloff = 1 - d / r;
    const mass = ENEMY_TYPES[e.type[j]].r * SIZE_MULS[e.size[j]];
    const push = (power * falloff) / Math.max(2.2, mass * 0.55);
    e.impX[j] += (dx / d) * push;
    e.impY[j] += (dy / d) * push;
  });
}

function aoe(g: Game, x: number, y: number, r: number, hit: number, burn = 0, slow = 0): void {
  const e = g.enemies;
  const r2 = r * r;
  g.hash.query(x, y, r, (j) => {
    if (e.hp[j] <= 0) return;
    const dx = e.x[j] - x, dy = e.y[j] - y;
    if (dx * dx + dy * dy > r2) return;
    dealHit(g, j, hit);
    if (burn > 0) e.burn[j] = burn;
    if (slow > 0) e.slow[j] = slow;
  });
}

export function updateTowers(g: Game, dt: number): void {
  g.beams.length = 0;
  const e = g.enemies;

  // Mortar shells land.
  for (let i = g.impacts.length - 1; i >= 0; i--) {
    const im = g.impacts[i];
    im.t -= dt;
    if (im.t > 0) continue;
    aoe(g, im.x, im.y, im.r, im.hit);
    shove(g, im.x, im.y, im.r * 1.7, 340);
    fx(g, 'shock', im.x, im.y, { r: im.r * 1.7, ttl: 0.34 });
    fx(g, 'boom', im.x, im.y, { r: im.r, ttl: 0.4 });
    fx(g, 'smoke', im.x, im.y, { r: 16, ttl: 1 , color: '#c9c2b8' });
    g.impacts[i] = g.impacts[g.impacts.length - 1];
    g.impacts.pop();
  }

  for (let ti = g.towers.length - 1; ti >= 0; ti--) {
    const t = g.towers[ti];
    if (t.hp <= 0) {
      destroyTower(g, ti);
      continue;
    }
    if (t.kind === 'wall') continue;
    // Still being aimed by the player: placed, but not yet a weapon.
    if (!t.armed) continue;
    const def = TOWER_DEFS[t.kind];
    // Upgrade branch AND the meta tree resolve here. Note hitMul/rateMul no
    // longer carry g.mods — towerStats owns that now, and applying it in both
    // places would square every global damage node.
    const S = towerStats(t, g.mods);
    const tm = g.typeMods[t.kind];
    const hitMul = Math.pow(1.4, tm.dmg);
    const rateMul = Math.pow(1.35, tm.rate);
    const splashMul = Math.pow(1.3, tm.splash);

    if (t.kind === 'mine') {
      if (t.charges < (S.maxCharges)) {
        t.rechargeT -= dt;
        if (t.rechargeT <= 0) {
          t.charges++;
          t.rechargeT = S.recharge;
        }
      }
      if (t.charges > 0) {
        const j = findTarget(g, t.x, t.y, S.range);
        if (j >= 0) {
          t.charges--;
          if (t.rechargeT <= 0) t.rechargeT = S.recharge;
          aoe(g, t.x, t.y, (S.splash) * splashMul, S.hit * hitMul, tm.fire ? 4 : 0, tm.cryo ? 1.5 : 0);
          // Mines throw hardest — a charge under the floor lifts the pack.
          shove(g, t.x, t.y, S.splash * splashMul * 2.4, 470);
          fx(g, 'shock', t.x, t.y, { r: S.splash * splashMul * 2.4, ttl: 0.3 });
          fx(g, 'boom', t.x, t.y, { r: S.splash, ttl: 0.35 });
          fx(g, 'flash', t.x, t.y, { r: 26, ttl: 0.15 });
        }
      }
      continue;
    }

    if (t.kind === 'lattice') {
      // Fixed lane. The beam burns whatever is first in it; the ramp builds
      // while it is hitting ANYTHING and bleeds off when the lane is clear.
      // (That trades some boss-executioner identity for lane-melting — a
      // deliberate consequence of removing target selection.)
      t.angle = t.aim;
      const j = findInLane(g, t, S.range);
      if (j < 0) {
        t.lockX = -1;
        t.lockT = Math.max(0, t.lockT - dt * 2); // spin down, don't snap to 0
        continue;
      }
      t.lockT += dt;
      t.lockX = e.x[j];
      t.lockY = e.y[j];
      t.angle = Math.atan2(e.y[j] - t.y, e.x[j] - t.x);
      const ramp = Math.min(1, t.lockT / S.rampTime);
      const dps = (S.hit + ((S.hitMax ?? 120) - S.hit) * ramp) * hitMul;
      dealBeam(g, j, dps, dt, S.threshIgnore);
      g.beams.push({ x: t.x, y: t.y, x2: e.x[j], y2: e.y[j], color: def.color });
      continue;
    }

    t.cd -= dt;

    if (t.kind === 'flame') {
      // The cone is welded to the committed facing.
      t.angle = t.aim;
      const half = ((def.coneDeg ?? 90) * Math.PI) / 360;
      // Fire when anything is IN THE CONE. This used to gate on findInLane,
      // which is a LANE_HALF-wide strip (52px) — far narrower than the 90°
      // spray it triggers. A flamethrower with twenty cars inside its cone sat
      // idle unless one happened to be in the centre strip, which is why an
      // equal-gold flame stack stopped 4% of what a mortar stack did.
      if (firstInCone(g, t, S.range, half) < 0) {
        if (t.cd < 0) t.cd = 0;
        continue;
      }
      if (t.cd <= 0) {
        const r2 = S.range * S.range;
        g.hash.query(t.x, t.y, S.range + 8, (k) => {
          if (e.hp[k] <= 0) return;
          const dx = e.x[k] - t.x, dy = e.y[k] - t.y;
          if (dx * dx + dy * dy > r2) return;
          let da = Math.atan2(dy, dx) - t.angle;
          if (da > Math.PI) da -= Math.PI * 2;
          else if (da < -Math.PI) da += Math.PI * 2;
          if (da < -half || da > half) return;
          dealHit(g, k, S.hit * hitMul);
          e.burn[k] = S.burnS; // Napalm makes fire cling

        });
        const fa = t.angle;
        for (let s = 0; s < 3; s++) {
          const d = 14 + s * 16;
          fx(g, 'flash', t.x + Math.cos(fa + (Math.random() - 0.5) * half) * d,
            t.y + Math.sin(fa + (Math.random() - 0.5) * half) * d,
            { r: 10 + s * 4, ttl: 0.12, color: '#e8863c' });
        }
        t.cd += 1 / (S.rate * rateMul);
      }
      continue;
    }

    if (t.kind === 'cryo') {
      // Freezes the committed area, not "everything near the tower".
      const ap = aimPoint(t, S.range, 0);
      t.angle = Math.atan2(ap.y - t.y, ap.x - t.x);
      if (t.cd <= 0) {
        if (nearestTo(g, ap.x, ap.y, S.splash) >= 0) {
          aoe(g, ap.x, ap.y, S.splash, S.hit * hitMul, 0, S.slowS);
          fx(g, 'boom', ap.x, ap.y, { r: S.splash, ttl: 0.35, color: '#79d6d0' });
          t.cd += 1 / (S.rate * rateMul);
        } else if (t.cd < 0) t.cd = 0;
      }
      continue;
    }

    // Remaining kinds: a lane weapon takes the first thing in its lane, a
    // point weapon services its committed ground target.
    const minR = def.minRange ?? 0;
    const pointMode = AIM_MODE[t.kind] === 'point';
    const ap = pointMode ? aimPoint(t, S.range, minR) : null;
    const j = pointMode
      ? nearestTo(g, ap!.x, ap!.y, Math.max(S.splash ?? 0, 46))
      : findInLane(g, t, S.range, minR);
    t.angle = pointMode ? Math.atan2(ap!.y - t.y, ap!.x - t.x) : t.aim;

    if (j < 0) {
      if (t.cd < 0) t.cd = 0;
      // Spin-down is now "nothing in the lane", and it bleeds rather than
      // snapping — a gap in traffic should not erase the whole ramp.
      if (t.kind === 'gatling') t.heat = Math.max(0, t.heat - dt / S.rampTime);
      continue;
    }

    if (t.kind === 'gatling') {
      t.heat = Math.min(1, t.heat + dt / S.rampTime);
    }

    if (t.cd > 0) continue;

    switch (t.kind) {
      case 'autocannon': {
        dealHit(g, j, S.hit * hitMul);
        if (tm.fire) e.burn[j] = 4;
        if (tm.cryo) e.slow[j] = 1.5;
        fx(g, 'tracer', t.x, t.y, { x2: e.x[j], y2: e.y[j], ttl: 0.06, color: '#fff3c4' });
        fx(g, 'flash', t.x + Math.cos(t.angle) * 12, t.y + Math.sin(t.angle) * 12, { r: 12, ttl: 0.07 });
        break;
      }
      case 'gatling': {
        // Depleted Rounds sets a damage floor so spin-up still bites armor.
        const ramped = S.hit + (S.hitMax - S.hit) * t.heat;
        const hit = Math.max(ramped, S.hitFloor) * hitMul;
        dealHit(g, j, hit);
        if (tm.fire) e.burn[j] = 4;
        if (tm.cryo) e.slow[j] = 1.5;
        fx(g, 'tracer', t.x, t.y, { x2: e.x[j], y2: e.y[j], ttl: 0.05, color: '#ffe9b0' });
        fx(g, 'flash', t.x + Math.cos(t.angle) * 12, t.y + Math.sin(t.angle) * 12, { r: 10 + t.heat * 8, ttl: 0.06 });
        break;
      }
      case 'railgun': {
        const bx = t.x + Math.cos(t.aim) * S.range;
        const by = t.y + Math.sin(t.aim) * S.range;
        g.hash.query(t.x, t.y, S.range + 10, (k) => {
          if (e.hp[k] <= 0) return;
          if (distSeg2(e.x[k], e.y[k], t.x, t.y, bx, by) <= 100) {
            dealHit(g, k, S.hit * hitMul);
          }
        });
        fx(g, 'rail', t.x, t.y, { x2: bx, y2: by, ttl: 0.22, color: '#dff2fb' });
        fx(g, 'flash', t.x + Math.cos(t.angle) * 14, t.y + Math.sin(t.angle) * 14, { r: 22, ttl: 0.18 });
        break;
      }
      case 'mortar': {
        // Cluster Shell scatters several smaller impacts instead of one.
        for (let c = 0; c < S.cluster; c++) {
          const off = S.cluster > 1 ? S.splash * 0.9 : 0;
          g.impacts.push({
            x: ap!.x + (Math.random() - 0.5) * off * 2,
            y: ap!.y + (Math.random() - 0.5) * off * 2,
            t: 0.7 + c * 0.08,
            hit: S.hit * hitMul, r: S.splash * splashMul,
          });
        }
        fx(g, 'flash', t.x, t.y, { r: 14, ttl: 0.12 });
        fx(g, 'smoke', t.x, t.y - 8, { r: 10, ttl: 0.7, color: '#c9c2b8' });
        break;
      }
      case 'tesla': {
        let cur = j;
        let hit = S.hit * hitMul;
        const chained = new Set<number>([j]);
        e.vel[j] = 0; // stutter-stun the primary
        if (tm.cryo) e.slow[j] = 1.5;
        for (let c = 0; c < S.chains; c++) {
          dealHit(g, cur, hit);
          hit *= def.chainFalloff ?? 0.7;
          // find the next link near the current one
          let nxt = -1;
          let bd = 90 * 90;
          g.hash.query(e.x[cur], e.y[cur], 90, (k) => {
            if (e.hp[k] <= 0 || chained.has(k)) return;
            const dx = e.x[k] - e.x[cur], dy = e.y[k] - e.y[cur];
            const d2 = dx * dx + dy * dy;
            if (d2 < bd) { bd = d2; nxt = k; }
          });
          const fromX = c === 0 ? t.x : e.x[cur];
          const fromY = c === 0 ? t.y : e.y[cur];
          fx(g, 'arc', fromX, fromY, { x2: e.x[cur], y2: e.y[cur], ttl: 0.16, color: '#aee8f8' });
          if (nxt < 0) break;
          chained.add(nxt);
          cur = nxt;
        }
        break;
      }
      case 'rocket': {
        // The salvo services the committed area; rockets home WITHIN it,
        // beefiest first. The player picks where, not who.
        const cands: number[] = [];
        const br = Math.max(S.splash ?? 0, 60);
        const br2 = br * br;
        g.hash.query(ap!.x, ap!.y, br + 10, (k) => {
          if (e.hp[k] <= 0) return;
          const dx = e.x[k] - ap!.x, dy = e.y[k] - ap!.y;
          if (dx * dx + dy * dy <= br2) cands.push(k);
        });
        cands.sort((a, b) => e.hp[b] - e.hp[a]);
        const n = S.salvo;
        for (let s = 0; s < n; s++) {
          const tgt = cands[s < cands.length ? s : 0];
          if (tgt === undefined) break;
          // Bunker Buster: extra punch against armored targets.
          const armorBonus = ENEMY_TYPES[e.type[tgt]].thresh > 0 ? S.vsArmor : 1;
          dealHit(g, tgt, S.hit * hitMul * armorBonus);
          if (tm.cryo) e.slow[tgt] = 1.5;
          fx(g, 'tracer', t.x, t.y, { x2: e.x[tgt], y2: e.y[tgt], ttl: 0.14, color: '#f0b9a0' });
          shove(g, e.x[tgt], e.y[tgt], 46, 210);
          fx(g, 'boom', e.x[tgt], e.y[tgt], { r: 14, ttl: 0.25 });
        }
        fx(g, 'smoke', t.x, t.y - 6, { r: 12, ttl: 0.8, color: '#c9c2b8' });
        break;
      }
    }
    t.cd += 1 / (S.rate * rateMul);
  }
}
