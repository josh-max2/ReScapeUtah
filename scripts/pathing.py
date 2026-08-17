"""Congestion-aware routing: does the horde spread, and does it ever flap?

The complaint this answers: every car took the same line, queued nose-to-tail,
and only spilled onto a parallel branch once physical crowd pressure shoved it
there. DELTA is the instrument — it splits three ways and rejoins, so branch
traffic share is directly measurable.

The third check is the important one. The failure mode of congestion routing is
that a jam makes the route THROUGH it cost more than backtracking, and cars
U-turn mid-route. Mass about-faces read as broken, not clever, so this measures
the fraction of cars driving against their own flow and holds it at baseline.

    python pathing.py
"""
import sys
import time
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
OUT = ("C:/Users/joshs/AppData/Local/Temp/claude/C--Users-joshs-Desktop-game/"
       "3d8718ef-5b59-4303-9562-1717e7c223c2/scratchpad")
FAILS = []


def check(name, ok, detail=""):
    print(f"  [{'PASS' if ok else 'FAIL'}] {name}{(' — ' + str(detail)) if detail else ''}")
    if not ok:
        FAILS.append(name)


# Traffic share across DELTA's three branches, plus the against-flow fraction.
PROBE = """() => {
  const g = window.__swarm.game, e = g.enemies;
  const CELL = 20, C = 90;
  // The branches separate vertically in the middle third of the map.
  const bands = [0, 0, 0];
  let against = 0, moving = 0;
  for (let i = 0; i < e.n; i++) {
    if (e.hp[i] <= 0) continue;
    const v = Math.hypot(e.vx[i], e.vy[i]);
    if (v > 8) {
      moving++;
      const cx = (e.x[i] / CELL) | 0, cy = (e.y[i] / CELL) | 0;
      const c = cy * C + cx;
      const dx = g.field.dirX[c], dy = g.field.dirY[c];
      if (dx !== 0 || dy !== 0) {
        if ((e.vx[i] / v) * dx + (e.vy[i] / v) * dy < -0.35) against++;
      }
    }
    // Sample only where the branches are actually SEPARATED. DELTA fans out
    // from x=300 and is only fully split around x=900; a window starting at
    // 420 counts cars that have not chosen yet as "middle" and reports a
    // perfectly spread horde as single-file.
    if (e.x[i] < 820 || e.x[i] > 1000) continue;
    const b = e.y[i] < 380 ? 0 : e.y[i] > 580 ? 2 : 1;
    bands[b]++;
  }
  // Peak smoothed density, to prove the congestion field is seeing traffic
  // at all — a silently-zero density would look exactly like a weak effect.
  let peak = 0;
  const d = g.routes[0].density;
  for (let c = 0; c < d.length; c++) if (d[c] > peak) peak = d[c];
  // How the horde is distributed across the shared routes.
  const onRoute = [0, 0, 0];
  for (let i = 0; i < e.n; i++) if (e.hp[i] > 0) onRoute[e.route[i]]++;
  return { bands, against, moving, n: e.n, rescues: g.rescues, peak, onRoute,
           etas: (window.__swarm.routeEta || []).map(v => Math.round(v)) };
}"""


def run(page, congestion):
    page.goto("http://localhost:5173/?map=delta", wait_until="networkidle")
    page.evaluate("() => localStorage.clear()")
    page.goto("http://localhost:5173/?map=delta", wait_until="networkidle")
    time.sleep(1.0)
    page.click("button[data-view='hangar']")
    page.click("button[data-launch]")
    time.sleep(0.4)
    if not congestion:
        # Baseline: every car on route 0, i.e. the old single-line behaviour.
        page.evaluate(
            "() => { const g = window.__swarm.game;"
            "  g.routes = [g.field, g.field, g.field]; }")
    page.evaluate("() => { window.__swarm.game.speed = 10; }")
    samples = []
    for _ in range(90):
        time.sleep(0.35)
        s = page.evaluate(PROBE)
        if s["n"] > 60:
            samples.append(s)
    return samples


with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1500, "height": 900},
                            device_scale_factor=2)
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    def summarise(samples):
        if not samples:
            return None
        tot = [0, 0, 0]
        against = moving = 0
        for s in samples:
            for i in range(3):
                tot[i] += s["bands"][i]
            against += s["against"]
            moving += s["moving"]
        n = sum(tot) or 1
        share = [t / n for t in tot]
        # Even spread across 3 branches = 0.333 each. Report the share taken by
        # the busiest branch: 1.0 is a single-file queue, 0.33 is perfect spread.
        return {"share": [round(x, 3) for x in share], "busiest": max(share),
                "against": against / max(1, moving),
                "rescues": samples[-1]["rescues"],
                "peakDensity": round(max(s["peak"] for s in samples), 2),
                "onRoute": samples[-1]["onRoute"],
                "etas": samples[-1].get("etas")}

    base = summarise(run(page, False))
    cong = summarise(run(page, True))
    check("both runs produced traffic", bool(base and cong), {"base": base, "cong": cong})
    # A spread test run on an uncongested road proves nothing — there has to be
    # a jam for congestion routing to have an opinion about.
    check("the road actually jams during the window",
          bool(cong) and cong["peakDensity"] > 3.5,
          f"peak smoothed density {cong['peakDensity'] if cong else '?'}")

    if base and cong:
        check("the horde spreads across more branches",
              cong["busiest"] < base["busiest"] - 0.02,
              f"busiest branch {base['busiest']:.3f} -> {cong['busiest']:.3f} "
              f"(shares {base['share']} -> {cong['share']})")
        # The U-turn failure mode.
        check("no mass U-turns", cong["against"] < max(0.06, base["against"] * 1.6 + 0.01),
              f"against-flow {base['against']:.3f} -> {cong['against']:.3f}")
        check("the stuck-rescue net is no worse",
              cong["rescues"] <= max(30, base["rescues"] * 1.5 + 5),
              f"rescues {base['rescues']} -> {cong['rescues']}")
        page.screenshot(path=f"{OUT}/pathing.png")

    browser.close()

print()
if errors:
    print("PAGE ERRORS:")
    for e in errors[:8]:
        print(" -", e)
    sys.exit(1)
if FAILS:
    print("FAILED:", ", ".join(FAILS))
    sys.exit(1)
print("OK — congestion routing spreads the horde without flapping it")
