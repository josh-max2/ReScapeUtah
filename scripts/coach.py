"""First-run coaching: can someone who has never seen this place and aim a tower
by following only the prompts?

That is the actual bar from the plan. The aiming flow (click, move, click) is
the core strategic mechanic and it is invisible — no turret swings around to
suggest it exists — so this walks the exact five steps a new player would and
asserts each one advances on the ACTION, not on a timer.

    python coach.py
"""
import sys
import time
from playwright.sync_api import sync_playwright
from maplib import snap_rim, open_near_rim

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

W, H = 1800, 1020
OUT = ("C:/Users/joshs/AppData/Local/Temp/claude/C--Users-joshs-Desktop-game/"
       "3d8718ef-5b59-4303-9562-1717e7c223c2/scratchpad")
FAILS = []


def check(name, ok, detail=""):
    print(f"  [{'PASS' if ok else 'FAIL'}] {name}{(' — ' + str(detail)) if detail else ''}")
    if not ok:
        FAILS.append(name)


def step_now(page):
    return page.evaluate(
        """() => { const el = document.querySelector('.coach');
             if (!el || el.style.display === 'none') return null;
             return { step: el.querySelector('.cstep')?.textContent ?? '',
                      text: el.querySelector('.ctext')?.textContent ?? '' }; }"""
    )


with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1500, "height": 900},
                            device_scale_factor=2)
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto("http://localhost:5173", wait_until="networkidle")
    page.evaluate("() => localStorage.clear()")
    page.reload(wait_until="networkidle")
    time.sleep(0.9)
    page.click("button[data-view='hangar']")
    page.click("button[data-launch]")
    time.sleep(0.5)
    box = page.evaluate(
        """() => { const r = document.querySelector('canvas').getBoundingClientRect();
                   return { x: r.x, y: r.y, w: r.width, h: r.height }; }"""
    )

    s1 = step_now(page)
    check("coaching appears on a first run", s1 is not None and "1 OF" in (s1 or {}).get("step", ""), s1)

    # step 1 -> pick a weapon
    page.keyboard.press("1")
    time.sleep(0.3)
    s2 = step_now(page)
    check("selecting a weapon advances the coach", "2 OF" in (s2 or {}).get("step", ""), s2)

    # step 2 -> place it on a rim cell
    rim = snap_rim(page, 620, 430)
    page.mouse.click(box["x"] + box["w"] * rim[0] / W, box["y"] + box["h"] * rim[1] / H)
    time.sleep(0.35)
    s3 = step_now(page)
    check("placing advances to aiming", "3 OF" in (s3 or {}).get("step", ""), s3)
    page.screenshot(path=f"{OUT}/coach_aim.png")

    # step 3 -> swing the angle
    tgt = open_near_rim(page, rim, 60, 170)
    page.mouse.move(box["x"] + box["w"] * tgt[0] / W, box["y"] + box["h"] * tgt[1] / H)
    time.sleep(0.35)
    s4 = step_now(page)
    check("moving the mouse advances to commit", "4 OF" in (s4 or {}).get("step", ""), s4)

    # step 4 -> commit
    page.mouse.click(box["x"] + box["w"] * tgt[0] / W, box["y"] + box["h"] * tgt[1] / H)
    time.sleep(0.35)
    s5 = step_now(page)
    armed = page.evaluate("() => window.__swarm.game.towers.filter(t => t.armed).length")
    check("committing arms the tower and finishes the lesson",
          "5 OF" in (s5 or {}).get("step", "") and armed >= 1,
          {"step": s5, "armed": armed})

    # the final card retires itself, and the flag persists
    page.evaluate("() => { window.__swarm.game.speed = 10; }")
    for _ in range(60):
        if step_now(page) is None:
            break
        time.sleep(0.4)
    taught = page.evaluate("() => window.__swarm.save.taught")
    check("coaching retires itself and records that it ran",
          step_now(page) is None and taught is True, {"taught": taught})

    # ---- a returning player is not coached again ----
    page.reload(wait_until="networkidle")
    time.sleep(0.8)
    page.click("button[data-view='hangar']")
    page.click("button[data-launch]")
    time.sleep(0.6)
    check("a returning player sees no coaching", step_now(page) is None, step_now(page))

    # ---- SKIP works for someone who does not want it ----
    page.evaluate("() => localStorage.clear()")
    page.reload(wait_until="networkidle")
    time.sleep(0.8)
    page.click("button[data-view='hangar']")
    page.click("button[data-launch]")
    time.sleep(0.5)
    before = step_now(page)
    page.click(".coach [data-skip]")
    time.sleep(0.4)
    check("SKIP dismisses coaching and remembers",
          before is not None and step_now(page) is None
          and page.evaluate("() => window.__swarm.save.taught") is True)

    browser.close()

print()
if errors:
    print("PAGE ERRORS:")
    for e in errors[:10]:
        print(" -", e)
    sys.exit(1)
if FAILS:
    print("FAILED:", ", ".join(FAILS))
    sys.exit(1)
print("OK — a new player can place and aim by following the prompts alone")
