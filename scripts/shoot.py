"""Screenshot the dev build at states worth LOOKING at, and refuse to lie.

This harness previously photographed an empty battlefield and reported success:
it loaded ?demo=1 (wave 1 — ~55 swarmers against a 24-tower prebuilt line, dead
in seconds), waited on fixed sleeps, and its "enemy count probe" counted CANVAS
ELEMENTS rather than enemies. It printed "canvases: 12" and passed. Several
"the game looks fine" reports leaned on these images while the owner was
watching enemies grind against walls.

So every capture here now WAITS for the state it claims to show and ASSERTS it
before shooting. If the frame is empty, this fails.
"""
import sys
import time
from playwright.sync_api import sync_playwright

OUT = "C:/Users/joshs/AppData/Local/Temp/claude/C--Users-joshs-Desktop-game/3d8718ef-5b59-4303-9562-1717e7c223c2/scratchpad"
BASE = "http://localhost:5173"

# Wave 1 is not a firefight. These have real mass behind them.
FIGHT_WAVE = 12   # BLITZ — runners at volume
BOSS_WAVE = 10    # first boss slot
MIN_ENEMIES = 60  # below this the frame is not worth looking at

shots = []
fails = []


def probe(page):
    """Real state — enemy count, phase, boss presence."""
    return page.evaluate(
        """() => { const g = window.__swarm.game, e = g.enemies;
             let boss = false;
             for (let i = 0; i < e.n; i++) {
               if (e.type[i] >= 8 && e.hp[i] > 0) { boss = true; break; }
             }
             return { n: e.n, phase: g.phase, wave: g.wave, boss,
                      hp: Math.round(g.baseHp), kills: g.kills }; }"""
    )


def wait_for(page, want, timeout=45.0, poll=0.4):
    """Poll until `want(state)` holds. Returns the state, or the last one seen."""
    best = None
    waited = 0.0
    while waited < timeout:
        s = probe(page)
        if best is None or s["n"] > best["n"]:
            best = s
        if want(s):
            return s
        time.sleep(poll)
        waited += poll
    return best


def shoot(page, name, state, ok, note):
    """Capture, and record whether the frame actually shows what it claims."""
    path = f"{OUT}/{name}.png"
    page.screenshot(path=path)
    shots.append((name, state, ok))
    status = "ok  " if ok else "EMPTY"
    print(f"  [{status}] {name}: {note} -> {state}")
    if not ok:
        fails.append(f"{name}: {note} (saw {state})")


with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1500, "height": 900},
                            device_scale_factor=2)
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

    # ---- 1. title screen ----
    page.goto(BASE, wait_until="networkidle")
    time.sleep(1.0)
    titled = page.is_visible(".gametitle")
    page.screenshot(path=f"{OUT}/1_menu.png")
    print(f"  [{'ok  ' if titled else 'EMPTY'}] 1_menu: title screen")
    if not titled:
        fails.append("1_menu: no title screen")

    # ---- 2. committed aim lanes: the core mechanic ----
    page.goto(f"{BASE}/?demo={FIGHT_WAVE}", wait_until="networkidle")
    time.sleep(1.4)
    page.evaluate("() => { const g = window.__swarm.game; g.flowPaused = true; g.enemies.n = 0; }")
    time.sleep(0.5)
    towers = page.evaluate("() => window.__swarm.game.towers.length")
    shoot(page, "2_build", {"towers": towers}, towers >= 8,
          "committed aim lanes")

    # ---- 3. mid-fight at real density ----
    page.goto(f"{BASE}/?demo={FIGHT_WAVE}", wait_until="networkidle")
    time.sleep(1.2)
    page.evaluate("() => { window.__swarm.game.speed = 2; }")
    st = wait_for(page, lambda s: s["n"] >= MIN_ENEMIES)
    shoot(page, "3_fight", st, st["n"] >= MIN_ENEMIES,
          f"wave {FIGHT_WAVE} at >= {MIN_ENEMIES} enemies")

    # a second, later frame so we see the wave under pressure, not just its front
    time.sleep(3.0)
    st2 = probe(page)
    shoot(page, "4_fight_late", st2, st2["n"] >= MIN_ENEMIES // 2,
          "same wave, deeper in")

    # ---- 5. a boss, with its bar ----
    page.goto(f"{BASE}/?demo={BOSS_WAVE}", wait_until="networkidle")
    time.sleep(1.2)
    page.evaluate("() => { window.__swarm.game.speed = 2; }")
    stb = wait_for(page, lambda s: s["boss"])
    bar = page.evaluate(
        "() => { const el = document.querySelector('.bossbar');"
        "  return !!el && el.style.display !== 'none'; }"
    )
    shoot(page, "5_boss", {**stb, "bar": bar}, bool(stb["boss"]) and bar,
          f"wave {BOSS_WAVE} boss on screen with health bar")

    browser.close()

print()
if errors:
    print("PAGE ERRORS:")
    for e in errors[:20]:
        print(" -", e)
    sys.exit(1)
if fails:
    print("CAPTURES THAT SHOW NOTHING:")
    for f in fails:
        print(" -", f)
    sys.exit(1)
print(f"OK — {len(shots) + 1} captures, all showing live state, no page errors")
