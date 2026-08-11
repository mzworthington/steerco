# Tech stack

**ADR:** [0002 Tech stack](../../docs/ADRs/0002-tech-stack.md) · [0003 Local-first](../../docs/ADRs/0003-local-first-no-auth.md)

## Decision summary

| Layer               | Choice                                                                         | Why                                                                                 |
| ------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Language            | **TypeScript**                                                                 | Matches ArchLens and portfolio Cloudflare hosting                                   |
| UI                  | **React 19 + Vite**                                                            | Fast local DX; same family as `@archlens/canvas`                                    |
| Styling             | **Tailwind CSS + CSS variables**                                               | Executive theme tokens (stone, ocean blue); light-first skin distinct from ArchLens |
| Domain              | **Zod** in `@steerco/core`                                                   | SteerSpec as typed contract; mirror BlueprintSpec discipline                        |
| Unit test           | **Vitest**                                                                     | Workspace-native with Vite                                                          |
| E2E / a11y          | **Playwright** (+ axe)                                                         | Critical executive journeys                                                         |
| Package manager     | **pnpm** + **mise**                                                            | Align with ArchLens / site toolchain                                                |
| Local persistence   | **File System Access API** + download/upload fallback                          | Folder = workspace; `steertree.yaml` on disk                                        |
| PDF export          | **Browser print CSS** first; optional later `@react-pdf`                       | Slice 1 board pack without heavy native deps                                        |
| Hosting             | **Cloudflare Pages** + Pulumi                                                  | See [ADR 0001](../../docs/ADRs/0001-cloudflare-pages-pulumi-wrangler.md)            |
| Auth (Slice 2+)     | **OAuth 2.1** per connector (GitHub, Microsoft Entra, Backstage session/token) | Only when integrations need identity                                                |
| AI assist standards | **Agent Lifecycle Kit**                                                        | Spec → TDD → XFN → implement                                                        |

## Monorepo shape

```text
steerco/
  app/                      # workspace root
    packages/core/          # @steerco/core - SteerSpec, mismatches, pure logic
    src/                    # @steerco/app - React SPA
  plan/                     # product specs, PRDs, schema, samples
  docs/                     # in-app docs + ADRs
  mockups/                  # executive UI mockups
```

`@steerco/core` already ships; Slice 1 UI adapters land next.

## Slice 1 constraints

- **No backend**
- **No auth**
- **No telemetry that leaves the machine** (optional local console only)
- Network access unused except user-initiated “open URL” for docs

## Slice 2+ (stack implications)

| Capability                     | Stack note                                                             |
| ------------------------------ | ---------------------------------------------------------------------- |
| Backstage Catalog API          | `adapters/backstage` - read Groups; write only SteerCo overlay kinds |
| GitHub teams + Actions metrics | Octokit; OAuth App / GitHub App                                        |
| Entra groups                   | Microsoft Graph; Entra ID app registration                             |
| Sync / multi-device            | Cloudflare Worker + R2 optional; still SteerSpec-first                 |
| ArchLens link                  | HTTP/entityRef to published blueprints - no shared UI kit required     |

## Explicit non-choices

| Rejected                     | Reason                                                                  |
| ---------------------------- | ----------------------------------------------------------------------- |
| Next.js (Slice 1)            | No SSR/SEO need for local SPA; Vite keeps local-first simple            |
| Electron/Tauri (Slice 1)     | Browser + FS Access enough; revisit if folder UX insufficient on Safari |
| Shared ArchLens UI package   | Visual languages must diverge                                           |
| Jira as SoR inside SteerCo | Dual entry kills adoption                                               |
| Python backend               | Unnecessary until connectors need secrets vaulting server-side          |

## Design system direction

- **Light editorial** executive theme (default)
- **Technical** theme later for import/merge (may borrow density cues from ArchLens but not the brand chrome)
- Fonts: distinctive editorial face for brand wordmark; humanist sans for UI - **not** Inter/Roboto/system-only
- Accent: deep ocean blue on stone/warm white (see mockups)
