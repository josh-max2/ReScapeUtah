// Per-frame canvas renderer. All texture work lives in pre-rendered layers
// (sprites.ts); this file only composites. Visual contract: design/template.html.

import {
  CELL, COLS, ROWS, PAL, ENEMY_TYPES, SIZE_MULS, TOWER_DEFS, TowerKind,
  STRIKE_RADIUS, clamp, AIM_MODE, LANE_HALF,
} from '../defs';
import {
  GOAL_X, GOAL_Y, GOAL_R2, SPAWN_X, SPAWN_Y1, SPAWN_Y2,
  sampleDist, wallNormal, PATH_RADIUS,
} from '../sim/terrain';
import type { Game } from '../state';
import { LOD_LIMIT, type Settings } from '../meta/save';
import { canPlace, type Tower } from '../sim/towers';
import { drawTowerBody } from './towerArt';
import {
  buildTerrain, buildVignette, buildFireGlow, buildSmoke, buildCarSprites,
  buildAura, GroundLayer, CAR_DIRS,
} from './sprites';

export interface UiState {
  placing: TowerKind | null;
  strikeArmed: boolean;
  mouseX: number;
  mouseY: number;
  mouseIn: boolean;
  /** Player options, mirrored from the save each frame. */
  settings: Settings;
  /** Index of the tower whose angle the player is currently choosing, or -1. */
  aiming: number;
}

let terrain: HTMLCanvasElement | null = null;
let vignette: HTMLCanvasElement | null = null;
let glow: HTMLCanvasElement | null = null;
let smoke: HTMLCanvasElement | null = null;
let cars: HTMLCanvasElement[][][] = []; // [type][sizeBucket][heading]
let auraShield: HTMLCanvasElement | null = null;
let auraHeal: HTMLCanvasElement | null = null;
let ground: GroundLayer | null = null;
let lastRunId = -1;

const CAR_Q = CAR_DIRS / (Math.PI * 2);
const TAU = Math.PI * 2;

function ensureAssets(): void {
  if (terrain) return;
  terrain = buildTerrain();
  vignette = buildVignette();
  glow = buildFireGlow();
  smoke = buildSmoke();
  // One sprite set per ENEMY_TYPE — never hardcode the count, or adding an
  // archetype throws here and kills the frame loop.
  cars = ENEMY_TYPES.map((_, t) => SIZE_MULS.map((m) => buildCarSprites(t, m)));
  auraShield = buildAura('120,220,245');
  auraHeal = buildAura('240,140,205');
  ground = new GroundLayer();
}

// ---- Route preview (build phase): a virtual fleet is traced through the
// field with individual lane biases (like real cars), clustered into the
// distinct routes the wave will take. Each route draws with width
// proportional to its traffic share and a green->red curvature gradient.
interface Route {
  xs: Float32Array;
  ys: Float32Array;
  turns: Float32Array;
  share: number;
}

let lineVer = -1;
let routes: Route[] = [];

const TRACERS = 56;
const RESAMPLE = 60;
const TR_NORM = new Float32Array(2);

function traceOne(g: Game, bias: number): number[] | null {
  let x = SPAWN_X + (Math.random() - 0.5) * 24;
  let y = SPAWN_Y1 + Math.random() * (SPAWN_Y2 - SPAWN_Y1);
  let vx = 1, vy = 0;
  const pts: number[] = [];
  for (let s = 0; s < 1600; s++) {
    const cx = clamp((x / CELL) | 0, 0, COLS - 1);
    const cy = clamp((y / CELL) | 0, 0, ROWS - 1);
    const dx0 = g.field.dirX[cy * COLS + cx];
    const dy0 = g.field.dirY[cy * COLS + cx];
    if (dx0 === 0 && dy0 === 0) break;
    // personal drift, perpendicular to the flow — this is what finds branches
    const dx = dx0 - dy0 * bias;
    const dy = dy0 + dx0 * bias;
    vx = vx * 0.84 + dx * 0.16;
    vy = vy * 0.84 + dy * 0.16;
    const vl = Math.sqrt(vx * vx + vy * vy) || 1;
    x += (vx / vl) * 8;
    y += (vy / vl) * 8;
    // stay off the walls, same as the cars
    const wd = sampleDist(x, y);
    if (wd > PATH_RADIUS - 8) {
      wallNormal(x, y, TR_NORM);
      const over = wd - (PATH_RADIUS - 8);
      x -= TR_NORM[0] * over;
      y -= TR_NORM[1] * over;
    }
    pts.push(x, y);
    const gdx = x - GOAL_X, gdy = y - GOAL_Y;
    if (gdx * gdx + gdy * gdy < GOAL_R2) return pts;
  }
  return null; // never reached the fort: not a route
}

