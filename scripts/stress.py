"""Stress + density check: wave 15 flood, enemy counts, and frame rate."""
import time
from playwright.sync_api import sync_playwright

OUT = r"C:\Users\joshs\AppData\Local\Temp\claude\C--Users-joshs-Desktop-game\3d8718ef-5b59-4303-9562-1717e7c223c2\scratchpad"
BASE = "http://localhost:5173"

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 860})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    page.goto(BASE + "/?demo=15", wait_until="networkidle")
    for label, wait in [("t4", 4), ("t10", 6), ("t16", 6)]:
        time.sleep(wait)
        stats = page.evaluate(
            """() => {
              const g = window.__swarm.game;
              return { enemies: g.enemies.n, towers: g.towers.length,
                       baseHp: Math.round(g.baseHp), phase: g.phase, wave: g.wave };
            }"""
        )
        print(label, stats)
        page.screenshot(path=f"{OUT}\\stress_{label}.png")

    fps = page.evaluate(
        """() => new Promise((res) => {
          let frames = 0;
          const t0 = performance.now();
          function cb() {
            frames++;
            if (performance.now() - t0 < 3000) requestAnimationFrame(cb);
            else res((frames / (performance.now() - t0)) * 1000);
          }
          requestAnimationFrame(cb);
        })"""
    )
    print(f"fps over 3s: {fps:.1f}")
    browser.close()
    if errors:
        print("PAGE ERRORS:", errors[:10])
    else:
        print("OK, no page errors")
