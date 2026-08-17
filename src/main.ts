// Bootstrap + input + the fixed-timestep loop that ties sim, render, and HUD together.

import {
  W, H, DT, CELL, COLS, ROWS, WAVES_PER_RUN, TOWER_KINDS, TowerKind, clamp,
  CARDS_ENABLED, AIM_MODE, TOWER_DEFS,
} from './defs';
import { initTerrain, pointOnPath, PATH_RADIUS } from './sim/terrain';
import { initArt } from './render/sprites';

// The map is an image and the terrain is textured — both must load first.
await Promise.all([initTerrain(), initArt()]);
import { createGame, startRun, startWave, castStrike, tick } from './sim/run';
import { shove } from './sim/combat';
import { placeTower, upgradeTower, sellTower, destroyTower } from './sim/towers';
import { loadSave, persist, type Settings } from './meta/save';
import { UPGRADES, computeMods } from './meta/upgrades';
import { CARDS, playModCard, playStrikeCard, playInstantCard } from './sim/cards';
import { initHand, updateHand } from './ui/hand';
import { initHud, updateHud, markMetaDirty, HudCallbacks } from './ui/hud';
import { render, UiState } from './render/draw';
import './style.css';

const save = loadSave();
const game = createGame(computeMods(save.upgrades));

const ui: UiState = {
  placing: null,
  strikeArmed: false,
  mouseX: 0,
  mouseY: 0,
  mouseIn: false,
  settings: save.settings,
  aiming: -1,
};

/** Point the tower being aimed at the cursor. Called on every mouse move. */
function updateAim(): void {
  const t = game.towers[ui.aiming];
  if (!t) return;
  t.aim = Math.atan2(ui.mouseY - t.y, ui.mouseX - t.x);
  t.aimX = ui.mouseX;
  t.aimY = ui.mouseY;
}

/** Commit the current angle and let the tower start firing. */
function commitAim(): void {
  const t = game.towers[ui.aiming];
  if (t) t.armed = true;
  ui.aiming = -1;
}

/** Abandon an unaimed tower: it never fired, so refund the full price. */
function cancelAim(): void {
  const ti = ui.aiming;
  ui.aiming = -1;
  const t = game.towers[ti];
  if (!t || t.armed) return;
  game.gold += TOWER_DEFS[t.kind].cost;
  destroyTower(game, ti);
}

const cb: HudCallbacks = {
  selectTower(kind: TowerKind | null) {
    ui.placing = ui.placing === kind ? null : kind;
    ui.strikeArmed = false;
  },
  startWave() {
    startWave(game);
  },
  cycleSpeed() {
    game.speed = game.speed === 1 ? 2 : game.speed === 2 ? 4 : game.speed === 4 ? 10 : 1;
  },
  armStrike() {
    if (game.phase !== 'wave') {
      ui.strikeArmed = false;
      return;
    }
    ui.strikeArmed = !ui.strikeArmed;
    ui.placing = null;
  },
  buyUpgrade(id: string) {
    const def = UPGRADES.find((u) => u.id === id);
    if (!def) return;
    const lvl = save.upgrades[id] ?? 0;
    const cost = def.cost(lvl);
    if (lvl >= def.max || save.cores < cost) return;
    save.cores -= cost;
    save.upgrades[id] = lvl + 1;
    persist(save);
    markMetaDirty();
  },
  launchRun() {
    startRun(game, computeMods(save.upgrades));
    game.speed = save.settings.defaultSpeed;
    ui.placing = 'autocannon';
    ui.strikeArmed = false;
  },
  upgradeSelected(branch: 1 | 2) {
    if (game.selected >= 0) upgradeTower(game, game.selected, branch);
  },
  sellSelected() {
    if (game.selected >= 0) {
      sellTower(game, game.selected);
      game.selected = -1;
    }
  },
  closeInspect() {
    game.selected = -1;
  },
  setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    // ui.settings aliases save.settings, so the renderer sees this next frame.
    save.settings[key] = value;
    persist(save);
  },
  pickCard(id: string | null) {
    if (game.cardChoices === null) return;
    if (id !== null && CARDS[id]) {
      // slip the new card into the draw pile at a random depth
      const at = (Math.random() * (game.deck.length + 1)) | 0;
      game.deck.splice(at, 0, id);
    }
    game.cardChoices = null;
  },
};

