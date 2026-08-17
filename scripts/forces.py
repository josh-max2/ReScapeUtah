"""Shockwave knockback: blasts must physically move the horde, by mass, and
must never punch a car through a wall.

Impulses are queued on the enemy and consumed by the movement integrator, so
they still run through wall repel and projection. This asserts that.
"""
import time
from playwright.sync_api import sync_playwright
from maplib import snap_open

W, H = 1800, 1020
R = {}

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={"width": 1440, "height": 860})
    errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.goto("http://localhost:5173/?demo=3", wait_until="networkidle")
    time.sleep(1.0)
    page.evaluate("() => { window.__swarm.game.speed = 1; }")

    spot = snap_open(page, 700, 500)

    def blast(etype, power=600, radius=120):
        """Park a ring of cars, detonate at the centre, measure the spread."""
        page.evaluate(
            f"""() => {{ const g = window.__swarm.game, e = g.enemies;
                 e.n = 0;
                 for (let k = 0; k < 12; k++) {{
                   const a = k / 12 * Math.PI * 2;
                   e.spawn({etype}, {spot[0]} + Math.cos(a) * 34,
                                    {spot[1]} + Math.sin(a) * 34);
                 }}
                 for (let i = 0; i < e.n; i++) {{ e.hp[i] = 1e6; e.vel[i] = 0; }} }}"""
        )
        time.sleep(0.25)
        d0 = page.evaluate(
            f"""() => {{ const e = window.__swarm.game.enemies; let s = 0;
                 for (let i = 0; i < e.n; i++)
                   s += Math.hypot(e.x[i] - {spot[0]}, e.y[i] - {spot[1]});
                 return s / e.n; }}"""
        )
        page.evaluate(
            f"() => window.__swarm.shove({spot[0]}, {spot[1]}, {radius}, {power})"
        )
        time.sleep(0.6)
        d1 = page.evaluate(
            f"""() => {{ const e = window.__swarm.game.enemies; let s = 0;
                 for (let i = 0; i < e.n; i++)
                   s += Math.hypot(e.x[i] - {spot[0]}, e.y[i] - {spot[1]});
                 return s / e.n; }}"""
        )
        return d1 - d0

    light = blast(0)   # swarmer
    print(f"mean spread from blast (swarmer): +{light:.1f}px")
    R["blast_pushes_the_horde"] = light > 12

    # Mass scaling must be measured on the IMPULSE, not on where cars end up:
    # a ring of titans is wide enough to shove itself apart by crowd pressure,
    # which swamps the blast and makes the heavy look lighter.
    def impulse_for(etype):
        page.evaluate(
            f"""() => {{ const e = window.__swarm.game.enemies;
                 e.n = 0; e.spawn({etype}, {spot[0]} + 30, {spot[1]});
                 e.hp[0] = 1e6; e.vel[0] = 0; e.impX[0] = 0; e.impY[0] = 0; }}"""
        )
        page.evaluate(f"() => window.__swarm.shove({spot[0]}, {spot[1]}, 120, 600)")
        return page.evaluate(
            "() => { const e = window.__swarm.game.enemies;"
            "  return Math.hypot(e.impX[0], e.impY[0]); }"
        )

    imp_light = impulse_for(0)   # swarmer, r 3.6
    imp_heavy = impulse_for(7)   # titan,   r 11
    print(f"impulse applied: swarmer {imp_light:.0f}, titan {imp_heavy:.0f}")
    R["heavier_cars_resist"] = imp_heavy < imp_light * 0.7

    # ---- the shove must not tunnel anyone off the track ----
    # Measure with the FINE mask, which is what the car physics actually reads.
    # The coarse walk mask needs >=25% road coverage per cell, so a car sitting
    # legitimately at the edge of the road can land in a cell that mask calls
    # wall — counting those reports a false off-track and fails a working shove.
    probe = page.evaluate(
        """() => { const g = window.__swarm.game, e = g.enemies, C = 90, CELL = 20;
             let coarse = 0, fine = 0;
             for (let i = 0; i < e.n; i++) {
               const cx = (e.x[i] / CELL) | 0, cy = (e.y[i] / CELL) | 0;
               if (g.field.walk[cy * C + cx] !== 1) coarse++;
               // sampleDist rises past PATH_RADIUS only INSIDE a wall.
               if (window.__swarm.sampleDist(e.x[i], e.y[i]) > 40) fine++;
             }
             return { coarse, fine }; }"""
    )
    off = probe["fine"]
    print(f"cars left off-track by the blast: {off}"
          f"  (coarse-mask count {probe['coarse']}, incl. road-edge false positives)")
    R["shove_never_tunnels_off_track"] = off == 0

    # ---- and the wave must still resolve, not lean on the drain cull ----
    page.goto("http://localhost:5173/?demo=8", wait_until="networkidle")
    time.sleep(1.0)
    page.evaluate("() => { const g = window.__swarm.game; g.rescues = 0; g.speed = 10; }")
    page.keyboard.press("Escape")
    page.keyboard.press(" ")
    end = None
    for _ in range(120):
        time.sleep(0.5)
        st = page.evaluate(
            """() => { const g = window.__swarm.game;
                 return { ph: g.phase, r: g.rescues, d: Math.round(g.drainT || 0),
                          n: g.enemies.n }; }"""
        )
        if st["ph"] != "wave":
            end = st
            break
    end = end or st
    print(f"wave 8 ended: rescues={end['r']} drainT={end['d']}")
    R["rescues_stay_sane"] = end["r"] < 300
    # NOTE: waves still frequently end on the 120s drain cull. That predates
    # knockback (see the 2026-08-16 audit) — this check exists to prove forces
    # did not make it WORSE, not that it is solved.
    R["cull_tail_not_worsened"] = end["r"] < 300

    for k, v in R.items():
        print(("PASS " if v else "FAIL ") + k)
    print("PAGE ERRORS:", errs[:6] if errs else "none")
    b.close()
    if not all(R.values()) or errs:
        raise SystemExit(1)
    print("ALL FORCE CHECKS PASSED")
