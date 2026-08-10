"""Sheet 2 — the six alternatives; Sheet 3 — small sizes; Sheet 4 — in context."""

from brandlib import INK, PAPER, OCEAN, f, render
from sheets import embed, text, card, pixel_strip, SANS, SERIF, MUTED, LINE
from concepts import CONCEPTS

import os

from paths import DESIGN_PACK as DP, OUT, TMP, SHEETS as ART
ORDER = ["aperture", "converge", "align", "dial", "turn", "monogram"]
RANK = {"aperture": "1st", "converge": "2nd", "align": "3rd"}


# ---------------------------------------------------------------- overview ---
def wrap(s, n=64):
    out, line = [], ""
    for word in s.split():
        if len(line) + len(word) + 1 > n:
            out.append(line)
            line = word
        else:
            line = (line + " " + word).strip()
    out.append(line)
    return out


def overview():
    W, H = 1660, 1090
    CW, CH = 522, 436
    p = [f'<rect width="{W}" height="{H}" fill="{PAPER}" />']
    p.append(text("Six alternative marks for SteerLens", 48, 64, 30, INK, SERIF, 600))
    p.append(
        text(
            "Each is generated geometry on one 512 grid with a 400 live area, auto-centred on its "
            "own ink, and drawn twice: full, and simplified for 16px.",
            48,
            96,
            16,
            MUTED,
            SANS,
            500,
        )
    )
    for i, key in enumerate(ORDER):
        spec = CONCEPTS[key]
        x = 48 + (i % 3) * (CW + 24)
        y = 130 + (i // 3) * (CH + 26)
        p.append(card(x, y, CW, CH, fill="#ffffff"))
        p.append(text(spec["title"], x + 28, y + 44, 22, INK, SERIF, 600))
        if key in RANK:
            p.append(
                f'<rect x="{x + CW - 92}" y="{y + 24}" width="64" height="24" rx="12" fill="{OCEAN}" />'
            )
            p.append(text(RANK[key], x + CW - 60, y + 41, 12, "#ffffff", SANS, 700, anchor="middle"))
        for li, ln in enumerate(wrap(spec["line"], 62)):
            p.append(text(ln, x + 28, y + 70 + li * 19, 13.5, MUTED, SANS, 500))
        p.append(embed(f"{OUT}/{key}/icon.svg", x + 30, y + 112, 196, 196))
        p.append(embed(f"{OUT}/{key}/icon-dark.svg", x + 258, y + 130, 112, 112))
        p.append(embed(f"{OUT}/{key}/icon-mono.svg", x + 392, y + 138, 96, 96))
        p.append(text("on ink", x + 314, y + 262, 12, MUTED, SANS, 600, anchor="middle"))
        p.append(text("one colour", x + 440, y + 262, 12, MUTED, SANS, 600, anchor="middle"))
        p.append(
            f'<path d="M {x + 28} {y + 320} H {x + CW - 28}" stroke="{LINE}" stroke-width="1" />'
        )
        p.append(embed(f"{OUT}/{key}/lockup.svg", x + 28, y + 348, 330, 56))
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">' + "".join(p) + "</svg>"
    sheet = os.path.join(TMP, "alts.svg")
    open(sheet, "w").write(svg)
    render(sheet, f"{ART}/alternatives_overview.png", w=W)


# ------------------------------------------------------------- small sizes ---
def small_sizes():
    rows = [("shipped arrow", f"{DP}/favicon.svg")] + [
        (CONCEPTS[k]["title"], f"{OUT}/{k}/favicon.svg") for k in ORDER
    ]
    RH = 124
    W = 900
    H = 168 + len(rows) * RH + 24
    p = [f'<rect width="{W}" height="{H}" fill="{PAPER}" />']
    p.append(text("16px is the real test", 48, 62, 28, INK, SERIF, 600))
    p.append(
        text(
            "True pixel renders, magnified ×3 with no smoothing — what a browser tab actually gets.",
            48,
            92,
            15,
            MUTED,
            SANS,
            500,
        )
    )
    p.append(card(40, 120, W - 80, H - 150, fill="#ffffff"))
    for i, (label, path) in enumerate(rows):
        y = 168 + i * RH + RH / 2
        if i:
            p.append(f'<path d="M 64 {f(y - RH / 2)} H {W - 64}" stroke="{LINE}" />')
        p.append(text(label, 76, y + 5, 16, INK if i else MUTED, SANS, 700 if i else 600))
        strip, _ = pixel_strip(path, [16, 20, 24, 32], 300, y, 3, labels=(i == 0), gap=28)
        p.append(strip)
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">' + "".join(p) + "</svg>"
    sheet = os.path.join(TMP, "small.svg")
    open(sheet, "w").write(svg)
    render(sheet, f"{ART}/alternatives_at_16px.png", w=W)


# -------------------------------------------------------------- in context ---
def in_context():
    rows = [("shipped", f"{DP}/favicon.svg", f"{DP}/mark-lockup.svg", f"{DP}/mark-dark.svg", True)] + [
        (
            CONCEPTS[k]["title"],
            f"{OUT}/{k}/favicon.svg",
            f"{OUT}/{k}/lockup.svg",
            f"{OUT}/{k}/icon-dark.svg",
            False,
        )
        for k in ORDER
    ]
    W = 1400
    RH = 116
    H = 150 + len(rows) * RH + 30
    p = [f'<rect width="{W}" height="{H}" fill="{PAPER}" />']
    p.append(text("The same seven marks where people meet them", 48, 62, 28, INK, SERIF, 600))
    p.append(
        text(
            "Browser tab at 16px, site header at 28px, app icon, and a circular avatar crop.",
            48,
            92,
            15,
            MUTED,
            SANS,
            500,
        )
    )
    for i, (label, fav, lock, tile, shipped) in enumerate(rows):
        y = 124 + i * RH
        p.append(card(40, y, W - 80, RH - 12, fill="#ffffff"))
        p.append(text(label, 62, y + 58, 15, MUTED if shipped else INK, SANS, 600 if shipped else 700))
        # tab
        tx = 190
        p.append(
            f'<path d="M {tx} {y + 74} v -38 a 10 10 0 0 1 10 -10 h 210 a 10 10 0 0 1 10 10 v 38 Z" '
            f'fill="#fbfaf8" stroke="{LINE}" />'
        )
        p.append(embed(fav, tx + 14, y + 36, 16, 16))
        p.append(text("SteerLens — Steering", tx + 40, y + 50, 12, MUTED, SANS, 500))
        p.append(f'<path d="M {tx} {y + 74} H {tx + 250}" stroke="{INK}" stroke-opacity="0.15" />')
        # header
        hx = 470
        p.append(
            f'<rect x="{hx}" y="{y + 22}" width="440" height="56" rx="10" fill="#fbfaf8" stroke="{LINE}" />'
        )
        lh = 28
        p.append(embed(lock, hx + 20, y + 50 - lh / 2, 190, lh))
        for nav, nx in [("Workspace", 258), ("Docs", 336), ("Design", 384)]:
            p.append(text(nav, hx + nx, y + 54, 12, MUTED, SANS, 600))
        # app icon + avatar
        p.append(embed(tile, 950, y + 24, 52, 52))
        p.append(f'<clipPath id="av{i}"><circle cx="1064" cy="{y + 50}" r="26" /></clipPath>')
        p.append(f'<circle cx="1064" cy="{y + 50}" r="26" fill="{INK}" />')
        p.append(f'<g clip-path="url(#av{i})">' + embed(tile, 1038, y + 24, 52, 52) + "</g>")
        # dark surface
        p.append(f'<rect x="1120" y="{y + 16}" width="220" height="68" rx="10" fill="{INK}" />')
        p.append(embed(lock.replace("lockup.svg", "lockup-dark.svg") if not shipped else lock, 1142, y + 38, 150, 24))
    p.append(
        text(
            "The shipped wide mark has no light-on-dark variant, so it disappears on the ink surface.",
            48,
            H - 22,
            13,
            "#d84c40",
            SANS,
            600,
        )
    )
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">' + "".join(p) + "</svg>"
    sheet = os.path.join(TMP, "ctx.svg")
    open(sheet, "w").write(svg)
    render(sheet, f"{ART}/alternatives_in_context.png", w=W)


if __name__ == "__main__":
    overview()
    small_sizes()
    in_context()
    print("ok")
