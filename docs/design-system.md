# Design system

SteerLens executive theme is a **light editorial** board-pack language: warm stone paper, deep ocean accent, serif titles. It is deliberately distinct from ArchLens’s dark cyan drafting chrome.

Live showcase: [`/design-system`](/design-system). Vector sources: [Design pack](/docs/design-pack).

The logo lockup is still provisional. Preferred mark exploration: `mockups/logo-explorations/steerlens-logo-v16-reticle-arrow.png` (reticle frame + northeast arrow). Styling source of truth: executive mockups `plan/mockups/steerlens-exec-01` … `04`.

---

## Identity

- **Atmosphere:** warm paper / stone (`#f7f5f3`), not cool grey or dark HUD.
- **Accent:** deep ocean blue (`#044a88`) for CTAs, active nav, on-track.
- **Wordmark:** Fraunces (serif) at hero weight; mark is the reticle + arrow in ink.
- **First viewport:** brand as hero-level signal, one headline, one lead, one CTA group.

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

Showcase-only classes (`.ds-*`, `.token-*`, `.asset-*`) stay on `/design-system`.

---

## Visual rules

- No purple gradients, no dark-cyber default, no YAML in executive chrome.
- Distinct fonts — not Inter / Roboto / system-only stacks.
- Cards only when they carry interaction; prefer whitespace over chrome.
- Keep SVG fills in `design-pack/` aligned when tokens change.

---

## Update checklist

1. Edit `@theme` in `app/src/index.css` (and `designSystem/tokens.ts` swatches).
2. Update `design-pack/` SVGs; run `bin/sync-design-pack.sh`.
3. Skim [`/design-system`](/design-system) and this doc.
