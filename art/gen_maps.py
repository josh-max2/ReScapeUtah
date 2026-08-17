"""Paint new tracks. Maps ARE images — this is the reproducible recipe for them.

  WHITE = road · BLACK = wall · RED = spawn strip · GREEN = goal

Two rules the classifier imposes, learned from map2:
  * roads must be at least ~90px wide. Walkability is AREA COVERAGE of fine
    samples over a 20px cell, and clearance/repel wants PATH_RADIUS (40px) of
    room, so a thinner strand reads as wall in places and pinches the horde.
  * the spawn strip must be a DEEP band, not a gate. At horde scale a narrow
    mouth jams and the wave trickles instead of flooding.

    python gen_maps.py            # writes every track to public/maps/
"""
import math
import os
from PIL import Image, ImageDraw

W, H = 1536, 960
ROAD = (255, 255, 255, 255)
WALL = (0, 0, 0, 255)
SPAWN = (220, 30, 30, 255)
GOAL = (40, 210, 60, 255)
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "maps")

WIDE = 104   # trunk width; comfortably over the 90px floor
LANE = 96


def stroke(d, pts, w):
    """Thick polyline with rounded joints — square joints leave notches that
    the area-coverage classifier turns into wall nibs mid-road."""
    d.line(pts, fill=ROAD, width=w, joint="curve")
    r = w // 2
    for x, y in pts:
        d.ellipse([x - r, y - r, x + r, y + r], fill=ROAD)


def finish(img, d, name, entry_y=H // 2):
    """Close the map out.

    The spawn band MUST be centred on the road that actually meets the left
    edge. Painting it at a fixed mid-height cost a whole track: red classifies
    as open and the spawn extent is read from its vertical span, so a band that
    misses its road becomes an open pocket with no route out — the flow field
    reports the map sealed and the horde grinds in the rift. maps.py caught it;
    nothing else would have.
    """
    top = max(0, entry_y - 230)
    d.rectangle([0, top, 96, min(H, entry_y + 230)], fill=SPAWN)
    # Goal: a blob at the fort end.
    d.ellipse([W - 190, H // 2 - 60, W - 70, H // 2 + 60], fill=GOAL)
    path = os.path.abspath(os.path.join(OUT, f"{name}.png"))
    img.save(path)
    print(f"  wrote {path}")


def delta():
    """Splits into three branches that rejoin — rewards spreading lanes wide."""
    img = Image.new("RGBA", (W, H), WALL)
    d = ImageDraw.Draw(img)
    stroke(d, [(0, H // 2), (300, H // 2)], WIDE)
    for dy in (-300, 0, 300):
        stroke(d, [(300, H // 2), (520, H // 2 + dy * 0.75),
                   (900, H // 2 + dy), (1180, H // 2 + dy * 0.6),
                   (1330, H // 2)], LANE)
    stroke(d, [(1330, H // 2), (W, H // 2)], WIDE)
    finish(img, d, "delta")


def coil():
    """A long serpentine: maximum track length, so depth of defence pays."""
    img = Image.new("RGBA", (W, H), WALL)
    d = ImageDraw.Draw(img)
    pts = [(0, 150), (1180, 150)]
    y = 150
    left = True
    while y < H - 220:
        ny = y + 200
        x = 1180 if left else 300
        pts += [(x, ny)]
        pts += [(300 if left else 1180, ny)]
        y = ny
        left = not left
    pts += [(pts[-1][0], H // 2), (W, H // 2)]
    stroke(d, pts, LANE)
    finish(img, d, "coil", 150)


def basin():
    """One wide bowl that funnels — the crowd bunches, so AoE shines."""
    img = Image.new("RGBA", (W, H), WALL)
    d = ImageDraw.Draw(img)
    for i in range(9):
        t = i / 8
        y = H // 2 + math.sin(t * math.pi) * 0 + (t - 0.5) * 620
        stroke(d, [(0, H // 2), (360, y), (760, y), (1120, H // 2)], LANE)
    stroke(d, [(1120, H // 2), (W, H // 2)], WIDE)
    finish(img, d, "basin")


if __name__ == "__main__":
    os.makedirs(os.path.abspath(OUT), exist_ok=True)
    delta()
    coil()
    basin()
