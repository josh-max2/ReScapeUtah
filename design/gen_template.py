"""Generate design/template.html — the visual spec for SWARM's level view.

Deterministic (fixed seed). Two baked SVG frames (combat + build phase) with the
HUD overlaid in HTML/CSS, followed by the token/implementation legend. This file
IS the design contract for src/render/* and src/style.css.
"""
import math
import random

rng = random.Random(7)

W, H = 1200, 680
PATH_TOP, PATH_BOT = 180, 500

C = {
    "soil": "#8f7350", "soil_worn": "#a08059", "soil_edge": "#5d4936",
    "verge": "#77803d", "verge_dark": "#5f6c31", "thicket": "#3a4a1c",
    "thicket2": "#46561f", "mite": "#3a6d26", "dart": "#86a03c",
    "brute": "#2f5a1d", "titan": "#2e2420", "titan_core": "#d9a441",
    "steel": "#4a5261", "steel_hi": "#707a8c", "steel_dark": "#343b47",
    "fire": "#ffd977", "fire_hot": "#fff3c4", "stain": "#4a1f16",
    "health": "#d43d2e", "cyan": "#79d6d0",
}


def wavy_edge(y_base, amp, n=24):
    pts = []
    for i in range(n + 1):
        x = W * i / n
        y = y_base + amp * math.sin(i * 1.7 + y_base) + rng.uniform(-4, 4)
        pts.append((x, y))
    return pts


def poly(pts, fill, extra=""):
    p = " ".join(f"{x:.0f},{y:.0f}" for x, y in pts)
    return f'<polygon points="{p}" fill="{fill}" {extra}/>'


def soil_noise(n=900):
    out = []
    for _ in range(n):
        x, y = rng.uniform(0, W), rng.uniform(0, H)
        s = rng.uniform(3, 9)
        tone = rng.choice(["#00000012", "#ffffff10", "#00000009"])
        out.append(f'<rect x="{x:.0f}" y="{y:.0f}" width="{s:.0f}" height="{s:.0f}" fill="{tone}"/>')
    return "".join(out)


def shrubs(cx, cy, count, spread):
    out = []
    for _ in range(count):
        a, d = rng.uniform(0, 6.28), rng.uniform(0, spread)
        x, y = cx + math.cos(a) * d, cy + math.sin(a) * d * 0.7
        r = rng.uniform(4, 11)
        col = rng.choice([C["thicket"], C["thicket2"]])
        out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.0f}" fill="{col}"/>')
    return "".join(out)


def terrain():
    s = [f'<rect width="{W}" height="{H}" fill="{C["verge"]}"/>']
    # dirt path band with carved dark edges
    top = wavy_edge(PATH_TOP, 14)
    bot = wavy_edge(PATH_BOT, 14)
    s.append(poly(top + bot[::-1], C["soil"]))
    s.append(poly([(x, y + 6) for x, y in top] + top[::-1], C["soil_edge"]))
    s.append(poly(bot + [(x, y + 6) for x, y in bot][::-1], C["soil_edge"]))
    # worn center lane
    mid = [(x, (a + b) / 2 + 18 * math.sin(x / 160)) for (x, a), (_, b) in zip(top, bot)]
    s.append(poly([(x, y - 58) for x, y in mid] + [(x, y + 58) for x, y in mid][::-1], C["soil_worn"]))
    # verge texture: mowed darker patches + shrub clusters
    for _ in range(10):
        cx = rng.uniform(80, W - 120)
        cy = rng.choice([rng.uniform(20, PATH_TOP - 40), rng.uniform(PATH_BOT + 40, H - 20)])
        s.append(shrubs(cx, cy, rng.randint(5, 12), rng.uniform(18, 46)))
    # left treeline (spawn forest) + ominous inner glow
    s.append(f'<rect width="86" height="{H}" fill="{C["thicket"]}"/>')
    for _ in range(90):
        x, y = rng.uniform(0, 96), rng.uniform(0, H)
        s.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{rng.uniform(6, 15):.0f}" '
                 f'fill="{rng.choice([C["thicket"], C["thicket2"], "#2e3c15"])}"/>')
    s.append(f'<rect x="80" width="26" height="{H}" fill="url(#spawnglow)"/>')
    # right base rampart
    s.append(f'<rect x="{W-46}" width="46" height="{H}" fill="{C["steel_dark"]}"/>')
    s.append(f'<rect x="{W-46}" width="7" height="{H}" fill="{C["steel_hi"]}"/>')
    for yy in range(0, H, 34):
        s.append(f'<rect x="{W-40}" y="{yy}" width="34" height="2" fill="#2a303a"/>')
    s.append(soil_noise())
    return "".join(s)


