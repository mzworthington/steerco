# Design pack & brand assets

SteerLens favicon, logos, and social-share art ship under `design-pack/` (vector sources + README) and `app/public/` (Vite-served copies). Preferred mark: reticle + northeast arrow (exploration v16).

| Asset        | Path                                        | Use                                  |
| ------------ | ------------------------------------------- | ------------------------------------ |
| Favicon      | `/favicon.svg`, `/favicon.png`              | Browser tab                          |
| Logo (light) | `/assets/logo.svg`                          | Nav brand mark                       |
| Logo (dark)  | `/assets/logo-dark.svg`                     | Dark / ink surfaces                  |
| Social share | `/assets/social-share.png`                  | `og:image` / Twitter card (1200×630) |
| Apple touch  | `/icons/apple-touch-icon.png`               | iOS home screen                      |
| PWA icons    | `/icons/pwa-192x192.png`, `pwa-512x512.png` | Optional install icons               |

After changing mark SVGs, regenerate rasters:

```bash
bin/sync-design-pack.sh   # requires librsvg: brew install librsvg
```

Tokens and named recipes: [Design system](/docs/design-system); live swatches: [`/design-system`](/design-system). Keep SVG strokes/fills and CSS variables in `app/src/index.css` aligned when the palette shifts. Logo lockup remains provisional until the exploration set is finalized.
