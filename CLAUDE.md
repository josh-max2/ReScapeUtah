# SWARM — incremental horde tower defense (working title)

Inspired by the *mechanics* of "Sir, We Have an Orc Problem" (incremental TD, fluid
hordes, win-or-lose meta-progression). Original name/art/theme required — no copied
assets or branding, no "Sir/Ma'am, [problem]" title pattern. Theme is deliberately
abstract shapes until mechanics are proven; treat all colors/shapes as placeholder.

## Hard constraints (do not violate)

- **Enemy sim stays structure-of-arrays** (`EnemyPool` typed arrays, swap-remove).
  Never introduce per-enemy objects or allocation inside the tick loop.
- **Enemy indices are only valid within one tick.** Damage sets `hp <= 0`;
  only `sweepDeaths` removes. Never remove enemies mid-tick.
- **Pathfinding is the shared flow field** (`FlowField.compute()`), recomputed only
  when towers change. No per-agent pathfinding, ever.
- **Fixed timestep** (`DT`, accumulator in `main.ts`). Sim logic never reads
  wall-clock time; rendering never mutates sim state.
- **Save format is versioned** (`meta/save.ts`). Any shape change bumps `version`
  and adds a migration. Players' saves outlive refactors.
- **Files stay under ~300 lines.** Split before you exceed it.
- **Run state vs meta state stay separate** (`Game` vs `SaveData`).

## Map & movement (owner-directed, 2026-08-15/16)

- `src/sim/terrain.ts` is the single source of map truth — and maps are now
  PAINTED IMAGES (owner workflow, 2026-08-16): `public/maps/*.png` where
  WHITE = road, BLACK = walls, RED = spawn strip, GREEN = goal. initTerrain()
  (top-level await in main; vite build target es2022) classifies the image at
  canvas scale, builds a chamfer distance field for repel/collision, and
  auto-extracts spawn/goal from the colored marks. New map = drop a PNG and
  point MAP_IMAGE at it. Cell walkability = AREA COVERAGE of fine samples
  (never single center-probes — narrow painted strands must stay connected).
  Terrain painting reads the image directly (sprites.buildTerrain).
- Playwright harnesses must stay MAP-AGNOSTIC: snap anchors to real rim/open
  cells via scripts/maplib.py, never hardcode map coordinates.

## ART LAW (owner-directed 2026-08-16) — READ BEFORE MAKING ANY ART

**AI generation is for TEXTURES ONLY. Objects stay code-drawn.**

- Terrain/ground textures: AI-generated (subtle, tileable, nobody reads a dirt
  texture as "AI"). Owner-approved and locked — see below.
- Towers, enemies, props, UI: CODE-DRAWN geometric art (`render/towerArt.ts`,
  `buildCarSprites`). Clean, deliberate, readable, consistent by construction.
- WHY: owner call after testing generated tower art — "they look obviously AI
  generated, and that's gonna be a big problem. We want to opt for simplicity
  so it doesn't come off as an AI game." This matches the research in
  `design/` notes: the indie audience pattern-matches painterly AI objects and
  penalises them. Simplicity is a CREDIBILITY choice, not a budget choice.
- `art/gen_sprites.py` (textures) stays. `art/gen_family.py` (img2img asset
  families) is kept as a REFERENCE EXPERIMENT ONLY — it proved style
  consistency works but also that img2img clones the hero's silhouette, which
  breaks tower readability. Do not wire generated object art into the game.
- If object art ever needs upgrading, push the code-drawn direction further
  (better silhouettes, layering, palette) — do not reach for a generator.

## Terrain art — LOCKED (owner-approved 2026-08-16)

The textured terrain is the established look; do not regress it to flat fills.
- Materials are AI-generated textures in `public/textures/` (dirt = road,
  grass = wall interiors, rock = wall rims), produced by `art/gen_sprites.py`
  (ComfyUI + SDXL, local). `initArt()` loads them; `buildTerrain()` tiles each
  material by map class, then applies an ALPHA-ONLY shading pass (carved rim,
  worn centre, sunlit wall edge) so material detail survives underneath.
