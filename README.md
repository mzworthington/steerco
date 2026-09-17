# SteerCo

[![CI](https://img.shields.io/github/actions/workflow/status/mzworthington/steerco/ci.yml?branch=main&style=for-the-badge&logo=github-actions&label=CI)](https://github.com/mzworthington/steerco/actions/workflows/ci.yml)
[![Quality gate](https://img.shields.io/sonar/alert_status/mzworthington_steerco?server=https%3A%2F%2Fsonarcloud.io&style=for-the-badge&logo=sonarqube)](https://sonarcloud.io/summary/new_code?id=mzworthington_steerco)

SteerCo holds the **investment contract**: goals, funded bets, topology intent and decision notes. Local-first board pack. Not another system of record.

## Overview

Jira plans work. Backstage catalogs systems. Directories catalog people. SteerCo is what you steer from: start, stop or continue, with the evidence in the same pack.

Product planning and specs live under [`docs/`](./docs/) and feature PRDs under [`docs/prds/`](./docs/prds/). The canonical SteerSpec schema is at [`schemas/`](./schemas/) and the sample at [`samples/`](./samples/). Implementation is under [`app/`](./app/) (`@steerco/app` + `@steerco/core`). Architecture decisions: [`docs/ADRs/`](./docs/ADRs/).

## Getting started

```bash
bin/setup-dev-env.sh
cd app && pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

## Docs

In-app docs at `/docs` (Markdown under `docs/`). Design tokens and recipes: `/docs/design-system` and [docs/design-system.md](./docs/design-system.md).

## License

See [LICENSE](./LICENSE).
