// Pre-rendered layers and sprites. Everything expensive is painted once here;
// the per-frame renderer only composites. The terrain is painted from the SAME
// polyline that drives walkability (sim/terrain.ts), so art and sim agree.

import { W, H, PAL, ENEMY_TYPES, asset} from '../defs';
import {
  SPAWN_X, SPAWN_Y1, SPAWN_Y2, GOAL_X, GOAL_Y, mapPixels, sampleDist, isOpen,
  PATH_RADIUS,
} from '../sim/terrain';

function mk(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

// ---- Generated terrain textures (art/gen_sprites.py -> public/textures) ----
// Loaded once at boot; buildTerrain tiles them per material.
const TEX_FILES = {
  dirt: asset('textures/terrain_dirt.png'),
  grass: asset('textures/terrain_grass.png'),
  rock: asset('textures/terrain_rock.png'),
} as const;

export const TEX: Record<keyof typeof TEX_FILES, HTMLImageElement | null> = {
  dirt: null, grass: null, rock: null,
};

export async function initArt(): Promise<void> {
  await Promise.all((Object.keys(TEX_FILES) as (keyof typeof TEX_FILES)[]).map(async (k) => {
    const img = new Image();
    img.src = TEX_FILES[k];
    try {
      await img.decode();
      TEX[k] = img;
    } catch {
      TEX[k] = null; // fall back to flat colour painting
    }
  }));
}

function thicketCluster(ctx: CanvasRenderingContext2D, cx: number, cy: number, count: number, spread: number): void {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.random() * spread;
    ctx.fillStyle = [PAL.thicket, PAL.thicket2, '#2e3c15'][(Math.random() * 3) | 0];
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 5 + Math.random() * 9, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function buildTerrain(): HTMLCanvasElement {
  const [c, ctx] = mk(W, H);
  const src = mapPixels!;

  if (TEX.dirt && TEX.rock) {
    // --- textured path: tile real materials, then shade them ---
    // 1. rock everywhere (the wall mass)
    const rockPat = ctx.createPattern(TEX.rock, 'repeat')!;
    ctx.fillStyle = rockPat;
    ctx.fillRect(0, 0, W, H);
    // 2. grass over the deep wall interiors, so walls aren't uniform stone
    if (TEX.grass) {
      const [gc, gctx] = mk(W, H);
      gctx.fillStyle = gctx.createPattern(TEX.grass, 'repeat')!;
      gctx.fillRect(0, 0, W, H);
      const gmask = gctx.createImageData(W, H);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          const open = src[i] > 140 || src[i + 1] > 110;
          const depth = sampleDist(x, y) - PATH_RADIUS;
          // fade grass in only well inside the wall mass
          const a = !open ? Math.min(1, Math.max(0, (depth - 10) / 26)) : 0;
          gmask.data[i] = 255; gmask.data[i + 1] = 255; gmask.data[i + 2] = 255;
          gmask.data[i + 3] = (a * 235) | 0;
        }
      }
      const [mc, mctx] = mk(W, H);
      mctx.putImageData(gmask, 0, 0);
      gctx.globalCompositeOperation = 'destination-in';
      gctx.drawImage(mc, 0, 0);
      ctx.drawImage(gc, 0, 0);
    }
    // 3. dirt on the road, masked by the map
    const [dc, dctx] = mk(W, H);
    dctx.fillStyle = dctx.createPattern(TEX.dirt, 'repeat')!;
    dctx.fillRect(0, 0, W, H);
    const dmask = dctx.createImageData(W, H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const open = src[i] > 140 || src[i + 1] > 110;
        dmask.data[i] = 255; dmask.data[i + 1] = 255; dmask.data[i + 2] = 255;
        dmask.data[i + 3] = open ? 255 : 0;
      }
    }
    const [mc2, mctx2] = mk(W, H);
    mctx2.putImageData(dmask, 0, 0);
    dctx.globalCompositeOperation = 'destination-in';
    dctx.drawImage(mc2, 0, 0);
    ctx.drawImage(dc, 0, 0);
    // 4. shading pass: carved rim, worn centre, sunlit wall edge — alpha only,
    //    so the material detail underneath survives.
    const shade = ctx.createImageData(W, H);
    const sd2 = shade.data;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const open = src[i] > 140 || src[i + 1] > 110;
        let r = 0, g = 0, b = 0, a = 0;
        if (open) {
          const clear = PATH_RADIUS - sampleDist(x, y);
          if (clear < 10) { a = (1 - clear / 10) * 150; }      // dark carved edge
          else if (clear > 26) { r = g = b = 255; a = 26; }    // worn, sunlit centre
        } else {
          const depth = sampleDist(x, y) - PATH_RADIUS;
          if (depth < 7) { r = 255; g = 240; b = 200; a = 70 * (1 - depth / 7); } // rim light
          else { a = Math.min(120, 40 + depth * 2.2); }        // mass falls into shadow
        }
        sd2[i] = r; sd2[i + 1] = g; sd2[i + 2] = b; sd2[i + 3] = a | 0;
      }
    }
    const [sc, sctx] = mk(W, H);
    sctx.putImageData(shade, 0, 0);
    ctx.drawImage(sc, 0, 0);
  } else {
    // --- fallback: flat-colour painting (no textures present) ---
    const img = ctx.createImageData(W, H);
    const od = img.data;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const open = src[i] > 140 || src[i + 1] > 110;
        const hsh = ((x * 73856093) ^ (y * 19349663)) >>> 0;
        const nv = (((hsh >>> 9) & 31) / 31 - 0.5) * 0.14;
        let r: number, g: number, b: number;
        if (open) {
          const clear = PATH_RADIUS - sampleDist(x, y);
          if (clear < 7) { r = 93; g = 73; b = 54; }
          else if (clear > 26) { r = 160; g = 128; b = 89; }
          else { r = 143; g = 115; b = 80; }
          const s2 = 1 + nv;
          r *= s2; g *= s2; b *= s2;
        } else {
          const depth = sampleDist(x, y) - PATH_RADIUS;
          if (depth < 9) { r = 84; g = 72; b = 50; }
          else { r = 48; g = 50; b = 33; }
          const s2 = 1 + nv * 1.4;
          r *= s2; g *= s2; b *= s2;
        }
        od[i] = r; od[i + 1] = g; od[i + 2] = b; od[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    for (let k = 0; k < 60; k++) {
      const gx = Math.random() * W;
      const gy = Math.random() * H;
      if (isOpen(gx, gy)) continue;
      if (sampleDist(gx, gy) - PATH_RADIUS < 14) continue;
      thicketCluster(ctx, gx, gy, 3 + ((Math.random() * 4) | 0), 14 + Math.random() * 22);
    }
  }
  // Spawn rift: a tall glowing tear along the left edge (the sketch's strip)
  const glow = ctx.createLinearGradient(SPAWN_X - 55, 0, SPAWN_X + 55, 0);
  glow.addColorStop(0, 'rgba(104,21,12,0)');
  glow.addColorStop(0.5, 'rgba(104,21,12,0.55)');
  glow.addColorStop(1, 'rgba(104,21,12,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(SPAWN_X - 55, SPAWN_Y1 - 40, 110, SPAWN_Y2 - SPAWN_Y1 + 80);
  ctx.fillStyle = '#120d09';
  ctx.beginPath();
  ctx.roundRect(SPAWN_X - 15, SPAWN_Y1 - 18, 30, SPAWN_Y2 - SPAWN_Y1 + 36, 15);
  ctx.fill();
  ctx.strokeStyle = '#7a2013';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(SPAWN_X - 15, SPAWN_Y1 - 18, 30, SPAWN_Y2 - SPAWN_Y1 + 36, 15);
  ctx.stroke();
  // The fort
  const fs = 38; // half-size
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(GOAL_X - fs + 3, GOAL_Y - fs + 5, fs * 2, fs * 2);
  ctx.fillStyle = PAL.steelDark;
  ctx.fillRect(GOAL_X - fs, GOAL_Y - fs, fs * 2, fs * 2);
  ctx.strokeStyle = PAL.steelHi;
  ctx.lineWidth = 3;
  ctx.strokeRect(GOAL_X - fs + 1.5, GOAL_Y - fs + 1.5, fs * 2 - 3, fs * 2 - 3);
  ctx.fillStyle = PAL.steel;
  ctx.fillRect(GOAL_X - fs + 10, GOAL_Y - fs + 10, fs * 2 - 20, fs * 2 - 20);
  ctx.strokeStyle = '#2a303a';
  ctx.lineWidth = 2;
  ctx.strokeRect(GOAL_X - fs + 10, GOAL_Y - fs + 10, fs * 2 - 20, fs * 2 - 20);
  ctx.fillStyle = PAL.steelHi;
  ctx.fillRect(GOAL_X - 4, GOAL_Y - 4, 8, 8);
  return c;
}

export function buildVignette(): HTMLCanvasElement {
  const [c, ctx] = mk(W, H);
  const g = ctx.createRadialGradient(W / 2, H * 0.46, H * 0.55, W / 2, H * 0.46, W * 0.62);
  g.addColorStop(0, 'rgba(27,19,11,0)');
  g.addColorStop(1, 'rgba(27,19,11,0.34)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  return c;
}

/** Soft warm radial glow, drawn additively at any scale. */
export function buildFireGlow(): HTMLCanvasElement {
  const size = 64;
  const [c, ctx] = mk(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,243,196,0.95)');
  g.addColorStop(0.4, 'rgba(255,217,119,0.55)');
  g.addColorStop(1, 'rgba(255,217,119,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

/**
 * Aura disc, pre-rendered once and drawImage'd per carrier. Creating a canvas
 * gradient per carrier per frame cost ~50fps at horde scale — never do that.
 */
export function buildAura(rgb: string): HTMLCanvasElement {
  const size = 128;
  const [c, ctx] = mk(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.12, size / 2, size / 2, size / 2);
  g.addColorStop(0, `rgba(${rgb},0.20)`);
  g.addColorStop(0.72, `rgba(${rgb},0.10)`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = `rgba(${rgb},0.55)`;
  ctx.lineWidth = 3;
  ctx.setLineDash([9, 11]);
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 3, 0, Math.PI * 2);
  ctx.stroke();
  return c;
}

export function buildSmoke(): HTMLCanvasElement {
  const size = 48;
  const [c, ctx] = mk(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(201,194,184,0.55)');
  g.addColorStop(0.7, 'rgba(201,194,184,0.28)');
  g.addColorStop(1, 'rgba(201,194,184,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

export const CAR_DIRS = 64; // rotation steps — reads as free rotation at dot scale

/**
 * Oriented car sprites, pre-rendered at CAR_DIRS headings for every type:
 * elongated rounded body, light windshield band toward the nose, darker tail,
 * wheel nubs on the heavy types.
 */
export function buildCarSprites(type: number, mul = 1): HTMLCanvasElement[] {
  const def = ENEMY_TYPES[type];
  const r = def.r * mul;
  // Darts are sleek speedsters; everything else is a stockier car.
  const len = type === 1 ? r * 3.4 : r * 2.8;
  const wid = type === 1 ? r * 1.7 : r * 2.0;
  const size = Math.ceil(len + 6);
  const out: HTMLCanvasElement[] = [];
  for (let d = 0; d < CAR_DIRS; d++) {
    const [c, ctx] = mk(size, size);
    ctx.translate(size / 2, size / 2);
    ctx.rotate((d / CAR_DIRS) * Math.PI * 2);
    const hl = len / 2, hw = wid / 2;
    // wheel nubs (heavies only — unreadable at mite scale)
    if (r >= 4) {
      ctx.fillStyle = '#15190d';
      for (const wx of [-hl * 0.55, hl * 0.45]) {
        ctx.fillRect(wx - r * 0.35, -hw - 1.2, r * 0.7, 1.6);
        ctx.fillRect(wx - r * 0.35, hw - 0.4, r * 0.7, 1.6);
      }
    }
    // outline + body
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.beginPath();
    ctx.roundRect(-hl - 1, -hw - 1, len + 2, wid + 2, hw * 0.7);
    ctx.fill();
    ctx.fillStyle = def.name === 'titan' ? '#2e2420' : def.color;
    ctx.beginPath();
    ctx.roundRect(-hl, -hw, len, wid, hw * 0.6);
    ctx.fill();
    // windshield band toward the nose
    ctx.fillStyle = def.nose;
    ctx.beginPath();
    ctx.roundRect(hl * 0.15, -hw + 0.8, hl * 0.55, wid - 1.6, 1);
    ctx.fill();
    // darker tail
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(-hl + 0.5, -hw + 0.8, hl * 0.3, wid - 1.6);
    if (def.name === 'titan') {
      // titan: amber core on the roof
      ctx.fillStyle = def.color;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2);
      ctx.fill();
    }
    out.push(c);
  }
  return out;
}

/**
 * Persistent ground-history layer, cleared per run: oil puddles where cars are
 * wrecked, rubber streaks where they corner or scrape hard. Builds up exactly
 * where the fighting and the friction actually happen.
 */
export class GroundLayer {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    const [c, ctx] = mk(W, H);
    this.canvas = c;
    this.ctx = ctx;
  }

  clear(): void {
    this.ctx.clearRect(0, 0, W, H);
  }

  /** Oil puddle at a wreck site: dark blot + a faint blue-gray sheen glint. */
  oil(x: number, y: number, r: number): void {
    const ctx = this.ctx;
    const jx = x + (Math.random() - 0.5) * 4;
    const jy = y + (Math.random() - 0.5) * 4;
    const rot = Math.random() * Math.PI;
    ctx.globalAlpha = 0.16 + Math.random() * 0.16;
    ctx.fillStyle = PAL.oil;
    ctx.beginPath();
    ctx.ellipse(jx, jy, r * (1.1 + Math.random()), r * (0.8 + Math.random() * 0.6), rot, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = PAL.oilSheen;
    ctx.beginPath();
    ctx.ellipse(jx - r * 0.25, jy - r * 0.2, r * 0.45, r * 0.28, rot, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  /** Twin rubber streaks along the car's heading. Low alpha — bands emerge from traffic. */
  skid(x: number, y: number, heading: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(heading);
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = PAL.rubber;
    ctx.fillRect(-3.5, -1.8, 7, 1.1);
    ctx.fillRect(-3.5, 0.7, 7, 1.1);
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
