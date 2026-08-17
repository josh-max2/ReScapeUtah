// PAINT-DRIVEN MAP PIPELINE. The map IS an image (public/maps/*.png):
//   WHITE = road (walkable) · BLACK = walls · RED = spawn strip · GREEN = goal
// initTerrain() loads and classifies the image at canvas scale, builds a
// chamfer distance field for wall repulsion/collision, and extracts spawn and
// goal from the colored marks. Draw a new PNG -> get a new map.

import { CELL, COLS, ROWS, W, H, asset} from '../defs';

/**
 * THE LEVELS. One map is one level (owner-directed 2026-08-17), and the list
 * grows as maps are painted — adding one is: drop `public/maps/<id>.png`, add a
 * row here. Everything downstream keys off `id`, so the clear ledger, the token
 * awards and the level-select screen all pick a new level up for free, and
 * `scripts/maps.py` discovers the list from the game rather than hardcoding it.
 *
 * Order is play order; the display number is the index.
 */
export const LEVELS = [
  { id: 'map2', name: 'THE CLAW', blurb: 'Branching canyon. The original.' },
  { id: 'delta', name: 'DELTA', blurb: 'Splits three ways and rejoins.' },
  { id: 'coil', name: 'COIL', blurb: 'One long serpentine. Depth pays.' },
  { id: 'basin', name: 'BASIN', blurb: 'A wide bowl that funnels. AoE shines.' },
  { id: 'chicane', name: 'CHICANE', blurb: 'Nothing on it is a straight run.' },
] as const;

/**
 * Which level to load. Terrain is a top-level-await singleton built once at
 * boot, so the level is chosen BEFORE the module graph settles and changing it
 * means a reload — the honest, cheap version. `?map=` wins so harnesses and
 * demo links can pin a level without touching the player's save.
 *
 * The save key is still `track`: renaming a persisted field for vocabulary
 * would cost a migration and buy the player nothing.
 */
function pickLevel(): string {
  try {
    const q = new URLSearchParams(location.search).get('map');
    if (q && LEVELS.some((t) => t.id === q)) return q;
    const raw = localStorage.getItem('swarm-td-save');
    const id = raw ? (JSON.parse(raw) as { track?: string }).track : null;
    if (id && LEVELS.some((t) => t.id === id)) return id;
  } catch {
    // Unreadable save or storage: fall through to the default level.
  }
  return 'map2';
}

export const MAP_IMAGE = asset(`maps/${pickLevel()}.png`);

export const PATH_RADIUS = 40; // clearance cap: this far from a wall = fully clear

// Populated by initTerrain (ESM live bindings — read after init).
export let SPAWN_X = 90;
export let SPAWN_Y = 510;
export let SPAWN_Y1 = 400;
export let SPAWN_Y2 = 620;
export let GOAL_X = 1600;
export let GOAL_Y = 900;
export let GOAL_R = 46;
export let GOAL_R2 = GOAL_R * GOAL_R;

/** Canvas-scale RGBA of the map image (for the terrain painter). */
export let mapPixels: Uint8ClampedArray | null = null;

const DF_CELL = 4;
const DF_W = Math.ceil(W / DF_CELL) + 1;
const DF_H = Math.ceil(H / DF_CELL) + 1;
const open4 = new Uint8Array(DF_W * DF_H);   // 1 = road at this 4px sample
const distField = new Float32Array(DF_W * DF_H); // sampleDist semantics (see below)

function isWhite(d: Uint8ClampedArray, i: number): boolean {
  return d[i] > 180 && d[i + 1] > 180 && d[i + 2] > 180;
}

