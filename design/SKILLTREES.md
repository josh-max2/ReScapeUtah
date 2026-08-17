# META SKILL TREES — owner spec 2026-08-16 (NOT YET BUILT)

Three permanent progression trees, 100 nodes total. Currency: **LP** (not yet
defined in-game — presumably earned per run alongside/replacing cores).
Transcribed verbatim from the owner's design doc; implementation notes at the
bottom. Do not build without a green light.

---

## TREE 1 — THE GARAGE (Damage) · 34 nodes

### Trunk
| # | Node | Effect | Ranks |
|---|---|---|---|
| 1 | Calibration | +3% damage, all towers | 5 |
| 2 | Workshop Tools | −5% tower build cost | 4 |
| 3 | Optics | +0.5 range, all towers | 3 |
| 4 | Overhaul | Towers gain +1% damage per wave survived this run (cap 25%) | 1 |

### Branch A — Ballistics
| # | Node | Effect | Ranks |
|---|---|---|---|
| 5 | Autocannon Feed | +6% Autocannon rate of fire | 5 |
| 6 | Hardened Rounds | +2 Hit on all kinetic towers | 5 |
| 7 | Spin-Up Motors | Gatling reaches full rate 25% faster | 3 |
| 8 | Barrel Cooling | Gatling damage ceiling +10% | 4 |
| 9 | Railgun Coils | −0.3s Railgun cycle | 4 |
| 10 | Penetrator Sabot | Railgun pierce applies −10 Threshold for 3s | Gate |
| 11 | Rocket Guidance | +1 rocket per salvo | 2 |
| 12 | Warhead Density | +12% Rocket Battery damage | 5 |
| 13 | Marksman Protocol | Kinetic towers +25% vs targets above 60% HP | Gate |
| 14 | ARMOUR PIERCING | All kinetic towers ignore Threshold entirely | Capstone |

### Branch B — Energy & Incendiary
| # | Node | Effect | Ranks |
|---|---|---|---|
| 15 | Fuel Mix | +10% Flamethrower burn damage | 5 |
| 16 | Sustained Burn | Burning duration +1s | 3 |
| 17 | Thermal Runaway | Burning stacks up to 3× | Gate |
| 18 | Arc Conductivity | Tesla +1 chain target | 3 |
| 19 | Capacitor Density | +8% Tesla damage | 5 |
| 20 | Stutter Field | Tesla stun +0.2s | 3 |
| 21 | Focusing Optics | Laser ramps 15% faster | 4 |
| 22 | Prism Split | Laser hits a second target at 40% output | Gate |
| 23 | Heat Soak | Energy towers +30% vs Burning or Frozen targets | Gate |
| 24 | MELTDOWN | Enemies killed while Burning detonate for 25% max HP, radius 2 | Capstone |

### Branch C — Ordnance & Area
| # | Node | Effect | Ranks |
|---|---|---|---|
| 25 | Shell Capacity | +10% Mortar damage | 5 |
| 26 | Wide Spread | +0.4 Mortar blast radius | 4 |
| 27 | Predictive Fire | Mortar correctly leads erratic movers | Gate |
| 28 | Mine Density | +1 Minefield charge | 4 |
| 29 | Fast Fuse | Minefield recharge −1s | 3 |
| 30 | Coolant Volume | Cryo slow strength +5% | 4 |
| 31 | Brittle | Frozen damage bonus 30% → 45% | 2 |
| 32 | Saturation | +8% radius on all AoE towers | 3 |
| 33 | Chain Reaction | Mine detonations trigger adjacent mines | Gate |
| 34 | CARPET | Mortar fires a second shell at a random point in range | Capstone |

---

## TREE 2 — THE RULEBOOK (Effects & Cards) · 34 nodes

### Trunk
| # | Node | Effect | Ranks |
|---|---|---|---|
| 35 | Authority | +5% flag card duration | 5 |
| 36 | Deep Bag | +1 max hand size | 3 |
| 37 | Signal Strength | +20% resistance to Jammer fizzle | 3 |
| 38 | Second Wave | Discard reshuffles into deck one wave sooner | 1 |

