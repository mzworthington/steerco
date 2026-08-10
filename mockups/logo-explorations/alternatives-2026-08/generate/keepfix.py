"""If the arrow stays: the shipped files with the geometry corrected.

Nothing here is a redesign — same shapes, put on a grid.
  * mark / favicon: rotate about the arrow's optical centre, then fill 78% of the artboard
  * lockup: arrow scaled to hexagon height, shared centre line, even 120u rhythm, trimmed artboard
"""

import math
import os

from brandlib import INK, PAPER, f, render, ink_bbox

from paths import OUT as _OUT, TMP

OUT = os.path.join(_OUT, "keep-and-fix")
ARROW = "M 130 0 L -130 102 Q -48 0 -130 -102 Z"

# measured on design-pack/mark.svg: ink bbox is 255.9u square, centred at (213.9, 286.1)
INK_C = (213.9, 286.1)
INK_SIZE = 255.9


def square(fill, tile=None, fill_ratio=0.78, size=500, radius=72):
    s = fill_ratio * size / INK_SIZE
    bg = f'\n  <rect width="{size}" height="{size}" rx="{radius}" fill="{tile}" />' if tile else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" role="img" '
        f'aria-label="SteerLens">{bg}\n'
        f'  <g transform="translate({size / 2} {size / 2}) scale({f(s)}) '
        f'translate({f(-INK_C[0])} {f(-INK_C[1])})">\n'
        f'    <g transform="translate(250 250) rotate(-45)">\n'
        f'      <path fill="{fill}" d="{ARROW}" />\n'
        f"    </g>\n  </g>\n</svg>\n"
    )


def favicon():
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" '
        'role="img" aria-label="SteerLens">\n'
        f'  <rect width="32" height="32" rx="7" fill="{INK}" />\n'
        f'  <g transform="translate(16 16) scale({f(0.74 * 32 / INK_SIZE)}) '
        f'translate({f(-INK_C[0])} {f(-INK_C[1])})">\n'
        '    <g transform="translate(250 250) rotate(-45)">\n'
        f'      <path fill="{PAPER}" d="{ARROW}" />\n'
        "    </g>\n  </g>\n</svg>\n"
    )


def hexagon(cx, cy, h=76):
    w = h * 32.91 / 38
    return (
        f"M {f(cx)} {f(cy - h / 2)} L {f(cx + w / 2)} {f(cy - h / 2 + 19)} "
        f"L {f(cx + w / 2)} {f(cy + h / 2 - 19)} L {f(cx)} {f(cy + h / 2)} "
        f"L {f(cx - w / 2)} {f(cy + h / 2 - 19)} L {f(cx - w / 2)} {f(cy - h / 2 + 19)} Z"
    )


def lockup(fill=INK):
    h = 76
    step = 120
    cy = h / 2
    x1, x2, x3 = 32.91, 32.91 + step, 32.91 + 2 * step
    s = h / 94.75  # shipped arrow bbox is 94.75u tall at scale 1
    # the shipped arrow's bbox centre is 13.45u down-left of its rotation origin: undo that
    ox, oy = 13.45 * s, -13.45 * s
    parts = [hexagon(x1, cy, h), hexagon(x2, cy, h)]
    arrow = (
        f'<g transform="translate({f(x3 + ox)} {f(cy + oy)}) scale({f(s)}) rotate(-45)">'
        f'<path fill="{fill}" d="M 48 0 L -48 38 Q -18 0 -48 -38 Z" /></g>'
    )
    w = x3 + h / 2
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {f(w)} {f(h)}" role="img" '
        f'aria-label="SteerLens">\n'
        f'  <path fill="{fill}" d="{" ".join(parts)}" />\n  {arrow}\n</svg>\n'
    )


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    open(f"{OUT}/mark.svg", "w").write(square(INK))
    open(f"{OUT}/mark-dark.svg", "w").write(square(PAPER, tile=INK))
    open(f"{OUT}/favicon.svg", "w").write(favicon())
    open(f"{OUT}/lockup.svg", "w").write(lockup())
    open(f"{OUT}/lockup-dark.svg", "w").write(lockup(PAPER))
    for name in ["mark.svg", "lockup.svg"]:
        png = os.path.join(TMP, f"kf_{name}.png")
        render(f"{OUT}/{name}", png, w=512)
        x0, y0, x1, y1, w, hh, total = ink_bbox(png)
        print(
            f"{name}: ink {x1 - x0 + 1}x{y1 - y0 + 1} in {w}x{hh}, "
            f"offset {((x0 + x1 + 1) / 2 - w / 2):+.1f},{((y0 + y1 + 1) / 2 - hh / 2):+.1f}, "
            f"fills {(x1 - x0 + 1) / w * 100:.0f}%W {(y1 - y0 + 1) / hh * 100:.0f}%H"
        )
