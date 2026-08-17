"""Tokens: the currency you can only earn by CLEARING a track.

One for a first clear, one more for a first clear at full fort health. They
price the capstones, which chips cannot buy at any price. The whole design
rests on the awards being ONCE per track per kind — without that, replaying the
easiest track mints tokens forever and the capstones are free.

    python tokens.py
"""
import sys
import time
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
FAILS = []


def check(name, ok, detail=""):
    print(f"  [{'PASS' if ok else 'FAIL'}] {name}{(' — ' + str(detail)) if detail else ''}")
    if not ok:
        FAILS.append(name)


# Drive the run to the far side of the final surge with the fort at `hp`.
CLEAR_RUN = """(hp) => {
  const g = window.__swarm.game;
  g.flowPaused = true;
  g.enemies.n = 0;
  g.baseHp = hp;
  // One tick short of the finish, then let the stage clock roll over it.
  g.runT = 20 * 24 - 0.05;
  g.wave = 20;
  g.flowPaused = false;
  return true;
}"""


def run_to_clear(page, hp, launch=True):
    if launch:
        page.click("button[data-launch]")
        time.sleep(0.5)
    page.evaluate(CLEAR_RUN, hp)
    for _ in range(60):
        st = page.evaluate(
            "() => { const g = window.__swarm.game;"
            "  return { cleared: g.cleared, perfect: g.clearPerfect,"
            "           got: g.clearTokens, wave: g.wave }; }"
        )
        if st["cleared"]:
            return st
        time.sleep(0.15)
    return st


def tokens(page):
    return page.evaluate("() => window.__swarm.save.tokens")


