// Wave composition + streaming spawner. Budget grows exponentially; new enemy
// types phase in as waves progress; a titan anchors every 5th wave.

import {
  ENEMY_TYPES, SWARMER, RUNNER, HAULER, SPLITTER, SHIELDER, MENDER, TITAN,
  BOSS_TYPES, WAVES_PER_RUN,
} from '../defs';
import { SPAWN_X, SPAWN_Y1, SPAWN_Y2, isOpen } from './terrain';
import type { Game } from '../state';
import { pickRoute } from './routing';

/**
 * Wave character. Each wave leans on ONE pressure so the player can read what
 * is coming and answer it with placement, not micro. Types phase in gradually
 * — a new archetype never debuts as the bulk of a wave.
 */
export interface WaveMix {
  label: string;
  weights: Partial<Record<number, number>>;
}

/**
 * HARDCORE: the wave you would have met this many surges later, arriving now.
 *
 * Deliberately a COMPOSITION shift rather than an HP multiplier. Multiplying
 * health gives the same run with bigger numbers — and the surge-10 toughness
 * curve already does that. Shifting the mix means you meet splitters,
 * shielders and menders while you are still poor, so the answer is a different
 * BUILD, not more of the same one. It also carries its own toughness for free,
 * since a hauler is thirty times a swarmer.
 */
export const HARDCORE_SHIFT = 5;

/**
 * Hardcore also thickens the stream, and it HAS to.
 *
 * Measured: the composition shift alone made hardcore EASIER — held 7:09
 * against 6:05 for the same bot. Budget buys COST, not bodies, so shifting to
 * elites means fewer units arrive, and elites pay far more gold per kill
 * (hauler 4.5 vs swarmer 0.8). The player simply out-earned the harder mix.
 * The shift decides WHAT you fight; this decides that there is more of it.
 */
export const HARDCORE_RATE = 1.45;

export function waveMix(wave: number, hardcore = false): WaveMix {
  if (hardcore) {
    const m = waveMix(Math.min(wave + HARDCORE_SHIFT, WAVES_PER_RUN), false);
    return { label: `${m.label}+`, weights: m.weights };
  }
  if (isBossWave(wave)) {
    return { label: 'BOSS', weights: { [SWARMER]: 0.55, [HAULER]: 0.25, [RUNNER]: 0.2 } };
  }
  // 1-2 teach the baseline, then one new idea at a time.
  if (wave <= 2) return { label: 'SWARM', weights: { [SWARMER]: 1 } };
  if (wave === 3) return { label: 'RUNNERS', weights: { [SWARMER]: 0.7, [RUNNER]: 0.3 } };
  if (wave === 4) return { label: 'HEAVY', weights: { [SWARMER]: 0.65, [HAULER]: 0.35 } };
  if (wave === 5) return { label: 'ANCHOR', weights: { [SWARMER]: 0.6, [HAULER]: 0.25, [RUNNER]: 0.15 } };
  if (wave === 6) return { label: 'SPLITTERS', weights: { [SWARMER]: 0.5, [SPLITTER]: 0.5 } };
  if (wave === 7) return { label: 'SPEED', weights: { [SWARMER]: 0.4, [RUNNER]: 0.6 } };
  if (wave === 8) return { label: 'SHIELDED', weights: { [SWARMER]: 0.72, [SHIELDER]: 0.08, [HAULER]: 0.2 } };
  if (wave === 9) return { label: 'PRESSURE', weights: { [SWARMER]: 0.5, [HAULER]: 0.3, [RUNNER]: 0.2 } };
  if (wave === 10) return { label: 'ANCHOR', weights: { [SWARMER]: 0.45, [SPLITTER]: 0.25, [HAULER]: 0.3 } };
  if (wave === 11) return { label: 'MENDED', weights: { [SWARMER]: 0.67, [MENDER]: 0.08, [HAULER]: 0.25 } };
  if (wave === 12) return { label: 'BLITZ', weights: { [RUNNER]: 0.7, [SWARMER]: 0.3 } };
  if (wave === 13) return { label: 'CRUSH', weights: { [HAULER]: 0.5, [SWARMER]: 0.4, [SPLITTER]: 0.1 } };
  if (wave === 14) return { label: 'MITOSIS', weights: { [SPLITTER]: 0.55, [SWARMER]: 0.39, [MENDER]: 0.06 } };
  if (wave === 15) return { label: 'ANCHOR', weights: { [SWARMER]: 0.44, [HAULER]: 0.25, [SHIELDER]: 0.06, [RUNNER]: 0.25 } };
  if (wave === 16) return { label: 'BULWARK', weights: { [SHIELDER]: 0.09, [HAULER]: 0.41, [SWARMER]: 0.5 } };
  if (wave === 17) return { label: 'ATTRITION', weights: { [MENDER]: 0.09, [SPLITTER]: 0.41, [SWARMER]: 0.5 } };
  if (wave === 18) return { label: 'ONSLAUGHT', weights: { [RUNNER]: 0.5, [SHIELDER]: 0.06, [SWARMER]: 0.44 } };
  if (wave === 19) return { label: 'SIEGE', weights: { [HAULER]: 0.42, [SPLITTER]: 0.4, [MENDER]: 0.08, [SWARMER]: 0.1 } };
  return {
    label: 'FINAL',
    weights: {
      [SWARMER]: 0.41, [RUNNER]: 0.18, [HAULER]: 0.16, [SPLITTER]: 0.16,
      [SHIELDER]: 0.05, [MENDER]: 0.04,
    },
  };
}

