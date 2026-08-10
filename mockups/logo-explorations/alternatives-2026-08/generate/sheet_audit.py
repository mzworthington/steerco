"""Sheet 1 — what is wrong with the shipped pack, drawn on top of the shipped files."""

from brandlib import INK, PAPER, OCEAN, f, render
from sheets import embed, text, card, pixel_strip, SANS, SERIF, MUTED, LINE

import os

from paths import DESIGN_PACK as DP, TMP, SHEETS
CORAL = "#d84c40"
W, H = 1660, 1080
p = [f'<rect width="{W}" height="{H}" fill="{PAPER}" />']

p.append(text("SteerLens design-pack — audit of the shipped mark", 48, 66, 30, INK, SERIF, 600))
p.append(
    text(
        "Every number below is measured off design-pack/*.svg rendered with librsvg, not eyeballed.",
        48,
        98,
        16,
        MUTED,
        SANS,
        500,
    )
)

CW, CH = 512, 400
GX, GY = 48, 130


def panel(i, j, title, note):
    x, y = GX + i * (CW + 24), GY + j * (CH + 40)
    p.append(card(x, y, CW, CH, fill="#ffffff"))
    p.append(text(title, x + 28, y + 40, 19, INK, SANS, 700))
    p.append(text(note, x + 28, y + 66, 14, MUTED, SANS, 500))
    return x, y


# --- 1: off centre -----------------------------------------------------------
x, y = panel(0, 0, "The square mark is off its own centre", "mark.svg · rotated about the wrong point")
bx, by, bs = x + 150, y + 96, 260
p.append(f'<rect x="{bx}" y="{by}" width="{bs}" height="{bs}" fill="#fbfaf8" stroke="{LINE}" />')
p.append(embed(f"{DP}/mark.svg", bx, by, bs, bs))
# measured ink bbox at 512: x 88..349, y 162..423
ix, iy = bx + bs * 88 / 512, by + bs * 162 / 512
iw = bs * 262 / 512
p.append(
    f'<rect x="{f(ix)}" y="{f(iy)}" width="{f(iw)}" height="{f(iw)}" fill="none" '
    f'stroke="{CORAL}" stroke-width="2" stroke-dasharray="6 4" />'
)
p.append(
    f'<path d="M {bx} {by + bs / 2} H {bx + bs} M {bx + bs / 2} {by} V {by + bs}" '
    f'stroke="{OCEAN}" stroke-width="1.5" />'
)
p.append(
    f'<path d="M {f(ix + iw / 2)} {f(iy + iw / 2)} L {f(bx + bs / 2)} {f(by + bs / 2)}" '
    f'stroke="{CORAL}" stroke-width="3" />'
)
p.append(f'<circle cx="{f(ix + iw / 2)}" cy="{f(iy + iw / 2)}" r="5" fill="{CORAL}" />')
p.append(text("artboard centre", bx + bs / 2 + 10, by + 18, 12, OCEAN, SANS, 600))
p.append(text("ink centre", ix + iw / 2 - 96, iy + iw / 2 + 26, 12, CORAL, SANS, 600))
p.append(text("−37px, +37px at 512 (7.2% of the canvas)", x + 28, y + CH - 46, 15, CORAL, SANS, 700))
p.append(text("Ink spans only 51% of the artboard, so it also reads small.", x + 28, y + CH - 22, 14, MUTED, SANS, 500))

# --- 2: circular crop --------------------------------------------------------
x, y = panel(1, 0, "Which is visible the moment it is cropped", "avatars, PWA masks, Slack, GitHub")
p.append('<clipPath id="cc"><circle cx="0" cy="0" r="1" /></clipPath>')
for k, (lbl, dx) in enumerate([("shipped", 0), ("re-centred", 232)]):
    cx0, cy0, d = x + 44 + dx, y + 104, 200
    p.append(f'<circle cx="{cx0 + d / 2}" cy="{cy0 + d / 2}" r="{d / 2}" fill="{INK}" />')
    p.append(
        f'<clipPath id="clip{k}"><circle cx="{cx0 + d / 2}" cy="{cy0 + d / 2}" r="{d / 2}" /></clipPath>'
    )
    off = 0 if k == 0 else -37 / 512 * d
    p.append(
        f'<g clip-path="url(#clip{k})">'
        + embed(f"{DP}/mark-dark.svg", cx0 - (0 if k == 0 else off), cy0 + (0 if k == 0 else off), d, d)
        + "</g>"
    )
    p.append(
        f'<path d="M {cx0 + d / 2} {cy0} V {cy0 + d} M {cx0} {cy0 + d / 2} H {cx0 + d} " '
        f'stroke="{PAPER}" stroke-opacity="0.35" stroke-width="1.5" />'
    )
    p.append(text(lbl, cx0 + d / 2, cy0 + d + 30, 14, MUTED, SANS, 600, anchor="middle"))
p.append(
    text(
        "The arrow leans into the bottom-left quadrant; the top-right is dead space.",
        x + 28,
        y + CH - 34,
        14,
        MUTED,
        SANS,
        500,
    )
)

