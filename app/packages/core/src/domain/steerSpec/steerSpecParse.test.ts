import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseSteerSpecYaml } from './parseSteerSpecYaml';
import { serializeSteerSpec } from './serializeSteerSpec';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '../../../fixtures');
const sampleYaml = readFileSync(join(fixturesDir, 'steertree.sample.yaml'), 'utf8');

describe('parseSteerSpecYaml', () => {
  it('parses the bundled sample and keeps outcome, bet, and team ids', () => {
    const result = parseSteerSpecYaml(sampleYaml);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.metadata.name).toBe('northwind-q3-alignment');
    expect(result.value.spec.outcomes.map((o) => o.id)).toEqual(
      expect.arrayContaining(['out_promise', 'out_store']),
    );
    expect(result.value.spec.bets.map((b) => b.id)).toEqual(
      expect.arrayContaining([
        'bet_pickup',
        'bet_fulfilil',
        'bet_loyalty',
        'bet_pos_resilience',
        'bet_insights',
      ]),
    );
    expect(result.value.spec.teams.map((t) => t.id)).toEqual(
      expect.arrayContaining([
        'team_storefront',
        'team_catalog',
        'team_pricing',
        'team_fulfilil',
        'team_enablement',
      ]),
    );
    expect(result.value.spec.teams.length).toBeGreaterThan(20);
    expect(result.value.spec.groupings.map((g) => g.id)).toEqual(
      expect.arrayContaining(['grp_fulfilil_platform']),
    );
    expect(result.value.spec.streams.map((s) => s.id)).toEqual(
      expect.arrayContaining(['stream_storefront', 'stream_catalog']),
    );
    expect(result.value.spec.domains[0]?.memberStreamIds).toEqual(
      expect.arrayContaining(['stream_storefront', 'stream_catalog']),
    );
    expect(result.value.spec.domains.length).toBeGreaterThanOrEqual(5);
    expect(result.value.spec.teams.find((t) => t.id === 'team_pricing')?.streamIds).toEqual([
      'stream_storefront',
    ]);
    expect(result.value.spec.teams.find((t) => t.id === 'team_fulfilil')?.platformScope).toBe(
      'organisation',
    );
    expect(result.value.spec.teams[0]?.members[0]).toMatchObject({
      id: 'mem_storefront_em',
      discipline: 'leadership',
      title: 'Engineering Manager',
    });
  });

  it('rejects an unsupported apiVersion with a plain-language error', () => {
    const result = parseSteerSpecYaml(`
apiVersion: steerco.dev/v0
kind: SteerTree
metadata:
  name: demo
spec:
  vision: x
  outcomes: []
  bets: []
  teams: []
`);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/apiVersion|version/i);
  });

  it('rejects documents missing required fields', () => {
    const result = parseSteerSpecYaml(`
apiVersion: steerco.dev/v1alpha1
kind: SteerTree
metadata:
  name: demo
spec:
  vision: Only a vision
`);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.length).toBeGreaterThan(0);
  });

  it('rejects unknown fields on the document root', () => {
    const result = parseSteerSpecYaml(`
apiVersion: steerco.dev/v1alpha1
kind: SteerTree
metadata:
  name: demo
spec:
  vision: A vision
  outcomes: []
  bets: []
  teams: []
extra: surprise
`);

    expect(result.ok).toBe(false);
  });

  it('rejects invalid YAML syntax with a plain-language error', () => {
    const result = parseSteerSpecYaml('outcomes: [\n  - id: broken');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/yaml|syntax|parse/i);
  });

  it('rejects a team member missing discipline', () => {
    const result = parseSteerSpecYaml(`
apiVersion: steerco.dev/v1alpha1
kind: SteerTree
metadata:
  name: demo
spec:
  vision: A vision
  outcomes: []
  bets: []
  teams:
    - id: team_a
      displayName: Team A
      role: stream_aligned
      provenance: local
      members:
        - id: mem_a
          displayName: Ada
          title: Engineer
          ftePercent: 100
`);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/discipline/i);
  });

  it('rejects a bet that references a missing outcome', () => {
    const result = parseSteerSpecYaml(`
apiVersion: steerco.dev/v1alpha1
kind: SteerTree
metadata:
  name: demo
spec:
  vision: A vision
  outcomes:
    - id: out_a
      title: Outcome A
      status: on_track
  bets:
    - id: bet_x
      outcomeId: out_missing
      title: Orphan bet
      successSignal: Done
      killCriteria: Stop if unused
      status: proposed
  teams: []
`);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/outcome/i);
  });

  it('fails closed on hostile prototype keys instead of yielding a document', () => {
    const result = parseSteerSpecYaml(`
apiVersion: steerco.dev/v1alpha1
kind: SteerTree
metadata:
  name: demo
spec:
  vision: A vision
  outcomes: []
  bets: []
  teams: []
  __proto__:
    polluted: true
`);

    expect(result.ok).toBe(false);
  });
});

describe('serializeSteerSpec round-trip', () => {
  it('preserves ids and semantic fields through YAML', () => {
    const first = parseSteerSpecYaml(sampleYaml);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const yaml = serializeSteerSpec(first.value);
    const second = parseSteerSpecYaml(yaml);

    expect(second.ok).toBe(true);
    if (!second.ok) return;

    expect(second.value.apiVersion).toBe(first.value.apiVersion);
    expect(second.value.kind).toBe(first.value.kind);
    expect(second.value.metadata).toEqual(first.value.metadata);
    expect(second.value.spec.vision).toBe(first.value.spec.vision);
    expect(second.value.spec.outcomes).toEqual(first.value.spec.outcomes);
    expect(second.value.spec.bets).toEqual(first.value.spec.bets);
    expect(second.value.spec.teams).toEqual(first.value.spec.teams);
    expect(second.value.spec.relationships).toEqual(first.value.spec.relationships);
    expect(second.value.spec.decisionNotes).toEqual(first.value.spec.decisionNotes);
    expect(second.value.spec.evidence).toEqual(first.value.spec.evidence);
  });
});
