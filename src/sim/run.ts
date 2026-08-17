// Run orchestration: the fixed-timestep tick, phase transitions, death sweep,
// payouts, and the strike ability.

import {
  ENEMY_TYPES, COLS, ROWS, W, H, MAX_ENEMIES, WAVES_PER_RUN,
  STRIKE_DMG, STRIKE_RADIUS, CARDS_ENABLED,
} from '../defs';
import type { Game } from '../state';
import { EnemyPool, updateEnemies, separate } from './enemies';
import { isOpen } from './terrain';
import { FlowField } from './flowfield';
import { SpatialHash } from './spatial';
import { updateTowers, shove } from './combat';
import { dealHit } from './damage';
import { Spawner } from './waves';
import { waveHpMul } from './waves';
import type { MetaMods } from '../meta/upgrades';
import type { SaveData } from '../meta/save';
import { persist } from '../meta/save';
import {
  defaultTypeMods, defaultRunFx, STARTER_DECK, shuffle, draw, rollCardChoices,
} from './cards';

export function createGame(mods: MetaMods): Game {
  const g: Game = {
    phase: 'meta',
    wave: 0,
    gold: 0,
    baseHp: 1,
    baseMaxHp: 1,
    runCores: 0,
    towers: [],
    towerGrid: new Int32Array(COLS * ROWS).fill(-1),
    enemies: new EnemyPool(),
    field: new FlowField(),
    hash: new SpatialHash(W, H, 16, MAX_ENEMIES),
    spawner: null,
    effects: [],
    beams: [],
    impacts: [],
    mods,
    deck: [],
    hand: [],
    typeMods: defaultTypeMods(),
    runFx: defaultRunFx(),
    cardChoices: null,
    strikeCd: 0,
    speed: 1,
    time: 0,
    selected: -1,
    kills: 0,
    drainT: 0,
    rescues: 0,
    deaths: [],
    marks: [],
    runId: 0,
  };
  g.field.compute();
  return g;
}

export function startRun(g: Game, mods: MetaMods): void {
  g.mods = mods;
  g.phase = 'build';
  g.wave = 0;
  g.gold = mods.startGold;
  g.baseMaxHp = mods.baseHp;
  g.baseHp = mods.baseHp;
  g.runCores = 0;
  g.towers = [];
  g.towerGrid.fill(-1);
  g.enemies.clear();
  g.field.blocked.fill(0);
  g.field.compute();
  g.spawner = null;
  g.effects.length = 0;
  g.beams.length = 0;
  g.impacts.length = 0;
  g.strikeCd = 0;
  g.time = 0;
  g.selected = -1;
  g.kills = 0;
  g.drainT = 0;
  g.rescues = 0;
  g.deaths.length = 0;
  g.marks.length = 0;
  g.deck = shuffle([...STARTER_DECK]);
  g.hand = [];
  g.typeMods = defaultTypeMods();
  g.runFx = defaultRunFx();
  g.cardChoices = null;
  if (CARDS_ENABLED) draw(g, 3); // opening hand
  g.runId++;
}

export function startWave(g: Game): void {
  if (g.phase !== 'build' || g.cardChoices !== null) return;
  g.wave++;
  g.enemies.hpMul = waveHpMul(g.wave);
  g.spawner = new Spawner(g.wave, g.runId);
  g.drainT = 0;
  g.phase = 'wave';
}

