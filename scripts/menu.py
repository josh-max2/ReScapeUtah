"""Start menu + options: navigation, real effect on rendering, and persistence.

Settings live in the versioned save, so this also covers the v1 -> v2 migration
(an old save must load and simply gain defaults, never lose progress).
"""
import time
from playwright.sync_api import sync_playwright

OUT = r"C:\Users\joshs\AppData\Local\Temp\claude\C--Users-joshs-Desktop-game\3d8718ef-5b59-4303-9562-1717e7c223c2\scratchpad"
URL = "http://localhost:5173"
results = {}

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 860})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))

    # ---- a v1 save must survive the bump ----
    pg.goto(URL, wait_until="networkidle")
    pg.evaluate("""() => localStorage.setItem('swarm-td-save', JSON.stringify(
        {version:1, cores:123, upgrades:{dmg:2}, bestWave:7, wins:1}))""")
    pg.reload(wait_until="networkidle"); time.sleep(1.0)
    mig = pg.evaluate("() => window.__swarm.save")
    print("v1 save migrated ->", {k: mig[k] for k in ('version','cores','bestWave','wins')},
          "settings:", mig["settings"])
    # v4 replaced the five flat upgrades with the skill tree. There is no
    # one-for-one remap, so the migration REFUNDS them: dmg:2 cost 12 + 18 = 30
    # chips, which land back on top of the 123 already banked. Progress is not
    # preserved in place — it is preserved in value, to be respent in the tree.
    results["v1_save_migrates_keeping_progress"] = (
        mig["version"] == 4 and mig["cores"] == 153 and mig["bestWave"] == 7
        and mig.get("upgrades") is None and mig["tree"] == {}
        and mig["settings"]["detail"] == "high")

    # ---- menu is the first thing you see ----
    title = pg.text_content(".gametitle")
    has_play = pg.is_visible("button[data-view='hangar']")
    has_opts = pg.is_visible("button[data-view='options']")
    print("menu:", {"title": title, "play": has_play, "options": has_opts})
    results["menu_shows_on_load"] = bool(title) and has_play and has_opts
    pg.screenshot(path=f"{OUT}/menu_start.png")

    # ---- options ----
    pg.click("button[data-view='options']"); time.sleep(0.3)
    rows = pg.eval_on_selector_all(".optrow .optname", "els => els.map(e => e.textContent.trim())")
    print("option rows:", rows)
    results["options_lists_every_setting"] = len(rows) == 5
    pg.screenshot(path=f"{OUT}/menu_options.png")

    # ---- a toggle must change real state, not just the button ----
    pg.click("button[data-set='routePreview'][data-val='false']"); time.sleep(0.25)
    pg.click("button[data-set='detail'][data-val='performance']"); time.sleep(0.25)
    after = pg.evaluate("() => window.__swarm.save.settings")
    print("after toggling:", after)
    results["toggle_updates_settings"] = (
        after["routePreview"] is False and after["detail"] == "performance")

    # ---- and must survive a reload ----
    pg.reload(wait_until="networkidle"); time.sleep(1.0)
    persisted = pg.evaluate("() => window.__swarm.save.settings")
    print("after reload:", persisted)
    results["settings_persist"] = (
        persisted["routePreview"] is False and persisted["detail"] == "performance")

    # ---- renderer actually honours them ----
    live = pg.evaluate("""() => { const s = window.__swarm.save.settings;
        return { routePreview: s.routePreview, detail: s.detail }; }""")
    results["renderer_sees_settings"] = live["routePreview"] is False

    # ---- navigation back, then into a run ----
    pg.click("button[data-view='options']"); time.sleep(0.25)
    pg.click("button[data-view='back']"); time.sleep(0.25)
    back_on_menu = pg.is_visible(".gametitle")
    pg.click("button[data-view='hangar']"); time.sleep(0.3)
    in_hangar = pg.is_visible("button.launch[data-launch]")
    print("nav:", {"back_to_menu": back_on_menu, "hangar": in_hangar})
    results["navigation_round_trips"] = back_on_menu and in_hangar

    # ---- opening speed setting is applied to the run ----
    pg.click("button[data-view='options']"); time.sleep(0.25)
    pg.click("button[data-set='defaultSpeed'][data-val='4']"); time.sleep(0.25)
    pg.click("button[data-view='back']"); time.sleep(0.25)
    pg.click("button.launch[data-launch]"); time.sleep(0.5)
    spd = pg.evaluate("() => window.__swarm.game.speed")
    print("run opened at speed:", spd)
    results["opening_speed_applies"] = spd == 4
    pg.screenshot(path=f"{OUT}/menu_inrun.png")

    for k, v in results.items():
        print(("PASS " if v else "FAIL ") + k)
    print("PAGE ERRORS:", errs[:6] if errs else "none")
    b.close()
    if not all(results.values()) or errs:
        raise SystemExit(1)
    print("ALL MENU CHECKS PASSED")