- `buildTerrain()` keeps a flat-colour fallback if textures fail to load —
  keep it working, but textures are the intended path.
- Regenerate/restyle: `python art/gen_sprites.py terrain --seed N` (ComfyUI on
  :8188), then copy `art/textures/*.png` to `public/textures/`.
- Enemy/tower art stays CODE-DRAWN for now (owner: the enemy design is fine).
  Graphics polish is explicitly deferred behind mechanics work.
  clearance() is the one geometry function; sampleDist/wallNormal keep the
  repel/project semantics the car sim expects. Goal-region cells carry an
  explicit dir toward the fort — NEVER leave them dir-0 (strands arrivals).
- Build phase shows ALL wave routes: a 56-tracer virtual fleet (biased wider
  than real cars to probe branches) is clustered into routes; line width
  scales with each branch's traffic share, color = curvature gradient.
- Enemies are cars: heading + scalar speed, traction-limited steering, corner
  braking, smooth distance-field wall collision (never cell-slide), quadratic
  crowd-pressure separation, 3 size buckets per type (SIZE_MULS). All render as
  free-rotating car sprites (64 headings x 3 sizes); LOD drops the mass types
  to rects above ~4.5k alive.
- Blocked cells (towers/walls) must never hard-pin cars: the chew branch
  SLIDES tangentially around obstructions. The flow field forbids diagonal
  corner-cutting past blocked/unwalkable cells.
- Build phase shows the racing-line preview traced from the live flow field
  (momentum-smoothed tracer; cache keyed on field.version). It must re-route
  visibly when towers/walls change the track.
- Ground history: kill sites stamp OIL (not blood); hard cornering/wall
  scrapes stamp tire marks. Persistent per run (GroundLayer).
- Wave size: `waveBudget` is `55 * 1.28^(wave-1)`, NOT the old flat 480 — the
  8x-scale figure was rebalanced away after the difficulty harness showed wave
  1 at 480 was unwinnable for every skill bracket. Budget buys COST, not
  bodies, so unit counts depend on the mix. Measured queue sizes: w1 55 ·
  w5 63 · w9 88 · w12 589 · w14 469 · w20 1153. Early waves are genuinely
  small by design; the flood arrives from ~w12. Fodder principle: mites die to
  one gun shot; threat = volume + speed + tanks. Balance posture 2026-08-16
  (provisional, owner playtest pending): startGold 120, mite hp 4 / leak 3.
- TOWER ROSTER (owner spec, 2026-08-16): 10 weapons (autocannon, flame,
  mortar, cryo, tesla, gatling, rocket, railgun, lattice, mine; keys 1-9,0)
  + wall (key W). Combat behaviors live in sim/combat.ts; ALL damage flows
  through sim/damage.ts (dealHit/dealBeam — armor Threshold + frozen x1.3;
  burn DoT bypasses by design; beams apply threshold per-second).
  Enemy `thresh`: brute 8, titan 25 (mapped from the spec's armored units —
  real tuning waits for the full enemy roster). Deferred from the spec:
  per-tower upgrade pairs, wreck/Tow-Truck, burning ground, Deaf/Off-Line
  units. `scripts/roster.py` asserts every weapon's behavior — keep it green.
- Walls block the track and are INVULNERABLE unless the route is fully sealed
  (two-pass flow field decides; never special-case this in enemy code).
  BUG FIXED 2026-08-16 — this rule had never actually worked. `compute()`
  decided `sealed` by probing ONE cell derived from the fine distance-field
  grid (`SPAWN_X`, nudged +12px) against the COARSE area-coverage `walk` mask.
  The probe landed on a solid cell, so `sealed` was permanently true and walls
  were chewable from wave 1. It now scans the whole 96px rift band: sealed
  means no spawn cell can reach the goal. `scripts/features.py` asserts both
  halves — it previously asserted NOTHING, which is why this survived.
  Mines place on ground but never set blocked/wallCell and never trigger
  field.compute() — the horde walks onto them.