/** Two-pass chamfer distance transform (px units) toward cells where seed=0. */
function chamfer(seedOpen: boolean): Float32Array {
  const d = new Float32Array(DF_W * DF_H);
  for (let i = 0; i < d.length; i++) {
    d[i] = (open4[i] === 1) === seedOpen ? 0 : 1e9;
  }
  const A = DF_CELL, B = DF_CELL * 1.414;
  for (let y = 0; y < DF_H; y++) {
    for (let x = 0; x < DF_W; x++) {
      const i = y * DF_W + x;
      if (x > 0) d[i] = Math.min(d[i], d[i - 1] + A);
      if (y > 0) d[i] = Math.min(d[i], d[i - DF_W] + A);
      if (x > 0 && y > 0) d[i] = Math.min(d[i], d[i - DF_W - 1] + B);
      if (x < DF_W - 1 && y > 0) d[i] = Math.min(d[i], d[i - DF_W + 1] + B);
    }
  }
  for (let y = DF_H - 1; y >= 0; y--) {
    for (let x = DF_W - 1; x >= 0; x--) {
      const i = y * DF_W + x;
      if (x < DF_W - 1) d[i] = Math.min(d[i], d[i + 1] + A);
      if (y < DF_H - 1) d[i] = Math.min(d[i], d[i + DF_W] + A);
      if (x < DF_W - 1 && y < DF_H - 1) d[i] = Math.min(d[i], d[i + DF_W + 1] + B);
      if (x > 0 && y < DF_H - 1) d[i] = Math.min(d[i], d[i + DF_W - 1] + B);
    }
  }
  return d;
}

export async function initTerrain(): Promise<void> {
  const img = new Image();
  img.src = MAP_IMAGE;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, 0, 0, W, H);
  const data = ctx.getImageData(0, 0, W, H).data;
  mapPixels = data;

  // Classify 4px samples + collect spawn/goal marks.
  let redX = 0, redN = 0, redY1 = 1e9, redY2 = -1e9;
  let grnX = 0, grnY = 0, grnN = 0, grnX1 = 1e9, grnX2 = -1e9, grnY1 = 1e9, grnY2 = -1e9;
  for (let gy = 0; gy < DF_H; gy++) {
    for (let gx = 0; gx < DF_W; gx++) {
      const px = Math.min(W - 1, gx * DF_CELL);
      const py = Math.min(H - 1, gy * DF_CELL);
      const i = (py * W + px) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const white = isWhite(data, i);
      const red = r > 140 && g < 90 && b < 90;
      const green = g > 110 && r < 110 && b < 110;
      open4[gy * DF_W + gx] = white || red || green ? 1 : 0;
      if (red) {
        redX += px; redN++;
        if (py < redY1) redY1 = py;
        if (py > redY2) redY2 = py;
      }
      if (green) {
        grnX += px; grnY += py; grnN++;
        if (px < grnX1) grnX1 = px;
        if (px > grnX2) grnX2 = px;
        if (py < grnY1) grnY1 = py;
        if (py > grnY2) grnY2 = py;
      }
    }
  }

  if (redN > 0) {
    const rx = redX / redN;
    SPAWN_Y1 = redY1 + 14;
    SPAWN_Y2 = redY2 - 14;
    SPAWN_Y = (SPAWN_Y1 + SPAWN_Y2) / 2;
    // step inward from the strip until we stand on road
    let sx = rx + 10;
    for (let k = 0; k < 60; k++) {
      const gi = ((SPAWN_Y / DF_CELL) | 0) * DF_W + ((sx / DF_CELL) | 0);
      if (open4[gi] === 1) break;
      sx += DF_CELL;
    }
    SPAWN_X = sx + 12;
  }
  if (grnN > 0) {
    GOAL_X = grnX / grnN;
    GOAL_Y = grnY / grnN;
    GOAL_R = Math.min(60, Math.max(38, Math.max(grnX2 - grnX1, grnY2 - grnY1) * 0.35));
    GOAL_R2 = GOAL_R * GOAL_R;
  }

  // Keep a pristine copy. Drafted tiles edit the map in place, and both of
  // these are module state built once at boot — without a baseline, the next
  // run would inherit the last run's rocks.
  pristineOpen = open4.slice();
  pristinePixels = data.slice();
  rebuildDerived();
}

let pristineOpen: Uint8Array | null = null;
let pristinePixels: Uint8ClampedArray | null = null;

/** Undo every drafted tile: back to the track as painted. */
export function resetTerrain(): void {
  if (!pristineOpen || !pristinePixels || !mapPixels) return;
  open4.set(pristineOpen);
  mapPixels.set(pristinePixels);
  rebuildDerived();
}

/**
 * Rebuild everything derived from `open4`. Split out of initTerrain because
 * the map is no longer built once and frozen — drafted tiles edit the terrain
 * mid-run, and the distance field they feed (wall repel, collision,
 * projection) has to follow or cars will collide with walls that are gone and
 * drive through ones that are not.
 *
 * ~93k cells x two chamfer passes. Fine on a tile placement; do NOT call it
 * per frame.
 */