### Branch D — Control
| # | Node | Effect | Ranks |
|---|---|---|---|
| 39 | Yellow Intensity | Slow strength +6% | 5 |
| 40 | Extended Caution | Yellow duration +0.5s | 4 |
| 41 | Blue Authority | Blue flag redirect reaches +1 lane | 2 |
| 42 | Forced Line | Blue flag works on Off-Line units | Gate |
| 43 | Red Reserve | Red flag cooldown −15% | 4 |
| 44 | Full Course | Red flag radius +1 | 3 |
| 45 | Deaf Override | Deaf units take 75% duration instead of 50% | 2 |
| 46 | Immobilise | Units below 30% speed take +20% damage | Gate |
| 47 | Marshal Reach | Cards playable 3 tiles further from Marshal Posts | 3 |
| 48 | BLACK FLAG AUTHORITY | Black flag becomes usable on one boss per run | Capstone |

### Branch E — Status & Terrain
| # | Node | Effect | Ranks |
|---|---|---|---|
| 49 | Gravel Depth | Off-Tarmac slow +5% | 4 |
| 50 | Debris Field | Debris persists +2s | 3 |
| 51 | Marbles | Off-Tarmac tiles also deal 5 dmg/s | 3 |
| 52 | Surface Damage | Fragile bonus 50% → 65% | 2 |
| 53 | Road Crew | Repair one Repave tile free at each wave start | 2 |
| 54 | Reclamation | Destroyed barriers refund 50% Salvage | Gate |
| 55 | Oil Slick | New card — 3s spin-out zone | Gate |
| 56 | Flare | New card — reveals all Silent units for 8s | Gate |
| 57 | Scrutineering | Permanent −5 enemy Threshold, globally | 3 |
| 58 | RULE 34.3 | Once per run, every enemy on screen must obey one flag, ignoring Sovereign and Deaf | Capstone |

### Branch F — Deck & Economy
| # | Node | Effect | Ranks |
|---|---|---|---|
| 59 | Salvage Yield | +5% Salvage from kills | 5 |
| 60 | Scrap Bonus | +8 Salvage per wave cleared | 4 |
| 61 | Card Draw | +1 card drawn per wave | 2 |
| 62 | Trim | Remove one card from your deck at run start | 3 |
| 63 | Selective Unlock | Toggle any unlocked card out of the draw pool | Gate |
| 64 | Rare Weighting | +10% chance of rare card offers | 3 |
| 65 | Banked Salvage | Carry 15% of unspent Salvage between waves | 3 |
| 66 | Bounty | First kill of each wave pays triple | 2 |
| 67 | Insurance | Recover 25 Salvage each time an enemy leaks | 2 |
| 68 | TEAM PRINCIPAL | Start every run with one chosen card guaranteed in your opening hand | Capstone |

---

## TREE 3 — THE PIT WALL (Quality of Life) · 32 nodes

### Branch G — Tempo
| # | Node | Effect | Ranks |
|---|---|---|---|
| 69 | Fast Forward I | Unlock 6× speed | 1 |
| 70 | Fast Forward II | Unlock 8× speed | 1 |
| 71 | Fast Forward III | Unlock 12× speed | 1 |
| 72 | Unrestricted | Uncapped speed slider to 20× | 1 |
| 73 | Auto-Start | Waves begin automatically after a set delay | 1 |
| 74 | Skip Ahead | Call the next wave early for +15% Salvage | 3 |
| 75 | Instant Build | Remove tower construction delay | 1 |
| 76 | Cut Intros | Skip boss entrance cinematics | 1 |
| 77 | Held Pause | Game pauses while you're aiming a card | 1 |
| 78 | Time Dilation | Auto-drop to 1× when a boss enters or you fall below 3 lives | 1 |

