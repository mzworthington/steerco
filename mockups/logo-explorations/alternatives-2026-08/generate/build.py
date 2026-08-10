"""Emit the alternative marks as SVG, auto-centred and optically normalised."""

import os, subprocess, sys
from brandlib import INK, PAPER, OCEAN, f, render, ink_bbox, wordmark_path
from concepts import CONCEPTS, FRAUNCES, FRAUNCES_AXES

OCEAN_LIGHT = "#7fb2e0"  # proposed ramp step so a two-tone mark survives on ink
from paths import OUT as _OUT, TMP

OUT = sys.argv[1] if len(sys.argv) > 1 else _OUT
LIVE = 400.0
ART = 512.0

PALETTES = {
    "light": {"solid": INK, "accent": OCEAN},
    "dark": {"solid": PAPER, "accent": OCEAN_LIGHT},
    "mono": {"solid": INK, "accent": INK},
}


def shapes_svg(shapes, palette, transform):
    body = []
    for d, role in shapes:
        if role == "raw-solid":
            body.append(d.replace("<path ", f'<path fill="{palette["solid"]}" '))
            continue
        fill = palette["accent"] if role == "accent" else palette["solid"]
        rule = ' fill-rule="evenodd"' if role == "evenodd" else ""
        body.append(f'<path fill="{fill}"{rule} d="{d}" />')
    return f'<g transform="{transform}">\n    ' + "\n    ".join(body) + "\n  </g>"


def icon_svg(shapes, palette, fit, title, tile=None):
    sc, dx, dy = fit[:3]
    tr = f"translate({f(ART / 2 + dx)} {f(ART / 2 + dy)}) scale({f(sc)})"
    bg = ""
    if tile:
        bg = f'\n  <rect width="512" height="512" rx="112" fill="{tile}" />'
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" '
        f'aria-label="{title}">{bg}\n  '
        + shapes_svg(shapes, palette, tr)
        + "\n</svg>\n"
    )


def measure(shapes, palette):
    """Render on an oversized artboard (so nothing clips), then solve scale + centring."""
    tmp_svg, tmp_png = f"{TMP}/m.svg", f"{TMP}/m.png"
    body = shapes_svg(shapes, palette, "translate(512 512)")
    open(tmp_svg, "w").write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">{body}</svg>'
    )
    render(tmp_svg, tmp_png, w=1024)
    x0, y0, x1, y1, w, h, _ = ink_bbox(tmp_png)
    bw, bh = x1 - x0 + 1, y1 - y0 + 1
    sc = LIVE / max(bw, bh)
    cx, cy = (x0 + x1 + 1) / 2 - 512, (y0 + y1 + 1) / 2 - 512
    return (sc, -cx * sc, -cy * sc, bw * sc, bh * sc)


def verify(path):
    png = f"{TMP}/v.png"
    render(path, png, w=512)
    x0, y0, x1, y1, w, h, total = ink_bbox(png)
    return {
        "dx": (x0 + x1 + 1) / 2 - 256,
        "dy": (y0 + y1 + 1) / 2 - 256,
        "w": x1 - x0 + 1,
        "h": y1 - y0 + 1,
        "cover": total / (w * h) * 100,
    }


def lockup_svg(shapes, palette, fit, height_ratio=1.30, max_width_ratio=2.1, gap_ratio=0.52):
    """Mark height is tied to cap height, not to the artboard, so every lockup reads level."""
    wm = wordmark_path("SteerLens", FRAUNCES, 100, FRAUNCES_AXES)
    cap = wm["cap"]
    x0, y0, x1, y1 = wm["bbox"]
    sc, dx, dy, inkw, inkh = fit
    icon_scale = height_ratio * cap / inkh
    if inkw * icon_scale > max_width_ratio * cap:
        icon_scale = max_width_ratio * cap / inkw
    iw, ih = inkw * icon_scale, inkh * icon_scale
    gap = gap_ratio * cap
    icon_cx = x0 - gap - iw / 2
    icon_cy = -cap / 2
    tr = (
        f"translate({f(icon_cx + dx * icon_scale)} {f(icon_cy + dy * icon_scale)}) "
        f"scale({f(sc * icon_scale)})"
    )
    minx = icon_cx - iw / 2
    maxx = x1
    miny = min(y0, icon_cy - ih / 2)
    maxy = max(y1, icon_cy + ih / 2)
    w, h = maxx - minx, maxy - miny
    body = shapes_svg(shapes, palette, tr)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{f(minx)} {f(miny)} {f(w)} {f(h)}" '
        f'role="img" aria-label="SteerLens">\n  '
        + body
        + f'\n  <path fill="{palette["solid"]}" d="{wm["d"]}" />\n</svg>\n'
    )


def wordmark_svg(palette):
    wm = wordmark_path("SteerLens", FRAUNCES, 100, FRAUNCES_AXES)
    x0, y0, x1, y1 = wm["bbox"]
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'viewBox="{f(x0)} {f(y0)} {f(x1 - x0)} {f(y1 - y0)}" role="img" aria-label="SteerLens">\n'
        f'  <path fill="{palette["solid"]}" d="{wm["d"]}" />\n</svg>\n'
    )


def main():
    os.makedirs(TMP, exist_ok=True)
    report = []
    for key, spec in CONCEPTS.items():
        d = f"{OUT}/{key}"
        os.makedirs(d, exist_ok=True)
        shapes = spec["build"]()
        fit = measure(shapes, PALETTES["light"])
        open(f"{d}/icon.svg", "w").write(
            icon_svg(shapes, PALETTES["light"], fit, f'SteerLens — {spec["title"]}')
        )
        open(f"{d}/icon-mono.svg", "w").write(
            icon_svg(shapes, PALETTES["mono"], fit, f'SteerLens — {spec["title"]}')
        )
        open(f"{d}/icon-dark.svg", "w").write(
            icon_svg(shapes, PALETTES["dark"], fit, f'SteerLens — {spec["title"]}', tile=INK)
        )
        small = spec["small"]()
        sfit = measure(small, PALETTES["light"])
        open(f"{d}/icon-small.svg", "w").write(
            icon_svg(small, PALETTES["light"], sfit, f'SteerLens — {spec["title"]}')
        )
        open(f"{d}/favicon.svg", "w").write(
            icon_svg(small, PALETTES["dark"], sfit, "SteerLens", tile=INK)
        )
        open(f"{d}/lockup.svg", "w").write(lockup_svg(shapes, PALETTES["light"], fit))
        open(f"{d}/lockup-dark.svg", "w").write(lockup_svg(shapes, PALETTES["dark"], fit))
        v = verify(f"{d}/icon.svg")
        report.append((key, v))
    open(f"{OUT}/wordmark.svg", "w").write(wordmark_svg(PALETTES["light"]))
    print(f"{'concept':10s} {'off-centre':>12s} {'ink w x h':>14s} {'coverage':>9s}")
    for key, v in report:
        print(
            f"{key:10s} {v['dx']:+5.1f},{v['dy']:+5.1f}px {v['w']:6.0f} x{v['h']:5.0f} "
            f"{v['cover']:7.1f}%"
        )


if __name__ == "__main__":
    main()
