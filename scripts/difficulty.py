"""Difficulty harness for CONTINUOUS FLOW: bots play, we read how long they hold.

Rewritten 2026-08-17. There are no waves any more, so "died on wave N" is
meaningless — the measure is TIME HELD. Two things changed what a skill bracket
even means:

  1. There is no build phase. A bot must buy while under attack, so purchase
     cadence is now part of skill rather than a free planning step.
  2. Towers hold a FIXED committed lane. Aiming is the dominant skill
     expression, so each bracket aims differently:
       poor   - leaves the default aim (down-flow from the tower's own cell,
                which for a rim mount projects a lane beside the traffic)
       median - aims at the nearest road cell
       strong - aims ALONG the road down-flow, so cars travel the lane

The gap between poor and strong is therefore the value of aiming, which is the
mechanic the game is now built on.

  python difficulty.py                 # 3 brackets x 2 runs
  python difficulty.py --runs 4
  python difficulty.py --skill strong
"""
import argparse
import os
import statistics
import time
from playwright.sync_api import sync_playwright

W, H = 1800, 1020
RUN_CAP_SECS = 600      # sim-seconds; a bot that holds this long has "won"
SAMPLE_EVERY = 10       # sim-seconds between HP samples

# (hotkey, cost) — must match TOWER_DEFS
KINDS = {
    "autocannon": ("1", 40), "flame": ("2", 60), "mortar": ("3", 85),
    "cryo": ("4", 70), "tesla": ("5", 100), "gatling": ("6", 110),
    "rocket": ("7", 125), "railgun": ("8", 130), "lattice": ("9", 150),
}

PLANS = {
    "poor":   ["autocannon"] * 8,
    "median": ["autocannon", "autocannon", "mortar", "tesla", "flame",
               "autocannon", "cryo", "mortar", "gatling", "tesla"],
    "strong": ["autocannon", "mortar", "tesla", "mortar", "cryo",
               "gatling", "railgun", "tesla", "rocket", "mortar", "lattice"],
}

AIM = {"poor": "default", "median": "road", "strong": "downflow"}

SPREAD_OVERRIDE = int(os.environ.get("SWARM_SPREAD", 0))


def rim_spots(page, count, spread):
    """Rim cells ordered along the route, so bots build where enemies pass."""
    return page.evaluate(
        f"""() => {{
          const g = window.__swarm.game, C = 90, R = 51;
          const out = [];
          for (let cy = 1; cy < R - 1; cy++) for (let cx = 1; cx < C - 1; cx++) {{
            const c = cy * C + cx;
            if (g.field.walk[c] === 1 || g.towerGrid[c] !== -1) continue;
            const rim = g.field.walk[c-1] || g.field.walk[c+1] ||
                        g.field.walk[c-C] || g.field.walk[c+C];
            if (!rim) continue;
            let cost = Infinity;
            for (const n of [c-1, c+1, c-C, c+C]) {{
              if (g.field.walk[n] === 1 && isFinite(g.field.cost[n])) {{
                cost = Math.min(cost, g.field.cost[n]);
              }}
            }}
            if (!isFinite(cost)) continue;
            out.push({{ x: cx * 20 + 10, y: cy * 20 + 10, cost }});
          }}
          out.sort((a, b) => b.cost - a.cost);   // far from fort = early on route
          const picked = [];
          for (const s of out) {{
            if (picked.length >= {count}) break;
            if (picked.every(p => Math.hypot(p.x - s.x, p.y - s.y) > {spread})) picked.push(s);
          }}
          return picked;
        }}"""
    )


def aim_last(page, style):
    """Point the tower just placed, per this bracket's aiming skill."""
    if style == "default":
        return
    page.evaluate(
        f"""() => {{
          const g = window.__swarm.game, C = 90, CELL = 20;
          const t = g.towers[g.towers.length - 1];
          if (!t) return;
          // nearest routable cell to the emplacement
          let bx = t.x, by = t.y, bd = 1e9;
          const cx0 = (t.x / CELL) | 0, cy0 = (t.y / CELL) | 0;
          for (let oy = -6; oy <= 6; oy++) for (let ox = -6; ox <= 6; ox++) {{
            const cx = cx0 + ox, cy = cy0 + oy;
            if (cx < 0 || cy < 0 || cx >= C || cy >= 51) continue;
            const c = cy * C + cx;
            if (g.field.walk[c] !== 1) continue;
            const px = cx * CELL + CELL / 2, py = cy * CELL + CELL / 2;
            const d = Math.hypot(px - t.x, py - t.y);
            if (d < bd) {{ bd = d; bx = px; by = py; }}
          }}
          let tx = bx, ty = by;
          if ('{style}' === 'downflow') {{
            // walk the flow from that road cell so the lane runs ALONG the
            // traffic — cars then spend the whole lane under fire
            let px = bx, py = by;
            for (let s = 0; s < 14; s++) {{
              const c = (((py / CELL) | 0) * C) + ((px / CELL) | 0);
              const dx = g.field.dirX[c], dy = g.field.dirY[c];
              if (dx === 0 && dy === 0) break;
              px += dx * CELL; py += dy * CELL;
            }}
            tx = px; ty = py;
          }}
          t.aim = Math.atan2(ty - t.y, tx - t.x);
          t.aimX = tx; t.aimY = ty; t.armed = true;
        }}"""
    )


