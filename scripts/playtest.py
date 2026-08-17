"""Real-user-flow playtest: fresh save -> launch run -> place guns -> fight waves 1-2."""
import time
from playwright.sync_api import sync_playwright

OUT = r"C:\Users\joshs\AppData\Local\Temp\claude\C--Users-joshs-Desktop-game\3d8718ef-5b59-4303-9562-1717e7c223c2\scratchpad"
BASE = "http://localhost:5173"

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 860})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    page.goto(BASE, wait_until="networkidle")
    page.evaluate("() => localStorage.clear()")
    page.reload(wait_until="networkidle")
    time.sleep(0.5)

    # front end is menu -> hangar -> run; PLAY only shows on a fresh load
    if page.is_visible("button[data-view='hangar']"):
        page.click("button[data-view='hangar']")
    page.click("button[data-launch]")
    time.sleep(0.3)
    # gun is auto-selected on launch; pressing '1' here would toggle it OFF

    box = page.evaluate(
        """() => { const c = document.querySelector('canvas');
                   const r = c.getBoundingClientRect();
                   return { x: r.x, y: r.y, w: r.width, h: r.height }; }"""
    )
    # Place autocannons on obstacles near the spawn funnel (sketch map blobs)
    spots = [(0.208, 0.235), (0.167, 0.147), (0.228, 0.524), (0.078, 0.118),
             (0.278, 0.382), (0.325, 0.417)]
    for fx, fy in spots:
        page.mouse.click(box["x"] + box["w"] * fx, box["y"] + box["h"] * fy)
        time.sleep(0.15)

    stats = page.evaluate("() => ({gold: window.__swarm.game.gold, towers: window.__swarm.game.towers.length})")
    print("after placement:", stats)

    # Speed up and fight until the run leaves wave phase twice (waves 1 and 2)
    page.click("text=4×") if False else None
    page.keyboard.press(" ")  # start wave 1
    for _ in range(2):
        page.evaluate("() => { window.__swarm.game.speed = 4; }")
        for _ in range(60):
            time.sleep(1)
            s = page.evaluate(
                """() => { const g = window.__swarm.game;
                  return { phase: g.phase, wave: g.wave, enemies: g.enemies.n,
                           baseHp: Math.round(g.baseHp), gold: Math.floor(g.gold),
                           cores: Math.floor(g.runCores), towers: g.towers.length }; }"""
            )
            if s["phase"] != "wave":
                break
        print("wave result:", s)
        if s["phase"] == "build":
            # the post-wave perk draft blocks Start Wave — pick the first card
            if page.query_selector(".perkcard"):
                page.click(".perkcard")
                time.sleep(0.3)
            # buy 2 more guns with earnings, then next wave (gun still selected)
            for fx, fy in [(0.45, 0.45), (0.45, 0.6)]:
                page.mouse.click(box["x"] + box["w"] * fx, box["y"] + box["h"] * fy)
                time.sleep(0.15)
            page.keyboard.press(" ")
        else:
            break

    page.screenshot(path=f"{OUT}\\playtest_end.png")
    final = page.evaluate("() => JSON.parse(localStorage.getItem('swarm-td-save') || 'null')")
    print("save after run (null until run ends):", final)
    browser.close()
    print("PAGE ERRORS:", errors[:10] if errors else "none")
