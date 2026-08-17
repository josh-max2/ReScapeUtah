# ENEMY ROSTER — owner spec 2026-08-16 (SAVED, NOT BUILT)

Transcribed verbatim from the owner's design doc ("just save this spec for
now"). Implementation notes at the bottom. The current 4 placeholder types
(mite/dart/brute/titan) are stand-ins until this roster is built.

## Stat conventions

| Stat | Definition |
|---|---|
| HP | Baseline is Touring Car = 100. |
| SPD | 1.0 = 4 tiles/sec. |
| ARM | Threshold value — incoming hits below this are reduced to 1. |
| SIZE | XS/S/M/L/XL. Drives AoE overlap and hitbox. |
| SLV | Salvage dropped on kill (the card-play economy). |
| THR | Threat 1–5. Suggested auto-targeting priority weight. |

**Wave scaling:** HP × (1 + 0.11 × wave), SLV × (1 + 0.04 × wave).
Speed and Armor never scale — scaling those breaks counterplay.

## Tier 1 — Civilian

| Unit | HP | SPD | ARM | SIZE | SLV | THR | Ability |
|---|---|---|---|---|---|---|---|
| Commuter Hatch | 30 | 0.8 | 0 | S | 2 | 1 | — |
| Touring Car | 100 | 1.0 | 0 | M | 5 | 2 | — |
| Pickup | 120 | 0.9 | 5 | M | 6 | 2 | Structural (weak). −25% durability to first barrier contacted. |
| Cargo Van | 180 | 0.6 | 5 | L | 8 | 2 | Field. Blocks tower line-of-sight for 2 tiles behind it. |
| Robotaxi | 70 | 1.1 | 0 | M | 9 | 3 | Silent. No audio cue, no minimap icon. |
| Taxi | 60 | 0.9 | 0 | M | 10 | 3 | Deploy(2). Spawns 2 Commuter Hatches at each pickup point. Max 3 stops. |

## Tier 2 — Two wheels

| Unit | HP | SPD | ARM | SIZE | SLV | THR | Ability |
|---|---|---|---|---|---|---|---|
| Sport Bike | 45 | 2.0 | 0 | S | 7 | 3 | Deaf (slows at 50%). Off-Line (lateral) — weaves between vehicles. |
| Dirt Bike | 40 | 1.5 | 0 | S | 8 | 3 | Off-Line (full). Zero terrain cost; routes toward lowest tower density. |
| Sidecar Rig | 60 / 50 | 1.2 | 0 | M | 11 | 3 | Fracture. Two HP bars. Lose sidecar → bike +40% SPD. Lose bike → sidecar becomes Structural at 0.6 SPD. |

## Tier 3 — Competition

| Unit | HP | SPD | ARM | SIZE | SLV | THR | Ability |
|---|---|---|---|---|---|---|---|
| Kart (squad of 12) | 15 ea | 1.2 | 0 | XS | 1 ea | 2 | Linked squad. Shared spawn timer, no split. |
| Open-Wheeler | 70 | 1.7 | 0 | S | 12 | 4 | Slipstream (+8%/car ahead, cap +40%). Fragile: +50% damage taken off-tarmac. |
| Drag Car | 90 | 3.2 straight / 0 corner | 0 | M | 10 | 3 | Sovereign (yellow). Cannot be slowed. Self-stuns 3s at first corner. |
| Drift Car | 95 | 1.4 | 0 | M (+20% width) | 11 | 3 | Sovereign (surface slow). Full speed across gravel and debris. |
| Sprint Winged Car | 105 | 1.5 erratic | 0 | M | 10 | 2 | Reactive. 25% per damage instance to spin out — stuns self 2s and all units behind in lane. |
| Rally Car | 110 | 1.3 | 0 | M | 14 | 4 | Off-Line (full) + Deaf. Deliberately low HP — see guardrail below. |
| Hillclimb Coupe | 130 | 1.3 | 5 | M | 13 | 4 | Off-Line (vertical). Uses ramps and embankments to skip sectors. |
| Stock Car (packs of 3+) | 160 | 1.0 | 10 | M | 9 | 3 | Draft-Give. Grants +8%/stack Slipstream to units behind, not itself. |
| Endurance Prototype | 320 | 1.2 | 10 | M | 16 | 4 | Pit. Below 40% HP diverts to pit box, full heal over 8s. Max 2 uses. |

## Tier 4 — Construction

| Unit | HP | SPD | ARM | SIZE | SLV | THR | Ability |
|---|---|---|---|---|---|---|---|
| Tow Truck | 200 | 0.8 | 5 | L | 15 | 3 | Reactive. Drags nearest wreck to spawn; that unit returns next wave at 50% HP. |
| Crane Truck | 300 | 0.5 | 5 | XL | 18 | 4 | Structural (displacement). Relocates one tower to a random adjacent tile. 4s telegraph animation. |
| Road Paver | 380 | 0.3 | 10 | L | 28 | 5 | Repave (new lane). Creates permanent passable ground. Hard cap: 1 per wave. |
| Bulldozer | 420 | 0.4 | 20 | L | 20 | 4 | Structural. Ignores objective; targets nearest barrier and demolishes it. |
| Cement Mixer | 500 | 0.35 | 15 | XL | 25 | 5 | Repave (+20% SPD, permanent). Effect outlives the unit. Highest-value kill in the game. |

## Tier 5 — Military