/**
 * Aura carriers are ELITES: a shield bubble should be a landmark you react to,
 * not ambient weather. Weights alone don't bound them (they set the ratio, not
 * the count), so a wave-scaled hard cap keeps them rare and keeps the aura
 * pass cheap at horde scale.
 */
function auraCap(wave: number, cut = 0, hardcore = false): number {
  // Hardcore allows more aura carriers. They are elites and the cap exists to
  // stop 470 bubbles costing 50fps, so this raises it rather than removing it.
  return Math.max(0, 4 + Math.floor(wave * 0.7) + (hardcore ? 3 : 0) - cut);
}

/**
 * Boss schedule: one mid-run and one finale, so a run has something to build
 * toward. Which boss you get is rolled per run — that rotation IS the variety.
 */
export const BOSS_WAVES = [10, WAVES_PER_RUN];

export function isBossWave(wave: number): boolean {
  return BOSS_WAVES.includes(wave);
}

/**
 * The boss for a given wave of this run. Deterministic per run+slot (so a run
 * always faces the same lineup) but the two slots must NOT collide — a run
 * should show you two different bosses. Uses an xorshift mix; a naive
 * multiply-add hash returned the same boss for both slots.
 */
export function bossForWave(runId: number, wave: number): number {
  const slot = BOSS_WAVES.indexOf(wave);
  if (slot < 0) return -1;
  // Hash the RUN only, then step once per slot. Mixing the slot into the hash
  // lets two slots land on the same boss; stepping cannot.
  let h = Math.imul(runId + 1, 0x9e3779b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2545f491);
  h ^= h >>> 13;
  const first = (h >>> 0) % BOSS_TYPES.length;
  return BOSS_TYPES[(first + slot) % BOSS_TYPES.length];
}

function pickType(mix: WaveMix): number {
  const entries = Object.entries(mix.weights) as unknown as [string, number][];
  let total = 0;
  for (const [, w] of entries) total += w;
  let r = Math.random() * total;
  for (const [k, w] of entries) {
    r -= w;
    if (r <= 0) return Number(k);
  }
  return SWARMER;
}

// Linear HP scaling per the owner's spec — speed and armor NEVER scale, so
// counterplay stays stable across the run.
/**
 * Per-body toughness. Linear early, quadratic tail past surge 10.
 *
 * Measured 2026-08-17: body COUNT already scales hard (6.6/s at surge 5 to
 * 349/s at surge 24 — the rift is not a throughput cap), but a wall of 4hp
 * mites is trivial to a mature gun line however many of them there are. A
 * 7-minute playtest sat at 333/400 fort HP from surge 8 to surge 18, never
 * threatened, because player DPS compounds with gold while toughness only rose
 * linearly. Toughness now has to climb faster than DPS can be bought.
 *
 * Deliberately identical up to surge 10, so the opening — the part that was
 * already a real fight — is untouched.
 */