export function castStrike(g: Game, x: number, y: number): boolean {
  // Wave-only: a misfire during the build phase would waste the whole cooldown.
  if (g.strikeCd > 0 || g.phase !== 'wave') return false;
  const e = g.enemies;
  const r2 = STRIKE_RADIUS * STRIKE_RADIUS;
  const dmg = STRIKE_DMG * g.mods.dmgMul;
  g.hash.query(x, y, STRIKE_RADIUS, (j) => {
    if (e.hp[j] <= 0) return;
    const dx = e.x[j] - x, dy = e.y[j] - y;
    if (dx * dx + dy * dy <= r2) dealHit(g, j, dmg);
  });
  // The strike is the player's own hand — it should visibly part the horde.
  shove(g, x, y, STRIKE_RADIUS * 2.2, 620);
  g.effects.push({ kind: 'shock', x, y, r: STRIKE_RADIUS * 2.2, t: 0, ttl: 0.42, color: '#fff3c4' });
  g.effects.push({ kind: 'boom', x, y, r: STRIKE_RADIUS, t: 0, ttl: 0.5, color: '#ffd977' });
  g.effects.push({ kind: 'flash', x, y, r: STRIKE_RADIUS * 0.9, t: 0, ttl: 0.25, color: '#fff3c4' });
  for (let s = 0; s < 5; s++) {
    g.effects.push({
      kind: 'smoke',
      x: x + (Math.random() - 0.5) * STRIKE_RADIUS,
      y: y + (Math.random() - 0.5) * STRIKE_RADIUS,
      r: 12 + Math.random() * 16, t: 0, ttl: 1.2, color: '#c9c2b8',
    });
  }
  g.strikeCd = g.mods.strikeCdMax;
  return true;
}

/** Returns true if anything was spawned (splitter bursts) while sweeping. */
function sweepDeaths(g: Game): boolean {
  let spawned = false;
  const e = g.enemies;
  // Cryo's Shatter branch: anything killed while Frozen detonates.
  const shatter = g.towers.some((t) => t.kind === 'cryo' && t.upg === 2);
  for (let i = e.n - 1; i >= 0; i--) {
    if (e.hp[i] > 0) continue;
    const def = ENEMY_TYPES[e.type[i]];
    if (shatter && e.slow[i] > 0 && e.leaked[i] === 0) {
      const bx = e.x[i], by = e.y[i];
      const r = 46;
      const r2 = r * r;
      g.hash.query(bx, by, r, (k) => {
        if (e.hp[k] <= 0) return;
        const dx = e.x[k] - bx, dy = e.y[k] - by;
        if (dx * dx + dy * dy <= r2) dealHit(g, k, 60);
      });
      g.effects.push({ kind: 'boom', x: bx, y: by, r, t: 0, ttl: 0.3, color: '#8fd8e8' });
    }
    // SPLITTER: bursts into swarmers — the mass visibly multiplies.
    if (def.ability === 'split' && e.leaked[i] === 0) {
      const n = def.splitCount ?? 4;
      const child = def.splitInto ?? 0;
      const px = e.x[i], py = e.y[i];
      const spin = Math.random() * Math.PI * 2;
      for (let k = 0; k < n; k++) {
        // Fan the children out. Never birth one inside a wall — it would spawn
        // off-track and thrash the stuck-rescue until it got culled — but do
        // NOT just fall back to the parent's exact point either: that stacked
        // every blocked child on one spot and was the main source of visible
        // body overlap on splitter waves. Try around the circle first.
        const base = (k / n) * Math.PI * 2 + spin;
        let sx = px, sy = py, found = false;
        for (let attempt = 0; attempt < 6 && !found; attempt++) {
          const a = base + attempt * 0.7;
          // Never below the widest child pair's combined radius (~8.7px) or
          // the children are born overlapping each other.
          const d = Math.max(9, 13 - attempt);
          const tx = px + Math.cos(a) * d;
          const ty = py + Math.sin(a) * d;
          if (isOpen(tx, ty)) { sx = tx; sy = ty; found = true; }
        }
        if (!found) {
          // Truly boxed in: at least jitter so bodies are not coincident.
          sx = px + (Math.random() - 0.5) * 6;
          sy = py + (Math.random() - 0.5) * 6;
        }
        e.spawn(child, sx, sy);
        spawned = true;
      }
      g.effects.push({
        kind: 'boom', x: px, y: py, r: 26, t: 0, ttl: 0.35, color: '#d4e86a',
      });
    }
    if (e.leaked[i] === 0) {
      g.gold += def.gold * g.runFx.goldMul;
      g.runCores += def.cores;
      g.kills++;
      if (g.deaths.length < 1200) {
        g.deaths.push(e.x[i], e.y[i], def.r);
      }
      if (def.r >= 4.5 && g.effects.length < 450) {
        g.effects.push({ kind: 'boom', x: e.x[i], y: e.y[i], r: def.r * 3, t: 0, ttl: 0.3, color: def.color });
      }
    }
    e.kill(i);
  }
  return spawned;
}

