// Enemy pool: structure-of-arrays in typed arrays, dense with swap-remove.
// Movement is a light car model — each agent has a heading and scalar speed,
// steers toward the flow field under a turn-rate limit (traction), brakes into
// corners, and accelerates out of them. With the flow field hugging apexes and
// momentum swinging entries wide, the horde takes racing lines through the
// serpentine. Indices are only valid within a tick; a sweep reaps hp<=0.

import {
  MAX_ENEMIES, ENEMY_TYPES, SIZE_MULS, CELL, COLS, ROWS, W, H, clamp, TOWER_DEFS,
} from '../defs';
import { GOAL_X, GOAL_Y, GOAL_R2, PATH_RADIUS, sampleDist, wallNormal } from './terrain';
import type { Game } from '../state';

const NORM = new Float32Array(2);

/** Blast shove bleeds off in ~0.4s. */
const IMPULSE_DECAY = 6;
/** Stuck check: how long a window, and how far a car must travel inside it. */
const STUCK_WINDOW = 1.0;
const STUCK_MIN_MOVE = 6;

/** Largest body radius in the game — the separation query reach. */
const SEP_R = new Float32Array(MAX_ENEMIES);
const MAX_BODY = Math.max(...ENEMY_TYPES.map((d) => d.r)) * Math.max(...SIZE_MULS); // scratch for wallNormal

const PI = Math.PI;
const TWO_PI = PI * 2;

export class EnemyPool {
  n = 0;
  x = new Float32Array(MAX_ENEMIES);
  y = new Float32Array(MAX_ENEMIES);
  hp = new Float32Array(MAX_ENEMIES);
  heading = new Float32Array(MAX_ENEMIES); // rad, car facing
  vel = new Float32Array(MAX_ENEMIES);     // scalar speed px/s
  type = new Uint8Array(MAX_ENEMIES);
  seed = new Float32Array(MAX_ENEMIES);
  leaked = new Uint8Array(MAX_ENEMIES);
  burn = new Float32Array(MAX_ENEMIES); // incendiary DoT time left (s)
  slow = new Float32Array(MAX_ENEMIES); // cryo slow time left (s)
  stuckT = new Float32Array(MAX_ENEMIES); // seconds without meaningful movement
  size = new Uint8Array(MAX_ENEMIES);   // size bucket (index into SIZE_MULS)
  lane = new Float32Array(MAX_ENEMIES); // preferred lane offset from center (-1..1)
  spd = new Float32Array(MAX_ENEMIES);  // per-car speed multiplier
  shield = new Float32Array(MAX_ENEMIES); // damage multiplier from Shielder auras (1 = none)
  surgeT = new Float32Array(MAX_ENEMIES); // Runner: seconds left in a speed burst
  abilT = new Float32Array(MAX_ENEMIES);  // boss timers / next shed threshold
  maxHp = new Float32Array(MAX_ENEMIES);  // bosses need a health-bar denominator
  /**
   * Pending shove, px/s. Blasts add to this; the movement integrator consumes
   * it so the shove still goes through wall repel and projection. Writing x/y
   * straight from combat would tunnel cars through thin walls into the
   * off-track pockets that strand them.
   */
  impX = new Float32Array(MAX_ENEMIES);
  impY = new Float32Array(MAX_ENEMIES);
  /**
   * Velocity VECTOR. Agents are circles now, not cars: there is no heading to
   * turn and no traction limit, so one facing a wall simply accelerates away
   * instead of grinding along it. `heading` and `vel` are kept in sync as
   * derived values because rendering, effects and the harnesses read them.
   */
  vx = new Float32Array(MAX_ENEMIES);
  vy = new Float32Array(MAX_ENEMIES);
  /** Where the car was when its stuck-check window opened. */
  ckX = new Float32Array(MAX_ENEMIES);
  ckY = new Float32Array(MAX_ENEMIES);
  ckT = new Float32Array(MAX_ENEMIES);
  hpMul = 1; // wave scaling applied at spawn

