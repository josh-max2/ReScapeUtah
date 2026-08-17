# META SKILL TREE v2 — owner-directed 2026-08-16 (BUILD SPEC)

**Revision 3 (2026-08-16): comprehensive pass.** Every node references a real
tower, enemy archetype, boss, or shipped system. Node vocabulary is pulled from
the owner's own 100-node `SKILLTREES.md` wherever that spec maps onto something
that actually exists; invented nodes fill the gaps. **86 nodes across 16 lines.**

Rev 3 added a fourth line to each branch — EMPLACEMENTS (the tower as a
structure, which is what Wreckers attack), THE RIFT (the spawner itself),
LAYOUT (build-phase tools) and RISK (wagers) — and put every line in a fixed
reading order.

**Ordering rule.** Each line reads outward in *ascending cost*: cheap
incremental ranks first, then the expensive one-offs, then gated unlocks, and
the capstone last. `design/skilltree.html` asserts this at render time and logs
`OUT OF ORDER` to the console if any line breaks it.

Supersedes the 100-node `SKILLTREES.md` as the thing we actually build. That doc
stays as the idea bank; this is the shipping shape.

> **All numbers here are placeholders.** Per CLAUDE.md, balance is hand-tuned by
> humans in playtests. These exist so the structure can be judged and built —
> tune them after `scripts/difficulty.py` measures the tree's effect.

## Owner's brief (verbatim intent — unchanged)

- Earn points per kill / from gold.
- **You keep them when you fail** — that is the roguelite hook.
- Spend into a skill tree with **more tycoon dynamics** than the current flat
  5-upgrade screen.
- **One central node**, then **four branches**: the three known ones
  (Garage / Rulebook / Pit Wall) plus one that is **tycoon-flavoured**.
- Some paths **unlock after clearing a level** and can then be bought.
- Net effect: **each reattempt starts from a better place than the last.**

---

## The rule that keeps meta nodes from eating the in-run upgrades

The game already has `TOWER_UPGRADES` — two mutually exclusive branches per
weapon, bought with gold, one-shot, in-run. The meta tree must not make those
choices trivial. The rule:

> **A meta node may share an AXIS with an in-run branch (incremental, global,
> permanent). A meta node may NEVER grant a branch's binary EFFECT.**

So "+1 Minefield charge per rank" is fine alongside Rapid Deploy (+3 charges),
because Rapid Deploy is still a real 50-gold decision on one tower. But a meta
node granting **Shatter** would collapse the Cryo choice to Deep Freeze forever,
so no such node exists.

Binary in-run effects that are **off-limits** to meta nodes:
`shatter` (Cryo) · `threshIgnoreAll` (Lattice Piercing Optics) · `preSpun`
(Gatling) · `hitFloor` (Gatling Depleted Rounds) · `cluster` (Mortar) ·
`vsArmor` (Rocket Bunker Buster).

Note the ARMOUR PIERCING capstone applies to **kinetic** towers only — the
Lattice is energy, so Piercing Optics stays a live choice.