def stains(kill_x0=470, kill_x1=780, n=110):
    out = []
    for _ in range(n):
        x = rng.triangular(kill_x0, kill_x1, kill_x1 - 70)
        y = rng.uniform(PATH_TOP + 18, PATH_BOT - 18)
        r = rng.uniform(2.5, 9)
        a = rng.uniform(0.22, 0.55)
        out.append(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{r:.0f}" ry="{r*0.7:.0f}" '
                   f'fill="#55190d" opacity="{a:.2f}"/>')
    return "".join(out)


def horde():
    out = []
    clusters = [(170, 340, 90, 60), (300, 400, 130, 220), (450, 330, 110, 200),
                (560, 380, 80, 120), (250, 260, 70, 80), (380, 450, 80, 90)]
    for cx, cy, spread, count in clusters:
        for _ in range(count):
            a, d = rng.uniform(0, 6.28), abs(rng.gauss(0, spread / 2))
            x = cx + math.cos(a) * d
            y = min(max(cy + math.sin(a) * d * 0.6, PATH_TOP + 12), PATH_BOT - 12)
            roll = rng.random()
            if roll < 0.82:
                out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="2.6" fill="{C["mite"]}"/>')
            elif roll < 0.95:
                out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="2.2" fill="{C["dart"]}"/>')
            else:
                out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="4.6" fill="{C["brute"]}" '
                           f'stroke="#00000040" stroke-width="1"/>')
    out.append(f'<circle cx="385" cy="352" r="14" fill="{C["titan"]}" stroke="#00000060" stroke-width="2.5"/>')
    out.append(f'<circle cx="385" cy="352" r="5.5" fill="{C["titan_core"]}"/>')
    return "".join(out)


def tower(x, y, kind="gun", angle=180, firing=False, selected=False, show_range=False, rng_r=110):
    a = math.radians(angle)
    bx, by = x + math.cos(a) * 15, y + math.sin(a) * 15
    s = []
    if show_range:
        col = C["cyan"] if selected else "#ffffff"
        op = 0.55 if selected else 0.22
        s.append(f'<circle cx="{x}" cy="{y}" r="{rng_r}" fill="none" stroke="{col}" '
                 f'stroke-width="1.5" opacity="{op}" stroke-dasharray="4 6"/>')
    s.append(f'<rect x="{x-11}" y="{y-11}" width="22" height="22" rx="4" fill="{C["steel_dark"]}"/>')
    s.append(f'<rect x="{x-11}" y="{y-11}" width="22" height="3" rx="1.5" fill="{C["steel_hi"]}" opacity="0.6"/>')
    barrel_w = {"gun": 3.5, "cannon": 6, "laser": 3}[kind]
    s.append(f'<line x1="{x}" y1="{y}" x2="{bx:.0f}" y2="{by:.0f}" stroke="{C["steel_hi"]}" '
             f'stroke-width="{barrel_w}" stroke-linecap="round"/>')
    core = {"gun": "#9aa5b8", "cannon": "#c8825a", "laser": "#b9a6d8"}[kind]
    s.append(f'<circle cx="{x}" cy="{y}" r="6" fill="{C["steel"]}" stroke="{core}" stroke-width="2"/>')
    if firing:
        s.append(f'<circle cx="{bx:.0f}" cy="{by:.0f}" r="34" fill="url(#fireglow)"/>')
    return "".join(s)


def combat_extras():
    s = []
    # tracers into the mass
    for (x1, y1, x2, y2) in [(716, 262, 470, 300), (716, 418, 520, 390), (762, 342, 560, 355)]:
        s.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{C["fire_hot"]}" '
                 f'stroke-width="1.6" opacity="0.85"/>')
    # cannon burst in the horde
    s.append('<circle cx="430" cy="330" r="52" fill="url(#fireglow)"/>')
    s.append(f'<circle cx="430" cy="330" r="30" fill="none" stroke="{C["fire"]}" stroke-width="3" opacity="0.7"/>')
    # laser beam: white-hot core, warm halo
    s.append(f'<line x1="762" y1="342" x2="330" y2="330" stroke="{C["fire"]}" stroke-width="7" opacity="0.28"/>')
    s.append(f'<line x1="762" y1="342" x2="330" y2="330" stroke="#ffffff" stroke-width="2.4" opacity="0.9"/>')
    # smoke puffs drifting over the kill zone
    for (x, y, r, o) in [(500, 280, 16, .30), (540, 262, 22, .22), (585, 250, 27, .15),
                         (475, 402, 14, .28), (515, 415, 20, .18)]:
        s.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#c9c2b8" opacity="{o}"/>')
    return "".join(s)