### Branch H — Information
| # | Node | Effect | Ranks |
|---|---|---|---|
| 79 | Threat Overlay | Show enemy keywords on hover | 1 |
| 80 | Telemetry | Per-tower DPS and damage totals | 1 |
| 81 | Wave Preview | See upcoming wave composition (+1 wave per rank) | 3 |
| 82 | Range Rings | Display all tower ranges simultaneously | 1 |
| 83 | Path Prediction | Draw projected routes for Off-Line units | 1 |
| 84 | Leak Warning | Alert when an enemy is 3 tiles from the objective | 1 |
| 85 | Damage Numbers | Floating combat text toggle | 1 |
| 86 | Kill Attribution | Post-wave breakdown of what killed what | 1 |
| 87 | Threshold Tags | Flag units your current deck mathematically cannot damage | 1 |
| 88 | Run History | Full statistics log per run | 1 |
| 89 | Heatmap | Post-run map of damage dealt and leak locations | 1 |

### Branch I — Control & Comfort
| # | Node | Effect | Ranks |
|---|---|---|---|
| 90 | Loadout Slots | Save tower loadout presets | 3 |
| 91 | Blueprint | Save and one-click rebuild a full layout | 1 |
| 92 | Build Queue | Queue towers to auto-build as Salvage arrives | 1 |
| 93 | Targeting Priorities | Set per-tower priority; rank 2 saves presets | 2 |
| 94 | Hotkeys | Rebindable card and tower hotkeys | 1 |
| 95 | Undo Placement | Full refund within 5s of placing | 1 |
| 96 | Free Respec | Reset the entire tree, all LP returned | 1 |
| 97 | Mid-Run Save | Save and quit mid-run | 1 |
| 98 | Accessibility Profiles | Colourblind palettes, audio cue profiles | 1 |
| 99 | Endless Mode | Unlock endless past wave 40 | 1 |
| 100 | Practice Mode | Replay any wave with unlimited Salvage | 1 |

---

## Implementation notes (Claude, 2026-08-16)

**Forward references — systems this spec assumes that don't exist yet:**
- **LP** currency (tree points) and its earn rate; relationship to cores unclear.
- **Salvage** economy (appears to replace in-run gold; nodes 54, 59-60, 65-67, 74, 100).
- **Flag cards** (Yellow/Blue/Red/Black — race-marshal identity for the card
  system; nodes 35, 39-48, 58). Implies lanes, redirects, and per-flag rules.
- **Marshal Posts** (a placeable? node 47), **Jammer** enemies (37), **Silent /
  Deaf / Sovereign / Off-Line** enemy keywords (42, 45, 56, 58, 83), **bosses**
  with cinematics (48, 76, 78), **lives** (78), **Fragile** keyword (52),
  **Off-Tarmac / Debris / Repave** terrain states (49-53), discard pile +
  reshuffle (38), rare card tiers (64), waves beyond 20 / wave 40 endless (99).

**Collisions with current implementation to resolve when building:**
- Tree 1 trunk overlaps the existing cores meta-upgrades (dmg/rate/hp/gold) —
  the cores tree likely retires or becomes LP.
- Node 61 (+1 draw/wave) stacks on the current 1/wave baseline.
- Tempo branch supersedes the current 1/2/4/10 speed cycle (10x isn't in the
  spec's ladder — reconcile to 1/2/4 + unlocks 6/8/12/20).
- "Kinetic" class = autocannon, gatling, railgun, rocket, mortar, mine;
  "Energy" = flame, tesla, lattice (cryo counts for Heat Soak's Frozen synergy
  but is damage-light). Confirm cryo's class before building 14/23/24.
- Node 30/31 modify Frozen numbers currently hardcoded (-40% speed, +30% dmg).
- Node 82 (all range rings) already exists in build phase — the node would
  extend it to combat phase.
- The 10-tower upgrade pairs from the tower spec (Twin-Linked etc.) are a
  SEPARATE open question from these trees — still undecided (cards vs menu).
