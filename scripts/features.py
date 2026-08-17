"""Verify walls (gap vs sealed behavior) and the post-wave perk draft."""
import time
from playwright.sync_api import sync_playwright

OUT = r"C:\Users\joshs\AppData\Local\Temp\claude\C--Users-joshs-Desktop-game\3d8718ef-5b59-4303-9562-1717e7c223c2\scratchpad"
W, H = 1800, 1020

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 860})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    # ---- Part 1: wall gap vs seal on a fresh run ----
    page.goto("http://localhost:5173", wait_until="networkidle")
    page.evaluate("() => localStorage.clear()")
    page.reload(wait_until="networkidle")
    time.sleep(0.5)
    # front end is menu -> hangar -> run; PLAY only shows on a fresh load
    if page.is_visible("button[data-view='hangar']"):
        page.click("button[data-view='hangar']")
    page.click("button[data-launch]")
    time.sleep(0.3)
    page.evaluate("() => { window.__swarm.game.gold = 500; }")
    box = page.evaluate(
        """() => { const r = document.querySelector('canvas').getBoundingClientRect();
                   return { x: r.x, y: r.y, w: r.width, h: r.height }; }"""
    )

    def click_px(gx, gy):  # game-space px -> screen click
        page.mouse.click(box["x"] + box["w"] * gx / W, box["y"] + box["h"] * gy / H)
        time.sleep(0.12)

    # gun overlooking the first straight
    page.keyboard.press("1")  # launch auto-selects gun; ensure toggle state ON by pressing twice
    page.keyboard.press("1")
    click_px(300, 170)
    # wall line in the open corridor at x=860 (walls are hotkey W now)
    page.keyboard.press("w")
    for gy in (380, 430, 530, 580):  # gap at ~480
        click_px(860, gy)
    print("placed:", page.evaluate("() => window.__swarm.game.towers.map(t => t.kind)"))

    page.keyboard.press("Escape")
    page.keyboard.press(" ")  # start wave 1
    page.evaluate("() => { window.__swarm.game.speed = 4; }")
    time.sleep(6)
    gap_state = page.evaluate(
        """() => { const g = window.__swarm.game;
             const walls = g.towers.filter(t => t.kind === 'wall');
             return { n: g.enemies.n, wallHpFrac: Math.min(...walls.map(t => t.hp / t.maxHp)) }; }"""
    )
    print("with gap:", gap_state)
    page.screenshot(path=f"{OUT}\\wall_gap.png")
    assert gap_state["wallHpFrac"] == 1, (
        f"walls took damage while a route was still open: {gap_state}"
    )

    # ---- the sealed half of the rule ----
    # Previously this was skipped with a comment claiming the gap case above
    # asserted it. It did not — nothing was asserted at all, so the whole
    # invulnerable-unless-sealed invariant had no coverage. Pixel-clicking a
    # full barrier is impractical, so build it through the real placement path
    # via the automation handle.
    page.goto("http://localhost:5173/?demo=1", wait_until="networkidle")
    time.sleep(0.8)
    page.evaluate("() => { window.__swarm.game.gold = 99999; }")

    seal = page.evaluate(
        """() => {
          const g = window.__swarm.game, C = 90, R = 51;
          const open = (cx, cy) => g.field.walk[cy * C + cx] === 1;
          // Cut one full column. The gap we leave must be STRAIGHT-THROUGH —
          // open in the columns either side — otherwise reaching it needs a
          // diagonal past a blocked cell, which the field rightly forbids, and
          // "sealed" would be correct rather than a bug.
          let best = -1, bestCells = [], gap = -1;
          for (let cx = 6; cx < C - 6; cx++) {
            const cells = [];
            for (let cy = 1; cy < R - 1; cy++) if (open(cx, cy)) cells.push(cy);
            if (!cells.length) continue;
            const through = cells.filter(cy => open(cx - 1, cy) && open(cx + 1, cy));
            if (!through.length) continue;
            if (bestCells.length === 0 || cells.length < bestCells.length) {
              best = cx; bestCells = cells;
              gap = through[Math.floor(through.length / 2)];
            }
          }
          if (best < 0) return { error: 'no column with a straight-through gap' };
          let placed = 0;
          for (const cy of bestCells) {
            if (cy === gap) continue;
            if (window.__swarm.place('wall', best, cy) >= 0) placed++;
          }
          const openSealed = g.field.sealed;
          const closed = window.__swarm.place('wall', best, gap) >= 0;
          return { col: best, cells: bestCells.length, gapAt: gap, placed, closed,
                   sealedWithGap: openSealed, sealedWhenClosed: g.field.sealed };
        }"""
    )
    print("seal test:", seal)
    assert seal["placed"] >= 1 and seal["closed"], f"could not build a barrier: {seal}"
    assert seal["sealedWithGap"] is False, f"field reported sealed while a gap remained: {seal}"
    assert seal["sealedWhenClosed"] is True, f"field did not seal when the route was cut: {seal}"

    # Sealed => the horde must now chew the barrier down.
    # Deliver the horde straight to the wall instead of relying on a wave: in
    # ?demo mode a prebuilt gun line kills wave 1 long before it reaches the
    # barrier, which looks identical to "the chew never fired".
    page.keyboard.press("Escape")
    page.keyboard.press(" ")
    page.evaluate(
        f"""() => {{ const g = window.__swarm.game, e = g.enemies, CELL = 20;
             const bx = {seal['col']} * CELL, by = {seal['gapAt']} * CELL;
             for (let k = 0; k < 24; k++) {{
               e.spawn(2, bx - 34 + (Math.random() - .5) * 10,
                          by - 40 + Math.random() * 80);
             }}
             for (let i = 0; i < e.n; i++) {{ e.hp[i] = 5000; e.maxHp[i] = 5000; }} }}"""
    )
    page.evaluate("() => { window.__swarm.game.speed = 4; }")
    time.sleep(8)
    sealed_state = page.evaluate(
        """() => { const g = window.__swarm.game;
             const walls = g.towers.filter(t => t.kind === 'wall');
             return { n: g.enemies.n, walls: walls.length,
                      wallHpFrac: walls.length ? Math.min(...walls.map(t => t.hp / t.maxHp)) : null,
                      sealed: g.field.sealed }; }"""
    )
    print("when sealed:", sealed_state)
    page.screenshot(path=f"{OUT}\\wall_sealed.png")
    assert sealed_state["wallHpFrac"] is not None and sealed_state["wallHpFrac"] < 1, (
        f"route was sealed but the horde never chewed the barrier: {sealed_state}"
    )
    print("PASS wall_invulnerable_with_gap")
    print("PASS field_seals_only_when_route_cut")
    print("PASS horde_chews_sealed_barrier")

    # ---- Part 2: the every-3rd-wave card draft ----
    page.goto("http://localhost:5173/?demo=1", wait_until="networkidle")
    time.sleep(0.5)
    if not page.evaluate("() => window.__swarm.cardsEnabled"):
        print("SKIP draft check: deck layer disabled (CARDS_ENABLED=false)")
        print("PAGE ERRORS:", errors[:10] if errors else "none")
        browser.close()
        raise SystemExit(0)
    # Force the draft state directly (organically it fires after wave 3)
    page.evaluate(
        """() => { const g = window.__swarm.game;
                   g.phase = 'build'; g.cardChoices = ['barrels', 'nova', 'scrap']; }"""
    )
    time.sleep(0.5)
    before_deck = page.evaluate("() => window.__swarm.game.deck.length")
    visible = page.evaluate("() => document.querySelector('.perkscreen').style.display !== 'none'")
    start_blocked = page.evaluate("() => document.querySelector('.startbtn').disabled")
    page.screenshot(path=f"{OUT}\\card_draft.png")
    print("draft overlay:", {"visible": visible, "startBlocked": start_blocked, "deck": before_deck})
    page.click(".perkcard")
    time.sleep(0.3)
    after = page.evaluate(
        "() => ({deck: window.__swarm.game.deck.length, choices: window.__swarm.game.cardChoices})"
    )
    print("after pick:", after)
    assert visible and start_blocked, "draft overlay not blocking"
    assert after["deck"] == before_deck + 1 and after["choices"] is None, "draft pick failed"
    browser.close()
    print("PAGE ERRORS:", errors[:10] if errors else "none")
