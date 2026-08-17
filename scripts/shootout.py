"""Equal-gold shootout: what does the SAME money buy from each weapon?

This replaces the intuition that a weapon's worth is its DPS. It is not. With
fixed firing lanes the purchase decision is "480 gold — twelve autocannons or
three railguns?", and the answer folds in fire rate, projectile flight time,
splash, slow, and above all COVERAGE: cheap towers buy more lanes, and more
lanes is a real advantage that no per-tower stat shows.

So each weapon gets an identical budget, spends it upfront on identical
route-ordered emplacements with identical aiming, and we score it on the only
thing that matters — how much of the horde never reached the fort.

Guards that took two attempts to get right:
  * the clock is PAUSED while buying. Placing twelve towers through the real UI
    takes longer than placing three, so an unpaused trial hands the cheap stack
    a later, harder start and calls it a weakness.
  * the fort is made unkillable. A weak stack that dies at 70s otherwise scores
    on a shorter window than a strong one that survives, which flatters it.
  * NO reinvestment after the buy. Kill income compounds for whoever is already
    killing more, which measures snowball, not the weapon.
  * score is per gold ACTUALLY SPENT (480/150 = 3 railguns = 450), against a
    no-tower baseline, so the leftovers of an awkward price don't count as
    defence that was never bought.

  python shootout.py               # 9 weapons + baseline, 2 reps
  python shootout.py --reps 3 --budget 600
"""
import argparse
import statistics
import time
from playwright.sync_api import sync_playwright
from difficulty import rim_spots, aim_last, KINDS, W, H

WINDOW = 120.0   # sim-seconds; ~5 stages, long enough that even a good stack leaks


def trial(page, box, kind, budget):
    """One weapon, one fresh run. Returns (fort damage taken, gold spent)."""
    page.evaluate("() => localStorage.clear()")
    page.reload(wait_until="networkidle")
    time.sleep(0.7)
    if page.is_visible("button[data-view='hangar']"):
        page.click("button[data-view='hangar']")
    page.click("button[data-launch]")
    time.sleep(0.4)
    page.evaluate(
        f"""() => {{ const g = window.__swarm.game;
             g.flowPaused = true;          // freeze progression while we buy
             g.gold = {budget};
             g.baseHp = 1e9; g.baseMaxHp = 1e9;   // fort cannot fall mid-window
             g.speed = 10; }}"""
    )

    spent = 0
    if kind:
        cost = KINDS[kind][1]
        want = budget // cost
        # Spots are ordered far-from-fort first, and the very first few sit
        # inside the rift band where placement is refused. Clicking blind there
        # cost every weapon its first 2-3 towers and made the whole table a
        # measure of how deep the spawn zone is. So VERIFY each placement and
        # walk the list until the budget is genuinely spent.
        spots = rim_spots(page, want + 30, 150)
        placed = 0
        for s in spots:
            if placed >= want:
                break
            page.keyboard.press("Escape")
            page.keyboard.press(KINDS[kind][0])
            page.mouse.click(box["x"] + box["w"] * s["x"] / W,
                             box["y"] + box["h"] * s["y"] / H)
            page.keyboard.press("Escape")
            n = page.evaluate(
                f"() => window.__swarm.game.towers.filter(t => t.kind === '{kind}').length"
            )
            if n <= placed:
                continue          # refused (rift band, occupied, wrong terrain)
            placed = n
            aim_last(page, "downflow")
        if placed < want:
            print(f"    ! {kind}: only {placed}/{want} placed — ran out of emplacements")
        spent = placed * cost

    page.evaluate("() => { window.__swarm.game.flowPaused = false; }")
    while True:
        st = page.evaluate(
            """() => { const g = window.__swarm.game;
                 return { t: g.runT, taken: 1e9 - g.baseHp, kills: g.kills,
                          n: g.enemies.n, phase: g.phase }; }"""
        )
        if st["t"] >= WINDOW or st["phase"] != "running":
            return st["taken"], spent, st["kills"]
        time.sleep(0.3)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--reps", type=int, default=2)
    ap.add_argument("--budget", type=int, default=480)
    ap.add_argument("--only", default="", help="comma-separated weapons, for fast iteration")
    args = ap.parse_args()

    order = ["autocannon", "flame", "cryo", "mortar", "tesla",
             "gatling", "rocket", "railgun", "lattice"]
    if args.only:
        want = [k.strip() for k in args.only.split(",")]
        order = [k for k in order if k in want]

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1440, "height": 860})
        errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))
        page.goto("http://localhost:5173", wait_until="networkidle")
        time.sleep(0.8)
        box = page.evaluate(
            """() => { const r = document.querySelector('canvas').getBoundingClientRect();
                       return { x: r.x, y: r.y, w: r.width, h: r.height }; }"""
        )

        base = statistics.median(
            [trial(page, box, None, args.budget)[0] for _ in range(args.reps)]
        )
        print(f"budget {args.budget}g · {int(WINDOW)}s window · "
              f"undefended fort damage = {base:.0f}\n")
        print(f"{'weapon':12}{'n':>3}{'spent':>7}{'leaked':>8}{'stopped':>9}{'per 100g':>10}")
        print("-" * 49)

        rows = []
        for kind in order:
            res = [trial(page, box, kind, args.budget) for _ in range(args.reps)]
            taken = statistics.median([r[0] for r in res])
            spent = res[0][1]
            stopped = base - taken
            per = (stopped / spent * 100) if spent else 0
            rows.append((kind, spent // KINDS[kind][1], spent, taken, stopped, per))

        anchor = next((r[5] for r in rows if r[0] == "autocannon"), 0) or 1
        for kind, n, spent, taken, stopped, per in sorted(rows, key=lambda r: -r[5]):
            print(f"{kind:12}{n:>3}{spent:>7}{taken:>8.0f}{stopped:>9.0f}{per:>10.1f}")
        print(f"\nvs autocannon spam (the thing that must not dominate):")
        for kind, n, spent, taken, stopped, per in sorted(rows, key=lambda r: -r[5]):
            print(f"  {kind:12}{per / anchor:>6.2f}x")
        print("\nPAGE ERRORS:", errs[:5] if errs else "none")
        browser.close()


if __name__ == "__main__":
    main()