| Unit | HP | SPD | ARM | SIZE | SLV | THR | Ability |
|---|---|---|---|---|---|---|---|
| Rocket Technical | 90 | 0.9 / halts | 0 | M | 17 | 4 | Structural (ranged 6 tiles). Stops and fires on nearest tower. Out-ranges most defenses. |
| Signal Jammer | 130 | 0.8 | 0 | M | 30 | 5 | Field (r=4). Cards played inside have 50% duration; 25% chance to fizzle outright. |
| Troop Half-Track | 340 | 0.6 | 15 | L | 22 | 4 | Deploy(2 / 6s) dismounts. Sovereign (terrain). |
| Armored Car | 400 | 0.7 | 25 | L | 18 | 4 | Threshold only. Pure deck-composition tax. |

## Tier 6 — Unique

| Unit | HP | SPD | ARM | SIZE | SLV | THR | Ability |
|---|---|---|---|---|---|---|---|
| Ice Cream Truck | 55 | 0.5 | 0 | M | 14 | 3 | Field (r=3). Towers stop firing for 3s. Audible two sectors out. |
| Ambulance | 150 | 1.0 | 0 | L | 20 | 5 | Field (r=3). Heals 3% max HP/sec to all vehicles in radius. Never attacks. |
| Monster Truck | 260 | 0.8 | 10 | L | 16 | 4 | Sovereign (barriers). Drives over any structure below height class 2. |

## Bosses

| Boss | HP | SPD | ARM | Core mechanic | Fail state |
|---|---|---|---|---|---|
| The Qualifier | 2,800 | 2.2 | 0 | Sets lap times instead of attacking. Damage dealt adds to its lap time. | 3 clean laps = run over |
| Team Orders | 1,900 ×2 (shared 3,800) | 1.6 | 10 | Shared damage pool. Either death → survivor inherits remaining HP and doubles SPD. | Standard leak |
| The Hauler | 6,500 | 0.5 | 30 | Never attacks. Drops one Tier 3 racer every 10s from its ramp. | Attrition |
| Fan Car | 4,200 | 1.8 | 15 | Immune to Authority — no flag affects it. Drags lighter units in its wake at +30% SPD. Only vulnerable when the road surface is broken. | Standard leak |
| The Grader | 7,000 | 0.25 | 35 | Terraform. Flattens elevation, buries traps, paves through funnels in real time. Arena changes mid-fight. | Standard leak |
| Scrapheap | 5,500 (+6 plates ×400) | 0.9 | 20 (10 when plates gone) | Each plate destroyed spits out one live Tier 1 unit. | Overwhelm |
| Streamliner | 5,000 | 4.0 fixed | 0 | Unstoppable. One pass down the longest straight, ~14s window. Cannot be slowed, stopped, or redirected. | Reaching the end levels every structure on the map |
| The Twenty-Four | 9,000 | 1.1 | 20 | Compressed day/night cycle. Pits and heals 25% every 45s, unlimited. Visibility drops at night. | Deck sustain failure |
| Black Flag | 4,800 | 1.4 | 15 | Counterplay. Plays cards against you: yellow-flags towers inactive, blue-flags barriers out of position, and permanently deletes one card from your deck every 30s. | Deck erosion |
| The Safety Car | 12,000 | 0.9 | 40 | Caution. Every other unit on the map is invulnerable and in formation while it lives. Obeys all flags instantly — flags just don't stop it. | You cannot damage the field. You can only reach the front. |

---

## Implementation notes (Claude, 2026-08-16)

**Rule conflicts with current implementation — spec wins when built:**
- **Threshold floor**: spec says hits below ARM are "reduced to 1"; current
  `dealHit` floors at 0. Change to floor-1 when this roster lands (it makes
  volume weapons chip armor instead of bouncing entirely — roster.py's
  "threshold_blocks_autocannon" assert must update).
- **Wave scaling**: spec is LINEAR (HP × 1+0.11w) vs current exponential
  1.15^(w-1). Spec also freezes SPD/ARM across waves — codify that rule.
- **Speed units**: SPD 1.0 = 4 tiles/s = 80 px/s at CELL=20.

**Systems this roster requires (beyond what exists):**
- Salvage as the kill-drop, card-play economy (confirms cards will COST
  Salvage to play). Lives/leaks economy interactions (Insurance node).
- LOS occlusion (Cargo Van) — mortar already specced to ignore it.
- Minimap + audio-cue layer (Silent), visibility system (Twenty-Four nights).
- Lanes + Off-Line variants (lateral/full/vertical), ramps/embankments =
  ELEVATION, pit boxes on the map, wreck entities (ties to Flamethrower's
  burn-prevents-recovery and Tow Truck), barrier durability + height classes,
  tower relocation (Crane), ranged enemy fire (Rocket Technical), tower
  disable fields (Ice Cream Truck), enemy healing auras (Ambulance),
  formation invulnerability (Safety Car), adversarial card AI with permanent
  deck destruction (Black Flag), lap logic (Qualifier), real-time terrain
  edits (Grader/Paver/Mixer — Repave is PERMANENT and outlives the unit).
- Multi-part HP (Sidecar Rig, Scrapheap plates), linked squads (Karts),
  spawn-on-death/deploy (Taxi, Half-Track, Hauler, Scrapheap).
- Per-tower targeting priorities driven by THR (Pit Wall node 93 hooks in).

**Cross-reference integrity:** the keywords here (Deaf, Silent, Sovereign,
Off-Line, Fragile, Repave, Jammer, flags/Authority) are exactly the ones the
tower spec and design/SKILLTREES.md reference — the three docs are one
coherent bible. Current placeholder mapping until built: mite≈Kart/Commuter,
dart≈Sport Bike, brute≈Stock Car, titan≈Endurance Prototype.
