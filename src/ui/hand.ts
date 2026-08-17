// The card hand: rendered bottom-right, drag cards onto towers/field to play.
// Mod cards want a tower, strike cards want a field position, instant cards
// play on a plain click. A floating ghost follows the pointer while dragging.

import { W, H } from '../defs';
import { CARDS } from '../sim/cards';
import type { Game } from '../state';

export interface HandCallbacks {
  /**
   * x/y are game coords when dropped on the canvas, null otherwise.
   * expectedId guards against the hand changing mid-drag (e.g. a wave-clear
   * draw at 10x speed): the play only lands if hand[index] still matches.
   */
  playCard(index: number, expectedId: string, x: number | null, y: number | null, isClick: boolean): void;
}

let handEl: HTMLElement | null = null;
let deckEl: HTMLElement | null = null;
let canvasEl: HTMLCanvasElement | null = null;
let cb: HandCallbacks | null = null;
let lastKey = '';

let dragIdx = -1;
let dragId = '';
let ghost: HTMLElement | null = null;
let startX = 0;
let startY = 0;
let moved = false;

function moveGhost(x: number, y: number): void {
  if (!ghost) return;
  ghost.style.left = `${x}px`;
  ghost.style.top = `${y}px`;
}

function onMove(ev: PointerEvent): void {
  if (Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) > 6) moved = true;
  moveGhost(ev.clientX, ev.clientY);
}

function onUp(ev: PointerEvent): void {
  window.removeEventListener('pointermove', onMove);
  ghost?.remove();
  ghost = null;
  const idx = dragIdx;
  const id = dragId;
  dragIdx = -1;
  dragId = '';
  if (idx < 0 || !cb || !canvasEl) return;
  const r = canvasEl.getBoundingClientRect();
  const inCanvas =
    ev.clientX >= r.left && ev.clientX <= r.right &&
    ev.clientY >= r.top && ev.clientY <= r.bottom;
  if (inCanvas && moved) {
    cb.playCard(
      idx, id,
      ((ev.clientX - r.left) / r.width) * W,
      ((ev.clientY - r.top) / r.height) * H,
      false,
    );
  } else if (!moved) {
    cb.playCard(idx, id, null, null, true); // click: instants resolve
  }
}

function onDown(ev: PointerEvent): void {
  const card = (ev.target as HTMLElement).closest('.card') as HTMLElement | null;
  if (!card || !card.dataset.idx) return;
  dragIdx = parseInt(card.dataset.idx, 10);
  dragId = card.dataset.id ?? '';
  startX = ev.clientX;
  startY = ev.clientY;
  moved = false;
  ghost = card.cloneNode(true) as HTMLElement;
  ghost.classList.add('dragghost');
  document.body.appendChild(ghost);
  moveGhost(ev.clientX, ev.clientY);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp, { once: true });
  ev.preventDefault();
}

export function initHand(hud: HTMLElement, canvas: HTMLCanvasElement, callbacks: HandCallbacks): void {
  cb = callbacks;
  canvasEl = canvas;
  const wrap = document.createElement('div');
  wrap.className = 'handwrap';
  deckEl = document.createElement('div');
  deckEl.className = 'deckchip';
  handEl = document.createElement('div');
  handEl.className = 'handrow';
  wrap.appendChild(deckEl);
  wrap.appendChild(handEl);
  hud.appendChild(wrap);
  handEl.addEventListener('pointerdown', onDown);
}

const KIND_TAG: Record<string, string> = {
  mod: 'DRAG ONTO TOWER',
  strike: 'DRAG ONTO FIELD',
  instant: 'CLICK TO PLAY',
};

export function updateHand(g: Game): void {
  if (!handEl || !deckEl) return;
  const inRun = g.phase === 'running';
  (handEl.parentElement as HTMLElement).style.display = inRun ? '' : 'none';
  if (!inRun) return;
  deckEl.textContent = `DECK ${g.deck.length}`;
  const key = g.hand.join(',');
  if (key === lastKey) return;
  lastKey = key;
  let html = '';
  g.hand.forEach((id, i) => {
    const def = CARDS[id];
    if (!def) return;
    html += `
      <div class="card ck-${def.kind}" data-idx="${i}" data-id="${id}">
        <span class="cname">${def.name.toUpperCase()}</span>
        <span class="cdesc">${def.desc}</span>
        <span class="ctag">${KIND_TAG[def.kind]}</span>
      </div>`;
  });
  handEl.innerHTML = html;
}
