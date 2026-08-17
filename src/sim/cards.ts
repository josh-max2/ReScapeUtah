// The deck layer. Cards live in a draw pile + hand; mod cards drag onto a
// tower to upgrade that TYPE (and visibly stack on the art), strike cards drop
// onto the field, instant cards play on click. Draw 1 per cleared wave; every
// 3rd wave drafts a new card into the deck.

import { TowerKind, TOWER_KINDS, STRIKE_RADIUS } from '../defs';
import type { Game } from '../state';
import { dealHit } from './damage';

/** Per-tower-type stacking mods; each level also adds a visual layer. */
export interface TypeMods {
  dmg: number;    // +40% damage per stack
  rate: number;   // +35% fire rate per stack
  splash: number; // +30% blast radius per stack (cannon)
  hp: number;     // +50% hp per stack
  fire: boolean;  // shots ignite
  cryo: boolean;  // shots chill
}

export function defaultTypeMods(): Record<TowerKind, TypeMods> {
  const mk = (): TypeMods => ({ dmg: 0, rate: 0, splash: 0, hp: 0, fire: false, cryo: false });
  const out: Partial<Record<TowerKind, TypeMods>> = {};
  for (const k of TOWER_KINDS) out[k] = mk();
  return out as Record<TowerKind, TypeMods>;
}

/** Run-wide effects from instant cards. */
export interface RunFx {
  goldMul: number;
}

export function defaultRunFx(): RunFx {
  return { goldMul: 1 };
}

export interface CardDef {
  id: string;
  name: string;
  desc: string;
  kind: 'mod' | 'strike' | 'instant';
  targets?: TowerKind[]; // for mod cards
}

export const CARDS: Record<string, CardDef> = {
  barrels:  { id: 'barrels',  name: 'Heavy Barrels', desc: 'Drop on a tower: that type +40% damage', kind: 'mod', targets: ['autocannon', 'gatling', 'mortar', 'rocket', 'railgun', 'flame', 'tesla', 'lattice'] },
  gatling:  { id: 'gatling',  name: 'Gatling Kit',   desc: 'Drop on a tower: that type +35% fire rate', kind: 'mod', targets: ['autocannon', 'gatling', 'tesla', 'mortar', 'rocket', 'cryo', 'flame', 'railgun'] },
  shells:   { id: 'shells',   name: 'Big Shells',    desc: 'Drop on a tower: that type +30% blast radius', kind: 'mod', targets: ['mortar', 'mine'] },
  incend:   { id: 'incend',   name: 'Incendiary',    desc: 'Drop on a tower: that type ignites (burn)', kind: 'mod', targets: ['autocannon', 'gatling', 'mine'] },
  cryo:     { id: 'cryo',     name: 'Cryo Rounds',   desc: 'Drop on a tower: that type chills (slow)', kind: 'mod', targets: ['autocannon', 'gatling', 'tesla', 'rocket', 'mine'] },
  plating:  { id: 'plating',  name: 'Plating',       desc: 'Drop on a tower: that type +50% HP (walls +100%)', kind: 'mod', targets: [...TOWER_KINDS] },
  artillery:{ id: 'artillery',name: 'Artillery',     desc: 'Drop on the field: heavy blast', kind: 'strike' },
  carpet:   { id: 'carpet',   name: 'Carpet Bomb',   desc: 'Drop on the field: a line of blasts', kind: 'strike' },
  nova:     { id: 'nova',     name: 'Frost Nova',    desc: 'Play: chill EVERY enemy for 3s', kind: 'instant' },
  scrap:    { id: 'scrap',    name: 'Scrap Market',  desc: 'Play: +12 gold per card in hand', kind: 'instant' },
  bounty:   { id: 'bounty',   name: 'Bounty Chips',  desc: 'Play: +20% gold from wrecks (permanent)', kind: 'instant' },
  archive:  { id: 'archive',  name: 'Archive Pull',  desc: 'Play: draw 2; +2% all damage per card left in deck', kind: 'instant' },
};

