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
import { Spawner, FlowSpawner, stageAt,
} from './waves';
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
    strikeCharges: 1,
    contingencyLeft: false,
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
    runT: 0,
    spawnAcc: 0,
    flowPaused: false,
    rescues: 0,
    deaths: [],
    marks: [],
    runId: 0,
  };
  g.field.compute();
  return g;
}

export function startRun(g: Game, mods: MetaMods, bankedGold = 0): void {
  g.mods = mods;
  // No build phase: the flow starts immediately and you build inside it.
  g.phase = 'running';
  g.wave = 1;
  g.runT = 0;
  g.spawnAcc = 0;
  // Money persists between attempts (owner call 2026-08-17) — a failed run
  // leaves you richer, not reset.
  g.gold = bankedGold > 0 ? bankedGold : mods.startGold;
  g.baseMaxHp = mods.baseHp;
  g.baseHp = mods.baseHp;
  g.runCores = 0;
  g.strikeCharges = mods.strikeCharges;
  g.contingencyLeft = mods.contingency;
  g.towers = [];
  g.towerGrid.fill(-1);
  g.enemies.clear();
  g.field.blocked.fill(0);
  g.field.compute();
  g.spawner = new FlowSpawner();
  g.enemies.hpMul = waveHpMul(1);
  g.effects.length = 0;
  g.beams.length = 0;
  g.impacts.length = 0;
  g.strikeCd = 0;
  g.time = 0;
  g.selected = -1;
  g.kills = 0;
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

export function castStrike(g: Game, x: number, y: number): boolean {
  // Second Wind banks charges; the cooldown only blocks when none are left.
  if (g.strikeCharges <= 0 || g.phase !== 'running') return false;
  const e = g.enemies;
  const R = STRIKE_RADIUS + g.mods.strikeRadiusAdd;
  const r2 = R * R;
  const dmg = STRIKE_DMG * g.mods.dmgMul;
  g.hash.query(x, y, R, (j) => {
    if (e.hp[j] <= 0) return;
    const dx = e.x[j] - x, dy = e.y[j] - y;
    if (dx * dx + dy * dy <= r2) dealHit(g, j, dmg);
  });
  // The strike is the player's own hand — it should visibly part the horde.
  shove(g, x, y, R * 2.2, 620);
  g.effects.push({ kind: 'shock', x, y, r: R * 2.2, t: 0, ttl: 0.42, color: '#fff3c4' });
  g.effects.push({ kind: 'boom', x, y, r: R, t: 0, ttl: 0.5, color: '#ffd977' });
  g.effects.push({ kind: 'flash', x, y, r: R * 0.9, t: 0, ttl: 0.25, color: '#fff3c4' });
  for (let s = 0; s < 5; s++) {
    g.effects.push({
      kind: 'smoke',
      x: x + (Math.random() - 0.5) * R,
      y: y + (Math.random() - 0.5) * R,
      r: 12 + Math.random() * 16, t: 0, ttl: 1.2, color: '#c9c2b8',
    });
  }
  g.strikeCharges--;
  if (g.strikeCd <= 0) g.strikeCd = g.mods.strikeCdMax;
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
      // Titan Bounty pays double on titans (type 7) and every boss (8+).
      const big = e.type[i] >= 7 ? g.mods.bossGoldMul : 1;
      g.gold += def.gold * g.runFx.goldMul * g.mods.goldKillMul * big;
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

export function endRun(g: Game, save: SaveData, _won = false): void {
  g.phase = 'lost';
  // Futures pays for time survived; Holdings Co. converts the unspent bank.
  const chips = g.runCores
    + g.mods.chipsPerMin * (g.runT / 60)
    + g.mods.bankChips * g.gold;
  save.cores += Math.floor(chips);
  // Money survives the run. This is the progression hook now: you come back
  // with what you had, so the next attempt starts from a better place.
  save.gold = Math.floor(g.gold);
  if (g.wave > save.bestWave) save.bestWave = g.wave;
  if (g.runT > (save.bestTime ?? 0)) save.bestTime = Math.floor(g.runT);
  persist(save);
}

export function tick(g: Game, save: SaveData, dt: number): void {
  if (g.phase !== 'running') return;
  g.time += dt;
  if (g.strikeCd > 0) g.strikeCd = Math.max(0, g.strikeCd - dt);

  // Rebuild the spatial hash from current positions.
  const e = g.enemies;
  g.hash.clear();
  for (let i = 0; i < e.n; i++) {
    g.hash.insert(i, e.x[i], e.y[i]);
  }

  if (g.phase === 'running' && g.spawner) {
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

  // No drain cull any more: the flow never stops, so there is no wave to end
  // and nothing to time out. The old 120s cull existed purely to guarantee a
  // wave could finish, and it was silently deleting stragglers (and bosses).

  // Stage advances on a CLOCK. Everything downstream — composition, HP
  // scaling, boss timing — keeps using it exactly as it used to use the wave
  // number, so all the tuned content carries over unchanged.
  // flowPaused freezes PROGRESSION, not just spawning: a harness that stops
  // the stream still had the clock advancing under it, so stage, HP scaling
  // and the stage bounty all kept moving and staged enemies spawned tougher
  // than the test expected.
  if (g.flowPaused) return;
  const prevStage = g.wave;
  g.runT += dt;
  g.wave = stageAt(g.runT);
  if (g.wave !== prevStage) {
    g.enemies.hpMul = waveHpMul(g.wave);
    // Surviving a stage still pays, on the same geometric curve as the old
    // wave-clear bounty — the economy is unchanged, only its cadence is.
    g.runCores += 5 + g.wave;
    g.gold += 40 * Math.pow(1.2, g.wave - 2) * g.mods.bountyMul;
    // Banked Salvage: interest on money you did NOT spend, which is the whole
    // tycoon pull — holding a reserve becomes a real alternative to buying.
    if (g.mods.interest > 0) g.gold += g.gold * g.mods.interest;
  }

  // Second Wind recharges toward the cap rather than a single slot.
  if (g.strikeCharges < g.mods.strikeCharges && g.strikeCd <= 0) {
    g.strikeCharges++;
    if (g.strikeCharges < g.mods.strikeCharges) g.strikeCd = g.mods.strikeCdMax;
  }
}
