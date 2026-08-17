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
  /** Longest continuous run, seconds. */
  bestTime: number;
  upgrades: Record<string, number>;
  bestWave: number;
  wins: number;
  settings: Settings;
}

const KEY = 'swarm-td-save';
const VERSION = 3;

const DEFAULTS: SaveData = {
  version: VERSION,
  cores: 0,
  gold: 0,
  bestTime: 0,
  upgrades: {},
  bestWave: 0,
  wins: 0,
  settings: { ...DEFAULT_SETTINGS },
};

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
    if (!raw) return { ...DEFAULTS, upgrades: {}, settings: { ...DEFAULT_SETTINGS } };
    const data = JSON.parse(raw) as Partial<SaveData>;
    // v1 -> v2: settings did not exist. Everything else carries over as-is, so
    // the migration is simply "fill in defaults" — progress is never lost.
    return {
      version: VERSION,
      cores: typeof data.cores === 'number' ? data.cores : 0,
      // v2 -> v3: gold and bestTime did not exist; default them. Nothing is
      // lost, a v2 player simply starts the new economy with an empty bank.
      gold: typeof data.gold === 'number' ? data.gold : 0,
      bestTime: typeof data.bestTime === 'number' ? data.bestTime : 0,
      upgrades: data.upgrades && typeof data.upgrades === 'object' ? data.upgrades : {},
      bestWave: typeof data.bestWave === 'number' ? data.bestWave : 0,
      wins: typeof data.wins === 'number' ? data.wins : 0,
      settings: readSettings(data.settings),
    };
  } catch {
    return { ...DEFAULTS, upgrades: {}, settings: { ...DEFAULT_SETTINGS } };
  }
}

export function persist(s: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Storage unavailable (private mode etc.) — play on without persistence.
  }
}
