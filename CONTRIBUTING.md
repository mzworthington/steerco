# Contributing

## Local setup

See [Setup](docs/setup.md).

```bash
bin/init-project.sh   # prompts; or --name / --slug
bin/setup-dev-env.sh
cd app && pnpm dev
```

## Quality checks

```bash
cd app
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Pre-commit hooks run formatting, lint, and typecheck on relevant staged files.

## Pull requests

Use the [pull request template](.github/pull_request_template.md). Prefer conventional commits (`feat:`, `fix:`, `docs:`, …) so the changelog renderer can group them.
