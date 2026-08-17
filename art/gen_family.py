"""Style-consistent asset FAMILY: generate one hero, then derive siblings.

The consistency problem with AI game art is that ten separately-prompted
assets look like ten different artists. This does what the user asked: make a
first image, then use it as CONTEXT so everything after inherits its palette,
lighting, material feel and framing.

Method: img2img. The hero image is VAE-encoded and used as the starting latent
for each sibling at partial denoise — high enough to become a different object,
low enough to keep the hero's look. Costs nothing extra (no IPAdapter weights).

  python gen_family.py                 # hero + all siblings
  python gen_family.py --denoise 0.72  # looser (more variety, less consistency)

Requires ComfyUI on 127.0.0.1:8188 with sd_xl_base_1.0.
"""
import argparse
import io
import json
import os
import random
import shutil
import time
import urllib.parse
import urllib.request

from gen_sprites import (
    COMFY, CKPT, CAM, STYLE, NEG, BG, OUT_RAW, q, history, fetch_image, postprocess,
)

COMFY_INPUT = (r"C:\AI\ComfyUI\ComfyUI_windows_portable_nvidia\ComfyUI_windows_portable"
               r"\ComfyUI\input")
OUT_FAM = os.path.join(os.path.dirname(__file__), "family")

# The hero defines the look; siblings inherit it.
HERO = ("tower_autocannon",
        "a compact armoured gun turret with one thick barrel pointing right, "
        "riveted steel plating, hatch on top", 96)

SIBLINGS = [
    ("tower_mortar", "a squat mortar emplacement, wide short tube angled upward, "
                     "ammo crates, sandbag ring", 96),
    ("tower_tesla", "a tesla coil tower, stacked copper rings on an armoured base, "
                    "arcing electrode on top", 96),
    ("tower_cryo", "a cryo sprayer turret, frost-covered coils and pale blue "
                   "pressure tanks, condenser fins", 96),
    ("tower_railgun", "a railgun emplacement, long twin parallel rails pointing "
                      "right, heavy capacitor block, thick cabling", 96),
]


def img2img_workflow(prompt, seed, ref_name, denoise, steps=30, cfg=7.0):
    """SDXL img2img: the hero image becomes the starting latent."""
    return {
        "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": CKPT}},
        "10": {"class_type": "LoadImage", "inputs": {"image": ref_name, "upload": "image"}},
        "11": {"class_type": "VAEEncode", "inputs": {"pixels": ["10", 0], "vae": ["4", 2]}},
        "6": {"class_type": "CLIPTextEncode",
              "inputs": {"text": f"{CAM}, {prompt}, {STYLE}, {BG}, {CAM}", "clip": ["4", 1]}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["4", 1]}},
        "3": {"class_type": "KSampler",
              "inputs": {"seed": seed, "steps": steps, "cfg": cfg,
                         "sampler_name": "dpmpp_2m", "scheduler": "karras",
                         "denoise": denoise,
                         "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0],
                         "latent_image": ["11", 0]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": "swarmfam", "images": ["8", 0]}},
    }


def txt2img_workflow(prompt, seed, steps=30, cfg=7.0):
    return {
        "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": CKPT}},
        "6": {"class_type": "CLIPTextEncode",
              "inputs": {"text": f"{CAM}, {prompt}, {STYLE}, {BG}, {CAM}", "clip": ["4", 1]}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["4", 1]}},
        "5": {"class_type": "EmptyLatentImage",
              "inputs": {"width": 1024, "height": 1024, "batch_size": 1}},
        "3": {"class_type": "KSampler",
              "inputs": {"seed": seed, "steps": steps, "cfg": cfg,
                         "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0,
                         "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0],
                         "latent_image": ["5", 0]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": "swarmfam", "images": ["8", 0]}},
    }


def run(wf):
    pid = q({"prompt": wf})["prompt_id"]
    for _ in range(900):
        time.sleep(1)
        h = history(pid)
        if pid in h:
            for node in h[pid]["outputs"].values():
                for img in node.get("images", []):
                    return fetch_image(img)
            return None
    raise TimeoutError("generation timed out")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--denoise", type=float, default=0.68)
    ap.add_argument("--seed", type=int, default=4242)
    args = ap.parse_args()
    os.makedirs(OUT_FAM, exist_ok=True)
    os.makedirs(OUT_RAW, exist_ok=True)

    hid, hprompt, hsize = HERO
    print(f"hero: {hid} ...", end="", flush=True)
    png = run(txt2img_workflow(hprompt, args.seed))
    hero_path = os.path.join(OUT_FAM, f"{hid}.png")
    with open(hero_path, "wb") as f:
        f.write(png)
    postprocess(png, hsize, os.path.join(OUT_FAM, f"{hid}_sprite.png"))
    print(" ok")

    # ComfyUI reads init images from its own input folder.
    ref_name = "swarm_hero.png"
    shutil.copyfile(hero_path, os.path.join(COMFY_INPUT, ref_name))

    for i, (sid, sprompt, ssize) in enumerate(SIBLINGS):
        print(f"sibling: {sid} (denoise {args.denoise}) ...", end="", flush=True)
        spng = run(img2img_workflow(sprompt, args.seed + 101 * (i + 1), ref_name, args.denoise))
        with open(os.path.join(OUT_FAM, f"{sid}.png"), "wb") as f:
            f.write(spng)
        postprocess(spng, ssize, os.path.join(OUT_FAM, f"{sid}_sprite.png"))
        print(" ok")

    print(f"\nfamily -> {OUT_FAM}")


if __name__ == "__main__":
    main()
