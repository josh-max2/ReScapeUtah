"""Difficulty-curve harness: bots play full runs, we read where they die.

A curve can't be judged from one human run. This plays the game headlessly at
three skill levels and reports, per wave, how much base HP survived and where
each bracket failed. Read it like a stress test of the DESIGN, not the code.

  python difficulty.py                 # 3 skills x 3 runs
  python difficulty.py --runs 5        # more samples
  python difficulty.py --skill median  # one bracket

Skill brackets:
  poor   - autocannons only, scattered, never upgrades (a new player)
  median - sensible mix, clusters near the spawn half, some upgrades
  strong - heavy mix, tight clustering, upgrades whenever affordable
"""
import argparse
import statistics
import time
from playwright.sync_api import sync_playwright

W, H = 1800, 1020
WAVES = 20

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
            // flow cost of an adjacent road cell = how far along the route it is
            let cost = Infinity;
            for (const n of [c-1, c+1, c-C, c+C]) {{
              if (g.field.walk[n] === 1 && isFinite(g.field.cost[n])) {{
                cost = Math.min(cost, g.field.cost[n]);
              }}
            }}
            if (!isFinite(cost)) continue;
            out.push({{ x: cx * 20 + 10, y: cy * 20 + 10, cost }});
          }}
          // high cost = far from the fort = early on the route
          out.sort((a, b) => b.cost - a.cost);
          const picked = [];
          for (const s of out) {{
            if (picked.length >= {count}) break;
            if (picked.every(p => Math.hypot(p.x - s.x, p.y - s.y) > {spread})) picked.push(s);
          }}
          return picked;
        }}"""
    )


def play_run(page, skill, box):
    page.evaluate("() => localStorage.clear()")
    page.reload(wait_until="networkidle")
    time.sleep(0.7)
    # front end is menu -> hangar -> run; PLAY only shows on a fresh load
    if page.is_visible("button[data-view='hangar']"):
        page.click("button[data-view='hangar']")
    page.click("button[data-launch]")
    time.sleep(0.4)
    page.evaluate("() => { window.__swarm.game.speed = 10; }")

    plan = PLANS[skill]
    spread = 150 if skill == "poor" else 95 if skill == "median" else 70
    placed = 0
    hp_by_wave = []

    for wave in range(1, WAVES + 1):
        # ---- build phase: spend what we can afford ----
        spots = rim_spots(page, 40, spread)
        for _ in range(8):  # a few purchases per wave
            gold = page.evaluate("() => window.__swarm.game.gold")
            if placed >= len(spots):
                break
            # Buy the planned tower, else the priciest plan entry we CAN afford.
            # (Stopping outright starves the bot into looking worse than it is.)
            kind = plan[placed % len(plan)]
            if KINDS[kind][1] > gold:
                affordable = [k for k in plan if KINDS[k][1] <= gold]
                if not affordable:
                    break
                kind = max(affordable, key=lambda k: KINDS[k][1])
            key, cost = KINDS[kind]
            s = spots[placed]
            page.keyboard.press("Escape")
            page.keyboard.press(key)
            page.mouse.click(box["x"] + box["w"] * s["x"] / W,
                             box["y"] + box["h"] * s["y"] / H)
            time.sleep(0.06)
            placed += 1
        page.keyboard.press("Escape")

        # ---- upgrades (median/strong only) ----
        if skill != "poor":
            n_up = 2 if skill == "median" else 4
            for _ in range(n_up):
                done = page.evaluate(
                    """() => { const g = window.__swarm.game;
                      const i = g.towers.findIndex(t => t.upg === 0 && t.kind !== 'wall');
                      if (i < 0) return 'none';
                      g.selected = i; return 'ok'; }"""
                )
                if done != "ok":
                    break
                time.sleep(0.12)
                clicked = page.evaluate(
                    """() => { const b = document.querySelector('.insupg:not([disabled])');
                       if (!b) return false; b.click(); return true; }"""
                )
                if not clicked:
                    break
                time.sleep(0.1)
            page.evaluate("() => { window.__swarm.game.selected = -1; }")

        # ---- fight ----
        page.keyboard.press(" ")
        for _ in range(90):
            time.sleep(1)
            s = page.evaluate(
                """() => { const g = window.__swarm.game;
                   return { phase: g.phase, hp: Math.round(g.baseHp), wave: g.wave }; }"""
            )
            if s["phase"] != "running":
                break
        econ = page.evaluate(
            """() => { const g = window.__swarm.game;
               return { gold: Math.round(g.gold), towers: g.towers.length }; }"""
        )
        hp_by_wave.append((s["hp"], econ["towers"], econ["gold"]))
        if s["phase"] in ("lost", "won"):
            return {"died_on": wave if s["phase"] == "lost" else None,
                    "hp": hp_by_wave, "towers": placed}
    return {"died_on": None, "hp": hp_by_wave, "towers": placed}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--runs", type=int, default=3)
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
        print(f"{'skill':8} {'runs':>4}  {'died on wave':>14}  {'cleared':>8}")
        print("-" * 46)
        curves = {}
        for skill in skills:
            deaths, curve = [], []
            for _ in range(args.runs):
                r = play_run(page, skill, box)
                deaths.append(r["died_on"] if r["died_on"] else WAVES + 1)
                curve.append(r["hp"])
            med = statistics.median(deaths)
            cleared = sum(1 for d in deaths if d > WAVES)
            shown = "cleared" if med > WAVES else f"{med:.0f}"
            print(f"{skill:8} {args.runs:>4}  {shown:>14}  {cleared}/{args.runs}")
            curves[skill] = curve
        print("\nper wave — baseHP / towers / gold (median run):")
        for skill, runs in curves.items():
            best = sorted(runs, key=len)[len(runs) // 2]
            print(f"  {skill:8}", "  ".join(f"{h:>3}/{t:>2}/{gld:>4}" for h, t, gld in best))
        print("\nPAGE ERRORS:", errors[:6] if errors else "none")
        browser.close()


if __name__ == "__main__":
    main()
