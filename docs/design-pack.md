# Design pack & brand assets

Coastal-ink favicon, logos, and social-share art ship under `design-pack/` (vector sources + README) and `app/public/` (Vite-served copies).

| Asset        | Path                                        | Use                                  |
| ------------ | ------------------------------------------- | ------------------------------------ |
| Favicon      | `/favicon.svg`, `/favicon.png`              | Browser tab                          |
| Logo (light) | `/assets/logo.svg`                          | Nav brand mark                       |
| Logo (dark)  | `/assets/logo-dark.svg`                     | Dark surfaces                        |
| Social share | `/assets/social-share.png`                  | `og:image` / Twitter card (1200×630) |
| Apple touch  | `/icons/apple-touch-icon.png`               | iOS home screen                      |
| PWA icons    | `/icons/pwa-192x192.png`, `pwa-512x512.png` | Optional install icons               |

`bin/init-project.sh --name … --origin https://…` rewrites title, description, canonical, and Open Graph / Twitter meta to match your brand. After changing the mark SVGs, regenerate PNGs with `rsvg-convert` — see `design-pack/README.md` in the repo root.

Tokens and named recipes are documented in [Design system](/docs/design-system); live swatches at [`/design-system`](/design-system). Keep SVG fills and CSS variables in `app/src/index.css` aligned when you rebrand.