export function endRun(g: Game, save: SaveData, won: boolean): void {
  g.phase = won ? 'won' : 'lost';
  if (won) {
    g.runCores += 50;
    save.wins++;
  }
  save.cores += Math.floor(g.runCores);
  if (g.wave > save.bestWave) save.bestWave = g.wave;
  persist(save);
}

export function tick(g: Game, save: SaveData, dt: number): void {
  if (g.phase !== 'wave' && g.phase !== 'build') return;
  g.time += dt;
  if (g.strikeCd > 0) g.strikeCd = Math.max(0, g.strikeCd - dt);

  // Rebuild the spatial hash from current positions.
  const e = g.enemies;
  g.hash.clear();
  for (let i = 0; i < e.n; i++) {
    g.hash.insert(i, e.x[i], e.y[i]);
  }

  if (g.phase === 'wave' && g.spawner) {
    g.spawner.update(g, dt);
  }

  updateEnemies(g, dt);
  // Circle bodies must never overlap; resolve after everyone has moved.
  // The hash was built at tick start, so it is stale by now — any agent that
  // crossed a bucket boundary would be invisible to its new neighbours and
  // the pair would stay interpenetrated. Rebuild first (O(n), cheap).
  g.hash.clear();
  for (let i = 0; i < e.n; i++) g.hash.insert(i, e.x[i], e.y[i]);
  separate(g);
  updateTowers(g, dt);
  const born = sweepDeaths(g);
  // Splitter bursts are created INSIDE sweepDeaths — after the main separation
  // pass — so without this their children sit interpenetrated for a whole
  // rendered frame. Measured: every deepest overlap was age 0, born that tick.
  // Only pay for it on ticks that actually spawned something, which buys
  // enough budget to run the two passes it takes to clear a burst landing in
  // an existing crowd.
  if (born && e.n > 1) {
    g.hash.clear();
    for (let i = 0; i < e.n; i++) g.hash.insert(i, e.x[i], e.y[i]);
    separate(g, 2);
  }

  // Effects age out here so they respect sim speed.
  for (let i = g.effects.length - 1; i >= 0; i--) {
    const fx = g.effects[i];
    fx.t += dt;
    if (fx.t >= fx.ttl) {
      g.effects[i] = g.effects[g.effects.length - 1];
      g.effects.pop();
    }
  }

  if (g.baseHp <= 0) {
    g.baseHp = 0;
    endRun(g, save, false);
    return;
  }

  // Soft-lock insurance: long after the spawner finishes, any car that STILL
  // hasn't reached the fort is beyond saving — cull it silently (no gold, no
  // base damage) so the wave can always end. Generous window: crossing the
  // whole map at the slowest pace takes well under 90s.
  if (g.phase === 'wave' && g.spawner && g.spawner.done) {
    g.drainT += dt;
    if (g.drainT > 120) {
      for (let i = 0; i < e.n; i++) {
        e.hp[i] = 0;
        e.leaked[i] = 1;
      }
    }
  }

  if (g.phase === 'wave' && g.spawner && g.spawner.done && e.n === 0) {
    // Wave cleared.
    g.runCores += 5 + g.wave;
    // Wave-clear bounty scales GEOMETRICALLY. Threat grows ~28%/wave, so a
    // flat bounty means linear defence against exponential pressure — the
    // difficulty harness showed that spiral kills every skill bracket by
    // wave 6, and makes expensive towers permanently unaffordable.
    g.gold += 40 * Math.pow(1.2, g.wave - 1);
    if (g.wave >= WAVES_PER_RUN) {
      endRun(g, save, true);
    } else {
      g.phase = 'build';
      if (CARDS_ENABLED) {
        draw(g, 1); // round-by-round draw
        if (g.wave % 3 === 0) {
          g.cardChoices = rollCardChoices(); // grow the deck every 3rd wave
        }
      }
    }
  }
}
