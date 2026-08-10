"""Sheet 6 — the social card ships live text, so it only works on machines with the font."""

import os

from brandlib import INK, PAPER, f, render, data_uri
from paths import DESIGN_PACK as DP, OUT, TMP, SHEETS
from sheets import embed, text, card, SANS, SERIF, MUTED, LINE

CORAL = "#d84c40"
GREEN = "#248054"

# a fontconfig that can see no fonts at all — i.e. any machine without Fraunces installed
CONF = os.path.join(TMP, "nofonts.conf")
EMPTY = os.path.join(TMP, "nofonts")
os.makedirs(EMPTY, exist_ok=True)
open(CONF, "w").write(
    '<?xml version="1.0"?>\n<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">\n'
    f"<fontconfig><dir>{EMPTY}</dir><cachedir>{EMPTY}/cache</cachedir></fontconfig>\n"
)

with_font = os.path.join(TMP, "social_with_font.png")
without_font = os.path.join(TMP, "social_without_font.png")
render(f"{DP}/social-share.svg", with_font, w=560)
render(f"{DP}/social-share.svg", without_font, w=560, env={"FONTCONFIG_FILE": CONF})

W, H = 1300, 560
p = [f'<rect width="{W}" height="{H}" fill="{PAPER}" />']
p.append(text("The social card is not a flat asset", 48, 62, 28, INK, SERIF, 600))
p.append(
    text(
        "social-share.svg sets Fraunces as a live text element. Anything rendering it without the font "
        "installed — most CI, most preview tools, anyone who opens the SVG — gets this.",
        48,
        92,
        15,
        MUTED,
        SANS,
        500,
    )
)

for k, (lbl, png, note, colour) in enumerate(
    [
        ("with Fraunces installed", with_font, "what you see locally", GREEN),
        ("without Fraunces", without_font, "what a bare renderer produces", CORAL),
    ]
):
    x = 48 + k * 612
    p.append(card(x, 122, 588, 380, fill="#ffffff"))
    p.append(text(lbl, x + 26, 158, 17, INK, SANS, 700))
    p.append(text(note, x + 26, 180, 13, colour, SANS, 600))
    p.append(f'<image x="{x + 26}" y="198" width="536" height="281" href="{data_uri(png)}" />')

p.append(
    text(
        "Fix: outline the wordmark. wordmark.svg in this folder is the same Fraunces setting shaped "
        "with HarfBuzz and converted to a single path — no font dependency, no fallback risk.",
        48,
        H - 26,
        14,
        INK,
        SANS,
        600,
    )
)

sheet = os.path.join(TMP, "wordmark.svg")
with open(sheet, "w") as fh:
    fh.write(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
        + "".join(p)
        + "</svg>"
    )
render(sheet, os.path.join(SHEETS, "audit_social_card_live_text.png"), w=W)
print("ok")