export function waveHpMul(wave: number): number {
  const late = Math.max(0, wave - 10);
  return 1 + 0.11 * (wave - 1) + 0.022 * late * late;
}

/**
 * Wave size curve. Rebalanced 2026-08-16 from difficulty-harness data: the old
 * flat-480 base made wave 1 send ~480 units against a 5-tower opening budget,
 * which every skill bracket lost. Start small enough to teach, ramp steeply so
 * late waves still become the intended tide.
 *   w1 ~55 · w5 ~170 · w10 ~700 · w15 ~2800 · w20 ~11000
 * Boss waves carry a lighter escort — the boss IS the wave.
 */
export function waveBudget(wave: number): number {
  const base = 55 * Math.pow(1.28, wave - 1);
  return isBossWave(wave) ? base * 0.45 : base;
}

interface SpawnEntry {
  t: number;
  type: number;
}

export class Spawner {
  private queue: SpawnEntry[] = [];
  private idx = 0;
  elapsed = 0;

  constructor(wave: number, runId = 0, auraCut = 0) {
    let budget = waveBudget(wave);
    const duration = 18 + wave * 1.2;
    // Spawns cluster into surges so the horde arrives as tides, not a drizzle.
    const nBursts = 4 + Math.floor(wave / 3);
    const bursts: number[] = [];
    for (let b = 0; b < nBursts; b++) {
      bursts.push(1 + Math.random() * (duration - 3));
    }
    const mix = waveMix(wave);
    const entries: SpawnEntry[] = [];
    const cap = auraCap(wave, auraCut);
    let auras = 0;
    while (budget > 0) {
      let type = pickType(mix);
      const ab = ENEMY_TYPES[type].ability;
      if (ab === 'shield' || ab === 'heal') {
        if (auras >= cap) type = SWARMER; // over the elite budget: plain mass
        else auras++;
      }
      budget -= ENEMY_TYPES[type].cost;
      const center = bursts[(Math.random() * nBursts) | 0];
      entries.push({ t: Math.max(0, center + (Math.random() - 0.5) * 1.6), type });
    }
    // Boss waves lead with the boss so the fight defines the wave; other
    // 5th waves still get a titan as the lesser anchor.
    const boss = bossForWave(runId, wave);
    if (boss >= 0) {
      entries.push({ t: 1.5, type: boss });
    } else if (wave % 5 === 0) {
      entries.push({ t: duration * 0.6, type: TITAN });
    }
    entries.sort((a, b) => a.t - b.t);
    this.queue = entries;
  }

  get done(): boolean {
    return this.idx >= this.queue.length;
  }

  update(g: Game, dt: number): void {
    this.elapsed += dt;
    while (this.idx < this.queue.length && this.queue[this.idx].t <= this.elapsed) {
      const entry = this.queue[this.idx++];
      // The horde pours out of the rift STRIP, bunched, and floods the field.
      // The band is DEEP (not a 24px gate): at 8x horde scale a narrow mouth
      // jams, the wave trickles instead of floods, and stragglers end up
      // culled by the drain timer. Depth lets the column form behind the front.
      let sx = SPAWN_X + Math.random() * 96;
      let sy = SPAWN_Y1 + Math.random() * (SPAWN_Y2 - SPAWN_Y1);
      for (let a = 0; a < 8 && !isOpen(sx, sy); a++) {
        sx = SPAWN_X + Math.random() * 96;
        sy = SPAWN_Y1 + Math.random() * (SPAWN_Y2 - SPAWN_Y1);
      }
      g.enemies.spawn(entry.type, sx, sy);
    }
  }
}

// ---------------------------------------------------------------------------
// CONTINUOUS FLOW (owner-directed 2026-08-17)
// ---------------------------------------------------------------------------
// There are no waves. The horde is one unbroken stream whose thickness grows
// with elapsed time. Everything above is reused unchanged — composition,
// HP scaling, the boss roster — by treating `stage` as a DERIVED number that
// advances on a clock instead of on a clear. That keeps all the tested content
// and only changes WHEN it arrives.

