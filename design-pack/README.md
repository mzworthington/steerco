# Design pack

SteerLens brand assets — circles + arrow motif, warm paper field, ocean accent. Tuned to executive tokens in `app/src/index.css`.

Live swatches: `/docs/design-system`. Written guide: `docs/design-system.md`.

Sketch: `mockups/logo-explorations/steerlens-logo-sketch-dots-arrow.png` (from v16 reticle explorations).

## Identity

| Token | Value | Role |
| --- | --- | --- |
| Ink | `#041c38` | Text, logo, dark surfaces |
| Paper / paper-soft | `#f7f5f3` / `#fbfaf8` | Page backgrounds |
| Stone | `#ebe7e2` | Soft fields |
| Ocean | `#044a88` | Primary brand / CTAs |
| Ocean hover | `#0a5ca0` | Active / hover |
| Coral | `#d84c40` | Stop / decision emphasis |
| Amber | `#b87c18` | At risk |
| Signal | `#248054` | Positive cues |
| Line | `#ddd8d2` | Borders |
| Display | Fraunces | Headings / wordmarks |
| Body | Plus Jakarta Sans | UI copy |

**Mark**

- Full motif: two filled circles + northeast arrowhead with scooped base (`mark-lockup.svg`).
- Square applications: **arrow only** (`mark.svg`, `mark-dark.svg`, `favicon.svg`, PWA / apple-touch).
- Geometry: rotate about the arrow’s **optical centre** (not its bounding box); square marks fill ~**78%** of the artboard; lockup shares one centre line, even **120u** centre rhythm, artboard trimmed to ink.

## Sources (this folder)

| File | Purpose |
| --- | --- |
| `mark.svg` / `mark.png` | Light square logo — arrow only (500×500) |
| `mark-dark.svg` / `mark-dark.png` | Dark square logo — arrow only (500×500) |
| `mark-lockup.svg` / `mark-lockup.png` | Wide circles + arrow motif |
| `favicon.svg` / `favicon.png` | Tab icon — arrow only |
| `grid.svg` | Repeatable paper grid tile |
| `social-share.svg` / `social-share.png` | Open Graph / Twitter card (1200×630) |

## Shipped to the app

Copied under `app/public/` for Vite:

```text
app/public/
  favicon.svg
  favicon.png
  assets/
    logo.svg          ← mark.svg (arrow)
    logo.png
    logo-dark.svg     ← mark-dark.svg (arrow)
    logo-dark.png
    logo-lockup.svg   ← mark-lockup.svg (circles + arrow)
    logo-lockup.png
    social-share.png
    grid.svg
  icons/
    apple-touch-icon.png   (180×180, dark arrow)
    pwa-192x192.png
    pwa-512x512.png
```

`app/index.html` wires favicon, apple-touch, theme-color (`#044a88`), and `og:` / `twitter:` image meta to `/assets/social-share.png`.

## Regenerate PNGs

```bash
bin/sync-design-pack.sh   # requires librsvg: brew install librsvg
```

After changing colors or the mark, edit the SVGs here, re-run sync, and keep `app/src/index.css` tokens in sync.