  spawn(type: number, x: number, y: number): void {
    if (this.n >= MAX_ENEMIES) return;
    const i = this.n++;
    this.x[i] = x;
    this.y[i] = y;
    this.hp[i] = ENEMY_TYPES[type].hp * this.hpMul;
    this.heading[i] = (Math.random() - 0.5) * 0.6; // roughly east, slight fan
    this.vel[i] = ENEMY_TYPES[type].speed * 0.3;
    this.type[i] = type;
    this.seed[i] = Math.random() * 100;
    this.leaked[i] = 0;
    this.burn[i] = 0;
    this.slow[i] = 0;
    this.stuckT[i] = 0;
    this.impX[i] = 0;
    this.impY[i] = 0;
    this.vx[i] = ENEMY_TYPES[type].speed * 0.3;
    this.vy[i] = 0;
    this.ckX[i] = x;
    this.ckY[i] = y;
    this.ckT[i] = 0;
    const roll = Math.random();
    this.size[i] = roll < 0.3 ? 0 : roll < 0.75 ? 1 : 2;
    // Every driver has their own lane and their own pace.
    this.lane[i] = (Math.random() * 2 - 1) * 0.85;
    this.spd[i] = 0.85 + Math.random() * 0.3;
    this.shield[i] = 1;
    this.surgeT[i] = Math.random() * 3;
    this.maxHp[i] = this.hp[i];
    const def = ENEMY_TYPES[type];
    // 'drop' counts down to the next unload; 'shed' stores the next HP gate.
    this.abilT[i] = def.ability === 'drop' ? (def.dropEvery ?? 3)
      : def.ability === 'shed' ? 1 - (def.shedAt ?? 0.12)
        : 0;
  }

  kill(i: number): void {
    const l = --this.n;
    this.x[i] = this.x[l];
    this.y[i] = this.y[l];
    this.hp[i] = this.hp[l];
    this.heading[i] = this.heading[l];
    this.vel[i] = this.vel[l];
    this.type[i] = this.type[l];
    this.seed[i] = this.seed[l];
    this.leaked[i] = this.leaked[l];
    this.burn[i] = this.burn[l];
    this.slow[i] = this.slow[l];
    this.stuckT[i] = this.stuckT[l];
    this.size[i] = this.size[l];
    this.lane[i] = this.lane[l];
    this.spd[i] = this.spd[l];
    this.shield[i] = this.shield[l];
    this.surgeT[i] = this.surgeT[l];
    this.abilT[i] = this.abilT[l];
    this.maxHp[i] = this.maxHp[l];
    this.impX[i] = this.impX[l];
    this.impY[i] = this.impY[l];
    this.vx[i] = this.vx[l];
    this.vy[i] = this.vy[l];
    this.ckX[i] = this.ckX[l];
    this.ckY[i] = this.ckY[l];
    this.ckT[i] = this.ckT[l];
  }

  clear(): void {
    this.n = 0;
  }
}

// Wobble lookup: cheap pseudo-random drift without per-agent trig.
const SIN_TABLE = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  SIN_TABLE[i] = Math.sin((i / 256) * TWO_PI) * 0.1;
}

/**
 * Aura pass: Shielders protect and Menders repair everything around them.
 * Runs once per tick before movement, writing e.shield[] which the damage gate
 * reads. Aura carriers are rare, so this is a small scan.
 */
