# Design pack & brand assets

SteerLens favicon, logos, and social-share art ship under `design-pack/` (vector sources + README) and `app/public/` (Vite-served copies).

**Mark rules**

- **Square** (favicon, app icons, nav): arrow only (`mark.svg` / `favicon.svg`).
- **Wide lockup** (social, brand moments): two hexagons + arrow (`mark-lockup.svg`).

Sketch reference: `mockups/logo-explorations/steerlens-logo-sketch-dots-arrow.png`.

| Asset        | Path                                        | Use                                  |
| ------------ | ------------------------------------------- | ------------------------------------ |
| Favicon      | `/favicon.svg`, `/favicon.png`              | Browser tab (arrow only)             |
| Logo (light) | `/assets/logo.svg`                          | Nav / square brand mark (arrow only) |
| Logo (dark)  | `/assets/logo-dark.svg`                     | Dark / ink surfaces (arrow only)     |
| Logo lockup  | `/assets/logo-lockup.svg`                   | Site header + wide hexagons + arrow  |
| Social share | `/assets/social-share.png`                  | `og:image` / Twitter card (1200×630) |
| Apple touch  | `/icons/apple-touch-icon.png`               | iOS home screen (arrow only)         |
| PWA icons    | `/icons/pwa-192x192.png`, `pwa-512x512.png` | Optional install icons (arrow only)  |

After changing mark SVGs, regenerate rasters:

```bash
bin/sync-design-pack.sh   # requires librsvg: brew install librsvg
```

Tokens and named recipes: [Design system](/docs/design-system); live swatches: [`/design-system`](/design-system). Keep SVG fills and CSS variables in `app/src/index.css` aligned when the palette shifts.
