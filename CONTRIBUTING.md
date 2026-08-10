# Contributing

## Local setup

See [Setup](docs/setup.md).

```bash
bin/setup-dev-env.sh
cd app && pnpm dev
```

Append `?preview=1` to unlock the full site locally.

## Quality checks

```bash
cd app
pnpm format:check
pnpm lint
pnpm typecheck
pnpm knip
pnpm test
pnpm build
```

Pre-commit hooks run formatting, lint, typecheck, and knip on relevant staged files.

## Pull requests

Use the [pull request template](.github/pull_request_template.md). Prefer conventional commits (`feat:`, `fix:`, `docs:`, …) so the changelog renderer can group them.