- Tower art + command-bar icons come from render/towerArt.ts (one silhouette
  per kind; card upgrades add visible layers).
- PLACEMENT RULE (owner-directed 2026-08-16): weapon towers mount ONLY on
  unwalkable obstacles (walk===0); walls place ONLY on open ground (walk===1).
- TOWER UPGRADES (2026-08-16): each weapon has TWO mutually exclusive branches
  (`TOWER_UPGRADES` in defs.ts, from the owner's tower spec). Click a tower
  with nothing selected in the palette to open the inspector: stats, both
  branches, and sell (60% refund). One-shot — no re-specs, no buying both.
  `towerStats(t)` in towers.ts resolves def + branch; combat.ts must read
  stats from it (S.*), never raw `def.*`, or upgrades silently do nothing.
  This is the in-run progression surface now that cards are off.
  `scripts/upgrades.py` asserts the inspector, a real DPS change, one-shot
  locking, and sell. Note towers are only damageable by Wreckers (proximity
  contact) — the cell-occupancy chew can't reach rim-mounted emplacements.
- Stuck-car guarantee stack (soft-locks must be impossible): wall repel →
  5-iteration projection → 3s stuck-rescue snap to nearest routable cell
  (g.rescues counts) → 120s post-spawner drain cull ends any wave.
  TREAT `g.rescues` AS AN ALARM, NOT PLUMBING. It is the safety net firing,
  and a high count means something is actually broken upstream. Healthy is
  tens per wave; audit 2026-08-16 found 5300/wave hiding two real bugs.
  Likewise, a wave ending at `drainT` 120 means the cull finished it — the
  wave did not resolve on its own. Check both after any sim change.
- Spawn geometry: the rift band is DEEP (96px), not a narrow gate. At 8x horde
  scale a 24px mouth jams — the wave trickles instead of flooding and the tail
  gets culled (73 slow cars at the rift before the fix, 2 after).
- Speeds: 1x/2x/4x/10x.

## Enemy design law (owner-directed, 2026-08-16) — READ BEFORE ADDING ENEMIES

At horde scale the player never sees, reads, or targets an individual unit.
So enemy variety MUST be visible mass behaviour, never stat sheets:

- **One idea per archetype**, explainable in a single sentence.
- The ability changes what the HORDE does — its shape, speed, mass, or what it
  attacks — so the player answers with placement and composition, never micro.
- **No invisible hard counters.** Armor is SOFT: `ARMOR_FLOOR` (0.25) means a
  light weapon is inefficient against heavy units but never does nothing.
  Never reintroduce zeroing thresholds — the player just sees a broken tower.
- Aura carriers (shield/heal) are ELITES: `auraCap()` in waves.ts bounds them
  per wave. Weights set the ratio, NOT the count — a 20% shielder weight once
  put ~470 bubbles on screen and cost 50fps.
- Anything an ability does must be VISIBLE (aura discs, split bursts, surges).
  An invisible ability is not a mechanic.
- Rejected direction: the fine-grained stat roster in `design/ENEMIES.md`
  (Threshold taxes, per-unit counters, target prioritisation). It fights the
  horde fantasy. That doc is kept as reference, not as a build order.

BOSSES (owner-directed 2026-08-16 — he wants them; what he rejected was the
25-unit STAT roster, not bosses): one per boss wave, currently waves 10 and 20
(`BOSS_WAVES`). A run rolls a stable lineup from `BOSS_TYPES` and the two slots
are guaranteed DIFFERENT — that rotation is the variety hook, so keep it.
Boss waves carry a lighter escort (the boss is the wave) and get a name banner
+ health bar + hull ring. Same one-idea rule as the archetypes:
THE RIG (unloads reinforcements on a timer) · THE MARSHAL (protects the whole
horde until it dies — makes focus mandatory) · SCRAPHEAP (sheds a burst of
units each chunk of HP it loses). Bosses justify single-target towers such as
the Lattice and Railgun — do NOT "fix" those for being anti-horde.
`scripts/bosses.py` asserts each boss's idea plus the health bar.

The archetypes: SWARMER (baseline flood) · RUNNER (speed surges, tests depth) ·
HAULER (armoured soak) · SPLITTER (bursts into 4 swarmers — mass multiplies) ·
SHIELDER (bubble reduces damage inside) · MENDER (heal aura, demands burst)
+ TITAN every 5th wave.

WRECKER is **RETIRED** (owner call 2026-08-17: "they just get stuck"). It
steered straight at the nearest tower, but weapon towers mount on UNWALKABLE
rim cells — so it drove into the wall beside its target and pressed there
forever. The frustration fallback never fixed the root cause: the thing it
wants to reach is somewhere it cannot stand. Its def slot survives at index 6
so TITAN and the bosses do not renumber (harnesses use literal type indices),
but nothing spawns it and the 'wreck' steering branch is deleted.
`scripts/enemies.py` asserts no wave mix contains it. **Any future
tower-attacking enemy must be able to physically reach a rim-mounted tower**,
or it will reproduce this exactly. Wave composition in `waveMix()` gives each wave ONE pressure and a HUD
label; new archetypes phase in gradually, never debuting as the bulk of a wave.
`scripts/enemies.py` asserts every ability — keep it green.

## Deck system — DISABLED (owner call, 2026-08-16)

`CARDS_ENABLED = false` in `src/defs.ts` hides the hand UI, stops all draws,
and stops the post-wave draft. Owner's verdict: the hand and the per-round
draft "take away more than they give" — both looked and felt worse than the
plain build loop. The code is INTACT and flipping the flag restores it; do not
delete `sim/cards.ts` or `ui/hand.ts`, and keep `typeMods` wired (it sits at
zero, so combat needs no changes either way). `scripts/decktest.py` and the
draft half of `scripts/features.py` skip themselves via `__swarm.cardsEnabled`.
Consequence: the Q-strike is now the only in-run active ability — that settles
the earlier "Q-strike vs strike cards" question in favour of Q.

## Deck system spec (retained for the disabled layer)

- `src/sim/cards.ts` owns cards. Hand UI + drag/drop in `src/ui/hand.ts`.
- Mod cards drag onto a tower and upgrade that TYPE; every stack MUST add a
  visible layer to the tower art (drawTower add-ons) — Isaac rule.
- Strike cards drop on the field (wave only); instant cards play on click.
- Draw 3 to open, +1 per cleared wave; every 3rd wave drafts a new card into
  the deck (reuses the perkscreen overlay). Start Wave blocks while drafting.
- The design/template.html frames predate the serpentine — its TOKENS and HUD
  rules still bind; its straight-lane playfield drawings do not.

## Design docs (spec'd, NOT built)

- `design/SKILLTREES.md` — the owner's 100-node meta skill tree spec (Garage /
  Rulebook / Pit Wall), transcribed 2026-08-16 with implementation notes.
