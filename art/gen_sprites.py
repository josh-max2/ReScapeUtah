"""SWARM sprite generator — ComfyUI (SDXL) -> game-ready PNGs.

Every asset the game needs is declared in ASSETS below. Run this and it
generates each one top-down, on a flat background, then auto-crops and
resizes to the game's grid. Re-run any time the style changes.

  python gen_sprites.py                # everything
  python gen_sprites.py tower          # only ids containing "tower"
  python gen_sprites.py --seed 7       # reproducible re-roll
  python gen_sprites.py --variants 4   # 4 options per asset to choose from

Requires ComfyUI running on 127.0.0.1:8188 with sd_xl_base_1.0 installed.
"""
import argparse
import io
import json
import os
import random
import sys
import urllib.parse
import urllib.request

COMFY = "http://127.0.0.1:8188"
CKPT = "sd_xl_base_1.0.safetensors"
OUT_RAW = os.path.join(os.path.dirname(__file__), "raw")
OUT_SPR = os.path.join(os.path.dirname(__file__), "sprites")

# The look. Edit STYLE once and every asset re-renders consistently.
# Two forces fight here: camera angle and object isolation. "flat lay" locks the
# angle but invites a scene, so isolation is carried by ICON framing — a pattern
# SDXL knows cold — and reinforced hard in the negatives.
CAM = (
    "a single isolated object, one object only, centered, "
    "viewed from directly above, straight-down overhead top view, no perspective"
)
STYLE = (
    "hand-painted game asset sprite, painterly texture, warm directional sunlight "
    "from upper left, soft contact shadow directly beneath the object, rich material "
    "detail, crisp readable silhouette, muted earthy palette with one saturated accent, "
    "high detail 2d game art"
)
NEG = (
    "three-quarter view, 3/4 view, angled view, perspective, side view, front view, "
    "isometric, tilted camera, horizon, vanishing point, "
    "many objects, multiple objects, repeated objects, pattern, tiled, grid of items, "
    "collection, group, scene, landscape, terrain, ground, sand, dirt field, "
    "text, caption, title, label, lettering, words, watermark, signature, logo, "
    "banner, ui bar, frame, border, collage, blurry, low detail, person, character, "
    "icon frame, rounded square frame, ui panel, button, plaque, inset panel, vignette"
)
BG = (
    "isolated on a plain flat white background, clean empty backdrop, "
    "product shot, cut out, no environment, no ground texture"
)

# Textures want the OPPOSITE of the object treatment: fill the frame edge to
# edge, no subject, no isolation, no shadow.
TEX_STYLE = (
    "seamless tileable ground surface, fills the entire frame edge to edge, viewed "
    "from directly above, flat even lighting, no shadows, hand-painted game texture, "
    "rich surface detail, natural irregular colour variation"
)
TEX_NEG = (
    "single object, centered subject, isolated, white background, border, frame, "
    "vignette, horizon, perspective, buildings, vehicles, people, text, watermark, "
    "logo, dramatic lighting, strong shadow, blurry, low detail"
)

