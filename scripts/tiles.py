"""Drafted tiles: does the map really change, and can a tile ever break a run?

The dangerous failure is a tile that seals the track. Mid-run that is
unrecoverable — the horde would chew at a wall with no way past it — so
placeTile stamps onto a snapshot, checks spawn->goal connectivity and rolls
back if it fails. This asserts the rollback actually happens, that all three
derived structures (road mask, distance field, routes) follow the edit, and
that the horde still gets through afterwards.

    python tiles.py
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


PLACE_ISLAND = """() => {
  const g = window.__swarm.game;
  const CELL = 20, C = 90;
  let spot = null;
  for (let cy = 8; cy < 44 && !spot; cy++)
    for (let cx = 30; cx < 60; cx++) {
      const c = cy * C + cx;
      if (g.field.walk[c] !== 1) continue;
      if (g.field.dirX[c] === 0 && g.field.dirY[c] === 0) continue;
      const x = cx * CELL + 10, y = cy * CELL + 10;
      // walk===1 is AREA COVERAGE (>=25% of the cell), so a walkable cell can
      // still have its centre inside a wall. A tile that wants road has to be
      // dropped somewhere genuinely open, or it is refused and the test
      // measures nothing.
      if (window.__swarm.sampleDist(x, y) > 18) continue;
      spot = { x, y, c };
      break;
    }
  const sum = (a) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s; };
  const before = { walk: g.field.walk[spot.c], ver: g.field.version,
                   road: sum(g.field.walk),
                   dist: window.__swarm.sampleDist(spot.x, spot.y) };
  const ok = window.__swarm.placeTile('island', spot.x, spot.y);
  return { ok, spot, before,
           after: { walk: g.field.walk[spot.c], ver: g.field.version,
                    road: sum(g.field.walk), tiles: g.tiles.length,
                    dist: window.__swarm.sampleDist(spot.x, spot.y) } };
}"""

FORCE_SEAL = """() => {
  const g = window.__swarm.game;
  const CELL = 20, C = 90;
  const sum = (a) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s; };
  const before = sum(g.field.walk);
  let refused = 0, placed = 0;
  // Try to plug the whole road with islands. Somewhere in there is a placement
  // that cuts the only route, and every one of those must be refused.
  for (let cy = 2; cy < 49; cy += 2) {
    for (let cx = 12; cx < 86; cx += 2) {
      if (g.field.walk[cy * C + cx] !== 1) continue;
      if (window.__swarm.placeTile('island', cx * CELL + 10, cy * CELL + 10)) placed++;
      else refused++;
    }
  }
  return { placed, refused, before, after: sum(g.field.walk),
           sealed: g.field.sealed, reach: window.__swarm.routeOpen() };
}"""

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1500, "height": 900},
                            device_scale_factor=2)
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto("http://localhost:5173", wait_until="networkidle")
    page.evaluate("() => localStorage.clear()")
    page.reload(wait_until="networkidle")
    time.sleep(1.0)
    page.click("button[data-view='hangar']")
    page.click("button[data-launch]")
    time.sleep(0.5)

    # ---- an offer arrives on a surge ----
    page.evaluate("() => { window.__swarm.game.runT = 23.4; }")
    offer = None
    for _ in range(40):
        offer = page.evaluate("() => window.__swarm.game.tileOffer")
        if offer:
            break
        time.sleep(0.2)
    check("a surge offers three tiles", bool(offer) and len(offer) == 3, offer)
    page.evaluate("() => { window.__swarm.game.flowPaused = true; }")
    time.sleep(0.3)
    page.screenshot(path=f"{OUT}/tile_offer.png")

    # ---- an ISLAND really edits the map ----
    res = page.evaluate(PLACE_ISLAND)
    a, b = res["after"], res["before"]
    check("an ISLAND stamps solid ground into the road",
          res["ok"] and a["walk"] == 0 and a["road"] < b["road"],
          {"roadCells": f"{b['road']} -> {a['road']}", "walkAtCentre": a["walk"]})
    # >PATH_RADIUS means the sampler now reports this point as INSIDE a wall,
    # which is what the car collision and projection code reads.
    # Compare BEFORE and AFTER: an absolute threshold reads a pre-existing
    # value and passes even when the placement was refused.
    check("the distance field follows the edit",
          a["dist"] > b["dist"] + 15 and a["dist"] > 40,
          f"sampleDist at the tile centre {b['dist']:.0f} -> {a['dist']:.0f}")
    check("the routes are rebuilt", a["ver"] > b["ver"],
          f"field.version {b['ver']} -> {a['ver']}")

    # ---- a tile that would seal the track is refused and rolled back ----
    seal = page.evaluate(FORCE_SEAL)
    check("the track is never sealed, however many tiles are forced in",
          seal["reach"] is True and seal["sealed"] is False, seal)
    check("some placements were refused", seal["refused"] > 0,
          f"{seal['placed']} placed, {seal['refused']} refused")
    page.screenshot(path=f"{OUT}/tile_after.png")

    # ---- and the horde still gets through the rebuilt map ----
    page.evaluate("() => { const g = window.__swarm.game; g.flowPaused = false; g.speed = 10; }")
    st = None
    for _ in range(80):
        st = page.evaluate(
            """() => { const g = window.__swarm.game;
                 return { leaked: 400 - Math.round(g.baseHp), n: g.enemies.n,
                          rescues: g.rescues, t: Math.round(g.runT) }; }"""
        )
        if st["leaked"] > 0:
            break
        time.sleep(0.4)
    check("the horde still reaches the fort after the map is rebuilt",
          st["leaked"] > 0, st)
    # g.rescues is the stuck-car alarm. A map this heavily edited is a harsh
    # case, but a wall of grinding cars would show up here.
    check("nothing is grinding on the new geometry", st["rescues"] < 150, st)

    # ---- a fresh run starts on the pristine track ----
    # open4 and mapPixels are module state built once at boot, so without an
    # explicit reset the next run would inherit the last run's rocks.
    page.evaluate("() => { window.__swarm.game.flowPaused = true; }")
    scarred = page.evaluate(
        "() => { const w = window.__swarm.game.field.walk;"
        "  let s = 0; for (let i = 0; i < w.length; i++) s += w[i]; return s; }"
    )
    # The metascreen is hidden while a run is live, so end this one the way a
    # player would — the fort falls, and a finished run always lands on the
    # hangar.
    page.evaluate("() => { const g = window.__swarm.game; g.flowPaused = false; g.baseHp = 0; }")
    for _ in range(30):
        if page.evaluate("() => window.__swarm.game.phase") == 'lost':
            break
        time.sleep(0.2)
    page.click("button[data-launch]")
    time.sleep(0.8)
    fresh = page.evaluate(
        "() => { const g = window.__swarm.game, w = g.field.walk;"
        "  let s = 0; for (let i = 0; i < w.length; i++) s += w[i];"
        "  return { road: s, tiles: g.tiles.length }; }"
    )
    check("a new run starts on the pristine track",
          fresh["road"] > scarred + 500 and fresh["tiles"] == 0,
          f"road cells {scarred} (scarred) -> {fresh['road']} (fresh), "
          f"{fresh['tiles']} tiles carried over")

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
print("OK — tiles reshape the map and can never cut the track")