function ensureRoutes(g: Game): void {
  if (g.field.version === lineVer) return;
  lineVer = g.field.version;
  // Trace the fleet and resample each successful run to a fixed point count.
  const traces: Float32Array[] = [];
  for (let k = 0; k < TRACERS; k++) {
    // Probe wider than the cars' own drift so side branches show up too.
    const bias = ((k / (TRACERS - 1)) * 2 - 1) * 0.55;
    const raw = traceOne(g, bias);
    if (!raw || raw.length < 40) continue;
    const n = raw.length / 2;
    const rs = new Float32Array(RESAMPLE * 2);
    for (let i = 0; i < RESAMPLE; i++) {
      const f = (i / (RESAMPLE - 1)) * (n - 1);
      const j = Math.min(n - 2, f | 0);
      const t = f - j;
      rs[i * 2] = raw[j * 2] * (1 - t) + raw[(j + 1) * 2] * t;
      rs[i * 2 + 1] = raw[j * 2 + 1] * (1 - t) + raw[(j + 1) * 2 + 1] * t;
    }
    traces.push(rs);
  }
  // Greedy clustering by mean pointwise distance.
  const sums: Float64Array[] = [];
  const counts: number[] = [];
  for (const tr of traces) {
    let best = -1;
    let bestD = 58; // tight: paths on opposite sides of an island must NOT merge
    for (let ci = 0; ci < sums.length; ci++) {
      let d = 0;
      for (let i = 0; i < RESAMPLE; i++) {
        const mx = sums[ci][i * 2] / counts[ci];
        const my = sums[ci][i * 2 + 1] / counts[ci];
        d += Math.hypot(tr[i * 2] - mx, tr[i * 2 + 1] - my);
      }
      d /= RESAMPLE;
      if (d < bestD) {
        bestD = d;
        best = ci;
      }
    }
    if (best < 0 && sums.length < 6) {
      sums.push(new Float64Array(tr));
      counts.push(1);
    } else if (best >= 0) {
      for (let i = 0; i < RESAMPLE * 2; i++) sums[best][i] += tr[i];
      counts[best]++;
    }
  }
  // Build routes: average, smooth, curvature.
  routes = [];
  const total = counts.reduce((a, b) => a + b, 0) || 1;
  for (let ci = 0; ci < sums.length; ci++) {
    const xs = new Float32Array(RESAMPLE);
    const ys = new Float32Array(RESAMPLE);
    for (let i = 0; i < RESAMPLE; i++) {
      xs[i] = sums[ci][i * 2] / counts[ci];
      ys[i] = sums[ci][i * 2 + 1] / counts[ci];
    }
    for (let pass = 0; pass < 2; pass++) {
      const nx = xs.slice();
      const ny = ys.slice();
      for (let i = 0; i < RESAMPLE; i++) {
        let sxx = 0, syy = 0, cnt = 0;
        for (let k = -2; k <= 2; k++) {
          const j = i + k;
          if (j < 0 || j >= RESAMPLE) continue;
          sxx += nx[j];
          syy += ny[j];
          cnt++;
        }
        xs[i] = sxx / cnt;
        ys[i] = syy / cnt;
      }
    }
    const turns = new Float32Array(RESAMPLE);
    for (let i = 1; i < RESAMPLE - 1; i++) {
      const h1 = Math.atan2(ys[i] - ys[i - 1], xs[i] - xs[i - 1]);
      const h2 = Math.atan2(ys[i + 1] - ys[i], xs[i + 1] - xs[i]);
      let d = h2 - h1;
      if (d > Math.PI) d -= Math.PI * 2;
      else if (d < -Math.PI) d += Math.PI * 2;
      turns[i] = Math.abs(d);
    }
    const sm = new Float32Array(RESAMPLE);
    for (let i = 0; i < RESAMPLE; i++) {
      let sum = 0, cnt = 0;
      for (let k = -4; k <= 4; k++) {
        const j = i + k;
        if (j < 0 || j >= RESAMPLE) continue;
        sum += turns[j];
        cnt++;
      }
      sm[i] = sum / cnt;
    }
    routes.push({ xs, ys, turns: sm, share: counts[ci] / total });
  }
}

