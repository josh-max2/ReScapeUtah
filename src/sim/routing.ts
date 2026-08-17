// ROUTE CHOICE — several shared routes, one sticky pick per car.
//
// THE PROBLEM: with a single shortest-DISTANCE field every car takes the same
// line, queues nose-to-tail, and only spills onto a parallel branch once
// physical crowd pressure shoves it there.
//
// WHAT DID NOT WORK, and why it is worth remembering: making that one field
// congestion-aware. Measured on DELTA it made spreading WORSE (busiest branch
// 0.82 -> 0.98). One shared gradient can only ever move the whole horde at
// once — it cannot split it. It herds everyone onto whatever is momentarily
// cheapest, and it even drags pressure-displaced cars back onto the main line,
// because a lone car on a side branch is the only density on it.
//
// WHAT WORKS: keep several DISTINCT shared routes, and let each car pick one
// on arrival based on how long that route currently looks. Because the pick is
// per-car and sticky, the horde SPLITS in a stable ratio: route 0 fills, its
// ETA rises, the next arrivals take route 1. That is the "route ETA" idea, and
// the only per-agent state is one byte naming a shared field — the routes
// themselves are still computed once for everyone, so the no-per-agent-
// pathfinding rule holds.
//
// ALL NUMBERS HERE ARE PROVISIONAL, pending playtest. The bar is "visibly
// spreads, never flaps" — not a tuned optimum.

import { COLS, ROWS, CELL, clamp } from '../defs';
import { FlowField, linkFields } from './flowfield';
import { SPAWN_X, SPAWN_Y1, SPAWN_Y2 } from './terrain';
import type { Game } from '../state';

/** How many alternates to keep. 3 covers a fork without tripling the cost. */
export const ROUTES = 3;

/** How hard queued traffic inflates a route's estimated time. */
const CONGESTION_K = 0.55;

/** How hard an alternate avoids the corridors of the routes above it. */
const AVOID_K = 1.6;

/** Corridor half-width, in cells, stamped around a traced route. */
const CORRIDOR_R = 3;

/** Sim-seconds between ETA/density refreshes. */
export const FLOW_INTERVAL = 0.33;

/** Weight kept from the previous density sample — deliberate hysteresis. */
const DENSITY_MEMORY = 0.55;

const N = COLS * ROWS;
const counts = new Uint16Array(N);
const corridor = new Uint8Array(N);

/** Live estimate per route, refreshed with the density. Lower is better. */
export const routeEta: number[] = new Array(ROUTES).fill(0);

/**
 * True length of each route in pixels, and the cells its centreline crosses.
 *
 * These are measured by WALKING the finished route, not read from
 * `field.cost`. That distinction cost an afternoon: `cost` includes the
 * avoidance penalty used to push an alternate away from the primary corridor,
 * so comparing costs made every alternate look 60-200% longer than it is and
 * route 0 always won. The penalty is a device for SHAPING a route, never a
 * statement about how long it takes to drive.
 */
const routeLen: number[] = new Array(ROUTES).fill(0);
const routeCells: Int32Array[] = [];
const routeCellN: number[] = new Array(ROUTES).fill(0);
for (let r = 0; r < ROUTES; r++) routeCells.push(new Int32Array(600));

/**
 * Walk a field's gradient from the rift and stamp the cells it uses. Bounded
 * by cell count, not by reaching the goal, so a degenerate field cannot spin.
 */
