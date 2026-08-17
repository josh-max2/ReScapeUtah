// Shared game-state types. Run state (this attempt) is rebuilt every run;
// meta state (cores, upgrades) lives in meta/save.ts and persists.

import { EnemyPool } from './sim/enemies';
import { FlowField } from './sim/flowfield';
import { SpatialHash } from './sim/spatial';
import type { Tower } from './sim/towers';
import type { FlowSpawner } from './sim/waves';
import type { MetaMods } from './meta/upgrades';
import type { TowerKind } from './defs';
import type { TypeMods, RunFx } from './sim/cards';

/**
 * Continuous flow (owner-directed 2026-08-17): there are no waves. A run is
 * one unbroken stream of enemies that thickens with elapsed time, and you
 * build while it is happening. 'stage' still exists as a DERIVED number —
 * it advances on a timer, not on a clear — so all the tested composition,
 * HP-scaling and boss content keeps working unchanged.
 */
export type Phase = 'meta' | 'running' | 'lost';

export interface Effect {
  kind: 'tracer' | 'boom' | 'flash' | 'smoke' | 'arc' | 'rail' | 'shock';
  x: number;
  y: number;
  x2?: number;
  y2?: number;
  r?: number;
  t: number;
  ttl: number;
  color: string;
}

export interface Beam {
  x: number;
  y: number;
  x2: number;
  y2: number;
  color: string;
}

/** A mortar shell in the air: resolves at (x, y) when t reaches 0. */
export interface Impact {
  x: number;
  y: number;
  t: number;
  hit: number;
  r: number;
}

export interface Game {
  phase: Phase;
  wave: number;       // DERIVED stage, advances on a timer (see runT)
  runT: number;       // seconds of continuous flow so far
  gold: number;
  baseHp: number;
  baseMaxHp: number;
  runCores: number;   // meta currency earned this run, banked at run end
  towers: Tower[];
  towerGrid: Int32Array;
  enemies: EnemyPool;
  field: FlowField;
  hash: SpatialHash;
  spawner: FlowSpawner | null;
  effects: Effect[];
  beams: Beam[];
  impacts: Impact[];
  mods: MetaMods;
  deck: string[];                        // draw pile (card ids)
  hand: string[];                        // playable cards (drag to use)
  typeMods: Record<TowerKind, TypeMods>; // per-type card upgrades (visibly stack)
  runFx: RunFx;                          // run-wide instant-card effects
  cardChoices: string[] | null;          // every-3rd-wave draft (blocks Start Wave)
  strikeCd: number;   // seconds until the strike is ready (0 = ready)
  speed: number;      // sim speed multiplier: 1 | 2 | 4
  time: number;       // sim clock (s)
  selected: number;   // index of the inspected tower, -1 = none
  kills: number;      // kills this run (HUD stat)
  spawnAcc: number;   // fractional spawn budget carried between ticks
  /** Test affordance: freeze the flow so a harness can stage exact enemies. */
  flowPaused: boolean;
  rescues: number;    // stuck-car rescues this run (telemetry)
  deaths: number[];   // flat [x, y, r, ...] death positions; renderer drains into the ground layer (oil)
  marks: number[];    // flat [x, y, heading, ...] skid events; renderer drains into the ground layer (rubber)
  runId: number;      // bumps every startRun; renderer clears the ground layer on change
}
