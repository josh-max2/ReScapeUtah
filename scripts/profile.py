"""Profile sim tick and render times at horde scale (2k/10k/20k enemies).

Uses the __swarm handle's tick/render hooks. Enemies get near-infinite HP and
the base near-infinite HP so the population stays constant during timing.
"""
import time
from playwright.sync_api import sync_playwright

PROBE = """(N) => {
  const S = window.__swarm;
  const g = S.game;
  const e = g.enemies;
  if (e.n < N) S.spawnOnPath(N - e.n);
  e.hp.fill(1e9, 0, e.n);          // nothing dies during timing
  g.baseHp = 1e9; g.baseMaxHp = 1e9; // nothing ends the run
  const t0 = performance.now();
  for (let k = 0; k < 60; k++) S.tick(1 / 60);
  const sim = (performance.now() - t0) / 60;
  const t1 = performance.now();
  for (let k = 0; k < 30; k++) S.render();
  const ren = (performance.now() - t1) / 30;
  return { n: e.n, towers: g.towers.length,
           simMs: +sim.toFixed(2), renderMs: +ren.toFixed(2),
           frameBudgetPct: +(((sim + ren) / 16.7) * 100).toFixed(0) };
}"""

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 860})
    errors = []
    page.on("pageerror", lambda x: errors.append(str(x)))
    page.goto("http://localhost:5173/?demo=1", wait_until="networkidle")
    time.sleep(1.0)
    for n in (2000, 10000, 20000):
        print(n, "->", page.evaluate(PROBE, n))
    browser.close()
    print("PAGE ERRORS:", errors[:10] if errors else "none")
