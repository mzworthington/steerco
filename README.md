# SteerLens

SteerLens helps product owners, product executives, and Engineering Directors keep **strategy, team shape, and evidence** aligned - and decide what to start, stop, or continue.

## Overview

Jira plans work. Backstage catalogs systems. Directories catalog people. SteerLens holds the **investment contract**: outcomes, funded bets, topology intent, and decision notes - as a local-first board pack, not another system of record.

Product planning lives under [`plan/`](./plan/). Implementation is under [`app/`](./app/) (`@steerlens/app` + `@steerlens/core`). Architecture decisions: [`docs/ADRs/`](./docs/ADRs/).

## Getting started

```bash
bin/setup-dev-env.sh
cd app && pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). Append `?preview=1` to unlock the full site behind the Coming Soon gate (sticky in `localStorage` until `?preview=no`).

## Docs

In-app docs at `/docs` (Markdown under `docs/`). Design tokens and recipes: `/docs/design-system` and [docs/design-system.md](./docs/design-system.md).

## License

See [LICENSE](./LICENSE).