function applyAuras(g: Game, dt: number): void {
  const e = g.enemies;
  for (let i = 0; i < e.n; i++) e.shield[i] = 1;

  // THE MARSHAL: a field-wide protection aura. Everything except the boss
  // itself is hardened, so the only way through the wave is through the boss.
  let protector = -1;
  for (let i = 0; i < e.n; i++) {
    if (ENEMY_TYPES[e.type[i]].ability === 'protect' && e.hp[i] > 0) { protector = i; break; }
  }
  if (protector >= 0) {
    const amt = ENEMY_TYPES[e.type[protector]].auraAmt ?? 0.3;
    for (let i = 0; i < e.n; i++) if (i !== protector) e.shield[i] = amt;
  }

  for (let i = 0; i < e.n; i++) {
    const def = ENEMY_TYPES[e.type[i]];
    if (def.ability !== 'shield' && def.ability !== 'heal') continue;
    const r = def.auraR ?? 80;
    const r2 = r * r;
    const amt = def.auraAmt ?? 1;
    const shield = def.ability === 'shield';
    g.hash.query(e.x[i], e.y[i], r, (j) => {
      if (e.hp[j] <= 0) return;
      const dx = e.x[j] - e.x[i], dy = e.y[j] - e.y[i];
      if (dx * dx + dy * dy > r2) return;
      if (shield) {
        if (amt < e.shield[j]) e.shield[j] = amt; // strongest bubble wins
      } else {
        const cap = ENEMY_TYPES[e.type[j]].hp * e.hpMul;
        e.hp[j] = Math.min(cap, e.hp[j] + amt * dt);
      }
    });
  }
}

/**
 * Diverter footprints, collected once per tick. Flat arrays because this is
 * read inside the movement loop for every living car — an array of objects
 * here would allocate and chase pointers in the hottest loop in the game.
 */
const DIV_X: number[] = [];
const DIV_Y: number[] = [];
const DIV_DX: number[] = [];
const DIV_DY: number[] = [];
const DIV_R2: number[] = [];
let divN = 0;

function collectDiverters(g: Game): void {
  divN = 0;
  for (const t of g.towers) {
    if (t.kind !== 'diverter' || !t.armed) continue;
    DIV_X[divN] = t.x;
    DIV_Y[divN] = t.y;
    DIV_DX[divN] = Math.cos(t.aim);
    DIV_DY[divN] = Math.sin(t.aim);
    const r = TOWER_DEFS.diverter.range;
    DIV_R2[divN] = r * r;
    divN++;
  }
}