def play_run(page, skill, box):
    page.evaluate("() => localStorage.clear()")
    page.reload(wait_until="networkidle")
    time.sleep(0.7)
    if page.is_visible("button[data-view='hangar']"):
        page.click("button[data-view='hangar']")
    page.click("button[data-launch]")
    time.sleep(0.4)
    page.evaluate("() => { window.__swarm.game.speed = 10; }")

    plan = PLANS[skill]
    # SWARM_SPREAD forces one spacing on every bracket. Spacing is a confound
    # now that towers hold fixed lanes — clustered lanes overlap and waste
    # coverage — so isolate it before blaming a result on tower cost.
    spread = SPREAD_OVERRIDE or (
        150 if skill == "poor" else 95 if skill == "median" else 70)
    style = AIM[skill]
    placed = 0
    spots = rim_spots(page, 60, spread)
    samples = []          # (runT, baseHp, towers, gold)
    next_sample = 0.0
    upgraded = 0

    while True:
        st = page.evaluate(
            """() => { const g = window.__swarm.game;
                 return { t: g.runT, hp: Math.round(g.baseHp), gold: Math.round(g.gold),
                          stage: g.wave, towers: g.towers.length, phase: g.phase }; }"""
        )
        if st["phase"] != "running" or st["t"] >= RUN_CAP_SECS:
            samples.append((round(st["t"]), st["hp"], st["towers"], st["gold"]))
            return {"held": st["t"], "stage": st["stage"], "samples": samples,
                    "survived": st["phase"] == "running"}

        if st["t"] >= next_sample:
            samples.append((round(st["t"]), st["hp"], st["towers"], st["gold"]))
            next_sample += SAMPLE_EVERY

        # ---- buy, mid-fight, whatever we can afford ----
        if placed < len(spots):
            kind = plan[placed % len(plan)]
            if KINDS[kind][1] > st["gold"]:
                affordable = [k for k in plan if KINDS[k][1] <= st["gold"]]
                # Stopping outright starves the bot into looking worse than it
                # is; take the priciest thing the plan can actually afford.
                kind = max(affordable, key=lambda k: KINDS[k][1]) if affordable else None
            if kind:
                key = KINDS[kind][0]
                s = spots[placed]
                page.keyboard.press("Escape")
                page.keyboard.press(key)
                page.mouse.click(box["x"] + box["w"] * s["x"] / W,
                                 box["y"] + box["h"] * s["y"] / H)
                # placing enters aiming; commit it, then set the real angle
                page.keyboard.press("Escape")
                aim_last(page, style)
                placed += 1

        # ---- upgrades: better bots reinvest ----
        if skill != "poor" and upgraded < (6 if skill == "median" else 14):
            ok = page.evaluate(
                """() => { const g = window.__swarm.game;
                     const i = g.towers.findIndex(t => t.upg === 0 && t.kind !== 'wall');
                     if (i < 0) return false; g.selected = i; return true; }"""
            )
            if ok:
                time.sleep(0.08)
                if page.evaluate(
                    """() => { const b = document.querySelector('.insupg:not([disabled])');
                         if (!b) return false; b.click(); return true; }"""
                ):
                    upgraded += 1
                page.evaluate("() => { window.__swarm.game.selected = -1; }")

        time.sleep(0.25)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--runs", type=int, default=2)
    ap.add_argument("--skill", default="")
    args = ap.parse_args()
    skills = [args.skill] if args.skill else ["poor", "median", "strong"]

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1440, "height": 860})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto("http://localhost:5173", wait_until="networkidle")
        time.sleep(0.8)
        box = page.evaluate(
            """() => { const r = document.querySelector('canvas').getBoundingClientRect();
                       return { x: r.x, y: r.y, w: r.width, h: r.height }; }"""
        )
        print(f"{'bracket':8} {'aim':9} {'runs':>4}  {'held (m:ss)':>12}  {'surge':>6}")
        print("-" * 50)
        detail = {}
        for skill in skills:
            helds, runs = [], []
            for _ in range(args.runs):
                r = play_run(page, skill, box)
                helds.append(r["held"])
                runs.append(r)
            med = statistics.median(helds)
            stage = statistics.median([r["stage"] for r in runs])
            print(f"{skill:8} {AIM[skill]:9} {args.runs:>4}  "
                  f"{int(med)//60}:{int(med)%60:02d}{'':>7}  {stage:>6.0f}")
            detail[skill] = sorted(runs, key=lambda r: r["held"])[len(runs) // 2]
        print("\nper 10s — fortHP / towers / gold (median run):")
        for skill, r in detail.items():
            row = "  ".join(f"{hp:>3}/{tw:>2}/{gd:>4}" for _, hp, tw, gd in r["samples"][:14])
            print(f"  {skill:8}", row)
        print("\nPAGE ERRORS:", errors[:6] if errors else "none")
        browser.close()


if __name__ == "__main__":
    main()