DEFS = f"""
<defs>
  <radialGradient id="fireglow">
    <stop offset="0%" stop-color="{C['fire_hot']}" stop-opacity="0.95"/>
    <stop offset="40%" stop-color="{C['fire']}" stop-opacity="0.55"/>
    <stop offset="100%" stop-color="{C['fire']}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="spawnglow" x1="0" x2="1">
    <stop offset="0%" stop-color="#68150c" stop-opacity="0.55"/>
    <stop offset="100%" stop-color="#68150c" stop-opacity="0"/>
  </linearGradient>
  <radialGradient id="vign" cx="50%" cy="46%" r="72%">
    <stop offset="62%" stop-color="#000" stop-opacity="0"/>
    <stop offset="100%" stop-color="#1b130b" stop-opacity="0.34"/>
  </radialGradient>
</defs>"""

TOWERS_COMBAT = [
    (716, 262, "gun", 195, True), (716, 418, "gun", 168, True),
    (716, 342, "cannon", 180, False), (762, 302, "gun", 190, False),
    (762, 382, "gun", 172, False), (762, 342, "laser", 181, False),
    (810, 262, "cannon", 190, False), (810, 420, "gun", 175, False),
]

svg_combat = (
    f'<svg viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg">{DEFS}'
    + terrain() + stains() + horde()
    + "".join(tower(x, y, k, ang, f) for x, y, k, ang, f in TOWERS_COMBAT)
    + combat_extras()
    + f'<rect width="{W}" height="{H}" fill="url(#vign)"/></svg>'
)

rng = random.Random(7)  # re-seed so build frame terrain matches combat frame
TOWERS_BUILD = [
    (716, 262, "gun", 195, False), (716, 418, "gun", 168, False),
    (716, 342, "cannon", 180, False), (762, 302, "gun", 190, False),
    (762, 382, "gun", 172, False), (762, 342, "laser", 181, False),
]
svg_build = (
    f'<svg viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg">{DEFS}'
    + terrain() + stains()
    + "".join(tower(x, y, k, ang, False, show_range=True,
                    rng_r={"gun": 110, "cannon": 140, "laser": 160}[k])
              for x, y, k, ang, _ in TOWERS_BUILD)
    + tower(810, 342, "gun", 180, False, selected=True, show_range=True, rng_r=110)
    + f'<rect x="800" y="332" width="20" height="20" rx="3" fill="none" stroke="{C["cyan"]}" stroke-width="2"/>'
    + f'<rect width="{W}" height="{H}" fill="url(#vign)"/></svg>'
)