export function updateEnemies(g: Game, dt: number): void {
  collectDiverters(g);
  const e = g.enemies;
  const f = g.field;
  const hash = g.hash;
  applyAuras(g, dt);
  const hcs = hash.cs, hcols = hash.cols, hrows = hash.rows;
  const heads = hash.heads, next = hash.next;
  const timeIdx = g.time * 110;
  for (let i = 0; i < e.n; i++) {
    const t = ENEMY_TYPES[e.type[i]];
    // Status effects: Burning ticks 8/s (ignores Threshold by design),
    // Frozen caps speed at -40%.
    if (e.burn[i] > 0) {
      e.burn[i] -= dt;
      e.hp[i] -= 8 * dt;
    }
    let topSpeed = t.speed;
    if (e.slow[i] > 0) {
      e.slow[i] -= dt;
      topSpeed *= 0.6;
    }
    // THE RIG: unloads a fresh column on a timer.
    if (t.ability === 'drop') {
      e.abilT[i] -= dt;
      if (e.abilT[i] <= 0) {
        e.abilT[i] = t.dropEvery ?? 3;
        const cnt = t.dropCount ?? 4;
        for (let k = 0; k < cnt; k++) {
          const a = Math.random() * Math.PI * 2;
          const d = 18 + Math.random() * 16;
          const sx = e.x[i] + Math.cos(a) * d;
          const sy = e.y[i] + Math.sin(a) * d;
          e.spawn(Math.random() < 0.7 ? 0 : 1, sx, sy);
        }
        g.effects.push({
          kind: 'boom', x: e.x[i], y: e.y[i], r: 40, t: 0, ttl: 0.4, color: '#e0a24a',
        });
      }
    }
    // SCRAPHEAP: sheds wreckage each time it loses a chunk of HP.
    if (t.ability === 'shed') {
      const frac = e.hp[i] / (e.maxHp[i] || 1);
      if (frac <= e.abilT[i]) {
        e.abilT[i] = frac - (t.shedAt ?? 0.12);
        const cnt = t.dropCount ?? 6;
        for (let k = 0; k < cnt; k++) {
          const a = (k / cnt) * Math.PI * 2;
          const d = 22 + Math.random() * 12;
          e.spawn(0, e.x[i] + Math.cos(a) * d, e.y[i] + Math.sin(a) * d);
        }
        g.effects.push({
          kind: 'boom', x: e.x[i], y: e.y[i], r: 46, t: 0, ttl: 0.4, color: '#c9c26a',
        });
      }
    }
    // RUNNER: periodic speed bursts — the wave visibly surges ahead.
    if (t.ability === 'surge') {
      e.surgeT[i] -= dt;
      if (e.surgeT[i] <= 0) e.surgeT[i] = 5 + Math.random() * 3; // cycle
      if (e.surgeT[i] > 3.2) topSpeed *= 1.75;                   // burst window
    }
    const px = e.x[i], py = e.y[i];
    const cx = clamp((px / CELL) | 0, 0, COLS - 1);
    const cy = clamp((py / CELL) | 0, 0, ROWS - 1);
    const c = cy * COLS + cx;

    // Neighbor scan (inline bucket walk, capped sample count): gathers the
    // separation force AND a hard-overlap shove.
    const rr = t.r * SIZE_MULS[e.size[i]]; // per-car size variance
    let sx = 0, sy = 0, cnt = 0;
    let pushX = 0, pushY = 0;
    const sepR = rr * 2.6;
    const sepR2 = sepR * sepR;
    const hardR = rr * 1.7; // body-contact distance: real shoving below this
    let hx0 = ((px - sepR) / hcs) | 0;
    let hy0 = ((py - sepR) / hcs) | 0;
    let hx1 = ((px + sepR) / hcs) | 0;
    let hy1 = ((py + sepR) / hcs) | 0;
    if (hx0 < 0) hx0 = 0;
    if (hy0 < 0) hy0 = 0;
    if (hx1 >= hcols) hx1 = hcols - 1;
    if (hy1 >= hrows) hy1 = hrows - 1;
    outer:
    for (let hy = hy0; hy <= hy1; hy++) {
      for (let hx = hx0; hx <= hx1; hx++) {
        let j = heads[hy * hcols + hx];
        while (j !== -1) {
          if (j !== i) {
            const ddx = px - e.x[j], ddy = py - e.y[j];
            const d2 = ddx * ddx + ddy * ddy;
            if (d2 <= sepR2 && d2 > 1e-6) {
              const d = Math.sqrt(d2);
              const ov = 1 - d / sepR;
              const w = (ov * ov * 2.4) / d;
              sx += ddx * w;
              sy += ddy * w;
              if (d < hardR) {
                // bodies overlap: physical shove, not steering
                const p = (hardR - d) / hardR;
                pushX += (ddx / d) * p;
                pushY += (ddy / d) * p;
              }
              if (++cnt >= 6) break outer;
            }
          }
          j = next[j];
        }
      }
    }

    // Traffic model (IDM-flavored): braking responds to pressure from ahead,
    // steering follows the flow plus this car's own preferred LANE — every
    // driver takes their own line, not one shared optimal line.
    const fdx = f.dirX[c], fdy = f.dirY[c];
    const along = sx * fdx + sy * fdy;
    const latX = sx - (along < 0 ? along : 0) * fdx;
    const latY = sy - (along < 0 ? along : 0) * fdy;
    const congestion = along < 0 ? Math.min(1.6, -along) : 0;

    // Wall awareness, computed once: distance + outward normal at the car.
    wallNormal(px, py, NORM);
    const wnx = NORM[0], wny = NORM[1];
    const wd0 = sampleDist(px, py);
    const maxD = PATH_RADIUS - rr * 0.8;

    // Base steering = flow… or, if we were shoved off-track (flow dir is 0
    // out there), steer straight back in — never wander without a path.
    let ffx = fdx, ffy = fdy;
    const offTrack = fdx === 0 && fdy === 0;
    if (offTrack) {
      ffx = -wnx;
      ffy = -wny;
    } else if (wd0 > maxD - 12) {
      // The wall repels BEFORE contact: an inward force ramping up through
      // the last 12px, so drivers shy away instead of scraping.
      const pen = Math.min(1, (wd0 - (maxD - 12)) / 12);
      ffx -= wnx * pen * 1.4;
      ffy -= wny * pen * 1.4;
    }

    // Personal lane: steer toward a target offset from the centerline.
    let laneX = 0, laneY = 0;
    if (!offTrack) {
      const rightX = -fdy, rightY = fdx; // right of travel (y-down space)
      const side = wnx * rightX + wny * rightY > 0 ? 1 : -1;
      // Open-field map: the lane bias doubles as plinko randomness — each car
      // holds a gentle personal drift, so streams braid around the pegs.
      const laneErr = clamp((e.lane[i] * (PATH_RADIUS - rr - 6) - wd0 * side) * 0.035, -0.35, 0.35);
      laneX = rightX * laneErr;
      laneY = rightY * laneErr;
    }

    const ji = (e.seed[i] * 41 + timeIdx) | 0;
    let desX = ffx + latX * 0.5 + laneX + SIN_TABLE[(ji * 3) & 255];
    let desY = ffy + latY * 0.5 + laneY + SIN_TABLE[(ji * 2 + 85) & 255];

    // ---- Diverters: bend the intent, not the position ----
    // This blends the DESIRED direction rather than writing velocity or
    // position, so wall repel, projection and separation all still run
    // afterwards exactly as they would have. A diverter therefore cannot punch
    // a car through a wall or strand one off-track, which is the failure mode
    // every direct-write shortcut in this file has caused before.
    for (let d = 0; d < divN; d++) {
      const ddx = px - DIV_X[d], ddy = py - DIV_Y[d];
      const dd2 = ddx * ddx + ddy * ddy;
      if (dd2 > DIV_R2[d]) continue;
      // Full authority at the centre, tapering to nothing at the rim, so cars
      // curve through it instead of snapping onto a new heading at the edge.
      const k = (1 - Math.sqrt(dd2 / DIV_R2[d])) * 0.85;
      desX += (DIV_DX[d] - desX) * k;
      desY += (DIV_DY[d] - desY) * k;
    }

    const dl = Math.hypot(desX, desY);
    if (dl > 1e-4) { desX /= dl; desY /= dl; } else { desX = 0; desY = 0; }

    // ---- circle motion ----
    // Agents accelerate toward where they want to go. No heading, no turn-rate
    // limit and NO speed floor: the old model let a car face a wall, be unable
    // to turn away in time, and grind along it forever at the 6px/s minimum —
    // which is precisely what "enemies stuck on walls" was.
    const targetV = topSpeed * e.spd[i] / (1 + congestion * 1.3);
    let vx = e.vx[i], vy = e.vy[i];
    const wantX = desX * targetV, wantY = desY * targetV;
    const ax = wantX - vx, ay = wantY - vy;
    const al = Math.hypot(ax, ay);
    const step = t.accel * 2.4 * dt;
    if (al > step && al > 1e-4) { vx += (ax / al) * step; vy += (ay / al) * step; }
    else { vx = wantX; vy = wantY; }

    // Motion = velocity + the gentle crowd force. Hard non-overlap is resolved
    // positionally after everyone has moved (see separate() below).
    const PUSH = 30;
    let ddx = vx * dt + pushX * PUSH * dt;
    let ddy = vy * dt + pushY * PUSH * dt;
    // …but NEVER net-backward along the track: displacement against the flow
    // becomes a lateral slide (kills backward traffic waves dead).
    if (fdx !== 0 || fdy !== 0) {
      const backAmt = ddx * fdx + ddy * fdy;
      if (backAmt < 0) {
        ddx -= fdx * backAmt;
        ddy -= fdy * backAmt;
      }
    }
    // Blast shove, applied as displacement so it still runs the gauntlet of
    // wall repel and projection below. Decays fast — a shockwave is a punch,
    // not a wind.
    const ipx = e.impX[i], ipy = e.impY[i];
    if (ipx !== 0 || ipy !== 0) {
      ddx += ipx * dt;
      ddy += ipy * dt;
      const keep = Math.max(0, 1 - IMPULSE_DECAY * dt);
      e.impX[i] = Math.abs(ipx) < 1 ? 0 : ipx * keep;
      e.impY[i] = Math.abs(ipy) < 1 ? 0 : ipy * keep;
    }
    let mx = clamp(px + ddx, 2, W - 2);
    let my = clamp(py + ddy, 2, H - 2);

    // Smooth wall collision: iteratively project back inside the channel
    // (one step under-corrects where the distance-field gradient flattens
    // at outer corners — the "bugged into the wall" cases).
    let wallD = sampleDist(mx, my);
    if (wallD > maxD) {
      for (let it = 0; it < 5 && wallD > maxD; it++) {
        wallNormal(mx, my, NORM);
        if (NORM[0] === 0 && NORM[1] === 0) break;
        const over = wallD - maxD + 1;
        mx = clamp(mx - NORM[0] * over, 2, W - 2);
        my = clamp(my - NORM[1] * over, 2, H - 2);
        wallD = sampleDist(mx, my);
      }
      // Kill the velocity component pointing INTO the wall so the agent slides
      // along instead of pressing. Without this it re-accelerates into the wall
      // every tick and grinds — the whole stuck-on-walls bug.
      wallNormal(mx, my, NORM);
      const intoWall = vx * NORM[0] + vy * NORM[1];
      if (intoWall > 0) { vx -= NORM[0] * intoWall; vy -= NORM[1] * intoWall; }
      // Scraping the wall at speed still lays rubber. The circle rewrite
      // dropped both mark sites and silently killed ground history, which
      // CLAUDE.md lists as a shipped feature.
      const scrapeV = Math.hypot(vx, vy);
      if (scrapeV > t.speed * 0.35 && g.marks.length < 600 && Math.random() < 0.08) {
        g.marks.push(mx, my, Math.atan2(vy, vx));
      }
    }
    const mc = clamp((my / CELL) | 0, 0, ROWS - 1) * COLS + clamp((mx / CELL) | 0, 0, COLS - 1);

    let holding = false;
    if (f.blocked[mc] === 1 && mc !== c) {
      // Something is in the way: chew if allowed, and SLIDE along it so the
      // pack flows around corners instead of pinning against the face.
      holding = true; // legitimate hold (chew queue) — not "stuck"
      const brake = Math.max(0, 1 - 3 * dt);
      vx *= brake; vy *= brake;
      const ti = g.towerGrid[mc];
      if (ti >= 0 && ti < g.towers.length) {
        // Barriers are invulnerable while ANY open route exists; only a fully
        // sealed track lets the horde chew them. Towers always chew.
        if (f.wallCell[mc] === 0 || f.sealed) {
          g.towers[ti].hp -= t.dps * dt;
        }
      }
      const scx = clamp((mx / CELL) | 0, 0, COLS - 1);
      const scy = clamp((my / CELL) | 0, 0, ROWS - 1);
      const hOnly = cy * COLS + scx; // horizontal component only
      const vOnly = scy * COLS + cx; // vertical component only
      if (f.blocked[hOnly] === 0 && f.walk[hOnly] === 1) {
        e.x[i] = mx;
      } else if (f.blocked[vOnly] === 0 && f.walk[vOnly] === 1) {
        e.y[i] = my;
      }
      // both blocked: genuinely pinned this tick (front of a chew queue)
    } else {
      e.x[i] = mx;
      e.y[i] = my;
    }
    // Hard change of direction at speed = a slide, same as cornering did.
    const prevSp = e.vel[i];
    if (prevSp > t.speed * 0.45 && g.marks.length < 600) {
      const turn = Math.abs(Math.atan2(vy, vx) - e.heading[i]);
      const wrapped = turn > Math.PI ? Math.PI * 2 - turn : turn;
      if (wrapped > 0.5 && Math.random() < 0.1) {
        g.marks.push(e.x[i], e.y[i], e.heading[i]);
      }
    }

    // Store the vector; keep heading/vel as derived values because rendering,
    // effects and the harnesses still read them.
    e.vx[i] = vx;
    e.vy[i] = vy;
    const sp = Math.hypot(vx, vy);
    e.vel[i] = sp;
    if (sp > 1e-3) e.heading[i] = Math.atan2(vy, vx);

    // Stuck safety net: a car that has barely moved for seconds (and is not a
    // legitimate chew-hold) gets snapped to the nearest routable cell — at
    // horde scale the snap is invisible, and it makes wall-wedge soft-locks
    // impossible.
    if (holding) {
      e.stuckT[i] = 0;
    } else {
      // NET displacement over a rolling window — not the per-tick delta.
      // The old check reset the timer on any tick that moved more than 0.2px,
      // so a car grinding against geometry (audit found one holding position
      // for 46s at ~9px/s) never registered as stuck and survived to the
      // 120s drain cull, hanging the end of the wave.
      e.ckT[i] += dt;
      if (e.ckT[i] >= STUCK_WINDOW) {
        const nx = e.x[i] - e.ckX[i], ny = e.y[i] - e.ckY[i];
        if (nx * nx + ny * ny < STUCK_MIN_MOVE * STUCK_MIN_MOVE) {
          e.stuckT[i] += e.ckT[i];
        } else {
          e.stuckT[i] = 0;
        }
        e.ckX[i] = e.x[i];
        e.ckY[i] = e.y[i];
        e.ckT[i] = 0;
      }
      if (e.stuckT[i] > 3) {
        let rescued = false;
        for (let ring = 0; ring <= 4 && !rescued; ring++) {
          let bestC = -1;
          let bestCost = Infinity;
          for (let oy = -ring; oy <= ring; oy++) {
            for (let ox = -ring; ox <= ring; ox++) {
              if (Math.max(ox < 0 ? -ox : ox, oy < 0 ? -oy : oy) !== ring) continue;
              const ncx2 = cx + ox, ncy2 = cy + oy;
              if (ncx2 < 0 || ncx2 >= COLS || ncy2 < 0 || ncy2 >= ROWS) continue;
              const cc = ncy2 * COLS + ncx2;
              if (f.walk[cc] !== 1 || f.blocked[cc] === 1) continue;
              if (f.cost[cc] < bestCost) {
                bestCost = f.cost[cc];
                bestC = cc;
              }
            }
          }
          if (bestC >= 0 && isFinite(bestCost)) {
            e.x[i] = (bestC % COLS) * CELL + CELL / 2 + (Math.random() - 0.5) * 6;
            e.y[i] = ((bestC / COLS) | 0) * CELL + CELL / 2 + (Math.random() - 0.5) * 6;
            e.heading[i] = Math.atan2(f.dirY[bestC], f.dirX[bestC]);
            e.vel[i] = 30;
            e.stuckT[i] = 0;
            g.rescues++;
            rescued = true;
          }
        }
        if (!rescued) {
          // nowhere sane to put it: silent cull (no gold, no base damage)
          e.hp[i] = 0;
          e.leaked[i] = 1;
        }
      }
    }

    const gdx = e.x[i] - GOAL_X;
    const gdy = e.y[i] - GOAL_Y;
    if (gdx * gdx + gdy * gdy < GOAL_R2) {
      // Contingency: one otherwise-lethal leak per run is survived at 1 HP.
      // Checked BEFORE the subtraction so it cannot be skipped by a big hit.
      if (g.contingencyLeft && g.baseHp - t.leak <= 0) {
        g.contingencyLeft = false;
        g.baseHp = 1;
      } else {
        g.baseHp -= t.leak;
      }
      g.gold += g.mods.leakRefund;   // Insurance
      e.hp[i] = 0;
      e.leaked[i] = 1;
    }
  }
}

