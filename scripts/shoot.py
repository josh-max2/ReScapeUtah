"""Screenshot the SWARM dev build: meta screen + demo-mode firefight."""
import sys
import time
from playwright.sync_api import sync_playwright

OUT = r"C:\Users\joshs\AppData\Local\Temp\claude\C--Users-joshs-Desktop-game\3d8718ef-5b59-4303-9562-1717e7c223c2\scratchpad"
BASE = "http://localhost:5173"

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 860})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

    # 1. Meta screen (fresh load)
    page.goto(BASE, wait_until="networkidle")
    time.sleep(1.0)
    page.screenshot(path=f"{OUT}\\1_meta.png")

    # 2. Demo mode: auto-run wave 5 with prebuilt guns
    page.goto(BASE + "/?demo=1", wait_until="networkidle")
    time.sleep(4.0)
    page.screenshot(path=f"{OUT}\\2_demo_early.png")
    time.sleep(6.0)
    page.screenshot(path=f"{OUT}\\3_demo_mid.png")

    # enemy count probe
    n = page.evaluate("() => document.querySelectorAll('canvas').length")
    print(f"canvases: {n}")
    time.sleep(8.0)
    page.screenshot(path=f"{OUT}\\4_demo_late.png")

    browser.close()
    if errors:
        print("PAGE ERRORS:")
        for e in errors[:20]:
            print(" -", e)
        sys.exit(1)
    print("OK, no page errors")