function playCard(idx: number, expectedId: string, x: number | null, y: number | null, isClick: boolean): void {
  if (game.phase !== 'build' && game.phase !== 'wave') return;
  const id = game.hand[idx];
  // The hand can change mid-drag (wave-clear draw); only play what was grabbed.
  if (!id || id !== expectedId) return;
  const def = CARDS[id];
  if (!def) return;
  let ok = false;
  if (def.kind === 'instant') {
    ok = (isClick || x !== null) && playInstantCard(game, id);
  } else if (x !== null && y !== null) {
    if (def.kind === 'strike') {
      ok = game.phase === 'wave' && playStrikeCard(game, id, x, y);
    } else {
      // mod card: find the tower under the drop point
      let best = -1;
      let bd = 18 * 18;
      for (let i = 0; i < game.towers.length; i++) {
        const dx = game.towers[i].x - x, dy = game.towers[i].y - y;
        const d2 = dx * dx + dy * dy;
        if (d2 < bd) { bd = d2; best = i; }
      }
      if (best >= 0) ok = playModCard(game, id, game.towers[best].kind);
    }
  }
  if (ok) game.hand.splice(idx, 1);
}

const root = document.getElementById('app')!;
const stage = initHud(root, cb);

const canvas = document.createElement('canvas');
canvas.width = W;
canvas.height = H;
stage.insertBefore(canvas, stage.firstChild);
const ctx = canvas.getContext('2d')!;
if (CARDS_ENABLED) initHand(stage.querySelector('.hud') as HTMLElement, canvas, { playCard });

function toCanvas(ev: MouseEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((ev.clientX - rect.left) / rect.width) * W,
    y: ((ev.clientY - rect.top) / rect.height) * H,
  };
}

canvas.addEventListener('mousemove', (ev) => {
  const p = toCanvas(ev);
  ui.mouseX = p.x;
  ui.mouseY = p.y;
  ui.mouseIn = true;
  if (ui.aiming >= 0) updateAim();
});
canvas.addEventListener('mouseleave', () => {
  ui.mouseIn = false;
});
canvas.addEventListener('click', (ev) => {
  const p = toCanvas(ev);
  // Aiming owns the click. If the inspector saw it first, committing an angle
  // would immediately open the panel on the tower you just placed.
  if (ui.aiming >= 0) {
    ui.mouseX = p.x;
    ui.mouseY = p.y;
    updateAim();
    commitAim();
    return;
  }
  if (ui.strikeArmed) {
    if (castStrike(game, p.x, p.y)) ui.strikeArmed = false;
    return;
  }
  if (ui.placing) {
    const cx = clamp((p.x / CELL) | 0, 0, COLS - 1);
    const cy = clamp((p.y / CELL) | 0, 0, ROWS - 1);
    const ti = placeTower(game, ui.placing, cx, cy);
    if (ti >= 0 && AIM_MODE[ui.placing] !== 'none') {
      // Placed but not yet a weapon: enter aiming until the next click.
      game.towers[ti].armed = false;
      ui.aiming = ti;
      updateAim();
    }
    return;
  }
  // Nothing selected in the palette: click a tower to inspect/upgrade/sell.
  let best = -1;
  let bd = 22 * 22;
  for (let i = 0; i < game.towers.length; i++) {
    const dx = game.towers[i].x - p.x, dy = game.towers[i].y - p.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < bd) { bd = d2; best = i; }
  }
  game.selected = best;
});
canvas.addEventListener('contextmenu', (ev) => {
  ev.preventDefault();
  // Right-click is the cancel: an unarmed tower never fired, so refund in full.
  if (ui.aiming >= 0) cancelAim();
  ui.placing = null;
  ui.strikeArmed = false;
});

