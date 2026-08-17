"""Enemy archetype coverage — asserts each ability's HORDE-VISIBLE behavior.

Design rule being tested: variety must show up as mass behaviour, not stats.
Types: 0 swarmer 1 runner 2 hauler 3 splitter 4 shielder 5 mender 6 wrecker 7 titan
"""
import time
from playwright.sync_api import sync_playwright
from maplib import snap_rim, snap_open, open_near_rim, aim_last_at

W, H = 1800, 1020

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 860})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto("http://localhost:5173", wait_until="networkidle")
    page.evaluate("() => localStorage.clear()")
    page.reload(wait_until="networkidle")
    time.sleep(0.8)
    # front end is menu -> hangar -> run; PLAY only shows on a fresh load
    if page.is_visible("button[data-view='hangar']"):
        page.click("button[data-view='hangar']")
    page.click("button[data-launch]")
    time.sleep(0.3)
    page.evaluate("() => { window.__swarm.game.gold = 9000; }")
    box = page.evaluate(
        """() => { const r = document.querySelector('canvas').getBoundingClientRect();
                   return { x: r.x, y: r.y, w: r.width, h: r.height }; }"""
    )

    def clear():
        page.evaluate("() => { window.__swarm.game.enemies.n = 0; }")

    def spawn(t, pt):
        page.evaluate(f"() => window.__swarm.game.enemies.spawn({t}, {pt[0]}, {pt[1]})")

    def count():
        return page.evaluate("() => window.__swarm.game.enemies.n")

    R = {}

    # --- SPLITTER: dying multiplies the mass ---
    clear()
    spot = snap_open(page, 700, 500)
    spawn(3, spot)
    time.sleep(0.4)
    before = count()
    page.evaluate("() => { window.__swarm.game.enemies.hp[0] = 0; }")
    time.sleep(0.6)
    after = count()
    R["splitter_multiplies_on_death"] = before == 1 and after >= 4
    print(f"  splitter: {before} -> {after}")

    # --- SHIELDER: reduces damage taken by neighbours ---
    clear()
    spawn(0, spot)                                   # lone swarmer
    time.sleep(0.3)
    page.evaluate("() => { const e = window.__swarm.game.enemies; e.hp[0] = 1000; }")
    time.sleep(0.35)  # let the aura pass run
    solo = page.evaluate("""() => { const g = window.__swarm.game;
        const before = g.enemies.hp[0];
        window.__dealt = before; return g.enemies.shield[0]; }""")
    clear()
    spawn(4, spot)                                   # shielder
    spawn(0, [spot[0] + 20, spot[1]])                # swarmer inside the bubble
    time.sleep(0.5)
    guarded = page.evaluate("() => window.__swarm.game.enemies.shield[1]")
    R["shielder_protects_neighbours"] = solo == 1 and guarded < 0.6
    print(f"  shield mult: solo {solo} -> guarded {guarded}")

    # --- MENDER: regenerates the horde ---
    clear()
    spawn(5, spot)                                   # mender
    spawn(2, [spot[0] + 22, spot[1]])                # damaged hauler nearby
    time.sleep(0.3)
    page.evaluate("() => { window.__swarm.game.enemies.hp[1] = 20; }")
    hp0 = page.evaluate("() => window.__swarm.game.enemies.hp[1]")
    time.sleep(1.6)
    hp1 = page.evaluate("() => window.__swarm.game.enemies.n > 1 ? window.__swarm.game.enemies.hp[1] : -1")
    R["mender_heals_neighbours"] = hp1 > hp0 + 5
    print(f"  mender: {hp0:.1f} -> {hp1:.1f}")

    # --- RUNNER: outpaces the swarmer over the same window ---
    clear()
    start = snap_open(page, 300, 500)
    spawn(0, start)
    spawn(1, [start[0], start[1] + 26])
    time.sleep(0.3)
    p0 = page.evaluate("() => [window.__swarm.game.enemies.x[0], window.__swarm.game.enemies.x[1]]")
    time.sleep(7)
    p1 = page.evaluate("() => [window.__swarm.game.enemies.x[0], window.__swarm.game.enemies.x[1]]")
    swarm_d = abs(p1[0] - p0[0])
    run_d = abs(p1[1] - p0[1])
    R["runner_outruns_swarmer"] = run_d > swarm_d * 1.25
    print(f"  travel: swarmer {swarm_d:.0f}px vs runner {run_d:.0f}px")

    # --- WRECKER is RETIRED (2026-08-17) ---
    # It steered at the nearest tower, but weapon towers mount on unwalkable
    # rim cells, so it drove into the wall beside its target and pressed there.
    # Guard the retirement rather than the behaviour: if anything puts it back
    # into a wave, this fails.
    wrecker_waves = page.evaluate(
        """() => { const out = [];
             for (let w = 1; w <= 20; w++) {
               const mix = window.__swarm.waveMix ? window.__swarm.waveMix(w) : null;
               if (mix && mix.weights && mix.weights[6]) out.push(w);
             }
             return out; }"""
    )
    print(f"  waves still containing wreckers: {wrecker_waves}")
    R["wrecker_stays_retired"] = wrecker_waves == []

    # --- SOFT ARMOR: a light weapon still hurts a heavy unit ---
    clear()
    rim2 = snap_rim(page, 500, 700)
    page.keyboard.press("Escape")
    page.keyboard.press("1")
    page.mouse.click(box["x"] + box["w"] * rim2[0] / W, box["y"] + box["h"] * rim2[1] / H)
    page.keyboard.press("Escape")
    time.sleep(0.2)
    assert page.evaluate("() => window.__swarm.game.towers.length") >= 1, "armor test tower missing"
    tgt = open_near_rim(page, rim2, 30, 85)
    aim_last_at(page, tgt[0], tgt[1])  # fixed-aim towers must be pointed at it
    spawn(2, tgt)  # hauler: armor 9 vs autocannon hit 8 — reduced, never zero
    time.sleep(0.4)
    h0 = page.evaluate("() => window.__swarm.game.enemies.hp[0]")
    time.sleep(3.5)
    h1 = page.evaluate("() => window.__swarm.game.enemies.n > 0 ? window.__swarm.game.enemies.hp[0] : -1")
    R["soft_armor_never_zero"] = h1 == -1 or h1 < h0 - 1
    print(f"  hauler under autocannon: {h0:.1f} -> {h1:.1f}")

    fails = [k for k, v in R.items() if not v]
    for k, v in R.items():
        print(("PASS " if v else "FAIL ") + k)
    print("PAGE ERRORS:", errors[:8] if errors else "none")
    browser.close()
    assert not fails, f"failed: {fails}"
    print("ALL ENEMY CHECKS PASSED")
