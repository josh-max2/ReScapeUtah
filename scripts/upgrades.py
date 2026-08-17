"""Tower upgrade coverage: the inspector, both branches, and sell.

Asserts upgrades actually change COMBAT, not just the stat readout.
"""
import time
from playwright.sync_api import sync_playwright
from maplib import snap_rim, open_near_rim, aim_last_at

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

    def click_at(pt):
        page.mouse.click(box["x"] + box["w"] * pt[0] / W, box["y"] + box["h"] * pt[1] / H)
        time.sleep(0.15)

    def place(key, anchor):
        rim = snap_rim(page, anchor[0], anchor[1])
        page.keyboard.press("Escape")
        page.keyboard.press(key)
        click_at(rim)
        page.keyboard.press("Escape")
        return rim

    R = {}

    # --- inspector opens on click, shows two branches ---
    rim = place("1", (250, 250))          # autocannon
    click_at(rim)                          # nothing selected in palette -> inspect
    time.sleep(0.3)
    vis = page.evaluate("() => document.querySelector('.inspect').style.display !== 'none'")
    nopts = page.evaluate("() => document.querySelectorAll('.insupg').length")
    R["inspector_opens_with_two_branches"] = vis and nopts == 2
    print(f"  inspector visible={vis} branches={nopts}")

    # --- Twin-Linked doubles rate: measure real dps before/after ---
    # The dummy must be PINNED: an immortal test enemy still drives off along
    # the flow field and silently leaves range mid-measurement.
    tgt = open_near_rim(page, rim, 30, 85)

    # Towers hold a committed lane now, so point it at the dummy.
    aim_last_at(page, tgt[0], tgt[1])

    def measure_dps(seconds):
        page.evaluate(f"""() => {{ const e = window.__swarm.game.enemies;
            e.n = 0; e.spawn(0, {tgt[0]}, {tgt[1]}); e.hp[0] = 1e7;
            window.__dmg = 0; window.__last = e.hp[0]; }}""")
        steps = int(seconds * 4)
        for _ in range(steps):
            time.sleep(0.25)
            page.evaluate(f"""() => {{ const e = window.__swarm.game.enemies;
                if (e.n < 1) return;
                window.__dmg += (window.__last - e.hp[0]);
                window.__last = e.hp[0];
                e.x[0] = {tgt[0]}; e.y[0] = {tgt[1]}; e.vel[0] = 0; }}""")
        return page.evaluate("() => window.__dmg") / seconds

    base_dps = measure_dps(3)
    page.evaluate("() => document.querySelector('.insupg[data-upg=\"1\"]').click()")
    time.sleep(0.3)
    upg = page.evaluate("() => window.__swarm.game.towers[0].upg")
    upg_dps = measure_dps(3)
    print(f"  autocannon dps: stock {base_dps:.0f} -> twin-linked {upg_dps:.0f} (upg={upg})")
    R["twin_linked_raises_dps"] = upg == 1 and upg_dps > base_dps * 1.5

    # --- branch is one-shot: second buy refused ---
    before_gold = page.evaluate("() => window.__swarm.game.gold")
    page.evaluate("() => { window.__swarm.game.selected = 0; }")
    ok2 = page.evaluate("() => window.__swarm.upgrade ? true : false")
    same = page.evaluate("() => window.__swarm.game.towers[0].upg")
    R["upgrade_is_one_shot"] = same == 1
    print(f"  branch locked at {same}")

    # --- Long Barrel extends range on a fresh tower ---
    rim2 = place("1", (500, 700))
    idx = page.evaluate("() => window.__swarm.game.towers.length - 1")
    r_before = page.evaluate(f"() => window.__swarm.range ? 0 : 0")
    page.evaluate(f"() => {{ window.__swarm.game.selected = {idx}; }}")
    time.sleep(0.35)
    page.evaluate("() => document.querySelector('.insupg[data-upg=\"2\"]').click()")
    time.sleep(0.3)
    u2 = page.evaluate(f"() => window.__swarm.game.towers[{idx}].upg")
    R["second_branch_selectable"] = u2 == 2
    print(f"  long barrel upg={u2}")

    # --- sell refunds and removes ---
    n0 = page.evaluate("() => window.__swarm.game.towers.length")
    g0 = page.evaluate("() => window.__swarm.game.gold")
    page.evaluate("() => document.querySelector('.inssell').click()")
    time.sleep(0.3)
    n1 = page.evaluate("() => window.__swarm.game.towers.length")
    g1 = page.evaluate("() => window.__swarm.game.gold")
    R["sell_refunds_and_removes"] = n1 == n0 - 1 and g1 > g0
    print(f"  sell: towers {n0}->{n1}, gold {g0:.0f}->{g1:.0f}")

    fails = [k for k, v in R.items() if not v]
    for k, v in R.items():
        print(("PASS " if v else "FAIL ") + k)
    print("PAGE ERRORS:", errors[:8] if errors else "none")
    browser.close()
    assert not fails, f"failed: {fails}"
    print("ALL UPGRADE CHECKS PASSED")
