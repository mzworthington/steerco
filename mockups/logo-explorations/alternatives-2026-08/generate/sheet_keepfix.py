"""Sheet 5 — if the arrow stays, the same shapes with the geometry corrected."""

from brandlib import INK, PAPER, OCEAN, f, render
from sheets import embed, text, card, pixel_strip, SANS, SERIF, MUTED, LINE

import os

from paths import DESIGN_PACK as DP, OUT, TMP, SHEETS

KF = os.path.join(OUT, "keep-and-fix")
W, H = 1400, 760
p = [f'<rect width="{W}" height="{H}" fill="{PAPER}" />']
p.append(text("If you keep the arrow, at least put it on a grid", 48, 62, 28, INK, SERIF, 600))
p.append(
    text(
        "Same two shapes, same colours — only the geometry changes. Left is shipped, right is corrected.",
        48,
        92,
        15,
        MUTED,
        SANS,
        500,
    )
)

# square mark
x, y, CW, CH = 48, 122, 430, 330
p.append(card(x, y, CW, CH, fill="#ffffff"))
p.append(text("Square mark", x + 26, y + 38, 18, INK, SANS, 700))
for k, (lbl, path, note) in enumerate(
    [("shipped", f"{DP}/mark.svg", "off-centre, fills 51%"), ("corrected", f"{KF}/mark.svg", "centred, fills 78%")]
):
    bx, by, bs = x + 26 + k * 200, y + 60, 176
    p.append(f'<rect x="{bx}" y="{by}" width="{bs}" height="{bs}" fill="#fbfaf8" stroke="{LINE}" />')
    p.append(embed(path, bx, by, bs, bs))
    p.append(
        f'<path d="M {bx} {by + bs / 2} H {bx + bs} M {bx + bs / 2} {by} V {by + bs}" '
        f'stroke="{OCEAN}" stroke-width="1" stroke-opacity="0.6" />'
    )
    p.append(text(lbl, bx + bs / 2, by + bs + 26, 14, INK, SANS, 700, anchor="middle"))
    p.append(text(note, bx + bs / 2, by + bs + 46, 12, MUTED, SANS, 500, anchor="middle"))
p.append(
    text(
        "Rotate about the arrow's optical centre, not its bounding box.",
        x + 26,
        y + CH - 22,
        13,
        MUTED,
        SANS,
        500,
    )
)

# favicon
x = 502
p.append(card(x, y, 380, CH, fill="#ffffff"))
p.append(text("Favicon", x + 26, y + 38, 18, INK, SANS, 700))
for k, (lbl, path) in enumerate([("shipped", f"{DP}/favicon.svg"), ("corrected", f"{KF}/favicon.svg")]):
    strip, _ = pixel_strip(path, [16, 24, 32], x + 116, y + 116 + k * 130, 3, labels=(k == 0), gap=22)
    p.append(strip)
    p.append(text(lbl, x + 26, y + 122 + k * 130, 14, INK, SANS, 700))

# lockup
x, y2 = 48, 476
p.append(card(x, y2, W - 96, 250, fill="#ffffff"))
p.append(text("Wide mark", x + 26, y2 + 38, 18, INK, SANS, 700))
for k, (lbl, path, vb) in enumerate(
    [("shipped", f"{DP}/mark-lockup.svg", (356, 200)), ("corrected", f"{KF}/lockup.svg", (310.91, 76))]
):
    bx = x + 40 + k * 640
    bw = 300
    bh = bw * vb[1] / vb[0]
    by = y2 + 130 - bh / 2
    p.append(f'<rect x="{bx}" y="{by}" width="{bw}" height="{f(bh)}" fill="#fbfaf8" stroke="{LINE}" />')
    p.append(embed(path, bx, by, bw, bh))
    p.append(
        f'<path d="M {bx} {f(by + bh / 2)} H {bx + bw}" stroke="{OCEAN}" stroke-width="1" '
        f'stroke-dasharray="4 4" />'
    )
    p.append(text(lbl, bx, y2 + 68, 14, INK, SANS, 700))
    p.append(
        text(
            "arrow hangs below the centre line; 31% of the artboard is padding"
            if k == 0
            else "shared centre line, even 120u rhythm, artboard trimmed to the ink",
            bx + 76,
            y2 + 68,
            13,
            MUTED,
            SANS,
            500,
        )
    )

svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">' + "".join(p) + "</svg>"
sheet = os.path.join(TMP, "kf.svg")
open(sheet, "w").write(svg)
render(sheet, os.path.join(SHEETS, "keep_and_fix_current_mark.png"), w=W)
print("ok")
