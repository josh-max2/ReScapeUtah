// DRAFTED TILES — the map is no longer fixed.
//
// Every surge offers three pieces; taking one lets the player edit the track
// itself. This is the Rogue-Tower idea adapted to continuous flow: nothing
// pauses to present the draft, the offer just sits there until it is used or
// the next surge replaces it.
//
// The design steer is crowd SHAPE, not stats. Each tile does one thing to the
// flow — split it, pinch it, or open a new way through — which is the
// vocabulary the fixed-angle towers want to play against.
//
// THE RULE THAT MAKES THIS SAFE: a tile is stamped onto a snapshot, the result
// is checked for a spawn->goal route, and it is ROLLED BACK if the track no
// longer connects. A sealed map is unrecoverable mid-run — the horde would
// chew a wall that no longer has a way past it — so the check happens before
// the player is ever told the placement succeeded.

import { COLS, ROWS, CELL, W, H, clamp } from '../defs';
import {
  GRID, openAt, setOpen, snapshotOpen, restoreOpen, rebuildDerived,
  buildWalkMask, SPAWN_X, SPAWN_Y1, SPAWN_Y2, GOAL_X, GOAL_Y, GOAL_R, mapPixels,
} from './terrain';
import { invalidateTerrain } from '../render/draw';
import type { Game } from '../state';
import { recomputeFields } from './routing';

export type TileKind = 'island' | 'narrows' | 'bypass';

export interface TileDef {
  kind: TileKind;
  name: string;
  desc: string;
  /** Half-extent of the stamp in world pixels — also the ghost's size. */
  r: number;
  /** What the tile needs under it to be worth placing. */
  wants: 'road' | 'wall';
}

export const TILE_DEFS: Record<TileKind, TileDef> = {
  island: {
    kind: 'island', name: 'ISLAND', r: 44, wants: 'road',
    desc: 'Drops a rock in the road. The flow splits around it — and rocks are where weapons mount.',
  },
  narrows: {
    kind: 'narrows', name: 'NARROWS', r: 56, wants: 'road',
    desc: 'Pinches the track from both sides. Everything bunches through the gap.',
  },
  bypass: {
    kind: 'bypass', name: 'BYPASS', r: 52, wants: 'wall',
    desc: 'Cuts a new way through. Opens a branch that thins the traffic elsewhere.',
  },
};

export const TILE_KINDS: TileKind[] = ['island', 'narrows', 'bypass'];

/** Stamp one tile into the fine road mask. Caller handles rebuild + rollback. */
function stamp(def: TileDef, x: number, y: number): void {
  const g = GRID;
  const gx0 = ((x - def.r) / g.CELL) | 0;
  const gy0 = ((y - def.r) / g.CELL) | 0;
  const gx1 = ((x + def.r) / g.CELL) | 0;
  const gy1 = ((y + def.r) / g.CELL) | 0;
  for (let gy = gy0; gy <= gy1; gy++) {
    for (let gx = gx0; gx <= gx1; gx++) {
      const px = gx * g.CELL - x;
      const py = gy * g.CELL - y;
      const d = Math.hypot(px, py);
      switch (def.kind) {
        case 'island':
          // A solid blob: the horde has to go round it.
          if (d <= def.r) setOpen(gx, gy, 0);
          break;
        case 'narrows':
          // Two nubs top and bottom, leaving a gap on the centreline.
          if (d <= def.r && Math.abs(py) > def.r * 0.34) setOpen(gx, gy, 0);
          break;
        case 'bypass':
          // Carve road through whatever is there.
          if (d <= def.r) setOpen(gx, gy, 1);
          break;
      }
    }
  }
}

/**
 * Paint the same shape into the SOURCE IMAGE PIXELS.
 *
 * The terrain art is pre-rendered once from the map image, not from the road
 * mask — so editing `open4` alone changes where cars can drive while the
 * picture underneath still shows the old track. Patching the pixels too, then
 * invalidating the cached canvas, keeps what the player sees and what the sim
 * believes as one thing.
 */
function paintPixels(def: TileDef, x: number, y: number): void {
  const px = mapPixels;
  if (!px) return;
  const road = def.kind === 'bypass';
  const x0 = Math.max(0, Math.round(x - def.r));
  const x1 = Math.min(W - 1, Math.round(x + def.r));
  const y0 = Math.max(0, Math.round(y - def.r));
  const y1 = Math.min(H - 1, Math.round(y + def.r));
  for (let py = y0; py <= y1; py++) {
    for (let qx = x0; qx <= x1; qx++) {
      const dx = qx - x, dy = py - y;
      const d = Math.hypot(dx, dy);
      if (d > def.r) continue;
      if (def.kind === 'narrows' && Math.abs(dy) <= def.r * 0.34) continue;
      const i = (py * W + qx) * 4;
      const v = road ? 255 : 0;
      px[i] = v; px[i + 1] = v; px[i + 2] = v; px[i + 3] = 255;
    }
  }
}

