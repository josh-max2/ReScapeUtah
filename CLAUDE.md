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
- **Pathfinding is SHARED ROUTE FIELDS** (`sim/routing.ts`), rebuilt only when
  the obstacles change. No per-agent pathfinding, ever. A car carries ONE BYTE
  (`enemies.route`) naming which shared field it follows — that is a
  preference, not a search. `routes[0]` IS `g.field` and stays canonical:
  route preview, the sealed/chew rule, placement, the stuck-rescue search and
  `defaultAim` all read it, so which line a car happens to be on can never
  make the game think a wall is breachable or a cell unroutable.
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

## Balance & difficulty — MEASURED UNDER CONTINUOUS FLOW (2026-08-17)

`scripts/difficulty.py` was rewritten for the flow model: no waves, so the
measure is TIME HELD, and each bracket now differs in how it AIMS, because
fixed lanes made aiming the dominant skill. Bots buy mid-fight (there is no
build phase). `SWARM_SPREAD=N` forces one spacing across brackets — spacing is
a real confound now and must be controlled before blaming a result on cost.

Current numbers — 2 runs per bracket at 150px spacing, re-measured 2026-08-17
after ROUTE CHOICE landed:

    poor    (default aim)   held 2:50   surge 8
    median  (road aim)      held 7:21   surge 19
    strong  (downflow aim)  held 6:07   surge 16

**Route choice made the game markedly easier for competent play, and that is
an owner decision, not a bug to tune away.** Same brackets immediately before
it: poor 2:39 · median 2:30 · strong 3:38. Poor barely moved (+11s); median
went up ~3x. The mechanism is straightforward — alternates are LONGER than the
shortest path, so a horde that splits spends more time under fire and arrives
at the fort spread out instead of in one mass. Poor gains nothing from that
because its lanes point the wrong way, so extra exposure buys it little.

Median outlasting strong here is almost certainly noise: strong is the bracket
with the known +/-50% swing and this is 2 runs. Do not read a bracket
inversion into it.

**The shootout table below predates route choice.** Spread traffic clusters
less, so the AoE weapons' 4x figures are the ones most likely to have moved.
Re-run `shootout.py` before quoting those numbers as current.

1. **Aiming pays, but this harness cannot yet say by how much.** Across three
   measurements this session strong came in at 7:00, 4:57 and 3:38 — a ±50%
   swing — while poor (2:40/2:35/2:39) and median (2:24/2:22/2:30) barely
   moved. Only strong's plan is long enough for spot choice and upgrade timing
   to compound, so it is the unstable one. The old "aiming is worth ~2.6x"
   line came from a single high sample and is WITHDRAWN at that precision.
   Directionally aiming is clearly the dominant skill; quote no multiplier
   until strong is run at 5+ reps.
2. **Spacing matters.** Clustered fixed lanes overlap and waste coverage, so
   spacing is a genuine confound — control it (`SWARM_SPREAD`) before blaming
   any result on cost or on a weapon.
3. **Poor and median are a tie, not an inversion** (2:39 vs 2:30, inside the
   noise). ~~The cost-curve inversion is REAL~~ — **WITHDRAWN 2026-08-17, it
   was a measurement artifact.** See below.
4. Strong fields FEWER towers than poor throughout (11 vs 19 at 130s) and
   still holds longer — independent corroboration that expensive towers earn
   their price.

**Do not quote a bracket comparison as evidence about tower cost.** The
brackets differ in aim style AND weapon mix simultaneously; `shootout.py` is
the instrument that separates them.

## Two bugs the cost investigation actually found (2026-08-17)

Both were invisible to every existing test and visible in one screenshot.

- **Flame was gated on the wrong shape.** A 90-degree cone weapon triggered on
  `findInLane`, a LANE_HALF strip 52px wide, so a flamethrower with twenty cars
  inside its cone held fire unless one sat in the centre strip. Cone weapons now
  gate on `firstInCone`. Separately its `range: 60` predated the rim-only
  placement law: mounts sit 20px off-road, leaving a 40px-deep wedge and ~3 road
  cells of coverage against the autocannon's ~13. Range is now 90. Flame went
  0.22x -> 0.42x (gate) -> 1.61x (range) vs autocannon spam. If a weapon's
  trigger shape and effect shape ever disagree again, that is the first suspect.
