# Security Policy

## Reporting a vulnerability

Please report security issues privately via [GitHub Security Advisories](https://github.com/mzworthington/steerlens/security/advisories/new) rather than opening a public issue.

Include:

- A clear description and impact
- Steps to reproduce or a minimal proof of concept
- Affected area (app, `@steerlens/core`, CI, Cloudflare bootstrap)

## Supported versions

Security fixes apply to `main` and the latest release.

## Scope

SteerLens is a React SPA + Cloudflare Pages product with a pure SteerSpec domain package. Reports of interest include XSS in the app, secret leakage in workflows/scripts, unsafe SteerSpec parsing, and supply-chain issues in CI.
