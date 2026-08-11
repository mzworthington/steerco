# Logo pack - counterchange disc

Partner exploration mark (Aug 2026) and vector alternatives for SteerLens review.

Source mockup: [`00-source-partner.png`](./00-source-partner.png)  
Shipped brand today (for comparison): [`../../../design-pack/`](../../../design-pack/)

---

## Analysis of the partner mark

### What it is doing well

- **Counterchange** (black-on-white / white-on-black across a hard horizon) is a strong, memorable device - reads as “above / below the line,” which fits steering, decision cutovers, and board-pack clarity.
- The **circular container** gives an app-icon and favicon silhouette without extra chrome.
- The motif is **abstract enough** to avoid looking like a generic SaaS play-button, while still suggesting direction.
- High contrast works in mono; colour is not load-bearing (good - colour stays free).

### What feels unresolved

1. **Asymmetry of language** - the upper blade is a hard triangle; the lower blade is a scooped drop. That contrast can look intentional (sail + keel) or unfinished, depending on size. At 16–24px the curve collapses and the mark reads as “uneven.”
2. **Directional ambiguity** - pixel trace shows the upper tip bearing ~2 o’clock and the lower tip at ~6 o’clock. Together they can read as bird / paper-plane / split arrow. “Steer” is present but not immediate.
3. **Optical join** - the shared base on the horizon is the brand idea; any gap, anti-alias fringing, or off-centre bottom tip weakens it. The source PNG’s lower tip sits slightly left of centre.
4. **Pure black / pure white** - fine for a mockup; in product UI it will clash with ink (`#041c38`) and paper (`#f7f5f3`). Treat mono as a construction drawing, not the shipping colourway.
5. **No wordmark path yet** - the disc is complete as a *mark*. “Wider logo” should not mean stretching the disc.

### Is a wider logo necessary?

**A wider *mark* is not necessary. A wider *lockup* is.**

| Placement | Need |
| --- | --- |
| Favicon, PWA, avatar, nav glyph | Disc alone |
| Marketing header, docs title, export cover, OG image | Disc + **SteerLens** wordmark |
| Dense UI where type sits next to the mark already | Disc alone (avoid double-branding) |

Recommendation: keep one refined circular mark; pair it with a horizontal lockup (`07`) and a stacked lockup (`08`) when the product name must carry the viewport. Do not elongate the disc geometry unless exploring the optional bar motif (`13`).

---

## Suggested tweaks (applied in this pack)

| # | Tweak | Why |
| --- | --- | --- |
| A | Lock a single shared base segment | Counterchange only works if the join is exact |
| B | Centre the lower tip on the vertical axis | Removes the slight left lean in the source |
| C | Decide: keep mixed language **or** harmonise | `02` keeps triangle + scoop; `03`/`04` remove the accident |
| D | Offer a clearer east-pointing chevron | `05` tests a stronger “steer” read |
| E | Chunk geometry for favicon | `12` thickens blades so 16px still counterchanges |
| F | Recolour with product tokens | `09`–`11` - ink / ocean / paper, not #000/#fff |
| G | Add wordmark lockups, don’t stretch the mark | `07`, `08`, optional `13` |

---

## Pack index

| File | Role |
| --- | --- |
| `00-source-partner.png` | Original partner mockup |
| `01-faithful.svg` | Clean vector of the mockup (mono) |
| `02-refined.svg` | **Primary candidate** - same idea, fixed join / centring / curves |
| `03-harmonized-straight.svg` | Both blades triangular |
| `04-harmonized-curved.svg` | Both blades scooped (sail/lens) |
| `05-steer-chevron.svg` | Counterchange chevron pointing east |
| `06-motif-only.svg` | Blades without disc field |
| `07-lockup-horizontal.svg` | Mark + SteerLens (wide) |
| `08-lockup-stacked.svg` | Mark over SteerLens (square/portrait) |
| `09-colorway-ocean.svg` | Ocean on paper |
| `10-colorway-ink-paper.svg` | Ink on paper (executive UI) |
| `11-colorway-dark.svg` | Dark chrome |
| `12-favicon.svg` | 64² simplified |
| `13-wide-motif-bar.svg` | Optional wordmark-free wide motif |
| `sheet-review.svg` | Contact sheet of key options |
| `preview-sheet.png` | Raster of the contact sheet for quick review |

Wordmark SVGs use `Fraunces` by name - outline type before any production handoff.

---

## Review prompts for design partner

1. Keep the **mixed** triangle/scoop (`02`) or harmonise (`03` / `04`)?
2. Is the metaphor **horizon + blades** or **eastbound steer** (`05`)?
3. Shipping colourway: **ink/paper** (`10`), **ocean** (`09`), or continue mono for mark-only contexts?
4. Confirm lockup type: horizontal for chrome (`07`), stacked only for splash/OG (`08`).
5. Compared with the current shipped arrow in `design-pack/`, does this disc replace it or sit as an alternate suite mark?

---

## Working recommendation

Adopt **`02-refined.svg`** as the exploration baseline, colour it with **`10-colorway-ink-paper.svg`**, and use **`07-lockup-horizontal.svg`** wherever the name must appear. Keep `05` only if partner feedback asks for a more literal “steer” arrow. A wider logo beyond that lockup is unnecessary.