- **Wave UI outlived the wave system.** The build-phase banner and START WAVE
  button were keyed on `g.phase === 'running'`, which under continuous flow is
  true for the WHOLE RUN — so the game permanently told the player to press
  SPACE to begin a wave that no longer exists, beside a button wired to a no-op.
  Removed, with its CSS and plumbing. Route preview and coverage rings had the
  same gate and now show while `ui.placing`/`ui.aiming` is active, which is the
  honest translation of the design contract's "build phase only". SPACE survives
  as commit-aim.

Standing lesson, third time now: `phase` has ONE value during play. Any UI that
used it to mean "not fighting yet" is currently always-on — audit before adding.

## The cost curve is NOT inverted (measured 2026-08-17)

The "cheap spam dominates" claim stood since the 2026-08-16 audit and drove a
whole plan item. It came from comparing difficulty.py brackets — but those
brackets differ in AIM STYLE and WEAPON MIX at the same time, and the poor/
median gap is ~13s on runs whose variance is larger than that. It never
isolated cost. Do not revive it from bracket comparisons.

`scripts/shootout.py` is the instrument that DOES isolate it: every weapon gets
an identical budget, spends it upfront on identical route-ordered emplacements
with identical downflow aim, and is scored on fort damage prevented per gold
actually spent, against a no-tower baseline. Its guards exist because each one
was got wrong first: the clock is PAUSED while buying (placing twelve towers
takes longer than three), the fort is unkillable (a weak stack must not score
on a shorter window), there is NO reinvestment (kill income compounds for
whoever is already winning), and placements are VERIFIED (the route-ordered
spot list starts inside the rift band where placement is refused, which silently
cost every weapon its first 2-3 towers and made the first table meaningless).

Measured, 480g budget, 120s window, 2 reps — fort damage stopped per 100g,
relative to autocannon spam:

    cryo 4.11x · mortar 3.86x · tesla 2.98x · rocket 1.76x · flame 1.61x
    lattice 1.38x · AUTOCANNON 1.00x · gatling 0.73x · railgun 0.29x

Autocannon spam ranks 6th of 9. Expensive towers already earn their price, so
**do not "fix" TOWER_DEFS costs.** Two live notes:
- **railgun 0.29x is BY DESIGN** — it is the anti-boss weapon and the enemy
  design law explicitly forbids fixing it for being anti-horde. Judge it in an
  armored/boss window, never here.
- **gatling 0.73x is the one open balance question.** At 110g it is beaten by
  40g spam. Not a bug — it is single-target with hitMax 22 against 4hp mites,
  so ~80% of every shot is overkill. Owner's call; the obvious lever is giving
  its ramped stream a pierce so overkill spills down the lane.

## Balance & difficulty (2026-08-16, wave model — superseded)

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

## LEVELS — one map is one level (owner-directed 2026-08-17)

`LEVELS` in `sim/terrain.ts` is the list, in play order, and it GROWS as maps
are painted. Adding one is two steps and nothing else:
1. paint `public/maps/<id>.png` (or add a function to `art/gen_maps.py`),
2. add a row to `LEVELS`.

Everything downstream keys off `id`, so the clear ledger, the token awards, the
level-select cards and the numbering all pick a new level up for free.
`scripts/maps.py` DISCOVERS the list from `window.__swarm.levels` rather than
hardcoding it — a hardcoded list would have kept passing while an unplayable
new level shipped. Adding CHICANE as level 5 was the test of that: the
validator found it and checked it without being told.

The save key is still `track`, deliberately — renaming a persisted field for
vocabulary costs a migration and buys the player nothing.

## TOKENS + THE CLEAR (owner-directed 2026-08-17)

Two currencies, deliberately different in what they reward:
- **CHIPS** (`save.cores`) come from kills and time held, are kept when you
  fail, and buy the ordinary tree. Grinding pays them.
- **TOKENS** (`save.tokens`) come ONLY from clearing a track: one for a first
  clear, one more for a first clear at full fort health. They price the four
  capstones, which chips cannot buy at any price.

`save.clears[trackId] = { clear, perfect }` is the ledger, and the awards are
once per track per kind — without it, replaying the easiest track mints tokens
forever and the capstones are free. Supply is therefore 4 tracks x 2 = 8, and
the capstones cost 2 each. Their old `bestTime` gates are GONE: earning the
token is the gate, and two gates on one node is friction, not depth.

