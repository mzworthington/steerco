# Design pack

Coastal-ink brand assets for the React Cloudflare Template — same role as ArchLens’s vector pack (favicon, logos, social share), tuned to the starter tokens in `app/src/index.css`. Live swatches: `/design-system`; written guide: `docs/design-system.md`.

## Identity

| Token | Value | Role |
| --- | --- | --- |
| Ink | `#0b1220` | Text, dark surfaces |
| Mist / mist-soft | `#eef2f6` / `#f7f9fb` | Light fields |
| Accent | `#0f766e` | Primary brand (teal) |
| Accent hover | `#0d9488` | Active / light-on-dark accent |
| Line | `#d5dde8` | Borders |
| Display | Syne | Headings / wordmarks |
| Body | Source Sans 3 | UI copy |

**Mark:** stacked page frames (template shell) + teal rail + command/launch prompt (`·>`). Reads as “scaffold ready to ship,” not a Cloudflare trademark mark.

## Sources (this folder)

| File | Purpose |
| --- | --- |
| `mark.svg` / `mark.png` | Light logo (500×500) |
| `mark-dark.svg` / `mark-dark.png` | Dark logo (500×500) |
| `favicon.svg` / `favicon.png` | Tab icon |
| `grid.svg` | Repeatable drafting grid tile |
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

`app/index.html` wires favicon, apple-touch, theme-color, and `og:` / `twitter:` image meta to `/assets/social-share.png`. `bin/init-project.sh` rewrites title, description, canonical, and OG/Twitter fields when you set `--name` / `--origin`.

## Regenerate PNGs

```bash
bin/sync-design-pack.sh   # requires librsvg: brew install librsvg
```

Or run the `rsvg-convert` commands listed in that script. After rebranding colors or the mark, edit the SVGs here, re-run sync, and keep `app/src/index.css` tokens in sync.
