// Floating HUD panels over the playfield + the meta/upgrade overlay.
// Layout contract: design/template.html. The overlay re-renders only when
// dirty; the panels update every frame with cheap writes.

import {
  TOWER_DEFS, TOWER_KINDS, TOWER_UPGRADES, ENEMY_TYPES, TowerKind, WAVES_PER_RUN,
} from '../defs';
import { towerStats } from '../sim/towers';
import type { Game } from '../state';
import type { SaveData, Settings } from '../meta/save';
import { renderTree, setSelectedNode } from './tree';
import { STEPS, type CoachStep } from './coach';

const STEP_IDS = STEPS.map((s) => s.id);
import { waveMix, STAGE_SECS } from '../sim/waves';
import { CARDS } from '../sim/cards';
import { makeTowerIcon } from '../render/towerArt';
import type { UiState } from '../render/draw';

export interface HudCallbacks {
  selectTower(kind: TowerKind | null): void;
  cycleSpeed(): void;
  armStrike(): void;
  buyUpgrade(id: string): void;
  respec(): void;
  skipCoaching(): void;
  selectTrack(id: string): void;
  launchRun(): void;
  pickCard(id: string | null): void;
  upgradeSelected(branch: 1 | 2): void;
  sellSelected(): void;
  closeInspect(): void;
  setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void;
}

interface HudRefs {
  waveEl: HTMLElement;
  hpFill: HTMLElement;
  hpText: HTMLElement;
  goldEl: HTMLElement;
  killsEl: HTMLElement;
  coresEl: HTMLElement;
  coach: HTMLElement;
  towerBtns: Map<TowerKind, HTMLButtonElement>;
  strikeBtn: HTMLButtonElement;
  strikeCd: HTMLElement;
  speedBtn: HTMLButtonElement;
  speedVal: HTMLElement;
  metaScreen: HTMLElement;
  perkScreen: HTMLElement;
  inspect: HTMLElement;
  bossBar: HTMLElement;
}

let refs: HudRefs | null = null;
let metaDirty = true;
let hudRoot: HTMLElement | null = null;

/**
 * Which face of the front-end overlay is showing. The overlay is one element
 * with three views rather than three stacked overlays, so only one thing can
 * ever be on screen and there is no z-order to get wrong.
 *   menu    - title screen: PLAY / OPTIONS
 *   hangar  - between-run upgrades + LAUNCH RUN
 *   options - settings
 */
type MenuView = 'menu' | 'hangar' | 'options';
let view: MenuView = 'menu';
let backTo: MenuView = 'menu';   // where OPTIONS was opened from

export function setMenuView(v: MenuView): void {
  view = v;
  metaDirty = true;
}
let lastPhase = '';

// updateHud runs every frame; only touch the DOM when a value actually changed.
const written = new Map<HTMLElement, string>();
function put(node: HTMLElement, html: string): void {
  if (written.get(node) !== html) {
    written.set(node, html);
    node.innerHTML = html;
  }
}

export function markMetaDirty(): void {
  metaDirty = true;
}