/**
 * Draw a tower's committed aim: a lane for directional weapons, a reticle for
 * point weapons. Mortars also get their dead zone ringed — otherwise "my
 * mortar won't shoot" is the first bug report.
 */
function drawAim(ctx: CanvasRenderingContext2D, t: Tower, alpha: number): void {
  const def = TOWER_DEFS[t.kind];
  const mode = AIM_MODE[t.kind];
  if (mode === 'none') return;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (mode === 'dir') {
    const dx = Math.cos(t.aim), dy = Math.sin(t.aim);
    const ex = t.x + dx * def.range, ey = t.y + dy * def.range;
    const px = -dy * LANE_HALF, py = dx * LANE_HALF;
    ctx.fillStyle = PAL.cyan;
    ctx.globalAlpha = alpha * (alpha > 0.5 ? 0.26 : 0.10);
    ctx.beginPath();
    ctx.moveTo(t.x + px, t.y + py);
    ctx.lineTo(ex + px, ey + py);
    ctx.lineTo(ex - px, ey - py);
    ctx.lineTo(t.x - px, t.y - py);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = PAL.cyan;
    ctx.lineWidth = alpha > 0.5 ? 2.6 : 1.4;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.moveTo(t.x, t.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.setLineDash([]);
    if (alpha > 0.5) {
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(t.x + px, t.y + py); ctx.lineTo(ex + px, ey + py);
      ctx.moveTo(t.x - px, t.y - py); ctx.lineTo(ex - px, ey - py);
      ctx.stroke();
    }
  } else {
    const ddx = t.aimX - t.x, ddy = t.aimY - t.y;
    const d = Math.hypot(ddx, ddy) || 1;
    const cl = clamp(d, def.minRange ?? 0, def.range);
    const ax = t.x + (ddx / d) * cl, ay = t.y + (ddy / d) * cl;
    ctx.strokeStyle = PAL.cyan;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 6]);
    ctx.beginPath();
    ctx.moveTo(t.x, t.y);
    ctx.lineTo(ax, ay);
    ctx.stroke();
    ctx.setLineDash([]);
    const rr = Math.max(def.splash ?? 0, 18);
    ctx.globalAlpha = alpha * 0.16;
    ctx.fillStyle = PAL.cyan;
    ctx.beginPath();
    ctx.arc(ax, ay, rr, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(ax, ay, rr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ax - 7, ay); ctx.lineTo(ax + 7, ay);
    ctx.moveTo(ax, ay - 7); ctx.lineTo(ax, ay + 7);
    ctx.stroke();
    if (def.minRange) {
      ctx.globalAlpha = alpha * 0.5;
      ctx.strokeStyle = '#e06052';
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.arc(t.x, t.y, def.minRange, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  ctx.restore();
}

function drawRoutes(ctx: CanvasRenderingContext2D): void {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = 0.38;
  for (const rt of routes) {
    // Width scales with how much of the wave takes this branch.
    ctx.lineWidth = 2.5 + 11 * rt.share;
    // Normalize curvature by segment length so color matches the old per-8px scale.
    const segLen = Math.hypot(rt.xs[1] - rt.xs[0], rt.ys[1] - rt.ys[0]) || 8;
    const scale = 0.11 * (segLen / 8);
    for (let i = 0; i + 1 < RESAMPLE; i++) {
      const k = Math.min(1, ((rt.turns[i] + rt.turns[i + 1]) / 2) / scale);
      ctx.strokeStyle = `hsl(${110 - 110 * k}, 62%, 55%)`;
      ctx.beginPath();
      ctx.moveTo(rt.xs[i], rt.ys[i]);
      ctx.lineTo(rt.xs[i + 1], rt.ys[i + 1]);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

function drawGlow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number): void {
  ctx.globalAlpha = alpha;
  ctx.drawImage(glow!, x - r, y - r, r * 2, r * 2);
}

function dashedCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number): void {
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

export function render(ctx: CanvasRenderingContext2D, g: Game, ui: UiState): void {
  ensureAssets();

  if (g.runId !== lastRunId) {
    ground!.clear();
    lastRunId = g.runId;
  }
  for (let i = 0; i < g.marks.length; i += 3) {
    ground!.skid(g.marks[i], g.marks[i + 1], g.marks[i + 2]);
  }
  g.marks.length = 0;
  for (let i = 0; i < g.deaths.length; i += 3) {
    ground!.oil(g.deaths[i], g.deaths[i + 1], g.deaths[i + 2]);
  }
  g.deaths.length = 0;

  ctx.drawImage(terrain!, 0, 0);
  if (ui.settings.groundHistory) ctx.drawImage(ground!.canvas, 0, 0);

  // Fort wear: red tint as the base takes damage.
  const hpFrac = g.baseMaxHp > 0 ? clamp(g.baseHp / g.baseMaxHp, 0, 1) : 0;
  if (hpFrac < 1) {
    ctx.globalAlpha = (1 - hpFrac) * 0.5;
    ctx.fillStyle = '#8c1d10';
    ctx.fillRect(GOAL_X - 38, GOAL_Y - 38, 76, 76);
    ctx.globalAlpha = 1;
  }

  if (g.phase === 'build') {
    if (ui.settings.routePreview) {
      ensureRoutes(g);
      drawRoutes(ctx);
    }
    if (ui.settings.coverageRings) {
      for (const t of g.towers) {
        const def = TOWER_DEFS[t.kind];
        if (def.range > 0 && t.kind !== 'mine') {
          dashedCircle(ctx, t.x, t.y, def.range, '#ffffff', 0.22);
        }
        if (def.minRange) dashedCircle(ctx, t.x, t.y, def.minRange, '#e06052', 0.25);
      }
    }
  }

  // ---- Committed firing lanes ----
  // Every armed tower shows the line it holds during build phase: the whole
  // strategy is where these point, so they must be readable without clicking.
  if (g.phase === 'build' && ui.settings.coverageRings) {
    for (let i = 0; i < g.towers.length; i++) {
      const t = g.towers[i];
      if (!t.armed || i === ui.aiming) continue;
      drawAim(ctx, t, 0.22);
    }
  }
  // The tower being aimed right now, bright and live.
  if (ui.aiming >= 0 && ui.aiming < g.towers.length) {
    drawAim(ctx, g.towers[ui.aiming], 0.95);
  }

  // Selected tower: ring + its range, so inspecting shows what it covers.
  if (g.selected >= 0 && g.selected < g.towers.length) {
    const st = g.towers[g.selected];
    const sr = TOWER_DEFS[st.kind].range;
    if (sr > 0) dashedCircle(ctx, st.x, st.y, sr, PAL.cyan, 0.55);
    ctx.strokeStyle = PAL.cyan;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(st.x, st.y, 16, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (const t of g.towers) {
    drawTowerBody(ctx, t.x, t.y, t.kind, t.angle, g.typeMods[t.kind], t);
    if (t.hp < t.maxHp) {
      const f = clamp(t.hp / t.maxHp, 0, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(t.x - 10, t.y - 17, 20, 3);
      ctx.fillStyle = f > 0.4 ? '#7fbf5f' : PAL.health;
      ctx.fillRect(t.x - 10, t.y - 17, 20 * f, 3);
    }
  }

  // Aura carriers first, UNDER the horde: a shield bubble and a heal field
  // have to be visible or the ability may as well not exist.
  {
    const e2 = g.enemies;
    const pulse = 0.93 + 0.07 * Math.sin(g.time * 3);
    for (let i = 0; i < e2.n; i++) {
      const def = ENEMY_TYPES[e2.type[i]];
      if (def.ability !== 'shield' && def.ability !== 'heal') continue;
      const r = (def.auraR ?? 80) * pulse;
      const spr = def.ability === 'shield' ? auraShield! : auraHeal!;
      ctx.drawImage(spr, e2.x[i] - r, e2.y[i] - r, r * 2, r * 2);
    }
  }

  // Bosses: an armoured hull ring + threat glow so a boss reads instantly as
  // "the big thing", not just a larger car.
  {
    const e3 = g.enemies;
    for (let i = 0; i < e3.n; i++) {
      const def = ENEMY_TYPES[e3.type[i]];
      if (!def.boss) continue;
      const x = e3.x[i], y = e3.y[i], r = def.r;
      ctx.fillStyle = 'rgba(0,0,0,0.34)';
      ctx.beginPath();
      ctx.ellipse(x + 3, y + 5, r * 1.5, r * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();
      const pulse = 0.86 + 0.14 * Math.sin(g.time * 4 + i);
      ctx.strokeStyle = `rgba(240,122,95,${0.5 * pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, r * 1.55 * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,220,180,0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r * 1.2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Enemies: plain circles (owner call 2026-08-16 — the car framing is gone;
  // movement is now velocity-vector circles with real circle collisions).
  // Batched by type so fill colour is set once per archetype, and by a single
  // path per batch so the whole horde is two draw calls per type.
  const e = g.enemies;
  const lod = e.n > LOD_LIMIT[ui.settings.detail];
  for (let tt = 0; tt < ENEMY_TYPES.length; tt++) {
    const def = ENEMY_TYPES[tt];
    let any = false;
    // dark rim first, so overlapping bodies still read as separate discs
    ctx.beginPath();
    for (let i = 0; i < e.n; i++) {
      if (e.type[i] !== tt) continue;
      const r = def.r * SIZE_MULS[e.size[i]];
      ctx.moveTo(e.x[i] + r + 1.2, e.y[i]);
      ctx.arc(e.x[i], e.y[i], r + 1.2, 0, TAU);
      any = true;
    }
    if (!any) continue;
    ctx.fillStyle = '#14180d';
    ctx.fill();
    ctx.beginPath();
    for (let i = 0; i < e.n; i++) {
      if (e.type[i] !== tt) continue;
      const r = def.r * SIZE_MULS[e.size[i]];
      ctx.moveTo(e.x[i] + r, e.y[i]);
      ctx.arc(e.x[i], e.y[i], r, 0, TAU);
    }
    ctx.fillStyle = def.color;
    ctx.fill();
    // A facing pip on the big bodies only — cheap, and it keeps bosses and
    // titans readable without reintroducing per-agent rotation.
    if (!lod && def.r >= 6) {
      ctx.beginPath();
      for (let i = 0; i < e.n; i++) {
        if (e.type[i] !== tt) continue;
        const r = def.r * SIZE_MULS[e.size[i]];
        const hx = Math.cos(e.heading[i]), hy = Math.sin(e.heading[i]);
        ctx.moveTo(e.x[i] + hx * r * 0.9 + 1.6, e.y[i] + hy * r * 0.9);
        ctx.arc(e.x[i] + hx * r * 0.9, e.y[i] + hy * r * 0.9, 1.6, 0, TAU);
      }
      ctx.fillStyle = def.nose;
      ctx.fill();
    }
  }

  // Fire pass: everything warm renders additively.
  ctx.globalCompositeOperation = 'lighter';
  for (const b of g.beams) {
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = PAL.fire;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x2, b.y2);
    ctx.stroke();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x2, b.y2);
    ctx.stroke();
    drawGlow(ctx, b.x, b.y, 18, 0.8);
  }
  for (const fx of g.effects) {
    const p = fx.t / fx.ttl;
    if (fx.kind === 'tracer') {
      ctx.globalAlpha = (1 - p) * 0.9;
      ctx.strokeStyle = fx.color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(fx.x, fx.y);
      ctx.lineTo(fx.x2 ?? fx.x, fx.y2 ?? fx.y);
      ctx.stroke();
    } else if (fx.kind === 'flash') {
      drawGlow(ctx, fx.x, fx.y, (fx.r ?? 14) * (1 + p * 0.5), 1 - p);
    } else if (fx.kind === 'boom') {
      drawGlow(ctx, fx.x, fx.y, (fx.r ?? 20) * 1.25, (1 - p) * 0.85);
      ctx.globalAlpha = (1 - p) * 0.7;
      ctx.strokeStyle = fx.color;
      ctx.lineWidth = 2 + 2 * (1 - p);
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, (fx.r ?? 20) * (0.35 + 0.65 * p), 0, Math.PI * 2);
      ctx.stroke();
    } else if (fx.kind === 'shock') {
      // Shockwave: a thin ring racing outward, so the shove is legible as a
      // cause rather than the horde just twitching.
      const rr = (fx.r ?? 40) * (0.25 + 0.75 * p);
      ctx.globalAlpha = (1 - p) * 0.55;
      ctx.strokeStyle = '#fff3c4';
      ctx.lineWidth = 3.5 * (1 - p) + 0.8;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, rr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = (1 - p) * 0.22;
      ctx.lineWidth = 9 * (1 - p);
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, rr * 0.86, 0, Math.PI * 2);
      ctx.stroke();
    } else if (fx.kind === 'rail') {
      // railgun shot: hot white lance
      ctx.globalAlpha = (1 - p) * 0.9;
      ctx.strokeStyle = fx.color;
      ctx.lineWidth = 4.5 * (1 - p) + 1;
      ctx.beginPath();
      ctx.moveTo(fx.x, fx.y);
      ctx.lineTo(fx.x2 ?? fx.x, fx.y2 ?? fx.y);
      ctx.stroke();
      drawGlow(ctx, fx.x, fx.y, 20, (1 - p) * 0.8);
    } else if (fx.kind === 'arc') {
      // tesla arc: jagged lightning, wobbling per frame
      const ax = fx.x, ay = fx.y;
      const bx = fx.x2 ?? fx.x, by = fx.y2 ?? fx.y;
      ctx.globalAlpha = (1 - p) * 0.95;
      ctx.strokeStyle = fx.color;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      const segs = 4;
      for (let s = 1; s < segs; s++) {
        const f = s / segs;
        const nx = ax + (bx - ax) * f + (Math.random() - 0.5) * 10;
        const ny = ay + (by - ay) * f + (Math.random() - 0.5) * 10;
        ctx.lineTo(nx, ny);
      }
      ctx.lineTo(bx, by);
      ctx.stroke();
      drawGlow(ctx, bx, by, 10, (1 - p) * 0.7);
    }
  }
  ctx.globalCompositeOperation = 'source-over';

  for (const fx of g.effects) {
    if (fx.kind !== 'smoke') continue;
    const p = fx.t / fx.ttl;
    const r = (fx.r ?? 12) * (1 + p * 0.7);
    ctx.globalAlpha = (1 - p) * 0.8;
    ctx.drawImage(smoke!, fx.x - r, fx.y - p * 10 - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 1;

  // While aiming, the palette ghost must go away — otherwise the range circle
  // for the NEXT tower keeps riding the cursor on top of the aim line.
  if (ui.placing && ui.mouseIn && ui.aiming < 0) {
    const cx = clamp((ui.mouseX / CELL) | 0, 0, COLS - 1);
    const cy = clamp((ui.mouseY / CELL) | 0, 0, ROWS - 1);
    const def = TOWER_DEFS[ui.placing];
    const ok = canPlace(g, cx, cy, ui.placing) && g.gold >= def.cost;
    const px = cx * CELL + CELL / 2;
    const py = cy * CELL + CELL / 2;
    const col = ok ? PAL.cyan : '#e06052';
    if (def.range > 0) dashedCircle(ctx, px, py, def.range, col, 0.6);
    if (def.minRange) dashedCircle(ctx, px, py, def.minRange, '#e06052', 0.5);
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx * CELL + 2, cy * CELL + 2, CELL - 4, CELL - 4);
  }

  if (ui.strikeArmed && ui.mouseIn) {
    dashedCircle(
      ctx, ui.mouseX, ui.mouseY, STRIKE_RADIUS,
      g.strikeCd <= 0 ? PAL.fire : '#8a8577', 0.85,
    );
  }

  ctx.drawImage(vignette!, 0, 0);
}