/**
 * Can the rift still reach the fort? Flood fill on the COARSE walk mask, which
 * is the same grid the flow field routes on — checking the fine mask instead
 * would pass placements that the area-coverage classifier then calls solid.
 */
function routeExists(walk: Uint8Array): boolean {
  const seen = new Uint8Array(COLS * ROWS);
  const queue = new Int32Array(COLS * ROWS);
  let head = 0, tail = 0;
  const gy0 = clamp((SPAWN_Y1 / CELL) | 0, 0, ROWS - 1);
  const gy1 = clamp((SPAWN_Y2 / CELL) | 0, 0, ROWS - 1);
  const gx0 = clamp((SPAWN_X / CELL) | 0, 0, COLS - 1);
  for (let cy = gy0; cy <= gy1; cy++) {
    for (let cx = gx0; cx <= gx0 + 5 && cx < COLS; cx++) {
      const c = cy * COLS + cx;
      if (walk[c] === 1 && seen[c] === 0) { seen[c] = 1; queue[tail++] = c; }
    }
  }
  const goalC = clamp((GOAL_X / CELL) | 0, 0, COLS - 1);
  const goalR = clamp((GOAL_Y / CELL) | 0, 0, ROWS - 1);
  const reach = Math.ceil((GOAL_R + CELL) / CELL);
  while (head < tail) {
    const c = queue[head++];
    const cx = c % COLS, cy = (c / COLS) | 0;
    if (Math.abs(cx - goalC) <= reach && Math.abs(cy - goalR) <= reach) return true;
    for (const n of [c - 1, c + 1, c - COLS, c + COLS]) {
      if (n < 0 || n >= COLS * ROWS) continue;
      if (Math.abs((n % COLS) - cx) > 1) continue; // row wrap
      if (walk[n] === 1 && seen[n] === 0) { seen[n] = 1; queue[tail++] = n; }
    }
  }
  return false;
}

/** Would this placement be legal? Cheap enough for a ghost every frame. */
export function tileAllowed(g: Game, kind: TileKind, x: number, y: number): boolean {
  const def = TILE_DEFS[kind];
  if (x < def.r || y < def.r || x > COLS * CELL - def.r || y > ROWS * CELL - def.r) {
    return false;
  }
  // Never on top of the rift or the fort: sealing either is unrecoverable and
  // burying the fort would end the run to no purpose.
  if (x < SPAWN_X + 140) return false;
  if (Math.hypot(x - GOAL_X, y - GOAL_Y) < GOAL_R + 110) return false;
  // Never on top of what the player already built.
  for (const t of g.towers) {
    if (Math.hypot(t.x - x, t.y - y) < def.r + 14) return false;
  }
  // It has to have something to work on.
  const gx = (x / GRID.CELL) | 0, gy = (y / GRID.CELL) | 0;
  const on = openAt(gx, gy) === 1;
  return def.wants === 'road' ? on : !on;
}

/**
 * Place a tile for real. Returns false and leaves the map untouched if the
 * result would cut the track — the rollback is the whole safety story here.
 */
export function placeTile(g: Game, kind: TileKind, x: number, y: number): boolean {
  if (!tileAllowed(g, kind, x, y)) return false;
  const before = snapshotOpen();
  stamp(TILE_DEFS[kind], x, y);
  const walk = buildWalkMask();
  if (!routeExists(walk)) {
    restoreOpen(before);
    return false;
  }
  // Committed: rebuild the distance field the car physics reads, repoint every
  // route field at the new walk mask, and recompute.
  paintPixels(TILE_DEFS[kind], x, y);
  invalidateTerrain();
  rebuildDerived();
  for (const f of g.routes) f.walk = walk;
  g.field.walk = walk;
  g.tiles.push({ kind, x, y });
  // Every route must be re-derived from the new map. This also bumps
  // field.version, which is the route-preview cache key — without it the
  // preview would keep drawing lines through a rock the player just placed.
  recomputeFields(g);
  return true;
}

/** Three offers, always including at least one that opens rather than blocks. */
export function rollDraft(): TileKind[] {
  const pool: TileKind[] = ['island', 'narrows', 'bypass'];
  const out: TileKind[] = ['bypass'];
  while (out.length < 3) {
    const k = pool[(Math.random() * pool.length) | 0];
    out.push(k);
  }
  // Shuffle so 'bypass' is not always first.
  for (let i = out.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const t = out[i]; out[i] = out[j]; out[j] = t;
  }
  return out;
}
