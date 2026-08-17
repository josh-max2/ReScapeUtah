"""The Diverter: does it actually bend the horde, and does it ever strand one?

Two things have to be true. It must visibly steer traffic — otherwise it is a
55-gold ornament. And it must NEVER put a car somewhere it cannot drive: every
direct-write shortcut in the movement code has caused exactly that before, which
is why the diverter blends the DESIRED direction and lets wall repel, projection
and separation all still run afterwards. This asserts both.

    python divert.py
"""
import sys
import time
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
FAILS = []


def check(name, ok, detail=""):
    print(f"  [{'PASS' if ok else 'FAIL'}] {name}{(' — ' + str(detail)) if detail else ''}")
    if not ok:
        FAILS.append(name)


SETUP = """(withDiv) => {
  const g = window.__swarm.game;
  g.flowPaused = true;
  g.enemies.n = 0;
  g.towers.length = 0;
  g.towerGrid.fill(-1);
  g.gold = 9999;
  const C = 90, CELL = 20;
  // A road cell with real flow, well clear of the rift and the fort.
  let spot = null;
  for (let cy = 8; cy < 44 && !spot; cy++)
    for (let cx = 26; cx < 60; cx++) {
      const c = cy * C + cx;
      if (g.field.walk[c] !== 1) continue;
      if (g.field.dirX[c] === 0 && g.field.dirY[c] === 0) continue;
      // want a cell with open road on both sides, so there is room to bend into
      if (g.field.walk[c - C] !== 1 || g.field.walk[c + C] !== 1) continue;
      spot = { cx, cy, x: cx * CELL + 10, y: cy * CELL + 10,
               fx: g.field.dirX[c], fy: g.field.dirY[c] };
      break;
    }
  if (!spot) return null;
  // Push PERPENDICULAR to the local flow — the honest test of steering, since
  // pushing along the flow would be indistinguishable from doing nothing.
  const perpX = -spot.fy, perpY = spot.fx;
  if (withDiv) {
    const i = window.__swarm.place('diverter', spot.cx, spot.cy);
    if (i < 0) return null;
    const t = g.towers[i];
    t.aim = Math.atan2(perpY, perpX);
    t.aimX = t.x + perpX * 60; t.aimY = t.y + perpY * 60;
    t.armed = true;
  }
  // A tight pack dropped upstream, identical in both trials.
  const ux = spot.x - spot.fx * 150, uy = spot.y - spot.fy * 150;
  for (let k = 0; k < 40; k++) {
    g.enemies.spawn(0, ux + (k % 8) * 6 - 24, uy + ((k / 8) | 0) * 6 - 12);
  }
  window.__div = { spot, perpX, perpY, n: g.enemies.n };
  return spot;
}"""

# Measure the STEERING, not the displacement. Projecting three seconds of
# travel onto a local perpendicular conflates "pushed sideways" with "made
# different progress along a curving route" — the first attempt at this read
# a real effect with the wrong sign for exactly that reason. Heading inside
# the footprint is immune to how the track bends downstream.
MEASURE = """() => {
  const g = window.__swarm.game, e = g.enemies;
  const d = window.__div;
  // Inner half of the footprint. Authority TAPERS to zero at the rim by
  // design, so averaging over the whole circle mostly measures the handback
  // and reports a working diverter as a weak one.
  const R2 = 35 * 35;
  let dot = 0, inside = 0, offTrack = 0;
  const C = 90, CELL = 20;
  for (let i = 0; i < e.n; i++) {
    if (e.hp[i] <= 0) continue;
    const cx = (e.x[i] / CELL) | 0, cy = (e.y[i] / CELL) | 0;
    if (g.field.walk[cy * C + cx] !== 1) offTrack++;
    const dx = e.x[i] - d.spot.x, dy = e.y[i] - d.spot.y;
    if (dx * dx + dy * dy > R2) continue;
    const v = Math.hypot(e.vx[i], e.vy[i]);
    if (v < 1) continue;
    dot += (e.vx[i] / v) * d.perpX + (e.vy[i] / v) * d.perpY;
    inside++;
  }
  return { dot, inside, offTrack, rescues: g.rescues };
}"""

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 860})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto("http://localhost:5173", wait_until="networkidle")

    def trial(with_div):
        page.evaluate("() => localStorage.clear()")
        page.reload(wait_until="networkidle")
        time.sleep(0.8)
        page.click("button[data-view='hangar']")
        page.click("button[data-launch]")
        time.sleep(0.4)
        spot = page.evaluate(SETUP, with_div)
        if not spot:
            return None
        page.evaluate("() => { window.__swarm.game.speed = 4; }")
        # Sample repeatedly: cars are only inside the footprint for a moment,
        # so a single reading at the end would usually catch an empty circle.
        tot, cnt, off, resc = 0.0, 0, 0, 0
        for _ in range(24):
            time.sleep(0.15)
            m = page.evaluate(MEASURE)
            tot += m["dot"]
            cnt += m["inside"]
            off = max(off, m["offTrack"])
            resc = max(resc, m["rescues"])
        return {"align": (tot / cnt) if cnt else 0.0, "samples": cnt,
                "offTrack": off, "rescues": resc}

    off = trial(False)
    on = trial(True)
    ok = off and on
    check("both trials ran", bool(ok), {"off": off, "on": on})

    if ok:
        # align = mean heading of cars in the footprint, projected on the push
        # axis. 0 = driving straight down the flow, 1 = fully turned.
        shift = on["align"] - off["align"]
        check("the diverter measurably bends the horde", shift > 0.25,
              f"heading alignment {off['align']:+.2f} -> {on['align']:+.2f} "
              f"({shift:+.2f}) over {on['samples']} car-samples")
        check("no car is pushed off the drivable road", on["offTrack"] == 0,
              f"{on['offTrack']} off-track at peak")
        # g.rescues is the stuck-car safety net. CLAUDE.md is explicit that it
        # is an ALARM, not plumbing — a diverter that wedges cars would show here.
        check("the stuck-rescue net does not fire", on["rescues"] <= off["rescues"] + 2,
              f"rescues {off['rescues']} -> {on['rescues']}")

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
print("OK — the Diverter steers the horde and strands nobody")