/**
 * Hard non-overlap. Agents are circles, so after everyone has moved we push
 * any overlapping pair apart POSITIONALLY — never by altering velocity. That
 * is the whole point: they shoulder each other aside without anyone being
 * turned around, which is what steering-based separation used to do.
 *
 * Heavier bodies give less ground (mass = radius). Two relaxation passes are
 * enough to clear a dense crush without the jitter a single pass leaves.
 */
export function separate(g: Game, passes = 2): void {
  const e = g.enemies;
  if (e.n < 2) return;

  // Body radius per agent, computed once instead of per pair per pass.
  const rad = SEP_R;
  let maxR = 0;
  for (let i = 0; i < e.n; i++) {
    const r = ENEMY_TYPES[e.type[i]].r * SIZE_MULS[e.size[i]];
    rad[i] = r;
    if (r > maxR) maxR = r;
  }

  // Inline, closure-free bucket walk — the documented pattern for this
  // codebase's hot loops. Going through hash.query()'s callback cost ~12x the
  // sim budget at 10k agents. The reach is the LARGEST BODY ACTUALLY PRESENT,
  // not the largest in the game: querying every swarmer at boss radius scanned
  // roughly nine times the buckets it needed.
  const hash = g.hash;
  const cs = hash.cs, hcols = hash.cols, hrows = hash.rows;
  const heads = hash.heads, next = hash.next;

  for (let pass = 0; pass < passes; pass++) {
    for (let i = 0; i < e.n; i++) {
      if (e.hp[i] <= 0) continue;
      const ri = rad[i];
      const reach = ri + maxR;
      const xi = e.x[i], yi = e.y[i];
      let x0 = ((xi - reach) / cs) | 0;
      let y0 = ((yi - reach) / cs) | 0;
      let x1 = ((xi + reach) / cs) | 0;
      let y1 = ((yi + reach) / cs) | 0;
      if (x0 < 0) x0 = 0;
      if (y0 < 0) y0 = 0;
      if (x1 >= hcols) x1 = hcols - 1;
      if (y1 >= hrows) y1 = hrows - 1;
      for (let cy = y0; cy <= y1; cy++) {
        const row = cy * hcols;
        for (let cx = x0; cx <= x1; cx++) {
          let j = heads[row + cx];
          while (j !== -1) {
            if (j <= i || e.hp[j] <= 0) { j = next[j]; continue; }
            const rj = rad[j];
            const rr = ri + rj;
            let dx = e.x[j] - e.x[i];
            let dy = e.y[j] - e.y[i];
            const d2 = dx * dx + dy * dy;
            if (d2 >= rr * rr) { j = next[j]; continue; }
            let d = Math.sqrt(d2);
            if (d < 1e-4) {
              // Exactly coincident: shove apart on a stable pseudo-random axis
              // so the pair cannot sit inside one another forever.
              const ang = (e.seed[i] + e.seed[j]) * 1.7;
              dx = Math.cos(ang); dy = Math.sin(ang); d = 1;
            } else {
              dx /= d; dy /= d;
            }
            const overlap = rr - d;
            const total = rr;
            const wi = rj / total;   // light bodies move most
            const wj = ri / total;
            e.x[i] -= dx * overlap * wi;
            e.y[i] -= dy * overlap * wi;
            e.x[j] += dx * overlap * wj;
            e.y[j] += dy * overlap * wj;
            j = next[j];
          }
        }
      }
    }
  }

  // Separation can shoulder someone into terrain; put them back on the road.
  for (let i = 0; i < e.n; i++) {
    const rr = ENEMY_TYPES[e.type[i]].r * SIZE_MULS[e.size[i]];
    const maxD = PATH_RADIUS - rr * 0.8;
    let wd = sampleDist(e.x[i], e.y[i]);
    for (let it = 0; it < 3 && wd > maxD; it++) {
      wallNormal(e.x[i], e.y[i], NORM);
      if (NORM[0] === 0 && NORM[1] === 0) break;
      const over = wd - maxD + 0.5;
      e.x[i] = clamp(e.x[i] - NORM[0] * over, 2, W - 2);
      e.y[i] = clamp(e.y[i] - NORM[1] * over, 2, H - 2);
      wd = sampleDist(e.x[i], e.y[i]);
    }
  }
}
