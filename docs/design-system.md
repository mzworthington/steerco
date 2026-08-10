# Design system

SteerLens executive theme is a **light editorial** board-pack language: warm stone paper, deep ocean accent, serif titles. It is deliberately distinct from ArchLens’s dark cyan drafting chrome.

In-app showcase: [`/docs/design-system`](/docs/design-system) (live swatches in the docs shell). Vector sources: [Design pack](/docs/design-pack).

Styling source of truth: executive mockups `plan/mockups/steerlens-exec-01` … `04`. Mark direction: sketch `mockups/logo-explorations/steerlens-logo-sketch-dots-arrow.png` (evolved from v16 reticle).

---

## Identity

- **Atmosphere:** warm paper / stone (`#f7f5f3`), not cool grey or dark HUD.
- **Accent:** deep ocean blue (`#044a88`) for CTAs, active nav, on-track.
- **Wordmark:** Fraunces (serif) at hero weight; ink `#041c38`.
- **First viewport:** brand as hero-level signal, one headline, one lead, one CTA group.

### Mark

Motif: **two circles + northeast arrowhead** (scooped base). Still provisional as a lockup, but this is the working direction.

| Use                                          | Asset                      | Rule                                                 |
| -------------------------------------------- | -------------------------- | ---------------------------------------------------- |
| Square (favicon, PWA, apple-touch, nav icon) | `mark.svg` / `favicon.svg` | **Arrow only**                                       |
| Wide / social / brand lockup                 | `mark-lockup.svg`          | **Circles + arrow** (main logo, header, Coming Soon) |
| Dark square surfaces                         | `mark-dark.svg`            | Arrow only on ink field                              |

Do not put the full circles+arrow motif in a tight square — it reads cramped. Prefer arrow alone, then pair with the Fraunces wordmark in the UI.

Explorations: `mockups/logo-explorations/` (v16 reticle ancestry + dots-arrow sketch).

---

## Tokens

Declared in `app/src/index.css` under `@theme` (Tailwind CSS 4). Architecture aliases `--vl-ink`, `--vl-paper`, `--vl-accent` mirror the same values.

| Token       | CSS variable          | Hex               | Role                      |
| ----------- | --------------------- | ----------------- | ------------------------- |
| Ink         | `--color-ink`         | `#041c38`         | Text, logo, dark surfaces |
| Ink muted   | `--color-ink-muted`   | `#5c6570`         | Secondary copy            |
| Paper       | `--color-paper`       | `#f7f5f3`         | Page background           |
| Paper soft  | `--color-paper-soft`  | `#fbfaf8`         | Soft elevated wash        |
| Stone       | `--color-stone`       | `#ebe7e2`         | Fields / hover            |
| Ocean       | `--color-ocean`       | `#044a88`         | Primary accent / CTAs     |
| Ocean hover | `--color-ocean-hover` | `#0a5ca0`         | Hover / active            |
| Ocean soft  | `--color-ocean-soft`  | `#e8edf3`         | Nav pills, tint bars      |
| Line        | `--color-line`        | `#ddd8d2`         | Borders                   |
| Coral       | `--color-coral`       | `#d84c40`         | Stop / decision emphasis  |
| Coral soft  | `--color-coral-soft`  | `#fcf5ef`         | Stop callout fill         |
| Amber       | `--color-amber`       | `#b87c18`         | At risk                   |
| Signal      | `--color-signal`      | `#248054`         | Positive / ops cues       |
| Display     | `--font-display`      | Fraunces          | Titles / wordmark         |
| Sans        | `--font-sans`         | Plus Jakarta Sans | UI / body                 |

---

## Named recipes

| Class                                                                      | Use                                       |
| -------------------------------------------------------------------------- | ----------------------------------------- |
| `.btn-primary`                                                             | Solid ocean CTA                           |
| `.btn-secondary`                                                           | Outlined secondary on white               |
| `.btn-tertiary`                                                            | Quiet text action                         |
| `.surface`                                                                 | White interactive panel                   |
| `.surface-ocean`                                                           | Highlighted org / focal card              |
| `.eyebrow` / `.eyebrow-signal`                                             | Section labels (coral for decision notes) |
| `.callout-stop`                                                            | Stop recommendation box                   |
| `.status-on-track` / `.status-at-risk` / `.status-stop` / `.status-signal` | Status colour helpers                     |
| `.hero` / `.hero-*`                                                        | Marketing first viewport                  |
| `.prose-docs`                                                              | In-app Markdown docs                      |

Showcase-only classes (`.ds-*`, `.token-*`, `.asset-*`) stay on `/docs/design-system`.

---

## Visual rules

- No purple gradients, no dark-cyber default, no YAML in executive chrome.
- Distinct fonts — not Inter / Roboto / system-only stacks.
- Cards only when they carry interaction; prefer whitespace over chrome.
- Square logos = arrow only; wide brand moments may use circles + arrow.
- Keep SVG fills in `design-pack/` aligned when tokens change.

---

## Update checklist

1. Edit `@theme` in `app/src/index.css` (and `designSystem/tokens.ts` swatches).
2. Update `design-pack/` SVGs; run `bin/sync-design-pack.sh`.
3. Skim [`/docs/design-system`](/docs/design-system) and this written guide.
