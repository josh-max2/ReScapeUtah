"""Every track must be drivable. A map is an image, so a bad one is a drawing
mistake, not a code bug — and it shows up as cars grinding in a pinch rather
than as an exception. This loads each track and asserts the horde can actually
get from the rift to the fort.

    python maps.py
"""
import sys
import time
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
OUT = ("C:/Users/joshs/AppData/Local/Temp/claude/C--Users-joshs-Desktop-game/"
       "3d8718ef-5b59-4303-9562-1717e7c223c2/scratchpad")
TRACKS = ["map2", "delta", "coil", "basin"]
FAILS = []


def check(name, ok, detail=""):
    print(f"  [{'PASS' if ok else 'FAIL'}] {name}{(' — ' + str(detail)) if detail else ''}")
    if not ok:
        FAILS.append(name)


with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1500, "height": 900},
                            device_scale_factor=2)
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    for track in TRACKS:
        page.goto(f"http://localhost:5173/?map={track}", wait_until="networkidle")
        page.evaluate("() => localStorage.clear()")
        page.goto(f"http://localhost:5173/?map={track}", wait_until="networkidle")
        time.sleep(1.1)
        page.click("button[data-view='hangar']")
        page.click("button[data-launch]")
        time.sleep(0.5)

        geom = page.evaluate(
            """() => {
                 const g = window.__swarm.game;
                 let road = 0;
                 for (let i = 0; i < g.field.walk.length; i++) road += g.field.walk[i];
                 return { road, sealed: g.field.sealed, towers: g.towers.length }; }"""
        )
        check(f"{track}: classifies into road", geom["road"] > 300, geom)
        # sealed==true with no walls placed means the rift cannot reach the fort
        check(f"{track}: the rift can reach the fort", not geom["sealed"], geom)

        # Let it run and confirm the horde actually arrives — a map can be
        # connected on the grid and still pinch cars somewhere impassable.
        page.evaluate("() => { window.__swarm.game.speed = 10; }")
        st = None
        for _ in range(80):
            st = page.evaluate(
                """() => { const g = window.__swarm.game;
                     return { t: Math.round(g.runT), n: g.enemies.n,
                              leaked: 400 - Math.round(g.baseHp),
                              rescues: g.rescues }; }"""
            )
            if st["leaked"] > 0:
                break
            time.sleep(0.4)
        check(f"{track}: the horde reaches the fort", st["leaked"] > 0, st)
        # rescues is the stuck-car safety net; CLAUDE.md calls it an alarm.
        check(f"{track}: nothing is grinding", st["rescues"] < 60, st)
        page.evaluate("() => { window.__swarm.game.speed = 1; }")
        time.sleep(0.3)
        page.screenshot(path=f"{OUT}/track_{track}.png")

    browser.close()

print()
if errors:
    print("PAGE ERRORS:")
    for e in errors[:10]:
        print(" -", e)
    sys.exit(1)
if FAILS:
    print("FAILED:", ", ".join(FAILS))
    sys.exit(1)
print(f"OK — all {len(TRACKS)} tracks are drivable")