`g.tokenEligible` is cleared by `?demo=N`, which drops into a late surge with a
prebuilt gun line — reaching the finish from there is not an achievement.
Save **v5**. `scripts/tokens.py` covers all of it.

## SCALING — why the late game had no arc (measured 2026-08-17)

A 7-minute playtest sat at 333/400 fort HP from surge 8 to surge 18, never once
threatened. The obvious suspect was the rift being a throughput cap, so it was
measured first: bodies/sec is 6.6 at surge 5, 12.8 at 10, 41.5 at 14, 78.7 at
17, 113.6 at 20, 349 at 24. **Count scales fine — the rift is not a cap.**

The real cause: player DPS compounds (kills -> gold -> more permanent towers)
while per-body toughness rose only LINEARLY (`1 + 0.11(w-1)`). A wall of 4hp
mites is trivial to a mature gun line however many there are. `waveHpMul` now
adds a quadratic tail past surge 10 (`+0.022*(w-10)^2`), identical below it so
the opening — already a real fight — is untouched. Same playtest after: fort HP
263 -> 233 -> 182 and the run ENDED at surge 23. Clear lands at 21, death in the
low 20s, which is the intended shape. Numbers provisional pending playtest.

**The speed control is aspirational at scale.** Measured at surge 20-23 after
the change: 1x and 2x hold a true 60fps with ~6000 alive (ratio 1.00), 4x
delivers 0.87, and 10x delivers **0.26** — about 2.6x. The accumulator clamp in
main.ts (`acc > 0.5`) discards sim time it cannot afford, so the request is
silently dropped rather than the frame rate collapsing. The player experience at
the speeds people actually play is fine; the READOUT was the problem, and it now
shows the achieved figure alongside the requested one when it falls short.
Consequence for harnesses: anything running at 10x takes far longer in wall
clock than sim-seconds/10 suggests — that is what timed difficulty.py out.

**Never edit src/ while a Playwright harness is running.** The vite dev server
hot-reloads the page and the run dies with "Execution context was destroyed".

STILL OPEN: the gold sink. That run finished holding 33,000 unspent gold with
nothing to buy — the economy stops meaning anything around minute five, and
neither directive covered it.

## DRAFTED TILES — the map is no longer fixed (2026-08-17)

Every surge offers three pieces (`sim/tiles.ts`); taking one lets the player
edit the track. Non-blocking, because the flow never stops — an offer sits
there until it is used or the next surge replaces it. One tile per offer.

The three do crowd SHAPE, not stats, which is the vocabulary fixed-angle towers
want to play against: ISLAND (a rock in the road — the flow splits, and rocks
are where weapons mount) · NARROWS (pinches from both sides; everything bunches
through the gap) · BYPASS (carves a new way through wall).

**`terrain.ts` is no longer built-once.** That sentence in its header used to be
the whole contract. What a tile placement now has to keep in step:
1. `open4` (the fine road mask) — stamped directly.
2. `distField` — `rebuildDerived()`. This is what wall repel, collision and
   projection read; skip it and cars collide with walls that are gone.
3. The COARSE walk mask — `buildWalkMask()`, then assigned to EVERY route
   field, which each hold their own reference.
4. `mapPixels` + `invalidateTerrain()` — the terrain art is pre-rendered from
   the IMAGE, not from the road mask, so without this the picture keeps showing
   the old track while cars drive the new one. Repaint only the terrain:
   nulling it and letting `ensureAssets` run rebuilds every car sprite too.
5. `recomputeFields()` — also bumps `field.version`, the route-preview cache key.

**The rule that makes it safe:** a tile is stamped onto a snapshot, checked for
a spawn->goal route on the coarse mask, and ROLLED BACK if the track no longer
connects. A sealed map mid-run is unrecoverable. `scripts/tiles.py` forces 117
islands in (road 1814 -> 812 cells) and asserts the track never cuts.

**Terrain is module state; tiles are run state.** `startRun` calls
`resetTerrain()` AND re-derives the walk mask — restoring the fine mask alone
leaves every route holding the last run's rocks, which is exactly the bug the
harness caught.

## ROUTE CHOICE — the horde splits instead of queueing (2026-08-17)