# id, prompt, output px (fits the game grid: CELL=20)
ASSETS = [
    # --- towers (base + separately rotatable barrel where it matters) ---
    ("tower_autocannon", "a compact tank turret with one long gun barrel pointing right, riveted steel armor, hatch on top", 96),
    ("tower_flame",      "a flamethrower turret emplacement, fuel tanks, short wide nozzle, scorched metal", 96),
    ("tower_mortar",     "a mortar pit emplacement, wide short tube angled up, ammo crates, sandbag ring", 96),
    ("tower_cryo",       "a cryo sprayer turret, frost-covered coils, pale blue tanks, condenser fins", 96),
    ("tower_tesla",      "a tesla coil tower, copper rings stacked on a base, arcing electrode", 96),
    ("tower_gatling",    "a gatling gun nest, six rotating barrels, ammo belt, armored cupola", 96),
    ("tower_rocket",     "a rocket battery emplacement, four launch tubes in a box frame", 96),
    ("tower_railgun",    "a railgun emplacement, long twin rails, heavy capacitor block, cabling", 96),
    ("tower_lattice",    "a laser lattice tower, faceted violet crystal emitter on a hexagonal base", 96),
    ("tower_mine",       "a land mine cluster laid flat on dirt, low metal discs, warning markings", 64),
    ("wall_barrier",     "a concrete jersey barrier block with yellow and black hazard stripes", 64),
    # --- enemy vehicles (ONE image each; the game rotates them in code) ---
    ("enemy_mite",       "a small battered civilian hatchback car, rusty green paint, dented panels", 64),
    ("enemy_dart",       "a fast stripped-down racing buggy, lightweight, exposed roll cage, olive paint", 64),
    ("enemy_brute",      "a heavy armored pickup truck with steel plating and a reinforced bumper, dark green", 80),
    ("enemy_titan",      "a huge armored war rig truck, thick plating, amber warning lights, menacing", 112),
    ("prop_fort",        "a fortified concrete bunker keep with steel gate and battlements, top-down", 160),
    ("prop_rift",        "a glowing red fissure in the ground, cracked earth, ominous light", 160),
]

# Terrain textures — generated with TEX_STYLE/TEX_NEG, kept at full size and
# tiled by the renderer. (id, prompt, output px)
TEXTURES = [
    ("terrain_dirt", "fine dry sandy soil, smooth loose dust, soft subtle tonal "
                     "variation, faint wind ripples, warm earthy brown, very low "
                     "contrast, featureless",
     512, "stones, pebbles, rocks, gravel, cobblestone, cracked mud, tiles, bricks, "
          "mosaic, cells, scales, hard edges, high contrast"),
    ("terrain_grass", "coarse dry meadow grass and scrub, clumps and tufts, patches of "
                      "bare soil, olive and sage green",
     512, "stones, cobblestone, tiles, bricks, mosaic"),
    ("terrain_rock", "rough grey rock and rubble ground, cracked stone slabs, lichen "
                     "patches, dark crevices", 512, ""),
]


def q(payload):
    req = urllib.request.Request(f"{COMFY}/prompt", data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())


def history(pid):
    with urllib.request.urlopen(f"{COMFY}/history/{pid}") as r:
        return json.loads(r.read())


def fetch_image(info):
    p = urllib.parse.urlencode({"filename": info["filename"], "subfolder": info["subfolder"],
                                "type": info["type"]})
    with urllib.request.urlopen(f"{COMFY}/view?{p}") as r:
        return r.read()