HTML = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SWARM — level view spec</title>
<style>
  :root {{
    --panel: rgba(20,17,14,0.87); --panel-line: rgba(255,255,255,0.10);
    --ink: #efe9df; --ink-dim: #a89f92; --health: {C['health']};
    --cyan: {C['cyan']}; --gold: #e8c26a;
  }}
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  body {{ background:#171310; color:var(--ink);
         font-family:'Bahnschrift','Arial Narrow',system-ui,sans-serif; padding:28px 0 64px; }}
  .spec-head {{ max-width:1200px; margin:0 auto 22px; padding:0 24px; }}
  .spec-head h1 {{ font-size:15px; letter-spacing:.34em; color:var(--ink-dim); font-weight:600; }}
  .spec-head p {{ font-size:13px; color:#7a7264; margin-top:4px; }}
  .frame {{ max-width:1200px; margin:0 auto 10px; position:relative;
            border:1px solid #2a241d; }}
  .frame svg {{ display:block; width:100%; height:auto; }}
  .frame-label {{ max-width:1200px; margin:0 auto 36px; font-size:11px;
                  letter-spacing:.28em; color:#7a7264; padding:8px 2px; }}

  .hud {{ position:absolute; inset:0; pointer-events:none;
          font-variant-numeric:tabular-nums; }}
  .panel {{ position:absolute; background:var(--panel);
            border:1px solid var(--panel-line); border-radius:6px; }}

  .health {{ top:14px; left:50%; transform:translateX(-50%);
             padding:8px 14px 10px; width:320px; text-align:center; }}
  .health .lbl {{ font-size:10px; letter-spacing:.30em; color:var(--ink-dim); }}
  .hbar {{ height:13px; margin-top:5px; background:#3a1512; border-radius:3px;
           position:relative; overflow:hidden; }}
  .hbar i {{ position:absolute; inset:0; width:88%; background:var(--health); }}
  .hbar b {{ position:absolute; inset:0; font-size:10.5px; font-weight:600;
             line-height:13px; color:#fff; }}
  .chips {{ display:flex; gap:14px; justify-content:center; margin-top:6px;
            font-size:11.5px; color:var(--ink-dim); }}
  .chips b {{ color:var(--ink); font-weight:600; }}

  .wavechip {{ top:14px; left:14px; padding:7px 12px; font-size:11.5px;
               letter-spacing:.22em; color:var(--ink); }}
  .wavechip small {{ color:var(--ink-dim); letter-spacing:.1em; }}

  .slots {{ bottom:14px; left:50%; transform:translateX(-50%);
            display:flex; gap:6px; padding:6px; }}
  .slot {{ width:86px; padding:7px 9px 8px; border-radius:4px;
           border:1px solid transparent; }}
  .slot .k {{ font-size:9.5px; color:var(--ink-dim); letter-spacing:.12em; }}
  .slot .n {{ font-size:12.5px; font-weight:600; letter-spacing:.10em; margin-top:1px; }}
  .slot .c {{ font-size:11px; color:var(--gold); margin-top:2px; }}
  .slot.sel {{ border-color:var(--cyan); background:rgba(121,214,208,0.08); }}
  .slot.dim {{ opacity:.45; }}

  .ctl {{ bottom:14px; left:14px; display:flex; gap:6px; padding:6px; }}
  .ctl .slot {{ width:auto; min-width:64px; }}

  .startbtn {{ position:absolute; bottom:14px; right:14px; padding:13px 26px; font-size:14px;
               font-weight:700; letter-spacing:.20em; color:#171310;
               background:var(--ink); border-radius:6px; border:none; }}

  .banner {{ top:88px; left:50%; transform:translateX(-50%);
             padding:14px 30px; text-align:center; }}
  .banner .t {{ font-size:24px; font-weight:700; letter-spacing:.30em; }}
  .banner .s {{ font-size:11.5px; color:var(--ink-dim); letter-spacing:.14em; margin-top:4px; }}

  .legend {{ max-width:1200px; margin:26px auto 0; padding:0 24px;
             display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:28px; }}
  .legend h2 {{ font-size:11px; letter-spacing:.30em; color:var(--ink-dim);
                margin-bottom:10px; font-weight:600; }}
  .swatches {{ display:grid; grid-template-columns:repeat(2,1fr); gap:6px; }}
  .sw {{ display:flex; align-items:center; gap:8px; font-size:11.5px; color:var(--ink-dim); }}
  .sw i {{ width:22px; height:22px; border-radius:4px; border:1px solid #ffffff22; }}
  .legend ol {{ font-size:12.5px; line-height:1.75; color:#c9c0b2; padding-left:18px; }}
  .legend li b {{ color:var(--ink); font-weight:600; }}
</style></head><body>

<div class="spec-head">
  <h1>SWARM — LEVEL VIEW SPEC</h1>
  <p>Two target frames + tokens. This document is the contract for src/render and src/style.css.</p>
</div>

<div class="frame">{svg_combat}
  <div class="hud">
    <div class="panel wavechip">WAVE 12<small>/20</small></div>
    <div class="panel health">
      <div class="lbl">HEALTH</div>
      <div class="hbar"><i></i><b>224 / 250</b></div>
      <div class="chips"><span>horde <b>1.4K</b></span><span>kills <b>7.3K</b></span><span>cores <b>+212</b></span></div>
    </div>
    <div class="panel ctl">
      <div class="slot"><div class="k">SPEED</div><div class="n">2&times;</div></div>
      <div class="slot"><div class="k">Q &middot; STRIKE</div><div class="n">12s</div></div>
    </div>
    <div class="panel slots">
      <div class="slot"><div class="k">1</div><div class="n">GUN</div><div class="c">15</div></div>
      <div class="slot"><div class="k">2</div><div class="n">CANNON</div><div class="c">60</div></div>
      <div class="slot dim"><div class="k">3</div><div class="n">LASER</div><div class="c">150</div></div>
    </div>
  </div>
</div>
<div class="frame-label">FRAME 01 &mdash; COMBAT &middot; horde mid-field, kill zone staining the path</div>

<div class="frame">{svg_build}
  <div class="hud">
    <div class="panel wavechip">WAVE 13<small>/20</small></div>
    <div class="panel health">
      <div class="lbl">HEALTH</div>
      <div class="hbar"><i></i><b>224 / 250</b></div>
      <div class="chips"><span>gold <b>184</b></span><span>kills <b>7.3K</b></span><span>cores <b>+212</b></span></div>
    </div>
    <div class="panel banner">
      <div class="t">BUILD PHASE</div>
      <div class="s">SPACE STARTS THE WAVE</div>
    </div>
    <div class="panel ctl">
      <div class="slot"><div class="k">SPEED</div><div class="n">1&times;</div></div>
      <div class="slot"><div class="k">Q &middot; STRIKE</div><div class="n">RDY</div></div>
    </div>
    <div class="panel slots">
      <div class="slot sel"><div class="k">1</div><div class="n">GUN</div><div class="c">15</div></div>
      <div class="slot"><div class="k">2</div><div class="n">CANNON</div><div class="c">60</div></div>
      <div class="slot dim"><div class="k">3</div><div class="n">LASER</div><div class="c">150</div></div>
    </div>
    <button class="startbtn">START WAVE</button>
  </div>
</div>
<div class="frame-label">FRAME 02 &mdash; BUILD PHASE &middot; ranges visible, cyan = selected/ghost, stains persist between waves</div>

<div class="legend">
  <div>
    <h2>TOKENS</h2>
    <div class="swatches">
      <div class="sw"><i style="background:{C['soil']}"></i>soil {C['soil']}</div>
      <div class="sw"><i style="background:{C['soil_worn']}"></i>worn path {C['soil_worn']}</div>
      <div class="sw"><i style="background:{C['verge']}"></i>verge {C['verge']}</div>
      <div class="sw"><i style="background:{C['thicket']}"></i>thicket {C['thicket']}</div>
      <div class="sw"><i style="background:{C['mite']}"></i>mite {C['mite']}</div>
      <div class="sw"><i style="background:{C['dart']}"></i>dart {C['dart']}</div>
      <div class="sw"><i style="background:{C['brute']}"></i>brute {C['brute']}</div>
      <div class="sw"><i style="background:{C['titan_core']}"></i>titan core {C['titan_core']}</div>
      <div class="sw"><i style="background:{C['steel']}"></i>steel {C['steel']}</div>
      <div class="sw"><i style="background:{C['fire']}"></i>fire {C['fire']}</div>
      <div class="sw"><i style="background:{C['stain']}"></i>stain {C['stain']}</div>
      <div class="sw"><i style="background:{C['cyan']}"></i>select {C['cyan']}</div>
    </div>
  </div>
  <div>
    <h2>IMPLEMENTATION RULES</h2>
    <ol>
      <li><b>Field fills the window.</b> No app bars; HUD floats as panels with 14px margins.</li>
      <li><b>Terrain pre-rendered once</b> to an offscreen canvas: verge, path + carved edges, noise, treeline, rampart.</li>
      <li><b>Kill stains are persistent</b>: stamp on a dedicated offscreen canvas at death position; never cleared during a run.</li>
      <li><b>Horde mass = two-tone pixel rects</b> (dark outline pass + color pass, integer coords) — measured 6x faster than sprite blits at 20k. Big units (brute/titan) use round glow sprites.</li>
      <li><b>Fire renders additively</b> ('lighter'): radial glow sprites at muzzles/impacts; smoke = gray alpha circles.</li>
      <li><b>Cyan is interaction-only</b>: selected slot, ghost cell, selected range ring. Never decoration.</li>
      <li><b>Ranges only in build phase</b> (dashed, white 22%); selected/ghost in cyan.</li>
      <li><b>Type: Bahnschrift</b>, tabular numerals; labels letter-spaced uppercase; no emoji, no glow text.</li>
      <li><b>Vignette 34%</b> warm-dark at edges, painted last over the field.</li>
    </ol>
  </div>
</div>
</body></html>"""

out = __file__.replace("gen_template.py", "template.html")
with open(out, "w", encoding="utf-8") as f:
    f.write(HTML)
print("wrote", out, len(HTML), "bytes")
