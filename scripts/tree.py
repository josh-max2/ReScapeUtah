"""Skill-tree harness. The one failure it exists to catch: a node that looks
bought, costs chips, and does nothing.

That is not hypothetical here — CLAUDE.md records it as a repeat failure ("combat
must read stats through towerStats(), never raw def.*, or nodes silently do
nothing"). The UI cannot show it: the button depresses and the rank counter goes
up either way. So test 1 walks EVERY node and asserts its effect actually moves
a field of MetaMods, and test 2 proves the tree reaches live combat by measuring
damage with and without it.

    python tree.py
"""
import sys
import time
from playwright.sync_api import sync_playwright

# Node labels carry the chip glyph, and the Windows console is cp1252 by
# default — without this the harness dies formatting its own PASS line.
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

FAILS = []


def check(name, ok, detail=""):
    print(f"  [{'PASS' if ok else 'FAIL'}] {name}{(' — ' + str(detail)) if detail else ''}")
    if not ok:
        FAILS.append(name)


with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto("http://localhost:5173", wait_until="networkidle")
    page.evaluate("() => localStorage.clear()")
    page.reload(wait_until="networkidle")
    time.sleep(0.9)

    # ---- 1. every node moves something ----
    dead = page.evaluate(
        """() => {
          const { tree, computeMods, emptyMods } = window.__swarm;
          const flat = (m) => {
            const out = {};
            for (const [k, v] of Object.entries(m)) {
              if (k === 'kind') {
                for (const [kk, kv] of Object.entries(v))
                  for (const [f, n] of Object.entries(kv)) out[kk + '.' + f] = n;
              } else out[k] = v;
            }
            return out;
          };
          const base = flat(emptyMods());
          const dead = [];
          for (const node of tree) {
            const got = flat(computeMods({ [node.id]: node.ranks }));
            let moved = false;
            for (const k of Object.keys(base)) {
              if (got[k] !== base[k]) { moved = true; break; }
            }
            if (!moved) dead.push(node.id);
          }
          return { dead, total: tree.length };
        }"""
    )
    check(f"all {dead['total']} nodes move a modifier", not dead["dead"],
          f"inert: {dead['dead']}" if dead["dead"] else "")

    # ---- 2. the tree reaches live combat ----
    # launchRun auto-selects the gun, but nothing is placed yet — place one.
    def measure(tree_json):
        page.evaluate("() => localStorage.clear()")
        page.reload(wait_until="networkidle")
        time.sleep(0.7)
        page.evaluate(f"() => {{ window.__swarm.save.tree = {tree_json}; }}")
        if page.is_visible("button[data-view='hangar']"):
            page.click("button[data-view='hangar']")
        page.click("button[data-launch]")
        time.sleep(0.4)
        return page.evaluate(
            """() => new Promise((res) => {
                 const g = window.__swarm.game;
                 g.flowPaused = true; g.gold = 9999; g.enemies.n = 0;
                 // Find any rim cell and mount an autocannon aimed down-flow.
                 const C = 90, CELL = 20;
                 let idx = -1;
                 for (let cy = 2; cy < 49 && idx < 0; cy++)
                   for (let cx = 2; cx < 88; cx++) {
                     const c = cy * C + cx;
                     if (g.field.walk[c] === 1) continue;
                     if (!(g.field.walk[c-1] || g.field.walk[c+1] ||
                           g.field.walk[c-C] || g.field.walk[c+C])) continue;
                     idx = window.__swarm.place('autocannon', cx, cy);
                     if (idx >= 0) break;
                   }
                 if (idx < 0) return res(null);
                 const t = g.towers[idx];
                 t.armed = true;
                 const ax = Math.cos(t.aim), ay = Math.sin(t.aim);
                 g.enemies.spawn(0, t.x + ax * 55, t.y + ay * 55);
                 const i = g.enemies.n - 1;
                 g.enemies.hp[i] = 1e7; g.enemies.maxHp[i] = 1e7;
                 const hold = setInterval(() => {
                   g.enemies.vx[i] = 0; g.enemies.vy[i] = 0; g.enemies.vel[i] = 0;
                   g.enemies.x[i] = t.x + ax * 55; g.enemies.y[i] = t.y + ay * 55;
                 }, 8);
                 const h0 = g.enemies.hp[i];
                 setTimeout(() => {
                   clearInterval(hold);
                   res(h0 - g.enemies.hp[i]);
                 }, 2500);
               })"""
        )

    plain = measure("{}")
    buffed = measure('{"calibration": 5, "acfeed": 5}')
    ok = plain and buffed and buffed > plain * 1.15
    check("tree damage nodes reach live combat", bool(ok),
          f"{plain:.0f} -> {buffed:.0f} dmg" if plain and buffed else "no measurement")

    # ---- 3. gates hold ----
    page.evaluate("() => localStorage.clear()")
    page.reload(wait_until="networkidle")
    time.sleep(0.8)
    page.click("button[data-view='hangar']")
    page.evaluate("() => { const s = window.__swarm.save;"
                  "  s.cores = 99999; s.bestTime = 0; window.__swarm.refreshMeta(); }")
    time.sleep(0.3)
    page.evaluate("() => { document.querySelector('[data-node=\"quota\"]').dispatchEvent(new MouseEvent('click', {bubbles: true})); }")
    time.sleep(0.3)
    locked = page.evaluate(
        "() => { const b = document.querySelector('.nodedetail button');"
        "  return { text: b.textContent.trim(), disabled: b.disabled }; }"
    )
    check("gated node refuses purchase with chips in hand",
          locked["disabled"] and "HOLD" in locked["text"], locked)

    # and opens once the time is on the board
    page.evaluate("() => { window.__swarm.save.bestTime = 900;"
                  "  window.__swarm.refreshMeta(); }")
    time.sleep(0.3)
    page.evaluate("() => { document.querySelector('[data-node=\"quota\"]').dispatchEvent(new MouseEvent('click', {bubbles: true})); }")
    time.sleep(0.3)
    opened = page.evaluate(
        "() => { const b = document.querySelector('.nodedetail button');"
        "  return { text: b.textContent.trim(), disabled: b.disabled }; }"
    )
    check("gate opens on bestTime", not opened["disabled"], opened)

    # ---- 4. respec returns every chip ----
    spend = page.evaluate(
        """() => {
             const s = window.__swarm.save;
             s.cores = 5000; s.tree = {};
             window.__swarm.refreshMeta();
             const before = s.cores;
             for (const id of ['requisition', 'requisition', 'calibration', 'salvage']) {
               const dot = document.querySelector(`[data-node="${id}"]`);
               dot.dispatchEvent(new MouseEvent('click', { bubbles: true }));
             }
             return before;
           }"""
    )
    for _ in range(4):
        page.evaluate(
            """() => { const b = document.querySelector('.nodedetail button[data-upgrade]');
                 if (b && !b.disabled) b.click(); }"""
        )
        time.sleep(0.15)
    mid = page.evaluate("() => window.__swarm.save.cores")
    page.evaluate("() => { document.querySelector('[data-respec]').click(); }")
    time.sleep(0.3)
    after = page.evaluate(
        "() => ({ cores: window.__swarm.save.cores,"
        "  ranks: Object.keys(window.__swarm.save.tree).length })"
    )
    check("respec refunds every chip and clears ranks",
          after["cores"] == spend and after["ranks"] == 0,
          f"{spend} -> spent to {mid} -> back to {after['cores']}, {after['ranks']} ranks left")

    # ---- 5. a v3 save migrates without confiscating anything ----
    # Read the CURRENT save version from a clean load rather than pinning a
    # number: the point of the check is that a migration lands on whatever is
    # current, and pinning means editing this test on every bump.
    page.evaluate("() => localStorage.clear()")
    page.reload(wait_until="networkidle")
    time.sleep(0.8)
    CURRENT_V = page.evaluate("() => window.__swarm.save.version")
    mig = page.evaluate(
        """() => {
             localStorage.setItem('swarm-td-save', JSON.stringify({
               version: 3, cores: 10, gold: 500, bestTime: 120,
               upgrades: { dmg: 3, hp: 2, gold: 1 },
               bestWave: 7, wins: 0,
             }));
             return true;
           }"""
    )
    page.reload(wait_until="networkidle")
    time.sleep(0.9)
    after_mig = page.evaluate(
        "() => { const s = window.__swarm.save;"
        "  return { v: s.version, cores: s.cores, gold: s.gold,"
        "           bestTime: s.bestTime, tree: Object.keys(s.tree).length }; }"
    )
    # dmg 3 = 12+18+27=57, hp 2 = 10+15=25, gold 1 = 10  ->  92 refunded on top of 10
    check(f"v3 -> v{CURRENT_V} refunds the old flat upgrades",
          after_mig["v"] == CURRENT_V and after_mig["cores"] == 102
          and after_mig["gold"] == 500 and after_mig["tree"] == 0, after_mig)

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
print("OK — skill tree wired, gated, refundable, and migrating")
