"""Fixed-angle aiming: place -> aim -> commit, and the click-to-sell flow.

Towers no longer choose targets. The player commits a lane (or a ground area)
at placement time and the tower holds it forever, so these checks cover the
placement state machine and prove a committed lane actually gates damage.
"""
import time
from playwright.sync_api import sync_playwright
from maplib import snap_rim, open_near_rim

W, H = 1800, 1020
R = {}

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={"width": 1440, "height": 860})
    errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.goto("http://localhost:5173", wait_until="networkidle")
    page.evaluate("() => localStorage.clear()")
    page.reload(wait_until="networkidle")
    time.sleep(0.8)
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

    def click(pt):
        page.mouse.click(box["x"] + box["w"] * pt[0] / W, box["y"] + box["h"] * pt[1] / H)
        time.sleep(0.12)

    def move(pt):
        page.mouse.move(box["x"] + box["w"] * pt[0] / W, box["y"] + box["h"] * pt[1] / H)
        time.sleep(0.08)

    def state():
        return page.evaluate(
            """() => { const g = window.__swarm.game;
                 const t = g.towers[g.towers.length - 1];
                 return { n: g.towers.length, gold: Math.round(g.gold),
                          armed: t ? t.armed : null,
                          aimDeg: t ? Math.round(t.aim * 180 / Math.PI) : null }; }"""
        )

    rim = snap_rim(page, 250, 250)

    # ---- 1. placing enters aiming, not a finished tower ----
    page.keyboard.press("Escape")
    page.keyboard.press("1")
    click(rim)
    mid = state()
    print("after placing:", mid)
    R["placing_enters_aim_mode"] = mid["armed"] is False

    # ---- 2. moving the mouse swings the lane ----
    move([rim[0] + 200, rim[1]])
    a1 = state()["aimDeg"]
    move([rim[0], rim[1] + 200])
    a2 = state()["aimDeg"]
    print("aim swung:", a1, "->", a2)
    R["mouse_swings_the_lane"] = a1 != a2

    # ---- 3. the second click commits, and must NOT open the inspector ----
    click([rim[0] + 200, rim[1]])
    done = state()
    inspector = page.evaluate(
        "() => { const el = document.querySelector('.inspect');"
        "  return !!el && el.style.display !== 'none'; }"
    )
    print("after commit:", done, "inspector open:", inspector)
    R["second_click_commits"] = done["armed"] is True
    R["commit_does_not_open_inspector"] = not inspector

    # ---- 4. a committed lane gates damage ----
    # Same dummy, same tower: in the lane it takes damage, off the lane it does not.
    tgt = open_near_rim(page, rim, 30, 85)

    def dmg_over(seconds=2.0):
        page.evaluate(
            f"""() => {{ const e = window.__swarm.game.enemies;
                 e.n = 0; e.spawn(0, {tgt[0]}, {tgt[1]});
                 e.hp[0] = 5000; e.maxHp[0] = 5000;
                 window.__p = setInterval(() => {{ if (e.n) {{
                   e.x[0] = {tgt[0]}; e.y[0] = {tgt[1]}; e.vel[0] = 0; }} }}, 8); }}"""
        )
        time.sleep(0.3)
        h0 = page.evaluate("() => window.__swarm.game.enemies.hp[0]")
        time.sleep(seconds)
        h1 = page.evaluate("() => window.__swarm.game.enemies.n ? window.__swarm.game.enemies.hp[0] : 0")
        page.evaluate("() => clearInterval(window.__p)")
        return h0 - h1

    page.evaluate(
        f"""() => {{ const g = window.__swarm.game, t = g.towers[g.towers.length - 1];
             t.aim = Math.atan2({tgt[1]} - t.y, {tgt[0]} - t.x); t.armed = true; }}"""
    )
    on_lane = dmg_over()
    page.evaluate(
        """() => { const g = window.__swarm.game, t = g.towers[g.towers.length - 1];
             t.aim += Math.PI; }"""     # spin the lane 180 degrees away
    )
    off_lane = dmg_over()
    print(f"damage in lane {on_lane:.0f} vs facing away {off_lane:.0f}")
    R["lane_gates_damage"] = on_lane > 10 and off_lane == 0

    # ---- 5. right-click during aim cancels and refunds in full ----
    before = page.evaluate("() => Math.round(window.__swarm.game.gold)")
    rim2 = snap_rim(page, 250, 650)
    page.keyboard.press("Escape")
    page.keyboard.press("1")
    click(rim2)
    page.mouse.click(box["x"] + box["w"] * rim2[0] / W,
                     box["y"] + box["h"] * rim2[1] / H, button="right")
    time.sleep(0.2)
    after = page.evaluate(
        """() => ({ gold: Math.round(window.__swarm.game.gold),
                    n: window.__swarm.game.towers.length })"""
    )
    print("cancel refund:", before, "->", after)
    R["cancel_refunds_in_full"] = after["gold"] == before

    # ---- 6. click a finished tower with nothing selected -> sell ----
    page.keyboard.press("Escape")
    n0 = page.evaluate("() => window.__swarm.game.towers.length")
    g0 = page.evaluate("() => Math.round(window.__swarm.game.gold)")
    click(rim)
    time.sleep(0.2)
    opened = page.evaluate(
        "() => { const el = document.querySelector('.inspect');"
        "  return !!el && el.style.display !== 'none'; }"
    )
    sold = page.evaluate(
        "() => { const b = document.querySelector('.inssell'); if (!b) return false;"
        "  b.click(); return true; }"
    )
    time.sleep(0.25)
    n1 = page.evaluate("() => window.__swarm.game.towers.length")
    g1 = page.evaluate("() => Math.round(window.__swarm.game.gold)")
    print(f"sell: inspector={opened} towers {n0}->{n1} gold {g0}->{g1}")
    R["click_tower_opens_inspector"] = opened
    R["sell_removes_and_refunds"] = sold and n1 == n0 - 1 and g1 > g0

    for k, v in R.items():
        print(("PASS " if v else "FAIL ") + k)
    print("PAGE ERRORS:", errs[:6] if errs else "none")
    b.close()
    if not all(R.values()) or errs:
        raise SystemExit(1)
    print("ALL AIMING CHECKS PASSED")