function stampCorridor(f: FlowField, out: Float32Array, r: number): void {
  corridor.fill(0);
  const y0 = SPAWN_Y1, y1 = SPAWN_Y2;
  const cells = routeCells[r];
  let cellN = 0;
  let longest = 0;
  for (let s = 0; s < 5; s++) {
    let px = SPAWN_X + 40;
    let py = y0 + ((y1 - y0) * s) / 4;
    let travelled = 0;
    for (let step = 0; step < 400; step++) {
      const cx = clamp((px / CELL) | 0, 0, COLS - 1);
      const cy = clamp((py / CELL) | 0, 0, ROWS - 1);
      const c = cy * COLS + cx;
      if (corridor[c] === 0 && cellN < cells.length) {
        cells[cellN++] = c;   // centreline cells, for the traffic measurement
      }
      corridor[c] = 1;
      const dx = f.dirX[c], dy = f.dirY[c];
      if (dx === 0 && dy === 0) break;
      px += dx * CELL * 0.7;
      py += dy * CELL * 0.7;
      travelled += CELL * 0.7;
      if (px < 0 || py < 0 || px >= COLS * CELL || py >= ROWS * CELL) break;
    }
    if (travelled > longest) longest = travelled;
  }
  routeLen[r] = longest;
  routeCellN[r] = cellN;
  // Thicken: a one-cell line would barely deflect the next route.
  for (let cy = 0; cy < ROWS; cy++) {
    for (let cx = 0; cx < COLS; cx++) {
      if (corridor[cy * COLS + cx] !== 1) continue;
      for (let oy = -CORRIDOR_R; oy <= CORRIDOR_R; oy++) {
        for (let ox = -CORRIDOR_R; ox <= CORRIDOR_R; ox++) {
          const nx = cx + ox, ny = cy + oy;
          if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
          out[ny * COLS + nx] = 1;
        }
      }
    }
  }
}

/** Count living enemies per cell, smoothed, onto every route field. */
export function sampleDensity(g: Game): void {
  counts.fill(0);
  const e = g.enemies;
  for (let i = 0; i < e.n; i++) {
    if (e.hp[i] <= 0) continue;
    const cx = clamp((e.x[i] / CELL) | 0, 0, COLS - 1);
    const cy = clamp((e.y[i] / CELL) | 0, 0, ROWS - 1);
    counts[cy * COLS + cx]++;
  }
  const d = g.routes[0].density;
  for (let c = 0; c < N; c++) {
    d[c] = d[c] * DENSITY_MEMORY + counts[c] * (1 - DENSITY_MEMORY);
  }
}

/**
 * Estimated time down each route: its length from the rift, inflated by the
 * traffic actually sitting on it. This is the number a car compares.
 */
function refreshEtas(g: Game): void {
  const d = g.routes[0].density;
  for (let r = 0; r < ROUTES; r++) {
    const len = routeLen[r];
    const n = routeCellN[r];
    if (len <= 0 || n === 0) { routeEta[r] = Infinity; continue; }
    // Traffic on the cells this route actually drives through. Averaging over
    // the FATTENED corridor instead dilutes a real jam with the empty verge
    // beside it, and the ETAs then barely move apart.
    let load = 0;
    const cells = routeCells[r];
    for (let k = 0; k < n; k++) load += d[cells[k]];
    routeEta[r] = len * (1 + CONGESTION_K * (load / n));
  }
}

/** The route a car arriving now should take: whichever looks quickest. */
export function pickRoute(): number {
  let best = 0;
  for (let r = 1; r < ROUTES; r++) if (routeEta[r] < routeEta[best]) best = r;
  return best;
}

/**
 * Rebuild every route. Called whenever the obstacles change, so the routes can
 * never disagree about where the walls are.
 *
 * Route 0 is the plain shortest path and stays canonical — it IS `g.field`,
 * which everything except enemy steering reads. Each alternate is computed
 * avoiding the corridors of the routes above it, which is what makes it a
 * genuinely different line rather than a noisy copy.
 */
export function recomputeFields(g: Game): void {
  linkFields(g.field, ...g.routes.slice(1));
  const acc = new Float32Array(N);
  for (let r = 0; r < ROUTES; r++) {
    const f = g.routes[r];
    f.avoid.set(acc);
    f.compute(0);
    // Remember this route's own corridor for the ETA load measurement, then
    // fold it into what the NEXT route avoids.
    f.avoidOwn.fill(0);
    stampCorridor(f, f.avoidOwn, r);
    for (let c = 0; c < N; c++) if (f.avoidOwn[c] > 0) acc[c] = AVOID_K;
  }
  refreshEtas(g);
}

/**
 * Periodic refresh. Paced on SIM time so it scales with the speed control, and
 * skipped while `flowPaused` — a harness staging an exact pack of enemies must
 * not have its own cars re-steering the thing it is measuring.
 *
 * Only the density and the ETAs move here. The fields themselves are geometry
 * and only change when the obstacles do, which keeps this cheap.
 */
export function tickRouting(g: Game, dt: number): void {
  if (g.flowPaused) return;
  g.flowAcc += dt;
  if (g.flowAcc < FLOW_INTERVAL) return;
  g.flowAcc = 0;
  sampleDensity(g);
  refreshEtas(g);
}