with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1400, "height": 820})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto("http://localhost:5173", wait_until="networkidle")
    page.evaluate("() => localStorage.clear()")
    page.reload(wait_until="networkidle")
    time.sleep(1.0)
    page.click("button[data-view='hangar']")

    # ---- 1. an imperfect clear pays exactly one ----
    st = run_to_clear(page, 200)
    check("surviving past the final surge clears the track", st["cleared"], st)
    check("an imperfect clear pays one token",
          st["got"] == 1 and tokens(page) == 1 and not st["perfect"],
          {"awarded": st["got"], "held": tokens(page), "perfect": st["perfect"]})

    # ---- 2. replaying the same track pays nothing ----
    page.evaluate("() => { window.__swarm.game.baseHp = 0; }")
    time.sleep(0.5)
    st2 = run_to_clear(page, 200)
    check("clearing the same track again pays nothing",
          st2["cleared"] and st2["got"] == 0 and tokens(page) == 1,
          {"awarded": st2["got"], "held": tokens(page)})

    # ---- 3. the first PERFECT clear pays the second token ----
    page.evaluate("() => { window.__swarm.game.baseHp = 0; }")
    time.sleep(0.5)
    st3 = run_to_clear(page, 999999)
    check("a first perfect clear pays the second token",
          st3["perfect"] and st3["got"] == 1 and tokens(page) == 2,
          {"awarded": st3["got"], "held": tokens(page), "perfect": st3["perfect"]})

    # and a second perfect pays nothing
    page.evaluate("() => { window.__swarm.game.baseHp = 0; }")
    time.sleep(0.5)
    st4 = run_to_clear(page, 999999)
    check("a second perfect clear pays nothing",
          st4["got"] == 0 and tokens(page) == 2,
          {"awarded": st4["got"], "held": tokens(page)})

    # ---- 4. a token node refuses at 1 and sells at 2 ----
    page.evaluate("() => { window.__swarm.game.baseHp = 0; }")
    time.sleep(0.6)
    page.evaluate("() => { const s = window.__swarm.save;"
                  "  s.tokens = 1; s.cores = 99999; window.__swarm.refreshMeta(); }")
    time.sleep(0.3)
    page.evaluate("() => document.querySelector('[data-node=\"piercing\"]')"
                  "  .dispatchEvent(new MouseEvent('click', {bubbles: true}))")
    time.sleep(0.3)
    poor = page.evaluate(
        "() => { const b = document.querySelector('.nodedetail button');"
        "  return { text: b.textContent.trim(), disabled: b.disabled }; }"
    )
    check("a capstone is unaffordable at one token, and chips do not help",
          poor["disabled"] and "★" in poor["text"], poor)

    page.evaluate("() => { window.__swarm.save.tokens = 2; window.__swarm.refreshMeta(); }")
    time.sleep(0.3)
    page.evaluate("() => document.querySelector('[data-node=\"piercing\"]')"
                  "  .dispatchEvent(new MouseEvent('click', {bubbles: true}))")
    time.sleep(0.3)
    page.evaluate("() => { const b = document.querySelector('.nodedetail button[data-upgrade]');"
                  "  if (b && !b.disabled) b.click(); }")
    time.sleep(0.3)
    bought = page.evaluate(
        "() => ({ rank: window.__swarm.save.tree.piercing ?? 0,"
        "          tokens: window.__swarm.save.tokens })"
    )
    check("two tokens buys the capstone and spends them",
          bought["rank"] == 1 and bought["tokens"] == 0,
          bought)

    # ---- 4b. HARDCORE is a separate pair of awards on the same level ----
    page.evaluate("() => { const g = window.__swarm.game; g.baseHp = 0; }")
    time.sleep(0.6)
    page.evaluate("() => { const s = window.__swarm.save;"
                  "  s.tokens = 0; s.hardcore = true; window.__swarm.refreshMeta(); }")
    time.sleep(0.3)
    hc = run_to_clear(page, 200)
    check("a hardcore clear pays even on a level already cleared",
          hc["cleared"] and hc["got"] == 1 and tokens(page) == 1,
          {"awarded": hc["got"], "held": tokens(page)})
    ledger = page.evaluate("() => window.__swarm.save.clears['map2']")
    check("the hardcore award is a separate ledger slot",
          ledger.get("clear") is True and ledger.get("hcClear") is True
          and ledger.get("hcPerfect") in (None, False), ledger)
    # and the composition really is shifted, not just tougher numbers
    shift = page.evaluate(
        "() => ({ normal: window.__swarm.waveMix(2, false).label,"
        "          hardcore: window.__swarm.waveMix(2, true).label })"
    )
    check("hardcore changes WHAT arrives, not just how much",
          shift["hardcore"] != shift["normal"], shift)
    page.evaluate("() => { window.__swarm.save.hardcore = false; }")

    # ---- 5. a demo run must not mint tokens ----
    page.goto("http://localhost:5173/?demo=19", wait_until="networkidle")
    time.sleep(1.2)
    before = tokens(page)
    page.evaluate("() => { window.__swarm.save.clears = {}; }")
    st5 = run_to_clear(page, 400, launch=False)
    check("a demo run clears but mints nothing",
          st5["cleared"] and st5["got"] == 0 and tokens(page) == before,
          {"cleared": st5["cleared"], "awarded": st5["got"],
           "tokens": f"{before} -> {tokens(page)}"})

    # ---- 6. v4 saves migrate cleanly ----
    page.evaluate(
        """() => localStorage.setItem('swarm-td-save', JSON.stringify({
             version: 5, cores: 40, gold: 90, bestTime: 200, tree: { requisition: 2 },
             track: 'map2', taught: true, bestWave: 9, wins: 0, tokens: 3,
             clears: { map2: { clear: true, perfect: false } },
           }))"""
    )
    page.goto("http://localhost:5173", wait_until="networkidle")
    time.sleep(1.0)
    mig = page.evaluate(
        "() => { const s = window.__swarm.save;"
        "  return { v: s.version, tokens: s.tokens, clears: s.clears,"
        "           cores: s.cores, tree: s.tree.requisition }; }"
    )
    check("v5 -> v6 keeps tokens and clears, leaving hardcore still to earn",
          mig["v"] == 6 and mig["tokens"] == 3
          and mig["clears"].get("map2", {}).get("clear") is True
          and mig["clears"].get("map2", {}).get("hcClear") in (None, False)
          and mig["cores"] == 40 and mig["tree"] == 2, mig)

    browser.close()

print()
if errors:
    print("PAGE ERRORS:")
    for e in errors[:8]:
        print(" -", e)
    sys.exit(1)
if FAILS:
    print("FAILED:", ", ".join(FAILS))
    sys.exit(1)
print("OK — tokens are earned by clearing, once each, and only they buy capstones")
