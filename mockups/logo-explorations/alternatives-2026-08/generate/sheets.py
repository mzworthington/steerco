"""Compose contact sheets from the generated SVGs."""

import os, re, sys
from brandlib import INK, PAPER, OCEAN, f, render, nearest_upscale, data_uri

from paths import OUT, TMP
SANS = "Plus Jakarta Sans, sans-serif"
SERIF = "Fraunces, serif"
MUTED = "#5c6570"
LINE = "#ddd8d2"


def embed(path, x, y, w, h, opacity=None):
    """Inline an SVG file as a nested <svg> placed in a box."""
    src = open(path).read()
    vb = re.search(r'viewBox="([^"]+)"', src).group(1)
    inner = src.split(">", 1)[1].rsplit("</svg>", 1)[0]
    op = f' opacity="{opacity}"' if opacity else ""
    return (
        f'<svg x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" viewBox="{vb}"'
        f' preserveAspectRatio="xMidYMid meet"{op}>{inner}</svg>'
    )


def text(s, x, y, size=15, fill=INK, family=SANS, weight=600, anchor="start", spacing=0):
    return (
        f'<text x="{f(x)}" y="{f(y)}" font-family="{family}" font-size="{size}" '
        f'font-weight="{weight}" fill="{fill}" text-anchor="{anchor}" '
        f'letter-spacing="{spacing}">{s}</text>'
    )


def card(x, y, w, h, fill=PAPER, stroke=LINE, r=18):
    return (
        f'<rect x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="{r}" '
        f'fill="{fill}" stroke="{stroke}" />'
    )


def pixel_strip(svg_path, sizes, x, y, factor, bg=None, label_fill=MUTED, labels=True, gap=16):
    """True-pixel renders, magnified nearest-neighbour so the reader sees real aliasing.

    `y` is the vertical centre of the strip; tiles are centred on it.
    """
    parts = []
    cx = x
    for s in sizes:
        base = os.path.basename(os.path.dirname(svg_path)) + "-" + os.path.basename(svg_path)
        png = f"{TMP}/px_{base}_{s}.png"
        up = f"{TMP}/px_{base}_{s}_up.png"
        render(svg_path, png, w=s, background=bg)
        W, H = nearest_upscale(png, up, factor)
        parts.append(
            f'<image x="{f(cx)}" y="{f(y - H / 2)}" width="{W}" height="{H}" href="{data_uri(up)}" />'
        )
        if labels:
            parts.append(
                text(f"{s}px", cx + W / 2, y - sizes[-1] * factor / 2 - 12, 11, label_fill, weight=600, anchor="middle")
            )
        cx += W + gap
    return "".join(parts), cx - x - gap
