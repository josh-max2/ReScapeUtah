// Flow field: Dijkstra integration field from the base across the grid, then a
// per-cell normalized direction toward descending cost. All enemies share it.
// Tower cells are traversable at high cost — hordes route around your line when
// they can and chew through it when they can't. Recomputed only when towers
// change (cheap: ~2k cells).

import { COLS, ROWS, CELL, clamp } from '../defs';
import { buildWalkMask, GOAL_X, GOAL_Y, GOAL_R, SPAWN_X, SPAWN_Y1, SPAWN_Y2 } from './terrain';

/** Depth of the rift band cars spawn inside — must match the Spawner. */
const SPAWN_BAND = 96;

const N = COLS * ROWS;
const SQRT2 = Math.SQRT2;
const TOWER_COST = 60; // traversal multiplier for a tower cell

export class FlowField {
  cost = new Float64Array(N);
  dirX = new Float32Array(N);
  dirY = new Float32Array(N);
  blocked = new Uint8Array(N);  // 1 = tower occupies this cell
  wallCell = new Uint8Array(N); // 1 = barrier: ~15x harsher than a tower, so the
                                // horde only ever breaches it when fully sealed
  walk = buildWalkMask();       // 0 = off-channel terrain, hard wall for enemies
  sealed = false;               // true when barriers fully cut the route
  version = 0;                  // bumps on every compute (racing-line cache key)

  /**
   * Two-pass: walls are fully impassable while any open route exists (they take
   * zero damage). Only when the track is sealed does the field route through
   * them — and then the horde chews.
   */
  compute(): void {
    this.version++;
    this.runPass(true);
    if (this.spawnReachable()) {
      this.sealed = false;
    } else {
      this.sealed = true;
      this.runPass(false);
    }
  }

