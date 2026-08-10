# PRD F09 - SteerSpec persistence

**Slice:** 1 · **Schema:** `schemas/steertree.schema.json`

## Problem

Without a durable contract, the UI is a toy. With a bad file format, git and future CI cannot help.

## Goal

Load/validate/save `steertree.yaml` as the workspace source of truth.

## User stories

- As a Director, my edits survive refresh when using a folder workspace.
- As an engineer (future), I can diff SteerSpec in git.

## Requirements

1. Parse YAML → validate with Zod/JSON Schema
2. Serialize stable key order where practical
3. Dirty state + Save (and optional autosave to FS when permission granted)
4. **Pending draft diff** (ArchLens-style): working copy vs last opened/accepted baseline; Revert draft; Accept draft (session baseline). Disk write remains Save/commit below.
5. Migration hook for `apiVersion` (passthrough v1alpha1 only in Slice 1)
6. Never write invalid docs over valid ones

## Acceptance

- Round-trip sample YAML preserves ids and semantics
- Invalid file blocks save; shows errors
- Diff view lists added / modified / deleted SteerSpec entities; Revert restores baseline; Accept clears pending without requiring disk yet

## XFN

Security: no secret fields · Resilience: atomic write where FS allows
