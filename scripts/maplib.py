"""Map-agnostic helpers for the Playwright harnesses.

Painted maps change geometry constantly — scripts snap their anchor points to
real cells at runtime instead of hardcoding coordinates.
"""

def snap_rim(page, gx, gy):
    """Nearest unwalkable cell touching the road (weapon mount). Returns [x, y] px."""
    return page.evaluate(f"""() => {{
      const g = window.__swarm.game, C = 90, R = 51;
      let best = null, bd = 1e18;
      for (let cy = 1; cy < R - 1; cy++) for (let cx = 1; cx < C - 1; cx++) {{
        const c = cy * C + cx;
        if (g.field.walk[c] === 1 || g.towerGrid[c] !== -1) continue;
        const rim = g.field.walk[c-1] || g.field.walk[c+1] || g.field.walk[c-C] || g.field.walk[c+C];
        if (!rim) continue;
        const dx = cx * 20 + 10 - {gx}, dy = cy * 20 + 10 - {gy};
        const d = dx * dx + dy * dy;
        if (d < bd) {{ bd = d; best = [cx * 20 + 10, cy * 20 + 10]; }}
      }}
      return best;
    }}""")


def snap_open(page, gx, gy):
    """Nearest walkable cell (enemy spawn / wall site). Returns [x, y] px."""
    return page.evaluate(f"""() => {{
      const g = window.__swarm.game, C = 90, R = 51;
      let best = null, bd = 1e18;
      for (let cy = 1; cy < R - 1; cy++) for (let cx = 1; cx < C - 1; cx++) {{
        const c = cy * C + cx;
        if (g.field.walk[c] !== 1 || g.towerGrid[c] !== -1) continue;
        const dx = cx * 20 + 10 - {gx}, dy = cy * 20 + 10 - {gy};
        const d = dx * dx + dy * dy;
        if (d < bd) {{ bd = d; best = [cx * 20 + 10, cy * 20 + 10]; }}
      }}
      return best;
    }}""")


def open_near_rim(page, rim_xy, min_d=30, max_d=90):
    """Walkable cell within [min_d, max_d] px of a rim point (target in range)."""
    return page.evaluate(f"""() => {{
      const g = window.__swarm.game, C = 90, R = 51;
      const tx = {rim_xy[0]}, ty = {rim_xy[1]};
      let best = null, bd = 1e18;
      for (let cy = 1; cy < R - 1; cy++) for (let cx = 1; cx < C - 1; cx++) {{
        const c = cy * C + cx;
        if (g.field.walk[c] !== 1) continue;
        const x = cx * 20 + 10, y = cy * 20 + 10;
        const dx = x - tx, dy = y - ty;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < {min_d} || d > {max_d}) continue;
        if (d < bd) {{ bd = d; best = [x, y]; }}
      }}
      return best;
    }}""")


def aim_at(page, ti, x, y):
    """Point tower `ti` at a world point and arm it.

    Towers hold a committed angle now instead of acquiring targets, so any
    harness that spawns a dummy next to a tower must also tell the tower to
    look at it — otherwise the tower is aimed down the road and correctly
    ignores the dummy.
    """
    page.evaluate(
        f"""() => {{ const t = window.__swarm.game.towers[{ti}];
             if (!t) return false;
             t.aim = Math.atan2({y} - t.y, {x} - t.x);
             t.aimX = {x}; t.aimY = {y}; t.armed = true; return true; }}"""
    )


def aim_last_at(page, x, y):
    """Aim the most recently placed tower — the common case in the harnesses."""
    ti = page.evaluate("() => window.__swarm.game.towers.length - 1")
    aim_at(page, ti, x, y)
    return ti
