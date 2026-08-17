# Build order — everything outstanding (2026-08-16)

The ordering principle, learned the hard way this session: **fix the instrument,
then close the bugs, then make it feel good, then add features.** Design work
ran ahead of a validated core loop and produced a 238-node tree before anyone
had played a build without stuck enemies.

## Assumption up front: let the October Next Fest go

Registration closes 31 Aug and needs a live, approved store page. With the open
bug list that means shipping a demo that burns the one Next Fest a game ever
gets. **Target the February 2027 fest instead.** That removes artificial time
pressure from everything below. The store page should still go up early —
wishlists accrue for months — just not on a two-week sprint.

If you want October anyway, jump straight to items 7 and 8 and accept the rest
slips. Say so and I'll re-order.

---

## Phase 0 — make the work recoverable

### 1. `git init`
**Why first:** this is not a repo. Every change made this session is
unrecoverable if something breaks. Five minutes, zero risk, and it makes every
later step safe to attempt.
**Know before starting:** `.gitignore` needs `node_modules/`, `dist/`,
`art/textures/` (generator output). DO commit `public/textures/` (the game
loads them), `design/`, and `CLAUDE.md` — the design record matters as much as
the code.
**Done when:** a clean `git status` and one baseline commit.

---

## Phase 1 — fix the instrument, then the bugs it should have caught

### 2. Repair `scripts/shoot.py`
**Why here, before the bug fixes:** it is the tool that was supposed to catch
the visual bugs and it has been photographing an empty battlefield — both
"mid-fight" and "late" captures show wave 1 already cleared, 48 and 54 kills,
zero cars on screen. Every "looks fine" I reported was partly based on this.
Fix the instrument before using it to verify anything else.
**Know:** `?demo=N` prebuilds a 24-tower gun line that shreds early waves long
before a screenshot lands. Use a later wave, fewer towers, or assert a live
enemy count before capturing.
**Done when:** captures show 100+ enemies actually fighting, and it fails loudly
if they don't.

### 3. Finish enemy non-overlap
**Where it stands:** peak penetration 1.8 px (wave 9), 4.7 px (wave 14). Was
unbounded. Two real causes already fixed — splitter children collapsing onto a
single point when their fan hit a wall, and separation querying a spatial hash
built before everyone moved.
**Know:** the remainder may not be a solver bug. At 8× horde scale in a narrow
corridor the bodies may not geometrically fit, in which case the fix is density
(congestion braking, corridor width, body radii) not more solver passes.
**Measure that first** — local body area vs corridor area — instead of adding
iterations blindly.
**Also know:** any test must exclude the rift band, where cars legitimately
spawn on top of each other for a tick or two, and watch boss drops, which fan
randomly and can still coincide. `separate()` is O(n · neighbours · passes) —
re-run `profile.py` at 10k before accepting more passes.
**Done when:** deepest penetration under ~1 px away from spawn points, and
`profile.py` unchanged.

### 4. The drain-cull tail
**Why:** waves end on the 120-second safety cull instead of resolving. At 1×
that is up to two real minutes of the player watching an empty map. Found in
the audit, documented twice, never fixed.
**Know:** the survivor is usually the slow anchor — titan or boss — crossing a
big map, plus a few stragglers. Unresolved question: **does the cull ever
delete a live boss**, silently voiding its bounty and its threat? Check that
before choosing a fix.
**Options, in order of preference:** end the wave when every remaining unit is
cull-eligible; speed the tail; shorten the timer. Shortening alone hides it.
**Done when:** waves 5, 10, 15 and 20 end with `drainT` well under 120.

---

## Phase 2 — make it feel like a game

### 5. Audio
**Why here:** the single biggest perceived-quality jump available, and it is
independent of every other item so it can't be blocked. A game about a thousand
things flooding a track, played in silence, reads as broken rather than
unfinished.
**Know:** there is currently *zero* audio — no system, no files, no references
in 5,400 lines. Needs engine hum that swells with horde size, per-weapon fire,
impacts, explosions, a wave-start sting, UI clicks, one music loop.
**Know:** use CC0/licensed libraries (Kenney, Sonniss GDC bundle, freesound),
**not generated audio** — same credibility logic as the ART LAW.
**Know:** at 8× scale hundreds of kills land in the same second. Pool and cap
concurrent instances per sound or it will crackle and tank the frame.
**Know:** the options screen deliberately has no volume slider yet because
there was nothing to control. Ship one with this.

### 6. Onboarding
**Why with audio:** together they are what makes a stranger's first 60 seconds
work, which is what a demo is judged on.
**Know:** nothing exists — a new player gets a map, a command bar and no
instruction. **The aiming flow especially needs teaching**: nobody will guess
that placing a tower is click, move, click again. That is new, it is the core
strategic mechanic, and it is invisible.
**Done when:** someone who has never seen it can place and aim a tower without
being told.

---

## Phase 3 — start the long-lead marketing clock

### 7. Name the game
**Why now:** it blocks the capsule, the trailer and the store page, and those
are the things with months of lead time. It is cheap to decide and expensive to
delay.
**Know:** must avoid the "Sir/Ma'am, [problem]" title pattern, must be original,
and needs a Steam-catalogue collision check plus a basic trademark search.
SWARM is a working title and is heavily used.