function fmt(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}K`;
  return `${Math.floor(n)}`;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K, cls: string, parent: HTMLElement, html = '',
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = cls;
  if (html) node.innerHTML = html;
  parent.appendChild(node);
  return node;
}

/** Builds the stage + HUD inside root; returns the stage the canvas mounts into. */
export function initHud(root: HTMLElement, cb: HudCallbacks): HTMLElement {
  const playwrap = el('div', 'playwrap', root);
  const stage = el('div', 'stage', playwrap);
  const hud = el('div', 'hud', stage);
  hudRoot = hud;

  const waveEl = el('div', 'panel wavechip', hud, 'WAVE –');

  const health = el('div', 'panel health', hud);
  el('div', 'lbl', health, 'HEALTH');
  const hbar = el('div', 'hbar', health);
  const hpFill = el('i', '', hbar);
  const hpText = el('b', '', hbar);
  const chips = el('div', 'chips', health);
  const goldEl = el('span', '', chips);
  const killsEl = el('span', '', chips);
  const coresEl = el('span', '', chips);

  // First-run coaching. One line, above the command bar, never blocking.
  const coach = el('div', 'panel coach', hud);
  coach.style.display = 'none';
  coach.addEventListener('click', (ev) => {
    if ((ev.target as HTMLElement).closest('[data-skip]')) cb.skipCoaching();
  });

  const ctl = el('div', 'panel ctl', hud);
  const speedBtn = el('button', 'slot', ctl, '<div class="k">SPEED</div>');
  const speedVal = el('div', 'n', speedBtn, '1×');
  speedBtn.addEventListener('click', () => cb.cycleSpeed());
  const strikeBtn = el('button', 'slot', ctl, '<div class="k">Q · STRIKE</div>');
  const strikeCd = el('div', 'n', strikeBtn, 'RDY');
  strikeBtn.addEventListener('click', () => cb.armStrike());

  const slots = el('div', 'panel slots', hud);
  const towerBtns = new Map<TowerKind, HTMLButtonElement>();
  for (const kind of TOWER_KINDS) {
    const def = TOWER_DEFS[kind];
    const b = el('button', 'tslot', slots);
    b.title = `${def.name} · ${def.cost}g\n${def.desc}`;
    const icon = makeTowerIcon(kind, 40);
    icon.className = 'ticon';
    b.appendChild(icon);
    b.insertAdjacentHTML(
      'beforeend',
      `<span class="tkey">${def.hotkey}</span><span class="tcost">${def.cost}</span>`,
    );
    b.addEventListener('click', () => cb.selectTower(kind));
    towerBtns.set(kind, b);
  }

  // Nothing to start any more — the flow never stops. Kept in the refs so the
  // rest of the HUD code and the harnesses do not need special-casing.

  const metaScreen = el('div', 'metascreen', stage);
  metaScreen.addEventListener('click', (ev) => {
    // Tree nodes are SVG groups, not buttons, so they are matched first.
    const dot = (ev.target as Element).closest?.('[data-node]');
    if (dot) {
      setSelectedNode(dot.getAttribute('data-node'));
      metaDirty = true;
      return;
    }
    const target = (ev.target as HTMLElement).closest('button');
    if (!target) return;
    if (target.hasAttribute('data-respec')) { cb.respec(); return; }
    const track = target.getAttribute('data-track');
    if (track) { cb.selectTrack(track); return; }
    const up = target.getAttribute('data-upgrade');
    const nav = target.getAttribute('data-view');
    const set = target.getAttribute('data-set');
    if (up) cb.buyUpgrade(up);
    else if (target.hasAttribute('data-launch')) cb.launchRun();
    else if (nav) {
      if (nav === 'options') backTo = view;
      setMenuView(nav === 'back' ? backTo : (nav as MenuView));
    } else if (set) {
      const raw = target.getAttribute('data-val') ?? '';
      const val: unknown =
        raw === 'true' ? true : raw === 'false' ? false :
        /^\d+$/.test(raw) ? Number(raw) : raw;
      cb.setSetting(set as keyof Settings, val as Settings[keyof Settings]);
      metaDirty = true;
    }
  });

  const perkScreen = el('div', 'panel perkscreen', hud);
  perkScreen.addEventListener('click', (ev) => {
    const target = (ev.target as HTMLElement).closest('button');
    if (!target) return;
    if (target.hasAttribute('data-skip')) cb.pickCard(null);
    else {
      const id = target.getAttribute('data-perk');
      if (id) cb.pickCard(id);
    }
  });

  const bossBar = el('div', 'panel bossbar', hud);

  const inspect = el('div', 'panel inspect', hud);
  inspect.addEventListener('click', (ev) => {
    const b = (ev.target as HTMLElement).closest('button');
    if (!b) return;
    if (b.hasAttribute('data-sell')) cb.sellSelected();
    else if (b.hasAttribute('data-close')) cb.closeInspect();
    else {
      const br = b.getAttribute('data-upg');
      if (br) cb.upgradeSelected(Number(br) as 1 | 2);
    }
  });

  refs = {
    waveEl, hpFill, hpText, goldEl, killsEl, coresEl, coach,
    towerBtns, strikeBtn, strikeCd, speedBtn, speedVal, metaScreen,
    perkScreen, inspect, bossBar,
  };
  return stage;
}

let lastBossName = '';

/** Boss presence: name, threat line, and a big health bar while it lives. */
function updateBossBar(g: Game): void {
  if (!refs) return;
  const e = g.enemies;
  let bi = -1;
  for (let i = 0; i < e.n; i++) {
    if (ENEMY_TYPES[e.type[i]].boss && e.hp[i] > 0) { bi = i; break; }
  }
  if (bi < 0) {
    refs.bossBar.style.display = 'none';
    lastBossName = '';
    return;
  }
  const def = ENEMY_TYPES[e.type[bi]];
  refs.bossBar.style.display = '';
  if (lastBossName !== def.name) {
    refs.bossBar.innerHTML =
      `<div class="bname">${def.title ?? def.name.toUpperCase()}</div>` +
      `<div class="bblurb">${def.blurb ?? ''}</div>` +
      '<div class="bbar"><i></i></div>';
    lastBossName = def.name;
  }
  const fill = refs.bossBar.querySelector('.bbar i') as HTMLElement | null;
  if (fill) {
    const frac = Math.max(0, e.hp[bi] / (e.maxHp[bi] || 1));
    fill.style.width = `${(frac * 100).toFixed(1)}%`;
  }
}

let lastInspectKey = '';

/** Tower inspector: the in-run progression surface now that cards are off. */
function renderInspect(g: Game): void {
  if (!refs) return;
  const t = g.towers[g.selected];
  if (!t) return;
  const def = TOWER_DEFS[t.kind];
  const opts = TOWER_UPGRADES[t.kind];
  const S = towerStats(t);
  let body = '';
  if (!opts) {
    body = '<div class="insnote">No upgrades available</div>';
  } else if (t.upg !== 0) {
    const chosen = opts[t.upg - 1];
    body = `<div class="insdone"><b>${chosen.name.toUpperCase()}</b><span>${chosen.desc}</span></div>`;
  } else {
    body = opts.map((o, i) => {
      const afford = g.gold >= o.cost;
      return `<button class="insupg" data-upg="${i + 1}" ${afford ? '' : 'disabled'}>
        <span class="un">${o.name.toUpperCase()}</span>
        <span class="ud">${o.desc}</span>
        <span class="uc">${o.cost} ⬡</span>
      </button>`;
    }).join('');
  }
  const refund = Math.floor((def.cost + (t.upg ? opts?.[t.upg - 1].cost ?? 0 : 0)) * 0.6);
  refs.inspect.innerHTML = `
    <div class="inshead">${def.name.toUpperCase()}
      <button class="insx" data-close>×</button></div>
    <div class="insstats">DMG <b>${S.hit.toFixed(0)}</b> · RATE <b>${S.rate ? S.rate.toFixed(2) : '—'}</b> · RANGE <b>${S.range.toFixed(0)}</b></div>
    <div class="insopts">${body}</div>
    <button class="inssell" data-sell>SELL · +${refund} ⬡</button>`;
}

let lastPerkKey = '';

function renderDraft(g: Game): void {
  if (!refs) return;
  let cards = '';
  for (const id of g.cardChoices ?? []) {
    const p = CARDS[id];
    if (!p) continue;
    cards += `
      <button class="perkcard" data-perk="${p.id}">
        <span class="pname">${p.name.toUpperCase()}</span>
        <span class="pdesc">${p.desc}</span>
        <span class="plvl">ADD TO DECK</span>
      </button>`;
  }
  refs.perkScreen.innerHTML = `
    <div class="perkhead">WAVE ${g.wave} CLEARED — ADD A CARD TO YOUR DECK</div>
    <div class="perkrow">${cards}</div>
    <button class="perkskip" data-skip>SKIP</button>`;
}

/** One option row: a label, a hint, and 2-3 mutually exclusive choices. */
function optionRow(
  label: string, hint: string, key: keyof Settings,
  choices: [string, string][], current: unknown,
): string {
  const btns = choices.map(([val, text]) =>
    `<button class="optbtn${String(current) === val ? ' on' : ''}"
       data-set="${key}" data-val="${val}">${text}</button>`).join('');
  return `
    <div class="optrow">
      <div class="opttext"><span class="optname">${label}</span>
        <span class="opthint">${hint}</span></div>
      <div class="optbtns">${btns}</div>
    </div>`;
}

const ON_OFF: [string, string][] = [['true', 'ON'], ['false', 'OFF']];

function renderOptions(save: SaveData): string {
  const s = save.settings;
  return `
    <div class="metainner optionsview">
      <h2>OPTIONS</h2>
      <p>Changes save immediately and persist between runs.</p>
      <div class="optlist">
        ${optionRow('Route preview', 'Show where the horde will drive while you are placing',
          'routePreview', ON_OFF, s.routePreview)}
        ${optionRow('Coverage rings', 'Show tower range while building',
          'coverageRings', ON_OFF, s.coverageRings)}
        ${optionRow('Ground history', 'Keep oil stains and tire marks for the whole run',
          'groundHistory', ON_OFF, s.groundHistory)}
        ${optionRow('Detail', 'When huge hordes switch to simplified cars',
          'detail', [['high', 'HIGH'], ['balanced', 'BALANCED'], ['performance', 'PERFORMANCE']],
          s.detail)}
        ${optionRow('Opening speed', 'Speed a run starts at',
          'defaultSpeed', [['1', '1×'], ['2', '2×'], ['4', '4×']], s.defaultSpeed)}
      </div>
      <button class="launch ghost" data-view="back">BACK</button>
    </div>`;
}

function renderMenu(save: SaveData): string {
  return `
    <div class="metainner menuview">
      <h1 class="gametitle">SWARM</h1>
      <p class="tagline">Hold the lane. Everything you kill pays for the next attempt.</p>
      <div class="menubtns">
        <button class="launch" data-view="hangar">PLAY</button>
        <button class="launch ghost" data-view="options">OPTIONS</button>
      </div>
      <p class="meta-stats">CHIPS <b>${save.cores} ◆</b> · LONGEST HELD
        <b>${Math.floor((save.bestTime ?? 0) / 60)}:${String((save.bestTime ?? 0) % 60).padStart(2, '0')}</b></p>
    </div>`;
}

function renderMeta(g: Game, save: SaveData): void {
  if (!refs) return;
  // A finished run always lands on the hangar so the result is never hidden
  // behind the title screen.
  if (g.phase === 'lost') view = 'hangar';
  if (view === 'menu') { refs.metaScreen.innerHTML = renderMenu(save); return; }
  if (view === 'options') { refs.metaScreen.innerHTML = renderOptions(save); return; }
  let head = '';
  if (g.phase === 'lost') {
    const m = Math.floor(g.runT / 60), sec = Math.floor(g.runT % 60);
    head = `<h2 class="bad">OVERRUN</h2><p>You held for ` +
      `${m}:${sec < 10 ? '0' : ''}${sec}, to surge ${g.wave}. ` +
      `Your money stays with you — go again.</p>`;
  } else {
    head = `<h2>SWARM</h2><p>One unbroken flow. It only ever gets heavier.</p>`;
  }
  refs.metaScreen.innerHTML = `
    <div class="metainner wide">
      ${head}
      ${renderTree(save)}
      <button class="launch" data-launch>LAUNCH RUN</button>
      <div class="metanav">
        <button class="linkbtn" data-view="menu">MENU</button>
        <button class="linkbtn" data-view="options">OPTIONS</button>
      </div>
    </div>`;
}

let coachStep: CoachStep | null = null;

/** Set by the frame loop; null hides the panel. */
export function setCoachStep(step: CoachStep | null): void {
  if (step?.id !== coachStep?.id) coachDirty = true;
  coachStep = step;
}
let coachDirty = true;

export function updateHud(g: Game, save: SaveData, ui: UiState): void {
  if (!refs) return;
  if (coachDirty) {
    coachDirty = false;
    refs.coach.style.display = coachStep ? '' : 'none';
    if (coachStep) {
      const i = STEP_IDS.indexOf(coachStep.id) + 1;
      refs.coach.innerHTML =
        `<div class="cstep">STEP ${i} OF ${STEP_IDS.length}</div>` +
        `<div class="ctext">${coachStep.text}</div>` +
        `<div class="chint">${coachStep.hint}</div>` +
        `<button class="linkbtn" data-skip>SKIP</button>`;
    }
  }
  const inRun = g.phase === 'running';

  // There are no waves to count. What matters is how long you have held and
  // how thick the flow has become.
  const mins = Math.floor(g.runT / 60);
  const secs = Math.floor(g.runT % 60);
  const clock = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  const intoStage = (g.runT % STAGE_SECS) / STAGE_SECS;
  put(refs.waveEl, inRun
    ? `${clock}<small> HELD</small>` +
      `<span class="wtype">${waveMix(Math.min(g.wave, WAVES_PER_RUN)).label}` +
      ` · SURGE ${g.wave}</span>` +
      `<span class="wprog"><i style="width:${(intoStage * 100).toFixed(0)}%"></i></span>`
    : 'STANDBY');
  const f = g.baseMaxHp > 0 ? Math.max(0, g.baseHp / g.baseMaxHp) : 0;
  const w = `${(f * 100).toFixed(1)}%`;
  if (written.get(refs.hpFill) !== w) {
    written.set(refs.hpFill, w);
    refs.hpFill.style.width = w;
  }
  put(refs.hpText, `${Math.max(0, Math.ceil(g.baseHp))} / ${g.baseMaxHp}`);
  put(refs.goldEl, `gold <b>${Math.floor(g.gold)}</b>`);
  put(refs.killsEl, `kills <b>${fmt(g.kills)}</b>`);
  put(refs.coresEl, `cores <b>${save.cores}${inRun && g.runCores >= 1 ? ` +${Math.floor(g.runCores)}` : ''}</b>`);

  // No build-phase banner and no START WAVE: the flow is continuous, so
  // `phase` is 'running' for the whole run. Keying that UI on it meant the game
  // permanently told the player to press SPACE to begin a wave that no longer
  // exists, beside a button wired to a no-op.
  const draftPending = g.cardChoices !== null && g.phase === 'running';
  refs.perkScreen.style.display = draftPending ? '' : 'none';
  if (draftPending) {
    const key = (g.cardChoices ?? []).join(',');
    if (key !== lastPerkKey) {
      renderDraft(g);
      lastPerkKey = key;
    }
  } else {
    lastPerkKey = '';
  }

  for (const [kind, btn] of refs.towerBtns) {
    const def = TOWER_DEFS[kind];
    btn.disabled = !inRun || g.gold < def.cost;
    btn.classList.toggle('sel', ui.placing === kind);
  }

  refs.strikeBtn.disabled = g.phase !== 'running';
  refs.strikeBtn.classList.toggle('sel', ui.strikeArmed);
  put(refs.strikeCd, g.strikeCd > 0 ? `${Math.ceil(g.strikeCd)}s` : 'RDY');
  put(refs.speedVal, `${g.speed}×`);

  if (inRun) updateBossBar(g);
  else refs.bossBar.style.display = 'none';

  // Tower inspector
  const sel = inRun && g.selected >= 0 && g.selected < g.towers.length;
  refs.inspect.style.display = sel ? '' : 'none';
  if (sel) {
    const t = g.towers[g.selected];
    const key = `${g.selected}|${t.kind}|${t.upg}|${Math.floor(g.gold)}`;
    if (key !== lastInspectKey) {
      renderInspect(g);
      lastInspectKey = key;
    }
  } else {
    lastInspectKey = '';
  }

  const showMeta = !inRun;
  refs.metaScreen.style.display = showMeta ? 'flex' : 'none';
  // Hide the in-run HUD behind the front end — a title screen with a dead
  // health bar reading 1/1 and a live tower palette reads as broken.
  if (hudRoot) hudRoot.style.display = showMeta ? 'none' : '';
  if (showMeta && (metaDirty || lastPhase !== g.phase)) {
    renderMeta(g, save);
    metaDirty = false;
  }
  lastPhase = g.phase;
}