# --- 3: favicon at real sizes ------------------------------------------------
x, y = panel(2, 0, "Favicon at the sizes browsers actually draw", "magnified ×6, nearest neighbour")
strip, sw = pixel_strip(f"{DP}/favicon.svg", [16, 24, 32], x + 40, y + 100, 6)
p.append(strip)
p.append(
    text(
        "The scooped tail closes up; the glyph covers 8% of the tile",
        x + 28,
        y + CH - 64,
        14,
        MUTED,
        SANS,
        500,
    )
)
p.append(text("and still sits low-left inside it.", x + 28, y + CH - 42, 14, MUTED, SANS, 500))

# --- 4: lockup alignment -----------------------------------------------------
x, y = panel(0, 1, "The wide mark has no shared centre line", "mark-lockup.svg · measured in viewBox units")
lx, ly, lw = x + 30, y + 124, 330
lh = lw * 200 / 356
p.append(f'<rect x="{lx}" y="{ly}" width="{lw}" height="{lh}" fill="#fbfaf8" stroke="{LINE}" />')
p.append(embed(f"{DP}/mark-lockup.svg", lx, ly, lw, lh))
u = lw / 356
p.append(
    f'<path d="M {lx} {f(ly + 100 * u)} H {lx + lw}" stroke="{OCEAN}" stroke-width="1.5" '
    f'stroke-dasharray="5 4" />'
)
p.append(
    f'<path d="M {f(lx + 230 * u)} {f(ly + 113.4 * u)} H {lx + lw}" stroke="{CORAL}" '
    f'stroke-width="1.5" stroke-dasharray="5 4" />'
)
p.append(text("hexagon centre", lx + lw + 10, ly + 100 * u + 4, 12, OCEAN, SANS, 600))
p.append(text("arrow centre,", lx + lw + 10, ly + 113.4 * u + 26, 12, CORAL, SANS, 600))
p.append(text("13.4u lower", lx + lw + 10, ly + 113.4 * u + 42, 12, CORAL, SANS, 600))
for lbl, yy in [("uneven rhythm: 120u then 98.6u", 0), ("padding 37.1u left vs 20.1u right", 22)]:
    p.append(text(lbl, x + 28, y + CH - 70 + yy, 14, MUTED, SANS, 500))
p.append(
    text("arrow is 25% taller than the hexagons", x + 28, y + CH - 26, 14, MUTED, SANS, 500)
)

# --- 5: two marks ------------------------------------------------------------
x, y = panel(1, 1, "Two marks, no shared DNA", "square uses the arrow; wide uses hexagons + arrow")
p.append(embed(f"{DP}/favicon.svg", x + 60, y + 116, 120, 120))
p.append(text("favicon / PWA / avatar", x + 120, y + 258, 13, MUTED, SANS, 600, anchor="middle"))
p.append(embed(f"{DP}/mark-lockup.svg", x + 236, y + 150, 232, 130))
p.append(text("site header", x + 352, y + 258, 13, MUTED, SANS, 600, anchor="middle"))
p.append(
    text(
        "The hexagons only ever appear in the wide lockup, so the",
        x + 28,
        y + CH - 70,
        14,
        MUTED,
        SANS,
        500,
    )
)
p.append(
    text(
        "highest-frequency impressions carry none of the distinguishing shape.",
        x + 28,
        y + CH - 48,
        14,
        MUTED,
        SANS,
        500,
    )
)
p.append(text("Nothing in either mark says “Lens”.", x + 28, y + CH - 22, 14, CORAL, SANS, 700))

# --- 6: palette --------------------------------------------------------------
x, y = panel(2, 1, "The primary brand colour cannot touch the mark", "WCAG contrast, measured")
rows = [
    ("Ink #041c38 on paper", INK, PAPER, 15.72, True),
    ("Ocean #044a88 on paper", OCEAN, PAPER, 8.25, True),
    ("Ocean #044a88 on ink", OCEAN, INK, 1.91, False),
    ("Proposed #7fb2e0 on ink", "#7fb2e0", INK, 7.61, True),
]
for k, (lbl, fg, bg, ratio, ok) in enumerate(rows):
    ry = y + 106 + k * 62
    p.append(f'<rect x="{x + 28}" y="{ry}" width="96" height="46" rx="10" fill="{bg}" stroke="{LINE}" />')
    p.append(f'<circle cx="{x + 76}" cy="{ry + 23}" r="15" fill="{fg}" />')
    p.append(text(lbl, x + 142, ry + 21, 15, INK, SANS, 600))
    p.append(
        text(
            f"{ratio:.2f}:1  " + ("usable" if ok else "invisible — this is why the pack is monochrome"),
            x + 142,
            ry + 41,
            13,
            "#248054" if ok else CORAL,
            SANS,
            600,
        )
    )

svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">' + "".join(p) + "</svg>"
sheet = os.path.join(TMP, "audit.svg")
open(sheet, "w").write(svg)
render(sheet, os.path.join(SHEETS, "audit_current_logo_pack.png"), w=W)
print("ok")
