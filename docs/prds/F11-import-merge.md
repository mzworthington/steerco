# PRD F11 - Import & merge

**Slice:** 2+ · **Mockup:** `technical/steerco-03-import-merge.png`

## Problem

Teams already live in Backstage/GitHub/Entra. Leaders should map them into SteerSpec without dual entry or competing Group files.

## Goal

Import directory shapes, preview merge, apply refs into SteerSpec; support Backstage Group export and write-backs.

## User stories

- As a Platform engineer, I import Groups from Backstage Catalog API.
- As a Platform engineer, I configure export and graph write-back options for Backstage Groups.
- As a Director, I only see friendly names after import (executive views unchanged).

## Requirements

1. Source tabs: Backstage / GitHub / Entra
2. Diff preview: incoming → SteerSpec team links
3. Configuration panel for Backstage Groups: customize Group YAML and export/graph contribution settings
4. Apply updates `teams[]` + `externalRefs` + `provenance`
5. Optional emit SteerBet overlay (opt-in)

## Acceptance

- Provider-backed import supports proposing, exporting, and writing back Group catalog definitions to Backstage
- Supports exporting Group definitions when user opts in

## XFN

Security: read-only scopes default · Audit log of applied merges (local)