Owner's complaint: every car took the same line, bunched up, crawled, and only
spilled onto a parallel branch once crowd pressure shoved it there. He asked
for routes with an ETA each, and cars picking the shorter one.

- `ROUTES` (3) shared fields. Route 0 is the plain shortest path. Each
  alternate is computed AVOIDING the traced corridors of the routes above it
  (`FlowField.avoid`), which is what makes it a genuinely different line rather
  than a noisy copy of the same one.
- `routeEta[r] = trueLength * (1 + K * meanDensityOnItsCentreline)`. Cars pick
  the lowest on spawn and the pick is STICKY for life.
- **Sticky is the whole trick.** Route 0 fills, its ETA rises, the next
  arrivals take route 1, and the shares settle where the ETAs equalise
  (measured: 6214 / 6307 / 6482 on DELTA).

**A dead end worth not repeating: a single congestion-weighted field.** It is
the obvious implementation and it made spreading WORSE — busiest branch went
0.82 -> 0.98 on DELTA. One shared gradient can only move the whole horde at
once, so it cannot split it; it herds everyone onto whatever is momentarily
cheapest and even drags pressure-displaced cars back onto the main line,
because a lone car on a side branch is the only density on it.

**Two traps that cost real time, both invisible without a probe:**
1. ETA must use the route's TRUE traced length, never `field.cost`. Cost
   includes the avoidance penalty used to SHAPE an alternate, so comparing
   costs made alternates look 60-200% longer and route 0 always won.
2. Density must be sampled on the route's CENTRELINE, not its fattened
   corridor — the corridor averages a real jam with the empty verge beside it.

Also: `FlowField`'s constructor calls `buildWalkMask()`, so fields MUST be
built inside `createGame` (after `await initTerrain()`). Hoisting them to
module scope runs them at import time, before terrain exists, and every route
gets an empty walk mask — the symptom is a silent pile-up in the rift, not an
error. `scripts/pathing.py` measures branch share, the ETA spread, the
against-flow fraction (the U-turn failure mode) and `g.rescues`.

Deferred by the owner, and the reason the byte exists: per-archetype
preference — some units always take the shortest DISTANCE and refuse a longer
line whatever the ETA, bigger ones route more cleverly. Not built.

## CONTINUOUS FLOW — there are no waves (owner-directed 2026-08-17)

A run is ONE unbroken stream that thickens with elapsed time. You build inside
it; nothing pauses. Phases are now `'meta' | 'running' | 'lost'` — no build
phase, no wave phase, no win state.

- `g.runT` is elapsed run seconds. `g.wave` survives as a DERIVED **stage**
  (`stageAt(runT)`, `STAGE_SECS` = 24) that advances on the clock rather than
  on a clear. Everything downstream — `waveMix`, `waveHpMul`, boss roster,
  `auraCap` — is reused unchanged, so all the tuned content carries over and
  only its cadence changed.
- `FlowSpawner` in waves.ts accumulates `flowRate(runT)` budget per tick and
  releases units as it can afford them. The rate is the old per-stage budget
  spread across the stage and blended across the boundary, so the pressure
  curve is the one the difficulty harness was tuned against.
- **The drain cull is gone.** It existed only to guarantee a wave could end,
  and it was silently deleting stragglers and bosses.
- **Money persists.** `save.gold` carries between attempts (save **v3**);
  `startRun(g, mods, bankedGold)` restores it. A failed run leaves you richer,
  which is the progression hook now. `save.bestTime` records the longest hold.
- `startWave()` is a retained no-op so callers do not need special-casing.
  The START WAVE button is hidden.
- `?demo=N` means **N surges in**, not wave N.
- **`g.flowPaused` is the harness affordance**: it freezes spawning AND the
  clock. Harnesses that stage exact enemies must set it, or the stream refills
  the pool and rising `hpMul` makes staged units tougher than the test expects.
  Both mistakes were made and caught while building this.

RESOLVED 2026-08-17 — there IS a clear now, and it did not cost the endless
model. See TOKENS below: reaching the far side of the final surge with the fort
standing CLEARS the track. It is a milestone inside a run that keeps going, so
"a run ends only when the fort falls" is still literally true and best-time
survives as the endless chase on top of a goal you can actually finish.

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
(The drain-cull note that sat here is RESOLVED: continuous flow deleted the
cull entirely — there are no waves left to fail to resolve.)

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
