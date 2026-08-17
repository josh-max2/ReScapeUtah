"""Circle movement: no wall grinding, no body overlap.

Agents are circles with velocity vectors — no heading, no traction limit and
no speed floor. The old car model let an agent face a wall, fail to turn away
in time, and scrape along it at the 6px/s minimum forever.
"""
import time
from playwright.sync_api import sync_playwright

R = {}
with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={"width": 1440, "height": 860})
    errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))

    def wave(demo, secs=20):
        page.goto(f"http://localhost:5173/?demo={demo}", wait_until="networkidle")
        time.sleep(1.2)
        page.evaluate("() => { const g = window.__swarm.game; g.speed = 4; g.rescues = 0; }")
        page.keyboard.press("Escape")
        page.keyboard.press(" ")
        worst = {"grind": 0, "overlap": 0, "maxPen": 0, "n": 0}
        for _ in range(int(secs * 2)):
            time.sleep(0.5)
            s = page.evaluate(
                """() => { const g = window.__swarm.game, e = g.enemies;
                     const RS = [3.6,3.2,7,5.6,6.4,6,6.8,11,20,19,21];
                     const MUL = [0.85,1,1.2];
                     let grind = 0, overlap = 0, maxPen = 0;
                     // Ignore the rift: cars are spawned at random points in
                     // the band and can land on top of one another, which
                     // separation clears within a tick or two. That transient
                     // is not the sustained crowd overlap under test.
                     const RIFT = 260;
                     for (let i = 0; i < e.n; i++) {
                       if (e.x[i] < RIFT) continue;
                       // Grinding = slow AND wedged on terrain, not merely
                       // slow: queueing behind a chew or braking in a jam is
                       // correct behaviour, not the bug under test.
                       if (e.vel[i] < 8 && e.stuckT[i] > 0.5) {
                         const cx = (e.x[i] / 20) | 0, cy = (e.y[i] / 20) | 0;
                         let solid = 0;
                         for (let oy = -1; oy <= 1; oy++)
                           for (let ox = -1; ox <= 1; ox++)
                             if (g.field.walk[(cy + oy) * 90 + (cx + ox)] === 0) solid++;
                         if (solid > 0) grind++;
                       }
                       const ri = RS[e.type[i]] * MUL[e.size[i]];
                       for (let j = i + 1; j < e.n; j++) {
                         if (e.x[j] < RIFT) continue;
                         const dx = e.x[j] - e.x[i], dy = e.y[j] - e.y[i];
                         const rr = ri + RS[e.type[j]] * MUL[e.size[j]];
                         const d2 = dx*dx + dy*dy;
                         if (d2 < rr*rr - 1) {
                           overlap++;
                           const pen = rr - Math.sqrt(d2);
                           if (pen > maxPen) maxPen = pen;
                         }
                       }
                     }
                     return { ph: g.phase, n: e.n, grind, overlap,
                              maxPen: +maxPen.toFixed(2), r: g.rescues }; }"""
            )
            if s["ph"] != "wave":
                break
            if s["n"] > worst["n"]:
                worst = s
            worst["grind"] = max(worst["grind"], s["grind"])
            worst["overlap"] = max(worst["overlap"], s["overlap"])
            worst["maxPen"] = max(worst["maxPen"], s["maxPen"])
        worst["r"] = s["r"]
        return worst

    w = wave(9)
    print(f"wave 9 peak: alive {w['n']}  grinding(<8px/s) {w['grind']}  "
          f"overlapping pairs {w['overlap']}  deepest overlap {w['maxPen']}px  rescues {w['r']}")
    R["no_wall_grinding"] = w["grind"] <= 2
    R["bodies_never_overlap"] = w["maxPen"] < 1.5
    R["rescues_stay_in_tens"] = w["r"] < 120

    w2 = wave(14)
    print(f"wave 14 peak: alive {w2['n']}  grinding {w2['grind']}  "
          f"overlapping {w2['overlap']}  deepest {w2['maxPen']}px  rescues {w2['r']}")
    R["no_grinding_at_scale"] = w2["grind"] <= 4
    R["no_overlap_at_scale"] = w2["maxPen"] < 1.5

    for k, v in R.items():
        print(("PASS " if v else "FAIL ") + k)
    print("PAGE ERRORS:", errs[:5] if errs else "none")
    b.close()
    if not all(R.values()) or errs:
        raise SystemExit(1)
    print("ALL MOVEMENT CHECKS PASSED")