export const STARTER_DECK: string[] = [
  'barrels', 'barrels', 'barrels', 'gatling', 'gatling', 'shells', 'incend',
  'cryo', 'plating', 'artillery', 'artillery', 'carpet', 'nova', 'scrap', 'archive',
];

export function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

export const HAND_CAP = 6;

export function draw(g: Game, n: number): void {
  while (n-- > 0 && g.deck.length > 0 && g.hand.length < HAND_CAP) {
    g.hand.push(g.deck.pop()!);
  }
}

/** Apply a mod card to a tower type. Returns false if the target is invalid. */
export function playModCard(g: Game, id: string, kind: TowerKind): boolean {
  const def = CARDS[id];
  if (!def || def.kind !== 'mod' || !def.targets?.includes(kind)) return false;
  const tm = g.typeMods[kind];
  switch (id) {
    case 'barrels': tm.dmg++; break;
    case 'gatling': tm.rate++; break;
    case 'shells': tm.splash++; break;
    case 'incend': tm.fire = true; break;
    case 'cryo': tm.cryo = true; break;
    case 'plating': {
      tm.hp++;
      const mul = kind === 'wall' ? 2 : 1.5;
      for (const t of g.towers) {
        if (t.kind === kind) { t.maxHp *= mul; t.hp *= mul; }
      }
      break;
    }
    default: return false;
  }
  return true;
}

/** Strike cards resolve at a field position. */
export function playStrikeCard(g: Game, id: string, x: number, y: number): boolean {
  const e = g.enemies;
  const blast = (bx: number, by: number, r: number, dmg: number): void => {
    const r2 = r * r;
    g.hash.query(bx, by, r, (j) => {
      if (e.hp[j] <= 0) return;
      const dx = e.x[j] - bx, dy = e.y[j] - by;
      if (dx * dx + dy * dy <= r2) dealHit(g, j, dmg);
    });
    g.effects.push({ kind: 'boom', x: bx, y: by, r, t: 0, ttl: 0.5, color: '#ffd977' });
    g.effects.push({ kind: 'flash', x: bx, y: by, r: r * 0.9, t: 0, ttl: 0.25, color: '#fff3c4' });
    for (let s = 0; s < 4; s++) {
      g.effects.push({
        kind: 'smoke', x: bx + (Math.random() - 0.5) * r, y: by + (Math.random() - 0.5) * r,
        r: 10 + Math.random() * 14, t: 0, ttl: 1.1, color: '#c9c2b8',
      });
    }
  };
  if (id === 'artillery') {
    blast(x, y, STRIKE_RADIUS * 1.15, 900 * g.mods.dmgMul);
    return true;
  }
  if (id === 'carpet') {
    for (const off of [-90, 0, 90]) {
      blast(x + off, y, 55, 400 * g.mods.dmgMul);
    }
    return true;
  }
  return false;
}

/** Instant cards play with no target. */
export function playInstantCard(g: Game, id: string): boolean {
  if (id === 'nova') {
    const e = g.enemies;
    for (let i = 0; i < e.n; i++) e.slow[i] = 3;
    // (slow strength is global: -40% speed, +30% damage taken)
    g.effects.push({ kind: 'boom', x: 600, y: 340, r: 320, t: 0, ttl: 0.6, color: '#79d6d0' });
    return true;
  }
  if (id === 'scrap') {
    g.gold += 12 * g.hand.length;
    return true;
  }
  if (id === 'bounty') {
    g.runFx.goldMul *= 1.2;
    return true;
  }
  if (id === 'archive') {
    g.mods.dmgMul *= 1 + 0.02 * g.deck.length;
    draw(g, 2);
    return true;
  }
  return false;
}

/** Every-3rd-wave draft: 3 distinct cards offered into the deck. */
export function rollCardChoices(): string[] {
  const pool = Object.keys(CARDS);
  shuffle(pool);
  return pool.slice(0, 3);
}