def workflow(prompt, seed, steps=30, cfg=7.0, w=1024, h=1024, texture=False, extra_neg=""):
    """Minimal SDXL txt2img graph in ComfyUI API format."""
    pos = f"{prompt}, {TEX_STYLE}" if texture else f"{CAM}, {prompt}, {STYLE}, {BG}, {CAM}"
    neg = (TEX_NEG if texture else NEG) + (f", {extra_neg}" if extra_neg else "")
    return {
        "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": CKPT}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": pos, "clip": ["4", 1]}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"text": neg, "clip": ["4", 1]}},
        "5": {"class_type": "EmptyLatentImage", "inputs": {"width": w, "height": h, "batch_size": 1}},
        "3": {"class_type": "KSampler",
              "inputs": {"seed": seed, "steps": steps, "cfg": cfg, "sampler_name": "dpmpp_2m",
                         "scheduler": "karras", "denoise": 1.0,
                         "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0],
                         "latent_image": ["5", 0]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": "swarm", "images": ["8", 0]}},
    }


def generate(prompt, seed, texture=False, extra_neg=""):
    pid = q({"prompt": workflow(prompt, seed, texture=texture, extra_neg=extra_neg)})["prompt_id"]
    import time
    for _ in range(600):
        time.sleep(1)
        h = history(pid)
        if pid in h:
            outs = h[pid]["outputs"]
            for node in outs.values():
                for img in node.get("images", []):
                    return fetch_image(img)
            return None
    raise TimeoutError("generation timed out")


def postprocess(png_bytes, size, out_path):
    """Crop to the subject, drop the flat background, square-pad, resize."""
    from PIL import Image
    import numpy as np
    im = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
    a = np.array(im)
    rgb = a[:, :, :3].astype(int)
    # background = the dominant border color; anything far from it is subject
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    bg = np.median(border, axis=0)
    dist = np.sqrt(((rgb - bg) ** 2).sum(axis=2))
    mask = dist > 58
    if mask.sum() < 200:
        mask = dist > 30
    ys, xs = np.where(mask)
    if len(ys) == 0:
        im.resize((size, size), Image.LANCZOS).save(out_path)
        return
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    pad = 6
    y0 = max(0, y0 - pad); x0 = max(0, x0 - pad)
    y1 = min(a.shape[0] - 1, y1 + pad); x1 = min(a.shape[1] - 1, x1 + pad)
    alpha = (np.clip((dist - 34) / 26, 0, 1) * 255).astype("uint8")
    a[:, :, 3] = alpha
    sub = Image.fromarray(a).crop((x0, y0, x1 + 1, y1 + 1))
    side = max(sub.size)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(sub, ((side - sub.width) // 2, (side - sub.height) // 2))
    canvas.resize((size, size), Image.LANCZOS).save(out_path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("filter", nargs="?", default="")
    ap.add_argument("--seed", type=int, default=None)
    ap.add_argument("--variants", type=int, default=1)
    args = ap.parse_args()

    os.makedirs(OUT_RAW, exist_ok=True)
    os.makedirs(OUT_SPR, exist_ok=True)
    OUT_TEX = os.path.join(os.path.dirname(__file__), "textures")
    os.makedirs(OUT_TEX, exist_ok=True)

    # Textures: no cropping, no background removal — saved whole for tiling.
    tex = [t for t in TEXTURES if args.filter in t[0]]
    for tid, prompt, size, xneg in tex:
        for v in range(args.variants):
            seed = args.seed if args.seed is not None else random.randint(1, 2 ** 31)
            seed += v * 1013
            tag = tid if args.variants == 1 else f"{tid}_v{v+1}"
            print(f"  [tex] {tag} (seed {seed}) ...", end="", flush=True)
            png = generate(prompt, seed, texture=True, extra_neg=xneg)
            if not png:
                print(" FAILED")
                continue
            from PIL import Image
            Image.open(io.BytesIO(png)).convert("RGB").resize((size, size), Image.LANCZOS) \
                .save(os.path.join(OUT_TEX, f"{tag}.png"))
            print(" ok")
    if tex:
        print(f"textures -> {OUT_TEX}")

    todo = [a for a in ASSETS if args.filter in a[0]]
    if not todo:
        if not tex:
            print(f"no assets match '{args.filter}'")
        return
    print(f"{len(todo)} assets x {args.variants} variant(s)")
    for aid, prompt, size in todo:
        for v in range(args.variants):
            seed = args.seed if args.seed is not None else random.randint(1, 2 ** 31)
            seed += v * 1013
            tag = aid if args.variants == 1 else f"{aid}_v{v+1}"
            print(f"  {tag} (seed {seed}) ...", end="", flush=True)
            png = generate(prompt, seed)
            if not png:
                print(" FAILED")
                continue
            with open(os.path.join(OUT_RAW, f"{tag}.png"), "wb") as f:
                f.write(png)
            postprocess(png, size, os.path.join(OUT_SPR, f"{tag}.png"))
            print(" ok")
    print(f"\nraw     -> {OUT_RAW}\nsprites -> {OUT_SPR}")


if __name__ == "__main__":
    main()