**Weapon classes** (referenced by class-wide nodes; resolves the open question
in `SKILLTREES.md`'s implementation notes):
- **Kinetic** — Autocannon, Gatling, Railgun, Rocket Battery, Mortar Pit, Minefield
- **Energy** — Flamethrower, Tesla Coil, Laser Lattice
- **Utility** — Cryo Sprayer, Wall (damage-light; Cryo counts as Energy only for
  Frozen synergies, never for damage nodes)

---

## Currency

`cores` already does what the owner described (earned per kill, banked on death,
persists in the versioned save). Keep the mechanic, rename in UI to **CHIPS** so
it reads as money, and add the run-end payout the owner asked for:

    chips_earned = kills_component (existing) + floor(gold_earned_this_run * 0.05)

**Cost convention:** every node has a `base` cost; rank *n* costs
`round(base * 1.5^n)`. Single-rank gated nodes and capstones are flat.

## Shape

                        ┌── GARAGE (the ten weapons)      28 nodes · 4 lines
                        │      ballistics · energy · ordnance · emplacements
                        │
        [ COMMAND ] ────┼── RULEBOOK (the horde & rules)  18 nodes · 4 lines
         4 nodes        │      damage rules · elites · the rift · mass & bosses
                        │
                        ├── PIT WALL (track & tempo)      21 nodes · 4 lines
                        │      the track · tempo & strike · information · layout
                        │
                        └── HOLDINGS (tycoon / economy)   15 nodes · 4 lines
                               earn · protect · risk · compound

- COMMAND is free and always owned; it holds the universal boosts and is the
  visual hub every branch radiates from.
- A branch's first node needs COMMAND rank 1. Deeper nodes need their parent.
- **Gates**: a gated node shows locked with its requirement visible
  ("CLEAR W10"). Wave gates read the existing `bestWave` field in the save; the
  single `WIN` gate (Overtime) reads `wins` instead.

> **Superseded in part (2026-08-16).** The owner asked for **multiple trees —
> one per tower** and chose **THE CONSTELLATION** shell from the three concepts
> in `design/treeconcepts.html`. The shipping shape is now:
>
> - `design/constellation.html` — **the tower trees.** Four levels: COMMAND hub →
>   11 tower cores + the MANUAL GUN orbiting it → branch nodes → 5 upgrades
>   ringed around each branch. 11 × 19 + 25 + 4 = **238 nodes**, all authored.
>   Its `DETAIL` object is the data source, and the page asserts every cluster
>   keeps the same ring shape (logs `SHAPE DRIFT` if one diverges).
>
> **THE MANUAL GUN (owner-directed 2026-08-16) — NOT YET IN THE SIM.** The owner
> asked for the player's own aimed weapon to sit in the constellation with its
> own branch of alternate weapons. It is the only cluster with **four** branches:
> MACHINE GUN (base, sustained chip fire) · FREEZE RAY (control, no damage) ·
> CLUSTER BOMB (lobbed, executes low-HP chaff) · BEAM (must be held, ramps).
> Design rules for it:
> - **Heat is the shared limiter** across all four modes. A held-down weapon with
>   no cost trivialises a horde game; heat is what makes mode-switching a
>   decision and stops the player out-damaging their own towers.
> - It is aimed at the cursor, so it is the ONE place the game asks for manual
>   aim. That does not violate the enemy-design law (no targeting individual
>   units) because the player is aiming at a *place in the crowd*, not selecting
>   a unit — the same reason the Q-strike is allowed.
> - Today the only active ability is the Q-strike (`STRIKE_DMG` 500,
>   `STRIKE_RADIUS` 70). Building the manual gun means deciding whether it
>   **replaces** the Q-strike or sits alongside it. Recommend replacing: two
>   active abilities on one hand is the kind of extra system the owner has
>   already cut once (see the deck layer).
> - Every tower's branches are **OUTPUT / REACH / IDENTITY** — the first two mean
>   the same thing everywhere, the third always attacks that weapon's own stated
>   weakness, so only one ring per tower needs original design. The Wall is the
>   one exception (STRUCTURE / SHAPE / TRAFFIC) because it deals no damage.
> - The meta nodes below **still apply** — they are the global layer that sits
>   behind the per-tower trees, not a replacement for them. The de-dupe rule
>   above now has a second job: a COMMAND-level node must not duplicate a
>   tower-level ring node either.

---

### COMMAND — hub · always owned · 4 nodes

#### UNIVERSAL

| Node | Effect | Ranks | Base | Gate |
|---|---|---|---|---|
| Requisition | +40 starting gold | 6 | 12 | — |
| Reinforced Fort | +60 fort HP | 6 | 12 | — |
| Calibration | +3% damage, all towers | 5 | 14 | — |
| Optics | +6px range, all towers | 3 | 16 | — |

### GARAGE — the ten weapons · 28 nodes

**Root — Workshop Tools** · −5% tower build cost · 4 ranks · base 16

#### BALLISTICS — Autocannon · Gatling · Railgun · Rocket

| Node | Effect | Ranks | Base | Gate |
|---|---|---|---|---|
| Autocannon Feed | Autocannon +6% rate of fire | 5 | 10 | — |
| Spin-Up Motors | Gatling hits its ceiling 15% sooner | 3 | 16 | — |
| Barrel Cooling | Gatling damage ceiling +8% | 4 | 18 | — |
| Railgun Coils | Railgun cycle −0.25s | 3 | 20 | — |
| Warhead Density | Rocket Battery +10% damage | 4 | 20 | — |
| Rocket Guidance | Rockets re-acquire instead of overkilling | 2 | 22 | — |
| Penetrator Sabot | Railgun pierce leaves −10 Threshold for 3s | 1 | 90 | W10 |
| **ARMOUR PIERCING** | Kinetic towers ignore Threshold entirely | 1 | 220 | W15 |

#### ENERGY — Flamethrower · Tesla · Lattice

| Node | Effect | Ranks | Base | Gate |
|---|---|---|---|---|
| Fuel Mix | Flamethrower burn damage +10% | 5 | 12 | — |
| Capacitor Density | Tesla Coil +8% damage | 5 | 16 | — |
| Stutter Field | Tesla stun +0.15s | 3 | 18 | — |
| Focusing Optics | Laser Lattice ramps 12% faster | 4 | 20 | — |
| Lock Assist | Lattice holds its charge 2s after the target dies | 3 | 20 | — |
| Thermal Runaway | Burning stacks up to 3× | 1 | 80 | W8 |
| **MELTDOWN** | Burning kills detonate for 25% max HP | 1 | 220 | W15 |

#### ORDNANCE — Mortar Pit · Minefield

| Node | Effect | Ranks | Base | Gate |
|---|---|---|---|---|
| Mine Density | +1 Minefield charge | 4 | 14 | — |
| Shell Capacity | Mortar +10% damage | 5 | 16 | — |
| Short Fuse | Mortar minimum range −15px | 2 | 18 | — |
| Predictive Fire | Mortar leads properly — scatter −30% | 3 | 20 | — |
| Sympathetic Detonation | A mine sets off adjacent mines | 1 | 90 | W12 |
| **CARPET** | Every Mortar shot fires a second shell | 1 | 240 | W18 |

#### EMPLACEMENTS — the tower as a structure

| Node | Effect | Ranks | Base | Gate |
|---|---|---|---|---|
| Hardened Emplacements | +15% tower HP | 4 | 14 | — |
| Field Repair | Towers recover 20% HP at each wave clear | 3 | 18 | — |
| Redundant Feeds | Rebuilding on a destroyed tower’s pad costs 50% | 2 | 22 | — |
| Modular Mounts | Relocate a tower free in build phase, upgrade intact | 1 | 30 | — |
| Automated Repair | Towers regenerate 3 HP/s during a wave | 1 | 85 | W12 |
| **BASTION** | Towers below 30% HP deal +50% damage | 1 | 230 | W18 |

### RULEBOOK — the horde & the rules · 18 nodes

**Root — Scrutineering** · Permanent −3 enemy Threshold, globally · 3 ranks · base 24

#### DAMAGE RULES — freeze · burn · armour

| Node | Effect | Ranks | Base | Gate |
|---|---|---|---|---|
| Coolant Volume | Cryo slow +5% stronger | 4 | 14 | — |
| Brittle | Frozen damage bonus +5% | 3 | 18 | — |
| Saturation | +6% blast radius on all AoE towers | 3 | 20 | — |
| Immobilise | Enemies under 30% speed take +8% damage | 3 | 26 | W8 |

#### THE ELITES — Runner · Wrecker · Shielder · Mender

| Node | Effect | Ranks | Base | Gate |
|---|---|---|---|---|
| Pit Limiter | Runner speed surges last 30% less | 2 | 20 | — |
| Bollards | Wreckers deal −20% damage to towers | 3 | 20 | — |
| Bubble Breaker | Shielder bubbles absorb 7% less | 3 | 22 | — |
| Interdiction | Mender heal aura −30% | 2 | 22 | — |
| Elite Quota | One fewer aura carrier per wave | 2 | 60 | W10 |

#### THE RIFT — the spawner itself

| Node | Effect | Ranks | Base | Gate |
|---|---|---|---|---|
| Staggered Start | The wave spawns over 20% longer — less bunched | 3 | 18 | — |
| Cold Start | Enemies leave the rift at 60% speed for 2s | 3 | 20 | — |
| Attrition Toll | Enemies take 4 dmg/s while still inside the rift band | 3 | 24 | — |
| Roll Call | See the whole run’s wave list and boss lineup up front | 1 | 40 | — |
| **QUARANTINE** | The rift shuts for 4s each 200 kills in a wave | 1 | 220 | W15 |

#### MASS & BOSSES — Splitter · Titan · Rig · Marshal · Scrapheap

| Node | Effect | Ranks | Base | Gate |
|---|---|---|---|---|
| Chain Reaction | Splitters burst into one fewer swarmer | 2 | 60 | W10 |
| Countermeasures | Every boss’s signature output −25% | 2 | 100 | W10 |
| **GIANT-SLAYER** | +40% damage to Titans and bosses | 1 | 220 | W15 |

### PIT WALL — the track & tempo · 21 nodes

**Root — Fast Forward** · Unlocks 6× → 10× → 15× → 20× · 4 ranks · base 10

#### THE TRACK — Wall · oil · tire marks

| Node | Effect | Ranks | Base | Gate |
|---|---|---|---|---|
| Roadworks | Wall cost −4 | 3 | 12 | — |
| Rebar | Wall HP +600 (matters once sealed) | 3 | 14 | — |
| Oil Slick | Kill-site oil turns slippery — cars run wide | 2 | 70 | W8 |
| Chicane | Cars scraping a wall lose 25% speed for 1s | 1 | 80 | W10 |
| Marbles | Oil-slicked ground deals 4 dmg/s | 2 | 95 | W12 |

#### TEMPO & STRIKE — Q-strike · speed

| Node | Effect | Ranks | Base | Gate |
|---|---|---|---|---|
| Full Course | Q-strike radius +15px | 3 | 18 | — |
| Red Reserve | Q-strike cooldown −8% | 4 | 18 | — |
| Skip Ahead | Call the next wave early for +10% gold | 3 | 20 | — |
| Time Dilation | Auto-slow to 1× on a boss or under 25% HP | 1 | 45 | — |
| Second Wind | The Q-strike gets a second charge | 1 | 110 | W12 |

#### INFORMATION — read the board

| Node | Effect | Ranks | Base | Gate |
|---|---|---|---|---|
| Wave Preview | See the next wave’s composition | 3 | 16 | — |
| Pit Lane | Sell refund +10% (cap 85%) | 2 | 22 | — |
| Range Rings | All tower ranges during the wave, not just build | 1 | 30 | — |
| Kill Attribution | Post-wave breakdown of what each tower killed | 1 | 30 | — |
| Heatmap | Post-run map of damage dealt and where cars leaked | 1 | 35 | — |

#### LAYOUT — build-phase tools

| Node | Effect | Ranks | Base | Gate |
|---|---|---|---|---|
| Undo Placement | Full refund within 5s of placing | 1 | 20 | — |
| Loadout Slots | Save and recall tower loadout presets | 2 | 26 | — |
| Build Queue | Queue towers to auto-build as gold arrives | 1 | 40 | — |
| Free Respec | Reset the whole tree, every chip returned | 1 | 60 | — |
| Blueprint | One-click rebuild of a saved layout | 1 | 120 | W15 |

### HOLDINGS — tycoon — money that makes money · 15 nodes

**Root — Salvage Yield** · +8% gold from kills · 5 ranks · base 12

#### EARN

| Node | Effect | Ranks | Base | Gate |
|---|---|---|---|---|
| Scrap Bonus | Wave-clear bounty +12% | 4 | 16 | — |
| Bounty | First 5 kills of each wave pay 3× | 3 | 18 | — |
| Banked Salvage | Keep 4% of unspent gold as interest | 4 | 20 | — |
| Titan Bounty | Titans and bosses pay double gold and chips | 1 | 80 | W10 |

#### PROTECT

| Node | Effect | Ranks | Base | Gate |
|---|---|---|---|---|
| Insurance | Recover 4 gold each time a car leaks | 3 | 18 | — |
| Reclamation | Destroyed towers refund 40% | 2 | 24 | — |
| Contingency | Survive one lethal leak per run at 1 HP | 1 | 55 | — |
| Write-Off | First tower lost each wave is rebuilt free at wave end | 1 | 70 | W10 |

#### RISK — wagers

| Node | Effect | Ranks | Base | Gate |
|---|---|---|---|---|
| Handicap | Start with 40% less gold but +25% gold from kills | 1 | 45 | — |
| Double or Nothing | Call a wave: 3× bounty if nothing leaks, nothing if it does | 1 | 100 | W12 |
| Overtime | Keep playing past wave 20 — each extra wave pays double chips | 1 | 160 | WIN |

#### COMPOUND

| Node | Effect | Ranks | Base | Gate |
|---|---|---|---|---|
| Futures | +2 chips per wave you have ever cleared | 1 | 90 | W10 |
| Holdings Co. | Bank 10% of unspent gold as chips at run end | 1 | 150 | W15 |
| **TEAM PRINCIPAL** | Start every run with one weapon pre-built | 1 | 240 | W18 |

---

## Design notes — read before building these

### ⚠️ Two decisions that need the owner's sign-off

**Fast Forward re-tiers the base speed ladder to 1× / 2× / 4×.** 10× currently
ships free; under this node it becomes rank 2. `SKILLTREES.md`'s implementation
notes already flagged this reconcile — this is the decision. If the owner would
rather keep 10× free, drop the node to 3 ranks (15× / 20× / 30×).

**Range Rings overrides a design-contract non-negotiable.** `design/template.html`
states "Coverage rings show in build phase only." This node is an explicit,
player-purchased exception. If that rule is load-bearing for the combat read,
cut the node rather than quietly breaking the contract.

### Swarmers deliberately get no node

They are the baseline everything else is measured against, and the answer to
them is the Garage's volume line, not a counter. A node that only helps against
the most common enemy is a global damage node wearing a costume.

### Enemy-design-law check

Every Rulebook node softens a *visible* mechanic — the aura discs, the shield
bubble, the split burst, the boss's signature, the rift itself — so the player
can see what their purchase did. Nothing introduces an invisible hard counter,
and armour stays soft (`ARMOR_FLOOR` 0.25) even under ARMOUR PIERCING.

### Archetype coverage

Runner (Pit Limiter) · Hauler (Scrutineering, Penetrator Sabot, ARMOUR PIERCING)
· Splitter (Chain Reaction) · Shielder (Bubble Breaker) · Mender (Interdiction)
· Wrecker (Bollards, plus the whole EMPLACEMENTS line, since towers are what it
attacks) · Titan and bosses (GIANT-SLAYER, Countermeasures, Titan Bounty).

---

## Why this answers "each attempt starts better"

Three compounding layers, which is the tycoon feel:
1. **Chips banked** from every run, win or lose.
2. **Nodes bought** raise your opening power (gold, HP, damage, a free tower).
3. **Gates opened** by depth unlock strictly stronger options to buy.

## Save migration

Bump `SaveData.version` 1 → 2.

The v1 flat upgrades (`dmg`, `rate`, `hp`, `gold`, `strike`) do not map 1:1 onto
the node graph — `rate` has no direct equivalent and the others changed scale. So
**refund rather than remap**: on load, total the chips spent on every v1 upgrade
level, credit it back as `chips`, and clear `upgrades`. Players keep 100% of their
investment and re-spend it in the new tree. `bestWave` and `wins` carry over
unchanged and immediately drive the gates.

Keep a strike node (`Red Reserve`) so the existing `strikeCdMax` plumbing in
`computeMods` stays live rather than becoming dead code.

## Implementation notes

- Replace `meta/upgrades.ts`'s flat list with a node graph:
  `{ id, branch, name, desc, max, base, requires[], gate? }`.
- `computeMods` grows to cover the multiplicative/additive nodes. Everything it
  cannot express hooks in at a specific site:
  - **run.ts** — Banked Salvage, Scrap Bonus, Skip Ahead, Double or Nothing
    (wave clear); Bounty, Salvage Yield, Titan Bounty (kill); Insurance,
    Contingency (leak); Futures, Holdings Co., Handicap, TEAM PRINCIPAL (run
    start/end); Reclamation, Write-Off, Redundant Feeds (tower destroyed);
    Field Repair (wave clear); Overtime (past wave 20).
  - **combat.ts** — all per-weapon nodes, read through `towerStats(t)`, never
    raw `def.*` (same rule the in-run upgrades follow, or the node silently
    does nothing). BASTION reads the tower's own HP fraction.
  - **damage.ts** — Scrutineering, Brittle, Immobilise, Bubble Breaker,
    ARMOUR PIERCING, GIANT-SLAYER, MELTDOWN. One gate, as always.
  - **enemies.ts** — Pit Limiter, Interdiction, Bollards, Chain Reaction,
    Countermeasures.
  - **towers.ts** — Hardened Emplacements, Automated Repair, Field Repair,
    Modular Mounts, Pit Lane (these are tower-side, not enemy-side).
  - **waves.ts / Spawner** — Staggered Start, Cold Start, Attrition Toll,
    Roll Call, QUARANTINE, Elite Quota (the existing `auraCap`).
  - **GroundLayer / terrain** — Oil Slick, Marbles, Chicane. With the rift line
    these are the only nodes needing new sim surface; everything else modifies
    an existing path.
  - **UI only** — Wave Preview, Range Rings, Kill Attribution, Heatmap, Undo
    Placement, Loadout Slots, Build Queue, Blueprint, Modular Mounts, Free
    Respec, Time Dilation. Cheap to ship and they carry the LAYOUT and
    INFORMATION lines on their own.
- The meta screen becomes the radial hub-and-four-arms layout — see
  `design/skilltree.html` for the visual spec and the full node catalog. That
  file's `TREE` object is the single source of truth for both boards **and for
  these tables**, which are generated from it; edit the data there, not here.
- After building: re-run `scripts/difficulty.py`. The empty-tree curve is
  poor w8 / median w6 / strong w10; the target is wave 20 clearable after
  ~5–8 invested runs. A new `scripts/skilltree.py` should assert gating,
  one-way spend, the migration refund, and that a bought node measurably
  changes a run.

## Known open question

The median bot dies at wave 6 — *earlier* than the poor bot at wave 8 — because
35 cheap Autocannons beat 11 expensive mixed towers at the current cost curve.
Workshop Tools and Salvage Yield make that worse before they make it better.
The tower cost curve wants a pass before the tree's economy nodes are tuned.