### 8. Steam page live
**Why here and not later:** the reference game's page ran ~4 months and
collected 150,000 wishlists while they built. The page is the wishlist clock —
starting it late is the single most expensive mistake available.
**Know:** Steamworks tax interview and bank verification are the one step you
cannot accelerate; start them the day you decide. The $100 fee also starts
Valve's **30-day release gate**, and the Coming Soon page must be live **two
weeks** before release.
**Know:** capsule art must be typographic/geometric per the ART LAW — no
generated objects. Needs 5+ screenshots and a trailer; the horde flowing down
the track is the shot.

---

## Phase 4 — the feature that makes it yours

### 9. Procedural tile drafting (Rogue Tower style)
**Why after the loop is solid:** it is the strongest identity idea raised, and
also the **largest technical risk on this list** — worth doing properly rather
than on top of a shaky core.
**Know:** the map is currently a painted PNG classified once at load, and
`terrain.ts` is documented as "the single source of map truth". Tile drafting
means the map becomes **composable at runtime**, which is a real change to that
file's contract.
**Know:** adding a tile changes terrain, so the walk mask AND the chamfer
distance field must rebuild — both are currently built once in `initTerrain()`.
The flow field only recomputes when towers change; it will need a terrain hook.
The route-preview cache is keyed on `field.version` and will need invalidating.
**Know:** tiles must be validated on draft — a tile that seals the route or
strands a pocket has to be rejected before it is offered.
**Design steer:** tiles that split, condense, or branch the flow are the ones
worth having. That is a crowd-shaping vocabulary, which is what the fixed-angle
towers want to play against.

---

## Phase 5 — progression

### 10. Level select + upgrades as their own destination
**Know:** the front end is already a three-view router (`menu` / `hangar` /
`options`) inside one overlay element — adding views is cheap and low-risk.
**Know:** per-level progress is a save shape change: bump to **v3** and add a
migration. v1→v2 is the worked example.

### 11. The skill tree — build a SUBSET
**Know:** 238 nodes are designed. **Do not build them all.** Ship ~40–60 —
COMMAND plus rings on three or four towers. That delivers the same "there is
depth here" signal for a fifth of the work, and post-launch content is exactly
what the reference game is using to answer its own thin-content criticism.
**Know:** the data already exists as the `TREE` object in
`design/constellation.html`; the rules are in `design/SKILLTREE_V2.md`.
**Know:** another save bump (v3/v4) — refund the old flat upgrades as chips
rather than remapping them.
**Know:** combat must read stats through `towerStats()`, never raw `def.*`, or
nodes silently do nothing. This has bitten before.

---

## Phase 6 — content, balance, polish

### 12. More maps
**Know:** the pipeline is drop-a-PNG (white road, black wall, red spawn, green
goal). There is exactly one. Each needs the area-coverage classifier to keep
narrow strands connected, and harnesses must stay map-agnostic via
`scripts/maplib.py` — they already are.

### 13. Tower cost curve, then re-measure difficulty
**Know:** the median bot currently dies at wave 6, **earlier than the poor bot
at wave 8** — 35 cheap autocannons beat 11 expensive mixed towers. The cost
curve is inverted against your own design intent.
**Know:** `difficulty.py` has not been run since fixed-angle aiming, which will
have moved the whole curve a long way. Run it before touching a number.
**Know:** bots use the default down-flow aim, so their result is a floor, not a
ceiling — do not tune to it directly.
**Know:** your rule — balance is hand-tuned by humans in playtests. Measure,
report, let the numbers be your call.

### 14. A horde-redirect mechanic
**Know:** the impulse system now exists (`impX/impY`, consumed by the movement
integrator), so a deflector or lure is cheap on top of it.
**Know:** anything that pushes must go through the integrator, never write
positions — direct writes skip wall repel and tunnel cars off-track.
**Design steer:** with fixed firing lanes, being able to steer traffic *into*
your lanes is the natural strategic complement. That is the version worth
building.

### 15. Bundle a webfont
**Know:** Bahnschrift ships with Windows only; the HUD silently degrades
everywhere else. Needs an OFL DIN-style face. Cheap — do it before any public
build, including the first playtest.

### 16. Mutate the F1-derived layout
**Know:** recorded as a pre-launch obligation. Change it into an inspired-by
variant and leave it unnamed before anything is public.

---

## Phase 7 — ship

### 17. Playtest → Demo → Next Fest (Feb 2027) → launch
**Know:** the ladder is prototype clips → store page → public Steam Playtest →
Demo in Next Fest → launch, and each rung is a separate discovery event.
**Know:** a game gets **one Next Fest, ever**. Do not spend it on a demo that
is not ready.
**Know:** honest AI disclosure is required by r/incremental_games and
galaxy.click. Frame it yourself, on your own page, before anyone asks.
**Know:** price at $9.99, not $5 — the reference game planned €6.99, raised it
on advice, and it cost them nothing.

---

## Standing changes to how I work on this

1. **A build in front of you after each item**, not a metrics report.
2. **A passing test is not evidence** until I have watched the thing it claims
   to cover. Four tests this session could not see the failure they existed to
   catch.
3. **No new features while a reported bug is open.**
