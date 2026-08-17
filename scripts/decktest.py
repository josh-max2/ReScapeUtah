"""Deck system end-to-end: opening hand, drag-mod onto tower, click-instant, drop-strike."""
import time
from playwright.sync_api import sync_playwright

OUT = r"C:\Users\joshs\AppData\Local\Temp\claude\C--Users-joshs-Desktop-game\3d8718ef-5b59-4303-9562-1717e7c223c2\scratchpad"
W, H = 1800, 1020

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 860})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    page.goto("http://localhost:5173", wait_until="networkidle")
    page.evaluate("() => localStorage.clear()")
    page.reload(wait_until="networkidle")
    time.sleep(0.5)
    # front end is menu -> hangar -> run; PLAY only shows on a fresh load
    if page.is_visible("button[data-view='hangar']"):
        page.click("button[data-view='hangar']")
    page.click("button[data-launch]")
    time.sleep(0.4)
    opening = page.evaluate("() => ({hand: window.__swarm.game.hand, deck: window.__swarm.game.deck.length})")
    print("opening:", opening)
    if not page.evaluate("() => window.__swarm.cardsEnabled"):
        print("SKIP: deck layer is disabled (CARDS_ENABLED=false in defs.ts)")
        browser.close()
        raise SystemExit(0)

    # Deterministic hand for the mechanics test
    page.evaluate("() => { const g = window.__swarm.game; g.hand = ['barrels','scrap','artillery']; g.gold = 500; }")
    time.sleep(0.3)

    box = page.evaluate(
        """() => { const r = document.querySelector('canvas').getBoundingClientRect();
                   return { x: r.x, y: r.y, w: r.width, h: r.height }; }"""
    )

    def to_screen(gx, gy):
        return (box["x"] + box["w"] * gx / W, box["y"] + box["h"] * gy / H)

    # place a gun overlooking the first straight
    page.keyboard.press("1")
    page.keyboard.press("1")
    gx, gy = to_screen(300, 170)
    page.mouse.click(gx, gy)
    page.keyboard.press("Escape")
    time.sleep(0.2)

    # drag Heavy Barrels onto the gun
    cb = page.query_selector('.card[data-idx="0"]').bounding_box()
    page.mouse.move(cb["x"] + cb["width"] / 2, cb["y"] + cb["height"] / 2)
    page.mouse.down()
    tx, ty = to_screen(300, 170)
    page.mouse.move(tx, ty, steps=12)
    page.mouse.up()
    time.sleep(0.3)
    s1 = page.evaluate("() => ({gunDmg: window.__swarm.game.typeMods.autocannon.dmg, hand: window.__swarm.game.hand})")
    print("after mod drag:", s1)

    # click Scrap Market (instant)
    gold_before = page.evaluate("() => window.__swarm.game.gold")
    card = page.query_selector('.card[data-idx="0"]')  # scrap now at 0
    bb = card.bounding_box()
    page.mouse.click(bb["x"] + bb["width"] / 2, bb["y"] + bb["height"] / 2)
    time.sleep(0.3)
    s2 = page.evaluate("() => ({gold: window.__swarm.game.gold, hand: window.__swarm.game.hand})")
    print(f"after instant (gold {gold_before} ->):", s2)

    # start the wave, then drop Artillery on the spawn mouth
    page.keyboard.press(" ")
    page.evaluate("() => { window.__swarm.game.speed = 2; }")
    time.sleep(4)
    cb2 = page.query_selector('.card[data-idx="0"]').bounding_box()
    page.mouse.move(cb2["x"] + cb2["width"] / 2, cb2["y"] + cb2["height"] / 2)
    page.mouse.down()
    ax, ay = to_screen(220, 110)
    page.mouse.move(ax, ay, steps=12)
    page.mouse.up()
    time.sleep(1.5)
    s3 = page.evaluate("() => ({hand: window.__swarm.game.hand, kills: window.__swarm.game.kills})")
    print("after strike drop:", s3)
    page.screenshot(path=f"{OUT}\\deck_test.png")
    browser.close()
    print("PAGE ERRORS:", errors[:10] if errors else "none")