window.addEventListener('keydown', (ev) => {
  const digit = '1234567890'.indexOf(ev.key);
  if (digit >= 0 && digit < TOWER_KINDS.length) cb.selectTower(TOWER_KINDS[digit]);
  else if (ev.key === 'w' || ev.key === 'W') cb.selectTower('wall');
  else if (ev.key === 'q' || ev.key === 'Q') cb.armStrike();
  else if (ev.key === ' ') {
    ev.preventDefault();
    // Starting a wave mid-aim commits at the current angle — never strand an
    // unarmed tower that silently does nothing all wave.
    if (ui.aiming >= 0) commitAim();
    if (game.phase === 'build') startWave(game);
  } else if (ev.key === 'Escape') {
    // Escape means "done placing", so it COMMITS a half-aimed tower rather
    // than binning it. Right-click is the destructive cancel.
    if (ui.aiming >= 0) commitAim();
    ui.placing = null;
    ui.strikeArmed = false;
  }
});

// Demo mode (?demo=N) for automated screenshots/stress tests: jump straight
// into wave N of a run with towers overlooking the serpentine.
const demoParam = new URLSearchParams(location.search).get('demo');
if (demoParam !== null) {
  // Clamp: waveBudget grows exponentially, an absurd N would hang the spawner.
  const demoWave = clamp(parseInt(demoParam, 10) || 5, 1, WAVES_PER_RUN);
  startRun(game, computeMods(save.upgrades));
  game.gold = 3000;
  // Towers on the canyon rims: unwalkable cells that touch the road.
  const kinds: TowerKind[] = [
    'autocannon', 'autocannon', 'tesla', 'mortar', 'gatling',
    'rocket', 'railgun', 'lattice', 'cryo', 'flame',
  ];
  let placed = 0;
  const spots: Array<[number, number]> = [];
  for (let cy = 1; cy < ROWS - 1 && placed < 24; cy += 1) {
    for (let cx = 1; cx < COLS - 1 && placed < 24; cx += 1) {
      const cc = cy * COLS + cx;
      if (game.field.walk[cc] === 1) continue;
      const rim = game.field.walk[cc - 1] || game.field.walk[cc + 1] ||
        game.field.walk[cc - COLS] || game.field.walk[cc + COLS];
      if (!rim) continue;
      if (spots.some(([sx, sy]) => Math.abs(sx - cx) + Math.abs(sy - cy) < 9)) continue;
      if (placeTower(game, kinds[placed % kinds.length], cx, cy) >= 0) {
        spots.push([cx, cy]);
        placed++;
      }
    }
  }
  game.wave = demoWave - 1;
  startWave(game);
  game.speed = 2;
}

// Automation/debug handle (used by the Playwright verification loop).
(window as unknown as Record<string, unknown>).__swarm = {
  game,
  save,
  cardsEnabled: CARDS_ENABLED,
  tick: (dt: number) => tick(game, save, dt),
  render: () => render(ctx, game, ui),
  // Placement through the real code path, so harnesses can build a barrier
  // without pixel-clicking every cell (needed to test the sealed-route rule).
  place: (kind: TowerKind, cx: number, cy: number) => placeTower(game, kind, cx, cy),
  // Blast physics probe for the force harness.
  shove: (x: number, y: number, r: number, power: number) => shove(game, x, y, r, power),
  // Perf probe: bunched spawns along the channel, like real waves.
  spawnOnPath: (count: number) => {
    for (let k = 0; k < count; k++) {
      const [px, py] = pointOnPath(Math.random());
      const a = Math.random() * Math.PI * 2;
      const dd = Math.random() * (PATH_RADIUS - 10);
      game.enemies.spawn(
        Math.random() < 0.85 ? 0 : (Math.random() < 0.8 ? 1 : 2),
        px + Math.cos(a) * dd,
        py + Math.sin(a) * dd,
      );
    }
  },
};

let last = performance.now();
let acc = 0;

function frame(now: number): void {
  const rdt = Math.min(0.1, (now - last) / 1000);
  last = now;
  // A strike armed when the wave ends would swallow build-phase clicks.
  if (game.phase !== 'wave' && ui.strikeArmed) ui.strikeArmed = false;
  acc += rdt * game.speed;
  if (acc > 0.5) acc = 0.5; // don't spiral after a long stall
  while (acc >= DT) {
    tick(game, save, DT);
    acc -= DT;
  }
  render(ctx, game, ui);
  updateHud(game, save, ui);
  if (CARDS_ENABLED) updateHand(game);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
