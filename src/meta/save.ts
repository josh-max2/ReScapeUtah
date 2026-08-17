// Versioned persistence. Format changes must bump `version` and add a
// migration here — players' saves outlive our refactors.

/**
 * Player-facing options. Every one of these is wired to real behaviour —
 * there are deliberately no placeholder controls (no volume slider until
 * there is audio to control).
 */
export interface Settings {
  routePreview: boolean;   // build-phase racing-line tracers
  coverageRings: boolean;  // build-phase tower range rings
  groundHistory: boolean;  // oil stains + tire marks persisting through a run
  detail: 'high' | 'balanced' | 'performance'; // sprite LOD switch point
  defaultSpeed: 1 | 2 | 4; // speed a run opens at
}

export const DEFAULT_SETTINGS: Settings = {
  routePreview: true,
  coverageRings: true,
  groundHistory: true,
  detail: 'high',
  // 1x preserves how runs have always opened. Changing the default here would
  // be a feel change smuggled in behind a menu — the player opts into faster.
  defaultSpeed: 1,
};

/** Enemy count at which mass types drop to batched rects instead of sprites. */
export const LOD_LIMIT: Record<Settings['detail'], number> = {
  high: 4500,
  balanced: 2500,
  performance: 1200,
};

export interface SaveData {
  version: number;
  cores: number;
  /** Money survives a failed run — the progression hook under continuous flow. */
  gold: number;
  /** Longest continuous run, seconds. Deep tree nodes gate on this. */
  bestTime: number;
  /** Skill-tree ranks by node id (see meta/tree.ts). Replaced `upgrades` in v4. */
  tree: Record<string, number>;
  /** Selected track (map id). */
  track: string;
  /** First-run coaching has been completed or skipped. */
  taught: boolean;
  /**
   * Tokens. A second currency that only CLEARING tracks pays out — one for a
   * first clear, one more for a first clear at full health. They price the
   * capstones, which chips cannot buy at any price, so the deepest upgrades
   * are earned by playing well rather than by grinding time.
   */
  tokens: number;
  /**
   * Per-track award ledger. Awards fire on the FIRST clear and the FIRST
   * perfect clear only — without this, replaying the easiest track mints
   * tokens forever.
   */
  clears: Record<string, { clear: boolean; perfect: boolean }>;
  bestWave: number;
  wins: number;
  settings: Settings;
}

const KEY = 'swarm-td-save';
const VERSION = 5;

const DEFAULTS: SaveData = {
  version: VERSION,
  cores: 0,
  gold: 0,
  bestTime: 0,
  tree: {},
  track: 'map2',
  taught: false,
  tokens: 0,
  clears: {},
  bestWave: 0,
  wins: 0,
  settings: { ...DEFAULT_SETTINGS },
};

/**
 * v3's five flat upgrades and their price curves, frozen here on purpose.
 * A migration must not read the live upgrade table — that table is gone, and
 * even when it existed it would keep changing underneath old saves. The only
 * safe refund basis is the prices the player actually paid.
 */
const LEGACY_COSTS: Record<string, (l: number) => number> = {
  dmg: (l) => Math.round(12 * Math.pow(1.5, l)),
  rate: (l) => Math.round(14 * Math.pow(1.55, l)),
  hp: (l) => Math.round(10 * Math.pow(1.45, l)),
  gold: (l) => Math.round(10 * Math.pow(1.6, l)),
  strike: (l) => Math.round(20 * Math.pow(1.5, l)),
};

/** Chips to hand back for a v3 save's flat upgrades, so nothing is confiscated. */
function refundLegacy(upgrades: unknown): number {
  if (!upgrades || typeof upgrades !== 'object') return 0;
  let chips = 0;
  for (const [id, lvl] of Object.entries(upgrades as Record<string, unknown>)) {
    const price = LEGACY_COSTS[id];
    if (!price || typeof lvl !== 'number') continue;
    for (let i = 0; i < lvl; i++) chips += price(i);
  }
  return chips;
}

/** Accept only known values — a hand-edited or future save must not brick. */
function readSettings(raw: unknown): Settings {
  const s = { ...DEFAULT_SETTINGS };
  if (!raw || typeof raw !== 'object') return s;
  const r = raw as Partial<Settings>;
  if (typeof r.routePreview === 'boolean') s.routePreview = r.routePreview;
  if (typeof r.coverageRings === 'boolean') s.coverageRings = r.coverageRings;
  if (typeof r.groundHistory === 'boolean') s.groundHistory = r.groundHistory;
  if (r.detail === 'high' || r.detail === 'balanced' || r.detail === 'performance') {
    s.detail = r.detail;
  }
  if (r.defaultSpeed === 1 || r.defaultSpeed === 2 || r.defaultSpeed === 4) {
    s.defaultSpeed = r.defaultSpeed;
  }
  return s;
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS, tree: {}, settings: { ...DEFAULT_SETTINGS } };
    const data = JSON.parse(raw) as Partial<SaveData> & { upgrades?: unknown };
    // v3 -> v4: the five flat upgrades became a skill tree. Their ranks cannot
    // be remapped onto nodes one-for-one, so REFUND them — every chip the
    // player spent comes back to be respent in the tree. Nothing is lost and
    // nothing is silently converted into something they did not choose.
    const refunded = (data.version ?? 0) < 4 ? refundLegacy(data.upgrades) : 0;
    // v1 -> v2: settings did not exist. Everything else carries over as-is, so
    // the migration is simply "fill in defaults" — progress is never lost.
    return {
      version: VERSION,
      cores: (typeof data.cores === 'number' ? data.cores : 0) + refunded,
      // v2 -> v3: gold and bestTime did not exist; default them. Nothing is
      // lost, a v2 player simply starts the new economy with an empty bank.
      gold: typeof data.gold === 'number' ? data.gold : 0,
      bestTime: typeof data.bestTime === 'number' ? data.bestTime : 0,
      tree: data.tree && typeof data.tree === 'object' ? data.tree : {},
      track: typeof data.track === 'string' ? data.track : 'map2',
      // Added inside v4 rather than bumping again: v4 was created this session
      // and never shipped, and the loader defaults every unknown field anyway,
      // so a v4 save written an hour ago reads `taught: false` and simply gets
      // the coaching once. No player state can be lost by this.
      taught: data.taught === true,
      // v4 -> v5: tokens did not exist. A v4 player starts the token economy
      // empty and their existing clears are not retroactively paid, because v4
      // had no notion of clearing anything to record.
      tokens: typeof data.tokens === 'number' ? data.tokens : 0,
      clears: data.clears && typeof data.clears === 'object' ? data.clears : {},
      bestWave: typeof data.bestWave === 'number' ? data.bestWave : 0,
      wins: typeof data.wins === 'number' ? data.wins : 0,
      settings: readSettings(data.settings),
    };
  } catch {
    return { ...DEFAULTS, tree: {}, settings: { ...DEFAULT_SETTINGS } };
  }
}

export function persist(s: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Storage unavailable (private mode etc.) — play on without persistence.
  }
}
