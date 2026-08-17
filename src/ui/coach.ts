// First-run coaching. NOT a tutorial level and not a modal — a single line that
// tracks what the player is actually doing and gets out of the way.
//
// It exists for one mechanic: towers hold a FIXED committed angle, and placing
// one is click, move, click again. Nobody guesses that. It is the whole
// strategic idea of the game and it is completely invisible — there is no
// turret swinging around to hint that aiming is a thing.
//
// So every step advances on the ACTION, never on a timer or an OK button: the
// player learns by doing the thing, and a player who already knows blows
// through all five steps without noticing they existed.

import { Game } from '../state';
import { UiState } from '../render/draw';

export interface CoachStep {
  id: string;
  text: string;
  hint: string;
  /** True once the player has done this step's action. */
  done: (g: Game, ui: UiState) => boolean;
}

export const STEPS: CoachStep[] = [
  {
    id: 'select',
    text: 'Pick a weapon',
    hint: 'Press 1, or click a slot on the command bar.',
    done: (_g, ui) => ui.placing !== null || ui.aiming >= 0,
  },
  {
    id: 'place',
    text: 'Mount it on the rock — not the road',
    hint: 'Weapons only sit on high ground. Walls are the ones that go on the track.',
    done: (_g, ui) => ui.aiming >= 0,
  },
  {
    id: 'aim',
    text: 'Now aim it',
    hint: 'Move the mouse. That line is the lane it fires down — it will never turn to follow anything.',
    done: (g, ui) => ui.aiming >= 0 && (g.towers[ui.aiming]?.aimMoved ?? false),
  },
  {
    id: 'commit',
    text: 'Click to lock the angle',
    hint: 'Right-click cancels for a full refund while it is still unarmed.',
    done: (g, ui) => ui.aiming < 0 && g.towers.some((t) => t.armed),
  },
  {
    id: 'done',
    text: 'That is the game',
    hint: 'Angle your lanes into the traffic. W builds a wall to bend the route, Q calls a strike.',
    done: () => false, // dismissed on a timer by the caller — nothing left to do
  },
];

export interface CoachState {
  step: number;
  /** Seconds the final card has been on screen. */
  restT: number;
  dismissed: boolean;
}

export function newCoach(): CoachState {
  return { step: 0, restT: 0, dismissed: false };
}

/**
 * Advance the coach. Returns the step to draw, or null when it is finished.
 * Never blocks input and never pauses the sim — the flow is running while the
 * player reads, which is the honest thing to teach them.
 */
export function updateCoach(
  c: CoachState, g: Game, ui: UiState, dt: number,
): CoachStep | null {
  if (c.dismissed) return null;
  const step = STEPS[c.step];
  if (!step) return null;
  if (step.id === 'done') {
    c.restT += dt;
    if (c.restT > 9) { c.dismissed = true; return null; }
    return step;
  }
  // Steps can complete out of order (a player who already knows the game places
  // and commits before reading step 1), so skip ahead past anything satisfied.
  while (c.step < STEPS.length - 1 && STEPS[c.step].done(g, ui)) c.step++;
  return STEPS[c.step];
}
