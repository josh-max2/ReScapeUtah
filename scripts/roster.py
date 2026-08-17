"""Roster coverage: every weapon fires once with an assertion — MAP-AGNOSTIC.

Anchors are approximate; maplib snaps them to real rim/open cells at runtime,
so this survives painted-map changes. Runs in BUILD phase (sim ticks, no
spawner). Types: 0 mite(hp4,thr0) 2 brute(hp90,thr8) 3 titan(hp1500,thr25).
"""
import time
from playwright.sync_api import sync_playwright
from maplib import snap_rim, snap_open, open_near_rim, aim_at, aim_last_at

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
    # No build phase any more — freeze the flow so dummies stay controlled.
    page.evaluate("() => { window.__swarm.game.flowPaused = true; }")
    time.sleep(0.3)
    page.evaluate("() => { window.__swarm.game.gold = 9000; }")
    box = page.evaluate(
        """() => { const r = document.querySelector('canvas').getBoundingClientRect();
                   return { x: r.x, y: r.y, w: r.width, h: r.height }; }"""
    )

    def click_at(pt):
        page.mouse.click(box["x"] + box["w"] * pt[0] / W, box["y"] + box["h"] * pt[1] / H)
        time.sleep(0.1)

    def place(key, anchor):
        rim = snap_rim(page, anchor[0], anchor[1])
        assert rim, f"no rim near {anchor}"
        page.keyboard.press("Escape")
        page.keyboard.press(key)
        click_at(rim)
        page.keyboard.press("Escape")
        return rim

    def clear_enemies():
        page.evaluate("() => { window.__swarm.game.enemies.n = 0; }")

    def spawn(t, pt):
        page.evaluate(f"() => {{ window.__swarm.game.enemies.spawn({t}, {pt[0]}, {pt[1]}) }}")

    def dummy_dps(t, pt, seconds=2.5):
        """DPS a tower lands on one parked, effectively immortal enemy of type t.

        Two traps this avoids, both of which previously made the soft-armor
        check measure nothing at all:
          1. Spawning and THEN raising hp leaves a window in which a 4 hp
             swarmer is already dead — the hp write then lands in an unused
             pool slot and the reader sees a number no tower ever dealt.
             Spawn and inflate in ONE evaluate.
          2. Test enemies drive off along the flow field, so pin the dummy.
        Returns dps, or None if the dummy did not survive (a real failure).
        """
        # Towers hold a fixed lane now — point it at the dummy first.
        aim_last_at(page, pt[0], pt[1])
        page.evaluate(
            f"""() => {{ const e = window.__swarm.game.enemies;
                e.n = 0; e.spawn({t}, {pt[0]}, {pt[1]});
                e.hp[0] = 4000; e.maxHp[0] = 4000;
                window.__pin = setInterval(() => {{ if (e.n) {{
                  e.x[0] = {pt[0]}; e.y[0] = {pt[1]}; e.vel[0] = 0; }} }}, 8); }}"""
        )
        time.sleep(0.4)
        h0 = page.evaluate("() => window.__swarm.game.enemies.hp[0]")
        time.sleep(seconds)
        st = page.evaluate(
            "() => { const e = window.__swarm.game.enemies;"
            "  return { n: e.n, hp: e.n > 0 ? e.hp[0] : null }; }"
        )
        page.evaluate("() => clearInterval(window.__pin)")
        if st["n"] == 0:
            return None
        return (h0 - st["hp"]) / seconds

    def towers():
        return page.evaluate("() => window.__swarm.game.towers.map(t => t.kind)")

    def kills():
        return page.evaluate("() => window.__swarm.game.kills")

    def sustain(t, pt, count, seconds, spread=14):
        """Keep `count` enemies parked at pt for `seconds`.

        Test enemies drive off along the flow field, so a single spawn can
        leave a slow tower (railgun/rocket cycle 5s) with nothing in range —
        that made kill-count checks flaky. Topping up keeps a stable target.
        """
        aim_last_at(page, pt[0], pt[1])
        steps = max(1, int(seconds * 2))
        for _ in range(steps):
            page.evaluate(
                f"""() => {{ const g = window.__swarm.game, e = g.enemies;
                    let live = 0;
                    for (let i = 0; i < e.n; i++) {{
                      const dx = e.x[i] - {pt[0]}, dy = e.y[i] - {pt[1]};
                      if (dx*dx + dy*dy < 160*160) live++;
                    }}
                    for (let k = live; k < {count}; k++) {{
                      e.spawn({t}, {pt[0]} + (Math.random()-.5)*{spread},
                                   {pt[1]} + (Math.random()-.5)*{spread});
                    }} }}"""
            )
            time.sleep(0.5)

    results = {}

    # --- A: autocannon vs armor + swarmers
    # Soft armor (2026-08-16): a light weapon must be REDUCED against a heavy
    # unit but never zeroed — no invisible hard counters.
    rim = place("1", (250, 250))
    assert "autocannon" in towers(), "autocannon placement failed"
    clear_enemies()
    tgt = open_near_rim(page, rim, 30, 85)
    armored_dps = dummy_dps(2, tgt)   # hauler: armor 9 vs autocannon hit 8
    bare_dps = dummy_dps(0, tgt)      # swarmer: no armor
    ratio = (armored_dps / bare_dps) if (armored_dps and bare_dps) else None
    print(f"    autocannon dps: bare {bare_dps} vs armored {armored_dps}"
          f" -> ratio {ratio if ratio is None else round(ratio, 3)} (ARMOR_FLOOR 0.25)")
    # Assert the FLOOR itself, not merely "less than bare". The old check
    # compared against a fabricated baseline and would have passed even if the
    # floor were 0.05 — i.e. it could not see the failure it existed to catch.
    results["soft_armor_floors_at_quarter"] = (
        ratio is not None and abs(ratio - 0.25) < 0.04
    )
    clear_enemies()
    k0 = kills()
    sustain(0, tgt, 5, 3.5)
    results["autocannon_kills_mites"] = kills() - k0 >= 3

    # --- B: flamethrower burn ignores threshold
    clear_enemies()
    rim = place("2", (250, 650))
    assert "flame" in towers(), "flame placement failed"
    tgt = open_near_rim(page, rim, 22, 52)
    aim_last_at(page, tgt[0], tgt[1])
    spawn(2, tgt)  # hauler, hp 120
    time.sleep(2.5)
    s = page.evaluate("() => ({hp: window.__swarm.game.enemies.hp[0], burn: window.__swarm.game.enemies.burn[0]})")
    results["flame_burn_ignores_threshold"] = s["hp"] < 120 and s["burn"] > 0

    # --- C: tesla chains
    clear_enemies()
    rim = place("5", (650, 650))
    assert "tesla" in towers(), "tesla placement failed"
    tgt = open_near_rim(page, rim, 30, 100)
    k0 = kills()
    sustain(0, tgt, 5, 3.5, spread=26)
    results["tesla_chain_kills"] = kills() - k0 >= 3

    # --- D: railgun pierce
    clear_enemies()
    rim = place("8", (1050, 700))
    assert "railgun" in towers(), "railgun placement failed"
    tgt = open_near_rim(page, rim, 60, 190)
    k0 = kills()
    sustain(0, tgt, 6, 12, spread=18)  # 5s cycle: needs a long stable window
    results["railgun_pierce_kills"] = kills() - k0 >= 3

    # --- E: mortar band + min range + in-air shell
    clear_enemies()
    rim = place("3", (650, 150))
    assert "mortar" in towers(), "mortar placement failed"
    # Fixed aim changed what a minimum range MEANS: you can no longer
    # designate a point inside the dead zone (the aim clamps outward), rather
    # than the tower refusing to fire at something standing close. The
    # observable rule is that no shell may ever land inside the dead zone.
    close = open_near_rim(page, rim, 20, 66)
    aim_last_at(page, close[0], close[1])
    spawn(7, close)  # titan, inside min range 80
    time.sleep(1.5)
    lands = page.evaluate(
        """() => { const g = window.__swarm.game;
             const t = g.towers.find(t => t.kind === 'mortar');
             return g.impacts.map(im => Math.round(Math.hypot(im.x - t.x, im.y - t.y))); }"""
    )
    print(f"    mortar shell distances: {lands} (min range 80)")
    results["mortar_never_lands_inside_min_range"] = all(d >= 75 for d in lands)
    clear_enemies()
    band = open_near_rim(page, rim, 110, 250)
    aim_last_at(page, band[0], band[1])
    spawn(7, band)  # titan
    # 0.5 shots/s means the cycle can be mid-flight when we arrive; poll for a
    # shell rather than assuming one is queued inside a fixed window.
    hp0 = page.evaluate("() => window.__swarm.game.enemies.hp[0]")
    imp = 0
    for _ in range(30):
        imp = page.evaluate("() => window.__swarm.game.impacts.length")
        if imp >= 1:
            break
        time.sleep(0.15)
    print(f"    mortar shells in flight: {imp}")
    time.sleep(2.0)
    hp1 = page.evaluate("() => window.__swarm.game.enemies.n > 0 ? window.__swarm.game.enemies.hp[0] : -1")
    results["mortar_fires_and_impacts"] = imp >= 1 and (hp1 == -1 or hp1 < hp0)

    # --- F: gatling heat ramp (brutes tank the early low-Hit shots)
    clear_enemies()
    rim = place("6", (1050, 150))
    assert "gatling" in towers(), "gatling placement failed"
    tgt = open_near_rim(page, rim, 35, 105)
    aim_last_at(page, tgt[0], tgt[1])
    for i in range(3):
        spawn(2, [tgt[0] + (i % 2) * 14, tgt[1] + (i // 2) * 14])
    # The lane is only ~26px wide now, and these are cars — left alone they
    # drive out of it and the ramp correctly bleeds back to zero. Pin them.
    page.evaluate(
        f"""() => {{ const e = window.__swarm.game.enemies;
             const xs = [], ys = [];
             for (let i = 0; i < e.n; i++) {{ xs.push(e.x[i]); ys.push(e.y[i]); }}
             window.__pin = setInterval(() => {{
               for (let i = 0; i < Math.min(e.n, xs.length); i++) {{
                 e.x[i] = xs[i]; e.y[i] = ys[i]; e.vel[i] = 0; }} }}, 8); }}"""
    )
    time.sleep(3)
    heat = page.evaluate("() => { const t = window.__swarm.game.towers.find(t => t.kind === 'gatling'); return t ? t.heat : -1; }")
    page.evaluate("() => clearInterval(window.__pin)")
    print(f"    gatling heat after 3s in lane: {heat}")
    results["gatling_heat_ramps"] = heat > 0.4

    # --- G: lattice lock + ramp vs titan
    clear_enemies()
    rim = place("9", (1400, 400))
    assert "lattice" in towers(), "lattice placement failed"
    tgt = open_near_rim(page, rim, 50, 150)
    aim_last_at(page, tgt[0], tgt[1])  # lane weapons must be pointed at it
    spawn(7, tgt)  # titan, hp 1800
    # Pin it: a titan drifts out of the 26px lane inside the measuring window
    # and the beam correctly stops ramping.
    page.evaluate(
        f"""() => {{ const e = window.__swarm.game.enemies;
             window.__lp = setInterval(() => {{ if (e.n) {{
               e.x[0] = {tgt[0]}; e.y[0] = {tgt[1]}; e.vel[0] = 0;
               e.vx[0] = 0; e.vy[0] = 0; }} }}, 8); }}"""
    )
    time.sleep(2.5)
    s = page.evaluate("""() => { const t = window.__swarm.game.towers.find(t => t.kind === 'lattice');
             return { lockT: t ? t.lockT : -1, hp: window.__swarm.game.enemies.n > 0 ? window.__swarm.game.enemies.hp[0] : -1 }; }""")
    page.evaluate("() => clearInterval(window.__lp)")
    print(f"    lattice lockT {s['lockT']:.2f}, titan hp {s['hp']:.0f}")
    results["lattice_locks_and_damages_titan"] = s["lockT"] > 1 and (s["hp"] == -1 or s["hp"] < 1800)

    # --- H: cryo applies Frozen
    clear_enemies()
    rim = place("4", (420, 430))
    assert "cryo" in towers(), "cryo placement failed"
    tgt = open_near_rim(page, rim, 30, 85)
    aim_last_at(page, tgt[0], tgt[1])
    spawn(2, tgt)
    time.sleep(1.8)
    slow = page.evaluate("() => window.__swarm.game.enemies.slow[0]")
    results["cryo_applies_frozen"] = slow > 0

    # --- I: rocket salvo prioritizes big targets
    clear_enemies()
    rim = place("7", (1400, 850))
    assert "rocket" in towers(), "rocket placement failed"
    tgt = open_near_rim(page, rim, 50, 170)
    k0 = kills()
    sustain(0, tgt, 5, 12, spread=20)  # 5s cycle: needs a long stable window
    results["rocket_salvo_kills"] = kills() - k0 >= 2

    # --- J: mine triggers on contact
    clear_enemies()
    mine_spot = snap_open(page, 820, 480)
    page.keyboard.press("Escape")
    page.keyboard.press("0")
    click_at(mine_spot)
    page.keyboard.press("Escape")
    assert "mine" in towers(), "mine placement failed"
    ch0 = page.evaluate("() => { const t = window.__swarm.game.towers.find(t => t.kind === 'mine'); return t.charges; }")
    spawn(0, [mine_spot[0] + 18, mine_spot[1]])
    time.sleep(1.5)
    ch1 = page.evaluate("() => { const t = window.__swarm.game.towers.find(t => t.kind === 'mine'); return t.charges; }")
    results["mine_triggers_and_spends_charge"] = ch0 == 6 and ch1 < ch0

    print("towers placed:", towers())
    fails = [k for k, v in results.items() if not v]
    for k, v in results.items():
        print(("PASS " if v else "FAIL ") + k)
    print("PAGE ERRORS:", errors[:10] if errors else "none")
    browser.close()
    assert not fails, f"failed: {fails}"
    print("ALL ROSTER CHECKS PASSED")
