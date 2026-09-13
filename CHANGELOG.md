# Changelog

## 2026-09-12

### 🐛 Bug Fixes

- *(deps)* Clear Dependabot alerts for js-yaml and extract-zip (#49)

### 🧰 Maintenance & Dependencies

- Improve dependendabot & codeQL

## 2026-09-11

### 🐛 Bug Fixes

- *(deps)* Bump wrangler so sharp reaches the libheif patch

### 🧰 Maintenance & Dependencies

- *(deps-dev)* Bump @types/node in /infra/cloudflare (#37)
- *(deps-dev)* Bump @testing-library/user-event in /app (#38)
- *(deps)* Bump posthog-js from 1.425.1 to 1.426.2 in /app (#39)
- *(deps-dev)* Bump knip from 6.32.2 to 6.34.0 in /app (#40)
- *(deps-dev)* Bump wrangler from 4.125.0 to 4.129.0 in /app (#41)
- *(deps)* Bump @xyflow/react from 12.10.0 to 12.11.6 in /app (#42)
- *(deps-dev)* Bump oxlint from 1.79.0 to 1.81.0 in /app (#44)
- *(deps-dev)* Bump vitest from 4.1.10 to 5.0.0 in /app (#45)
- *(deps-dev)* Bump lint-staged from 17.3.0 to 17.5.0 in /app (#43)
- *(deps-dev)* Bump @testing-library/react in /app (#47)
- *(deps-dev)* Bump vite from 8.2.1 to 8.2.2 in /app (#46)
- Update wk hooks
- Steerlens updates
- *(deps)* Bump app and Pulumi packages to latest current majors

### 🧪 Testing

- *(organisation)* Catalog planned XaaS load risk (MZW-55) (#36)

## 2026-09-07

### 🐛 Bug Fixes

- Update import paths to remove file extensions in analysis package

## 2026-09-06

### 🚀 Features

- *(organisation)* Add tests for platform load risk in planned X-as-a-Service scenarios

### 🧰 Maintenance & Dependencies

- *(deps)* Bump @pulumi/cloudflare in /infra/cloudflare (#34)
- *(deps-dev)* Bump @types/node in /infra/cloudflare (#33)
- *(deps-dev)* Bump wrangler from 4.120.0 to 4.125.0 in /app (#32)
- *(deps-dev)* Bump oxlint from 1.77.0 to 1.79.0 in /app (#31)
- *(deps-dev)* Bump @testing-library/user-event in /app (#29)
- *(deps-dev)* Bump knip from 6.32.0 to 6.32.2 in /app (#25)
- *(deps-dev)* Bump @testing-library/jest-dom in /app (#24)
- *(deps-dev)* Bump @axe-core/playwright from 4.11.1 to 4.13.0 in /app (#22)
- *(deps)* Bump @pulumi/pulumi in /infra/cloudflare (#28)
- *(deps)* Bump zod from 4.3.6 to 4.5.4 in /app (#19)
- *(deps-dev)* Bump @types/node from 26.1.2 to 26.4.1 in /app (#21)
- *(deps)* Bump mermaid from 11.16.1 to 11.17.2 in /app (#30)

## 2026-09-05

### 🚀 Features

- Enhance accessibility and UI components across the application

### 📚 Documentation

- Update README, press release, and product guid

## 2026-09-04

### 🚀 Features

- Enhance organisation timeline with capacity markers and update related tests
- *(organisation)* Record planned team-shape changes (MZW-55)

### 🐛 Bug Fixes

- Pipeline fixes

### 🧰 Maintenance & Dependencies

- Retry pnpm setup after npm registry 504s (MZW-55)

## 2026-09-03

### 🚀 Features

- Integrate PostHog for analytics tracking

### 🐛 Bug Fixes

- Skip core-js postinstall and format PostHog secrets docs

### 🧰 Maintenance & Dependencies

- Update documentation for Waykit integration and clarify setup instructions
- Dependabot fixes
- Depndabot fixes
- Update .gitignore and AGENTS.md for MCP configuration and setup instructions
- Add pulumi to toolchain installation in mise.toml
- Update core-js setting in pnpm-workspace.yaml to false

## 2026-09-02

### 🧰 Maintenance & Dependencies

- Update references from agent-lifecycle-kit to Waykit in documentation and setup script

## 2026-09-01

### 🚀 Features

- *(cloudflare)* Inject web analytics beacon and update documentation

### ⚙️ Refactoring & Performance

- *(cloudflare)* Remove web analytics beacon injection and update documentation for autoInstall

## 2026-08-20

### 🚀 Features

- Remove preview feature flag and tidy up docs

## 2026-08-12

### 🚀 Features

- Lvt lanaguage
- Coplanar domain/stream/team lenses and team-size load signals (#12)
- Add consistent LVT child creation on Goals (#14)
- Use modal when adding goals, bets, and initiatives
- Add installable PWA with vite-plugin-pwa (#16)

### 🧪 Testing

- Cover Goals modal add goal/bet/initiative in critical journey (#15)

## 2026-08-11

### 🚀 Features

- Persist preview mode in localStorage until preview=no
- Team topologies learnings and a first class principle
- Add initiatives and products to steerSpec with validation and presentation updates
- Improved graphs
- Rename to SteerCo
- Improved front page logo
- Enhance BrandReveal component and update HomePage layout
- Remove many views that did not pass user testing

### 🐛 Bug Fixes

- *(test)* Speed up OrganisationPage tests to stop CI timeouts
- *(ui)* Improve mobile navigation for workspace and docs (#10)
- *(ui)* Hide graph full-view control on mobile (#11)

### 🧰 Maintenance & Dependencies

- Update brand assets with new logo designs, SVG adjustments, and favicon enhancements
- Roadmap enhancements
- Copy changes

### 📚 Documentation

- Elevate EDGE teachings beyond the Lean Value Tree

## 2026-08-10

### 🚀 Features

- Deploy placeholder app to cloudflare
- Enhance documentation structure with ADR support and improve Markdown rendering
- Integrate new workspace features and enhance documentation with Mermaid support
- Update team roles and interaction modes in SteerSpec schema, enhance YAML fixture with team members and their roles
- Replace DecisionNotesStubPage with DecisionNotesPage and add export functionality; enhance styling and update SteeringOverviewPage to display decision notes summary
- Update dependencies and enhance workspace features with new Evidence and Diff pages; improve styling and session management
- Enhance SteerSpec schema with new metrics and funding attributes; update documentation and tests for improved clarity and functionality
- Add support for new team topology shapes and interaction modes; enhance styling and update tests for improved functionality

### 🧰 Maintenance & Dependencies

- Fix knip findings and add to precommit
- Update design system and branding to SteerLens executive theme with new color tokens and assets
- Update brand assets with new logo designs and favicon adjustments
