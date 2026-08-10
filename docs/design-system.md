# Design system

Coastal-ink is the starter visual language for this template — light surfaces, teal accent, Syne + Source Sans 3. It is deliberately small: tokens in one CSS file, a vector pack, named UI recipes, and an in-app showcase at [`/design-system`](/design-system).

This is **not** ArchLens’s dark cyan drafting theme. Rebrand colors, type, and the mark when the product is yours.

---

## Identity

- **First viewport:** brand name as the hero, one lead sentence, one CTA group, mist gradients + soft grid atmosphere.
- **Mark:** stacked page frames with a teal rail and launch prompt (`·>`) — see [Design pack](/docs/design-pack).
- **Light by default:** page background is mist-soft; ink for text; accent for primary actions.

---

## Tokens

Declared in `app/src/index.css` under `@theme` (Tailwind CSS 4). Keep SVG fills in `design-pack/` aligned when you change values.

| Token        | CSS variable           | Hex           | Role                 |
| ------------ | ---------------------- | ------------- | -------------------- |
| Ink          | `--color-ink`          | `#0b1220`     | Text, dark surfaces  |
| Ink muted    | `--color-ink-muted`    | `#4a5568`     | Secondary copy       |
| Mist         | `--color-mist`         | `#eef2f6`     | Soft fields / hover  |
| Mist soft    | `--color-mist-soft`    | `#f7f9fb`     | Page background      |
| Accent       | `--color-accent`       | `#0f766e`     | Primary brand / CTAs |
| Accent hover | `--color-accent-hover` | `#0d9488`     | Hover / active       |
| Line         | `--color-line`         | `#d5dde8`     | Borders              |
| Display      | `--font-display`       | Syne          | Headings / wordmarks |
| Sans         | `--font-sans`          | Source Sans 3 | UI / body            |

---

## Named recipes

Prefer these classes over one-off utility piles so rebrands stay mechanical:

| Class               | Use                                               |
| ------------------- | ------------------------------------------------- |
| `.btn-primary`      | Solid accent CTA                                  |
| `.btn-secondary`    | Outlined secondary action                         |
| `.btn-tertiary`     | Quiet text action                                 |
| `.surface`          | Bordered panel when interaction needs a container |
| `.eyebrow`          | Mono uppercase section label                      |
| `.hero` / `.hero-*` | Marketing first viewport                          |
| `.prose-docs`       | In-app Markdown docs                              |

Showcase layout classes (`.ds-*`, `.token-*`, `.asset-*`) are for `/design-system` only — do not reuse them as product chrome.

---

## Showcase

Open **Design** in the nav or go to [`/design-system`](/design-system) for live swatches, assets, and CTA samples. Written asset map: [Design pack](/docs/design-pack).

---

## Rebrand checklist

1. Update `@theme` tokens in `app/src/index.css`.
2. Replace marks in `design-pack/` and sync to `app/public/` (see `design-pack/README.md`).
3. Run `bin/init-project.sh --name … --origin https://…` for copy and OG meta.
4. Skim `/design-system` to confirm swatches and recipes still match.
