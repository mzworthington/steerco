# Workflows (GitHub Actions)

Automation for SteerCo lives under `.github/workflows/`:

| Workflow              | File                    | When it runs                                   | What it does                                                                                                      |
| --------------------- | ----------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **CI & Deployment**   | `ci.yml`                | Push/PR to `main`, or manual                   | Format, lint, typecheck, knip, unit tests, build; on `main`, deploys `app/dist` to Cloudflare Pages with Wrangler |
| **Pulumi Cloudflare** | `pulumi-cloudflare.yml` | Changes under `infra/cloudflare/**`, or manual | `pulumi preview` always; **Approval** job waits on **pulumi-prod** reviewers; then `pulumi up`                    |
| **Refresh derived**   | `refresh-derived.yml`   | Weekly (Sunday) + manual                       | Regenerates changelog + docs screenshots via `bin/sync-derived.sh` and commits when something changed             |
| **Lighthouse**        | `lighthouse.yml`        | Weekly (Sunday) + manual                       | Builds the app, runs Lighthouse CI, uploads the report artifact                                                   |
| **CodeQL**            | `codeql.yml`            | Push/PR to `main` + weekly                     | Security analysis for JavaScript/TypeScript                                                                       |

```text
PR / main ──► CI & Deployment ──► (main) Pages deploy
infra/**  ──► Pulumi preview ──► (approved) pulumi up
schedule  ──► Refresh derived (changelog + screenshots)
schedule  ──► Lighthouse report artifact
push/PR   ──► CodeQL
```

Local equivalents: quality checks in [Setup](/docs/setup); derived outputs via `bin/sync-derived.sh`. Hosting secrets: [cloudflare-secrets.md](./cloudflare-secrets.md).
