"""Six alternative SteerLens marks, generated on a 512 grid with a 400 live area.

Every mark is built from computed geometry, auto-centred on its ink bounding box, and
normalised so the live area is identical across the pack. Each concept ships a `small`
build: the same idea redrawn with fewer parts and heavier strokes for 16-24px use.
"""

import math
from brandlib import (
    P,
    f,
    pt,
    arc,
    circle_path,
    rounded_rect,
    annulus_sector,
    offset_polyline,
    wordmark_path,
)

import os
from paths import FONT_DIR

FRAUNCES = os.path.join(FONT_DIR, "Fraunces.ttf")
JAKARTA = os.path.join(FONT_DIR, "PlusJakartaSans.ttf")
FRAUNCES_AXES = {"wght": 600, "opsz": 144, "SOFT": 0, "WONK": 0}


# --------------------------------------------------------------- A aperture --
def aperture(R=196, gap=8, d=72, twist=12, rot=-90, n=3):
    """Three iris blades around a triangular opening — a lens you open deliberately."""
    out = []
    step = 360 / n
    half = step / 2
    for k in range(n):
        a = rot + k * step
        t0 = d / math.cos(math.radians(half + twist - gap))
        t1 = d / math.cos(math.radians(half - twist - gap))
        out.append(
            f"M {pt(P(R, a + gap))} {arc(R, P(R, a + step - gap), 0, 1)} "
            f"L {pt(P(t1, a + step - gap))} L {pt(P(t0, a + gap))} Z"
        )
    return [(" ".join(out), "solid")]


def aperture_small():
    return aperture(gap=12, d=88, twist=10)


# ------------------------------------------------------------------ B dial --
def dial(Ro=192, Ri=142, a0=133, a1=407, needle_deg=-68, tip_r=128, pivot=44):
    """A heading instrument: a measured sweep, and a course chosen on it."""
    ring = annulus_sector(Ro, Ri, a0, a1)
    hw_base, hw_tip = 27, 15
    n = (math.cos(math.radians(needle_deg + 90)), math.sin(math.radians(needle_deg + 90)))
    tip, base = P(tip_r, needle_deg), P(30, needle_deg)
    quad = [
        (base[0] + n[0] * hw_base, base[1] + n[1] * hw_base),
        (tip[0] + n[0] * hw_tip, tip[1] + n[1] * hw_tip),
        (tip[0] - n[0] * hw_tip, tip[1] - n[1] * hw_tip),
        (base[0] - n[0] * hw_base, base[1] - n[1] * hw_base),
    ]
    needle = "M " + " L ".join(pt(p) for p in quad) + " Z"
    return [(ring + " " + needle + " " + circle_path(0, 0, pivot), "solid")]


def dial_small():
    return dial(Ro=192, Ri=118, tip_r=112, pivot=54, a0=138, a1=402)


# ----------------------------------------------------------------- C align --
def align(h=64, rows=(-108, 0, 108), right=118, lefts=(-200, -128, -168), accent_row=1):
    """Three streams squared up to one line; the funded one carries the accent."""
    bars = [(rounded_rect(x, y - h / 2, right - x, h, h / 2), i) for i, (x, y) in enumerate(zip(lefts, rows))]
    solid = " ".join(b for b, i in bars if i != accent_row)
    accent = " ".join(b for b, i in bars if i == accent_row)
    spine = rounded_rect(146, -170, 44, 340, 22)
    return [(solid + " " + spine, "solid"), (accent, "accent")]


def align_small():
    return align(h=76, rows=(-112, 0, 112), right=112, lefts=(-200, -134, -172))


# -------------------------------------------------------------- D converge --
def _lens(cx, Rv, c):
    h = math.sqrt(Rv * Rv - c * c)
    return f"M {f(cx)} {f(-h)} {arc(Rv, (cx, h), 0, 1)} {arc(Rv, (cx, -h), 0, 1)} Z"


def converge(Rv=250, c=190, cx=-30, bh=28, ys=(-108, 0, 108), lead=24, focus_x=250, hw=14):
    """Three inputs enter, one lens, one decision: an optics diagram of the product."""
    half_w = Rv - c
    left, right = cx - half_w, cx + half_w
    ins = " ".join(rounded_rect(-250, y - bh / 2, (left - lead) + 250, bh, bh / 2) for y in ys)
    rays = []
    for y in ys:
        start = (right + lead, y)
        t = (focus_x - 54 - start[0]) / (focus_x - start[0])
        rays.append(offset_polyline([start, (focus_x - 54, y * (1 - t))], hw))
    return [
        (_lens(cx, Rv, c) + " " + ins, "solid"),
        (" ".join(rays) + " " + circle_path(focus_x, 0, 34), "accent"),
    ]


def converge_small(Rv=250, c=186, cx=0, bh=48, ys=(-118, 118), lead=32, out_h=56, tail=210):
    """16px fallback: drop the ray fan and one input; two in, one lens, one out."""
    half_w = Rv - c
    left, right = cx - half_w, cx + half_w
    ins = " ".join(rounded_rect(-tail, y - bh / 2, (left - lead) + tail, bh, bh / 2) for y in ys)
    out = rounded_rect(right + lead, -out_h / 2, tail - (right + lead) + 40, out_h, out_h / 2)
    return [(_lens(cx, Rv, c) + " " + ins, "solid"), (out, "accent")]


# ------------------------------------------------------------------ E turn --
def turn(hw=33, hole=30, pts=((-192, 84), (-16, 84), (156, -76))):
    """A route that makes one decisive turn; the counter is the decision point."""
    body = offset_polyline([tuple(p) for p in pts], hw)
    return [(body + " " + circle_path(pts[1][0], pts[1][1], hole, ccw=True), "evenodd")]


def turn_small():
    return turn(hw=38, hole=36)


# --------------------------------------------------------------- F monogram --
def monogram(Ro=196, Ri=152, a0=-32, a1=288, cap=170):
    """The safe pick: Fraunces S inside an aperture-cut ring."""
    ring = annulus_sector(Ro, Ri, a0, a1)
    s = wordmark_path("S", FRAUNCES, cap / 0.7, FRAUNCES_AXES)
    x0, y0, x1, y1 = s["bbox"]
    glyph = (
        f'<g transform="translate({f(-(x0 + x1) / 2)} {f(-(y0 + y1) / 2)})">'
        f'<path d="{s["d"]}" /></g>'
    )
    return [(ring, "solid"), (glyph, "raw-solid")]


def monogram_small():
    return monogram(Ro=196, Ri=144, cap=176)


CONCEPTS = {
    "aperture": {
        "title": "Aperture",
        "line": "Three blades, one opening. A lens you set on purpose — how much you let in.",
        "build": aperture,
        "small": aperture_small,
    },
    "dial": {
        "title": "Dial",
        "line": "A heading instrument. Measured sweep, one course chosen on it.",
        "build": dial,
        "small": dial_small,
    },
    "align": {
        "title": "Align",
        "line": "Strategy, team shape and evidence squared up to one line; the funded bet in ocean.",
        "build": align,
        "small": align_small,
    },
    "converge": {
        "title": "Converge",
        "line": "Three inputs, one lens, one decision — the product drawn as an optics diagram.",
        "build": converge,
        "small": converge_small,
    },
    "turn": {
        "title": "Turn",
        "line": "A route with one decisive turn; the counter marks where the call was made.",
        "build": turn,
        "small": turn_small,
    },
    "monogram": {
        "title": "Monogram",
        "line": "The safe pick: a Fraunces S inside an aperture-cut ring.",
        "build": monogram,
        "small": monogram_small,
    },
}