export function rebuildDerived(): void {
  // sampleDist: 0 in open field far from walls, rises to PATH_RADIUS at a
  // wall, and keeps rising inside walls (so projection can push back out).
  const dOut = chamfer(false); // distance from walls, valid on road
  const dIn = chamfer(true);   // distance from road, valid inside walls
  for (let i = 0; i < distField.length; i++) {
    distField[i] = open4[i] === 1
      ? Math.max(0, PATH_RADIUS - dOut[i])
      : PATH_RADIUS + dIn[i];
  }
}

/** Fine-grid geometry, exposed so tiles can edit the map. */
export const GRID = { W: DF_W, H: DF_H, CELL: DF_CELL };

/** Read/write access to the fine road mask. Editing it REQUIRES rebuildDerived. */
export function openAt(gx: number, gy: number): number {
  if (gx < 0 || gy < 0 || gx >= DF_W || gy >= DF_H) return 0;
  return open4[gy * DF_W + gx];
}

export function setOpen(gx: number, gy: number, v: 0 | 1): void {
  if (gx < 0 || gy < 0 || gx >= DF_W || gy >= DF_H) return;
  open4[gy * DF_W + gx] = v;
}

/** Snapshot / restore, so a tile can be tried and rolled back if it seals. */
export function snapshotOpen(): Uint8Array {
  return open4.slice();
}

export function restoreOpen(snap: Uint8Array): void {
  open4.set(snap);
}

export function isOpen(x: number, y: number): boolean {
  let gx = (x / DF_CELL) | 0;
  let gy = (y / DF_CELL) | 0;
  if (gx < 0) gx = 0; else if (gx >= DF_W) gx = DF_W - 1;
  if (gy < 0) gy = 0; else if (gy >= DF_H) gy = DF_H - 1;
  return open4[gy * DF_W + gx] === 1;
}

export function sampleDist(x: number, y: number): number {
  let gx = (x / DF_CELL) | 0;
  let gy = (y / DF_CELL) | 0;
  if (gx < 0) gx = 0; else if (gx >= DF_W) gx = DF_W - 1;
  if (gy < 0) gy = 0; else if (gy >= DF_H) gy = DF_H - 1;
  return distField[gy * DF_W + gx];
}

/** Direction toward the nearest wall (the sampleDist gradient), into out[0..1]. */
export function wallNormal(x: number, y: number, out: Float32Array): void {
  const dx = sampleDist(x + DF_CELL, y) - sampleDist(x - DF_CELL, y);
  const dy = sampleDist(x, y + DF_CELL) - sampleDist(x, y - DF_CELL);
  const l = Math.sqrt(dx * dx + dy * dy);
  if (l > 1e-4) {
    out[0] = dx / l;
    out[1] = dy / l;
  } else {
    out[0] = 0;
    out[1] = 0;
  }
}

/** A random open point, biased along the spawn->goal axis by t (perf probes). */
export function pointOnPath(t: number): [number, number] {
  for (let k = 0; k < 40; k++) {
    const x = SPAWN_X + (GOAL_X - SPAWN_X) * t + (Math.random() - 0.5) * 160;
    const y = 20 + Math.random() * (H - 40);
    if (isOpen(x, y) && sampleDist(x, y) < PATH_RADIUS - 10) return [x, y];
  }
  return [SPAWN_X, SPAWN_Y];
}

/**
 * Per-cell walkability by AREA COVERAGE of the fine samples — painted strands
 * narrower than a cell must stay connected in the flow field (a single
 * center-probe fragments them; px-level collision remains the wall truth).
 */
export function buildWalkMask(): Uint8Array {
  const walk = new Uint8Array(COLS * ROWS);
  const S = CELL / DF_CELL; // 4px samples per cell edge
  for (let cy = 0; cy < ROWS; cy++) {
    for (let cx = 0; cx < COLS; cx++) {
      let count = 0;
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const gx = cx * S + sx;
          const gy = cy * S + sy;
          if (gx < DF_W && gy < DF_H && open4[gy * DF_W + gx] === 1) count++;
        }
      }
      if (count >= 6) walk[cy * COLS + cx] = 1; // ~25% road coverage
    }
  }
  return walk;
}