- `design/ENEMIES.md` — the owner's full enemy roster spec (6 tiers + 10
  bosses, keyword system, Salvage economy, wave-scaling rules), transcribed
  2026-08-16. NOTE the rule conflicts it documents: spec Threshold floors
  damage at 1 (current code floors at 0) and wave HP scaling is linear.
- These docs + the tower spec form one design bible — read the relevant one
  before designing anything touching meta progression, economy, cards, speed
  controls, enemies, or damage rules, so new work doesn't collide with where
  the design is headed.

## Design contract

`design/template.html` (generated by `design/gen_template.py` — edit the generator,
never the HTML) is the visual spec: palette tokens, two target frames, and the
implementation rules. The renderer (`src/render/`) and HUD (`src/style.css`,
`src/ui/hud.ts`) must match it. Non-negotiables from it:

- Warm daylight field (soil/verge/thicket tokens) — never a dark void.
- Red belongs to blood/damage only (stains, health, rampart wear, invalid ghost).
  The horde is greens; **cyan is interaction only** (selection, ghost).
- All texture work is pre-rendered once (sprites.ts); fire renders additively;
  kill stains persist for the whole run.
- HUD is floating panels over the field (Bahnschrift, letter-spaced caps,
  tabular numerals). No emoji, no glow text, no full-width app bars.
  NOTE: Bahnschrift ships with Windows only — bundle an equivalent webfont
  (e.g. an OFL DIN-style face) before the itch/web launch.
