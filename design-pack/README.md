# Design pack

SteerLens brand assets — reticle + arrow mark, warm paper field, ocean accent. Same role as the template vector pack (favicon, logos, social share), tuned to executive tokens in `app/src/index.css`.

Live swatches: `/design-system`. Written guide: `docs/design-system.md`.

Preferred exploration (not yet final lockup): `mockups/logo-explorations/steerlens-logo-v16-reticle-arrow.png`.

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

**Mark:** rounded reticle frame with mid-side ticks, inner sharp square, solid northeast steer/cursor arrow.

## Sources (this folder)

| File | Purpose |
| --- | --- |
| `mark.svg` / `mark.png` | Light logo (500×500) |
| `mark-dark.svg` / `mark-dark.png` | Dark logo (500×500) |
| `favicon.svg` / `favicon.png` | Tab icon |
| `grid.svg` | Repeatable paper grid tile |
| `social-share.svg` / `social-share.png` | Open Graph / Twitter card (1200×630) |

## Shipped to the app

Copied under `app/public/` for Vite:

```text
app/public/
  favicon.svg
  favicon.png
  assets/
    logo.svg          ← mark.svg
    logo.png
    logo-dark.svg     ← mark-dark.svg
    logo-dark.png
    social-share.png
    grid.svg
  icons/
    apple-touch-icon.png   (180×180, dark mark)
    pwa-192x192.png
    pwa-512x512.png
```

`app/index.html` wires favicon, apple-touch, theme-color (`#044a88`), and `og:` / `twitter:` image meta to `/assets/social-share.png`.

## Regenerate PNGs

```bash
bin/sync-design-pack.sh   # requires librsvg: brew install librsvg
```

After changing colors or the mark, edit the SVGs here, re-run sync, and keep `app/src/index.css` tokens in sync.
