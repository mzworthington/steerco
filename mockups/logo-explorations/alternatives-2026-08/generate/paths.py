"""Shared paths for the logo generator.

Override with environment variables when running outside the repo checkout:

    STEERLENS_FONT_DIR   TTFs for Fraunces + Plus Jakarta Sans (default ~/.fonts)
    STEERLENS_LOGO_WORK  scratch dir for intermediate renders (default /tmp/steerlens-logo)
    STEERLENS_LOGO_OUT   where the SVG pack is written (default: this folder's parent)
    STEERLENS_SHEET_OUT  where the contact sheets are written (default: ../contact-sheets)

With no overrides, running build.py, keepfix.py and the sheet_*.py scripts regenerates
the committed pack in place.
"""

import os

HERE = os.path.dirname(os.path.abspath(__file__))
PACK = os.path.dirname(HERE)
REPO = os.path.abspath(os.path.join(PACK, "..", "..", ".."))

FONT_DIR = os.environ.get("STEERLENS_FONT_DIR", os.path.expanduser("~/.fonts"))
WORK = os.environ.get("STEERLENS_LOGO_WORK", "/tmp/steerlens-logo")
TMP = os.path.join(WORK, "tmp")
OUT = os.environ.get("STEERLENS_LOGO_OUT", PACK)
SHEETS = os.environ.get("STEERLENS_SHEET_OUT", os.path.join(PACK, "contact-sheets"))
DESIGN_PACK = os.path.join(REPO, "design-pack")

for _d in (WORK, TMP, OUT, SHEETS):
    os.makedirs(_d, exist_ok=True)