  /**
   * Can the horde get out of the rift at all? Cost is distance-to-goal, so a
   * spawn cell with finite cost has a route.
   *
   * This scans the whole rift BAND rather than probing one cell. Probing a
   * single point was wrong twice over: the rift is 96px deep and cars spawn
   * anywhere inside it, and SPAWN_X is derived from the fine distance-field
   * grid (then nudged +12px) while this mask is the coarse CELL grid built by
   * area coverage — so the probe could land on a cell this mask calls solid.
   * When that happened the field reported sealed with zero walls on the map,
   * which silently made walls chewable from wave 1 and disabled the entire
   * invulnerable-unless-sealed rule.
   */
  private spawnReachable(): boolean {
    const cx0 = clamp((SPAWN_X / CELL) | 0, 0, COLS - 1);
    const cx1 = clamp(((SPAWN_X + SPAWN_BAND) / CELL) | 0, 0, COLS - 1);
    const cy0 = clamp((SPAWN_Y1 / CELL) | 0, 0, ROWS - 1);
    const cy1 = clamp((SPAWN_Y2 / CELL) | 0, 0, ROWS - 1);
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const c = cy * COLS + cx;
        if (this.walk[c] === 1 && isFinite(this.cost[c])) return true;
      }
    }
    return false;
  }

  private runPass(wallsHard: boolean): void {
    const cost = this.cost;
    const blocked = this.blocked;
    cost.fill(Infinity);

    // Binary min-heap of (cell, cost) pairs in parallel arrays.
    const hi: number[] = [];
    const hc: number[] = [];
    const push = (i: number, c: number): void => {
      let k = hi.length;
      hi.push(i); hc.push(c);
      while (k > 0) {
        const p = (k - 1) >> 1;
        if (hc[p] <= hc[k]) break;
        const ti = hi[p]; hi[p] = hi[k]; hi[k] = ti;
        const tc = hc[p]; hc[p] = hc[k]; hc[k] = tc;
        k = p;
      }
    };
    const pop = (): number => {
      const top = hi[0];
      const li = hi.pop()!;
      const lc = hc.pop()!;
      if (hi.length > 0) {
        hi[0] = li; hc[0] = lc;
        let k = 0;
        for (;;) {
          const a = 2 * k + 1, b = 2 * k + 2;
          let m = k;
          if (a < hi.length && hc[a] < hc[m]) m = a;
          if (b < hi.length && hc[b] < hc[m]) m = b;
          if (m === k) break;
          const ti = hi[m]; hi[m] = hi[k]; hi[k] = ti;
          const tc = hc[m]; hc[m] = hc[k]; hc[k] = tc;
          k = m;
        }
      }
      return top;
    };

    // Seed: walkable cells at the fort are the goal.
    const goalR = GOAL_R + CELL;
    for (let cy = 0; cy < ROWS; cy++) {
      for (let cx = 0; cx < COLS; cx++) {
        const c = cy * COLS + cx;
        if (this.walk[c] === 0) continue;
        const dx = cx * CELL + CELL / 2 - GOAL_X;
        const dy = cy * CELL + CELL / 2 - GOAL_Y;
        if (dx * dx + dy * dy <= goalR * goalR) {
          cost[c] = 0;
          push(c, 0);
        }
      }
    }

    while (hi.length > 0) {
      const c0 = hc[0];
      const i = pop();
      if (c0 > cost[i]) continue; // stale entry
      const cx = i % COLS;
      const cy = (i / COLS) | 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
          const n = ny * COLS + nx;
          if (this.walk[n] === 0) continue; // off-channel: never relaxed
          if (wallsHard && this.wallCell[n] === 1) continue; // barriers: no route
          if (dx !== 0 && dy !== 0) {
            // No corner-cutting: a diagonal is only routable when both
            // orthogonal neighbors are open — cars can't squeeze corners.
            const o1 = cy * COLS + nx;
            const o2 = ny * COLS + cx;
            if (this.walk[o1] === 0 || blocked[o1] === 1) continue;
            if (this.walk[o2] === 0 || blocked[o2] === 1) continue;
          }
          const step = (dx !== 0 && dy !== 0) ? SQRT2 : 1;
          const w = step * (this.wallCell[n] ? 900 : blocked[n] ? TOWER_COST : 1);
          const nc = c0 + w;
          if (nc < cost[n]) {
            cost[n] = nc;
            push(n, nc);
          }
        }
      }
    }

    // Direction: toward the cheapest neighbor, then one smoothing pass.
    const rawX = new Float32Array(N);
    const rawY = new Float32Array(N);
    for (let cy = 0; cy < ROWS; cy++) {
      for (let cx = 0; cx < COLS; cx++) {
        const i = cy * COLS + cx;
        if (cost[i] === 0) continue; // goal cells: zero dir
        // Steepest descent PER UNIT DISTANCE — comparing raw neighbor cost lets
        // a diagonal tie with the straight step and win on scan order, which
        // skews the whole field 45° (enemies drift to the map edge).
        let bx = 0, by = 0, bestRate = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = cx + dx, ny = cy + dy;
            if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
            const step = (dx !== 0 && dy !== 0) ? SQRT2 : 1;
            const rate = (cost[ny * COLS + nx] - cost[i]) / step;
            if (rate < bestRate) { bestRate = rate; bx = dx; by = dy; }
          }
        }
        const l = Math.hypot(bx, by) || 1;
        rawX[i] = bx / l;
        rawY[i] = by / l;
      }
    }
    for (let cy = 0; cy < ROWS; cy++) {
      for (let cx = 0; cx < COLS; cx++) {
        const i = cy * COLS + cx;
        if (cost[i] === 0 && this.walk[i] === 1) {
          // Goal cells: drive straight at the fort — a zero dir here strands
          // whatever enters the goal ring outside the exact leak radius.
          const gx = GOAL_X - (cx * CELL + CELL / 2);
          const gy = GOAL_Y - (cy * CELL + CELL / 2);
          const gl = Math.hypot(gx, gy);
          this.dirX[i] = gl > 1e-4 ? gx / gl : 0;
          this.dirY[i] = gl > 1e-4 ? gy / gl : 0;
          continue;
        }
        let sx = rawX[i] * 2, sy = rawY[i] * 2;
        if (cx > 0)        { sx += rawX[i - 1];    sy += rawY[i - 1]; }
        if (cx < COLS - 1) { sx += rawX[i + 1];    sy += rawY[i + 1]; }
        if (cy > 0)        { sx += rawX[i - COLS]; sy += rawY[i - COLS]; }
        if (cy < ROWS - 1) { sx += rawX[i + COLS]; sy += rawY[i + COLS]; }
        const l = Math.hypot(sx, sy);
        if (l > 1e-4) {
          this.dirX[i] = sx / l;
          this.dirY[i] = sy / l;
        } else {
          this.dirX[i] = 0;
          this.dirY[i] = 0;
        }
      }
    }

    // ---- escape gradient ----
    // NO cell may end with a zero direction. Wall and tower cells are excluded
    // from the hard pass, so they finish unreachable with dir 0 — and any car
    // shoved onto or wedged against one then has nothing to steer by and grinds
    // in place until the drain cull. (This is the same failure the goal-cell
    // special case above already guards against, generalised to the whole map.)
    // Each sweep points a dead cell at its cheapest neighbour, so directions
    // propagate outward from live ground into walls and pockets.
    for (let sweep = 0; sweep < 4; sweep++) {
      let changed = 0;
      for (let cy = 0; cy < ROWS; cy++) {
        for (let cx = 0; cx < COLS; cx++) {
          const i = cy * COLS + cx;
          if (this.dirX[i] !== 0 || this.dirY[i] !== 0) continue;
          let bestScore = Infinity;
          let best = -1;
          for (let oy = -1; oy <= 1; oy++) {
            for (let ox = -1; ox <= 1; ox++) {
              if (ox === 0 && oy === 0) continue;
              const nx = cx + ox, ny = cy + oy;
              if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
              const n = ny * COLS + nx;
              const reachable = isFinite(cost[n]);
              const steered = this.dirX[n] !== 0 || this.dirY[n] !== 0;
              if (!reachable && !steered) continue;
              // Prefer genuinely routable ground; fall back to any cell that
              // at least knows which way is out.
              const score = reachable ? cost[n] : 1e9;
              if (score < bestScore) { bestScore = score; best = n; }
            }
          }
          if (best < 0) continue;
          const dx = (best % COLS) - cx;
          const dy = ((best / COLS) | 0) - cy;
          const l2 = Math.hypot(dx, dy) || 1;
          this.dirX[i] = dx / l2;
          this.dirY[i] = dy / l2;
          changed++;
        }
      }
      if (changed === 0) break;
    }
  }
}