- Coverage rings show in build phase only.

## Balance & difficulty (2026-08-16)

`scripts/difficulty.py` is the difficulty-curve harness: bots play full runs at
three skill brackets (poor/median/strong) and report where each dies plus
per-wave baseHP / towers / gold. Run it after ANY balance change — it has
already caught four real failures that no unit test would:
1. wave 1 sent ~480 units against a 5-tower opening budget (unwinnable);
2. 250 base HP vs 3-damage leaks capped a whole RUN at ~83 leaked cars;
3. a flat wave-clear bounty = linear defence vs exponential threat, so
   expensive towers were never affordable and cheap-spam strictly dominated;
4. (harness bug, same class) a bot that stops buying when it cannot afford its
   planned tower starves itself and looks like a balance result.
Curve as of this pass: poor dies ~w8, strong ~w10, with an EMPTY meta tree.
That is the intended roguelite starting point — the skill tree is meant to
carry the rest. Re-measure rather than reasoning about balance from the code.

## Tower aiming — FIXED ANGLE (owner-directed 2026-08-16)

Towers do NOT acquire targets. The player commits a facing (or a ground area)
at placement and the tower holds it forever — angling the line IS the strategy.
`AIM_MODE` in defs.ts splits the roster:
- **dir** (autocannon, flame, gatling, railgun, lattice) — fires down a fixed
  lane, `LANE_HALF` px wide; whatever drives in gets hit. `findInLane()`.
- **point** (mortar, cryo, tesla, rocket) — services a committed ground area,
  clamped to `[minRange, range]` at fire time. `aimPoint()`.
- **none** (mine, wall).
Chain/splash still use proximity (`nearestTo`) — the ban is on a tower CHOOSING
whom to shoot, not on a tesla arc finding its next hop.

- Flow: click places (unarmed) → mouse aims → click commits. **Escape commits**,
  **right-click cancels** with a 100% refund (it never fired). Starting a wave
  mid-aim auto-commits rather than leaving a dud.
- `placeTower` returns the TOWER INDEX now, not a boolean. `-1` is falsy-unsafe
  — always compare `>= 0`.
- Default aim is the local flow direction (`defaultAim`), set inside
  `placeTower`, so demo prebuild, `__swarm.place` and every bot get a sane
  facing for free.
- **Harnesses must aim their towers**: `maplib.aim_last_at(page, x, y)`. A test
  that spawns a dummy beside a tower without aiming measures zero damage.
  `scripts/aiming.py` covers the state machine, that a lane genuinely gates
  damage, cancel-refund, and click-to-sell.
- Consequences accepted deliberately: gatling spin-down means "nothing in the
  lane" and bleeds rather than snapping; the lattice ramps while hitting
  anything, shifting it from boss-executioner toward lane-melter.

## Forces — blasts move the horde (2026-08-16)

`shove(g, x, y, r, power)` in combat.ts queues an impulse on `impX/impY`; the
movement integrator in enemies.ts consumes it. NEVER write x/y from combat —
that skips wall repel and projection and punches cars through thin walls into
the pockets that strand them. Heavier cars resist (mass = archetype radius ×
size bucket). Wired to mortar impacts, mines, rockets and the Q-strike, each
with a `shock` ring so the shove reads as a cause. `scripts/forces.py` asserts
the push, the mass scaling (measured on the IMPULSE — a ring of titans shoves
itself apart and swamps a displacement measurement), and that nothing lands
off-track.