/** Seconds per stage. Roughly the old wave duration, so pressure ramps alike. */
export const STAGE_SECS = 24;

export function stageAt(runT: number): number {
  return 1 + Math.floor(runT / STAGE_SECS);
}

/**
 * Spawn budget per second. The old per-stage budget spread evenly across the
 * stage, so the pressure curve is the one the difficulty harness was tuned
 * against — just delivered continuously instead of in bursts.
 */
export function flowRate(runT: number, hardcore = false): number {
  const stage = stageAt(runT);
  // Blend across the stage boundary so the stream thickens smoothly rather
  // than stepping every 24 seconds.
  const f = (runT % STAGE_SECS) / STAGE_SECS;
  const a = waveBudget(stage) / STAGE_SECS;
  const b = waveBudget(stage + 1) / STAGE_SECS;
  return (a + (b - a) * f) * (hardcore ? HARDCORE_RATE : 1);
}

/** Stages at which a boss joins the flow. */
export const BOSS_STAGES = [10, 20];

/**
 * Continuous spawner. Accumulates budget every tick and releases units as it
 * can afford them, so the stream is dense and steady rather than arriving in
 * discrete bursts.
 */
export class FlowSpawner {
  private auras = 0;
  private auraStage = 0;
  private bossesSent = new Set<number>();

  update(g: Game, dt: number): void {
    if (g.flowPaused) return;
    const stage = stageAt(g.runT);
    if (stage !== this.auraStage) { this.auraStage = stage; this.auras = 0; }

    // Bosses arrive once, when their stage opens.
    for (const bs of BOSS_STAGES) {
      if (stage >= bs && !this.bossesSent.has(bs)) {
        this.bossesSent.add(bs);
        const boss = bossForWave(g.runId, BOSS_WAVES[BOSS_STAGES.indexOf(bs)]);
        if (boss >= 0) this.spawnOne(g, boss);
      }
    }
    // A titan anchors every 5th stage, as it used to.
    if (stage % 5 === 0 && !this.bossesSent.has(-stage)) {
      this.bossesSent.add(-stage);
      this.spawnOne(g, TITAN);
    }

    g.spawnAcc += flowRate(g.runT, g.hardcore) * dt;
    const mix = waveMix(Math.min(stage, WAVES_PER_RUN), g.hardcore);
    const cap = auraCap(stage, g.mods.auraCut, g.hardcore);
    let guard = 0;
    while (g.spawnAcc > 0 && guard++ < 400) {
      let type = pickType(mix);
      const ab = ENEMY_TYPES[type].ability;
      if (ab === 'shield' || ab === 'heal') {
        if (this.auras >= cap) type = SWARMER;
        else this.auras++;
      }
      const cost = ENEMY_TYPES[type].cost;
      if (cost > g.spawnAcc) break;
      g.spawnAcc -= cost;
      this.spawnOne(g, type);
    }
  }

  private spawnOne(g: Game, type: number): void {
    let sx = SPAWN_X + Math.random() * 96;
    let sy = SPAWN_Y1 + Math.random() * (SPAWN_Y2 - SPAWN_Y1);
    for (let a = 0; a < 8 && !isOpen(sx, sy); a++) {
      sx = SPAWN_X + Math.random() * 96;
      sy = SPAWN_Y1 + Math.random() * (SPAWN_Y2 - SPAWN_Y1);
    }
    g.enemies.spawn(type, sx, sy);
    // Pick a route on arrival, from the live ETAs. Sticky for life: this is
    // what makes the horde SPLIT in a stable ratio instead of switching in
    // lockstep. As route 0 fills, its ETA rises and the next arrivals take
    // another one.
    g.enemies.route[g.enemies.n - 1] = pickRoute();
    // Cold Start holds new arrivals at reduced speed as they leave the rift.
    if (g.mods.riftSlow > 0) {
      const i = g.enemies.n - 1;
      g.enemies.slow[i] = Math.max(g.enemies.slow[i], g.mods.riftSlow);
    }
  }
}