**Stuck detection was rewritten at the same time.** It measured per-tick
displacement and reset on any tick moving >0.2px, so a car grinding in place at
~9px/s never registered (audit found one holding position 46s). It now measures
NET displacement over a 1s window (`STUCK_WINDOW`, `STUCK_MIN_MOVE`).
STILL OPEN: waves frequently end on the 120s drain cull rather than resolving.

## Front end + settings (2026-08-16)

The overlay is ONE element (`.metascreen`) with three views, so only one can
ever be on screen: `menu` (title · PLAY · OPTIONS) → `hangar` (upgrades +
LAUNCH RUN) → `options`. A finished run always forces `hangar` so the result
is never hidden behind the title. The in-run HUD is display:none behind it.

- **Harnesses must click through the menu**: PLAY (`button[data-view='hangar']`)
  then `button[data-launch]`. `button.launch` alone is ambiguous now — it
  matches PLAY too, which silently never starts a run.
- `SaveData` is **version 2**: it gained `settings`. v1 saves migrate by
  filling defaults; progress is never lost. `scripts/menu.py` asserts the
  migration, the toggles, persistence, and that opening speed applies.
- Only ship options wired to real behaviour — there is deliberately no volume
  slider until there is audio. Current five: route preview, coverage rings,
  ground history, detail (LOD switch point), opening speed.
- `defaultSpeed` is **1** because runs have always opened at 1x. Do not change
  it to make the game feel faster — that is a balance change wearing a menu.

## Verify every gameplay change

Dev server: `npm run dev` (background). Then, with the C:\AI venv Python:

- `scripts/shoot.py` — meta screen + `?demo=5` mid-fight screenshots. LOOK at them.
- `scripts/stress.py` — `?demo=15` flood: enemy counts, tower attrition, FPS
  (must hold ~60 with 600+ enemies).
- `scripts/profile.py` — sim/render ms at 2k/10k/20k enemies via the tick/render
  hooks on `__swarm`. Perf posture (2026-08-15, owner-directed): every enemy is a
  free-rotating car sprite (64 pre-rendered headings, drawImage). 60fps holds to
  ~6-7k concurrent — far above real wave loads. If scale is ever needed beyond
  that, the known knob is dropping the mass types back to batched fillRect
  (measured 6x faster) at the cost of rotation.
- `scripts/playtest.py` — real UI flow: launch → place → fight waves 1-2 → verify
  the save persists cores. NOTE: `launchRun` auto-selects the gun; pressing `1`
  again toggles it off.
- `scripts/features.py` — wall gap-vs-sealed rule + the every-3rd-wave draft.
- `scripts/decktest.py` — deck mechanics: opening hand, drag-mod onto tower,
  click-instant, drop-strike.
- `window.__swarm = { game, save }` is the automation handle; `?demo=N` jumps into
  wave N with a prebuilt gun line.

`npm run build` (tsc + vite) must stay green.

## Balance philosophy

Balance is hand-tuned by humans in playtests — do not "fix" difficulty numbers as a
side effect of code changes. Wave budget/HP curves live in `sim/waves.ts`; meta
costs in `meta/upgrades.ts`. First-run feel target: wave 1 barely survivable with
starting gold, death around waves 2-4 pre-upgrades, each run visibly further.

## Launch posture (decided)

- Web/itch.io first; Steam later via **Electron** (steamworks.js supports it; Tauri
  webviews underperform for canvas). 
- r/incremental_games and galaxy.click require honest AI disclosure — we disclose.
- Avoid "vibe-coded tells": no emoji UI, no neon glow soup, no grandiose upgrade
  names; restrained visual identity, hand-written store/marketing copy.
