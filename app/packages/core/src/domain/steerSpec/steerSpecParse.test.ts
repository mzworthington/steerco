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

    expect(result.value.metadata.name).toBe('platform-transformation');
    expect(result.value.spec.outcomes.map((o) => o.id)).toEqual(['out_delivery']);
    expect(result.value.spec.bets.map((b) => b.id)).toEqual(['bet_pipeline', 'bet_idp', 'bet_obs']);
    expect(result.value.spec.teams.map((t) => t.id)).toEqual([
      'team_checkout',
      'team_sportsbook',
      'team_platform',
      'team_devex',
    ]);
  });

  it('rejects an unsupported apiVersion with a plain-language error', () => {
    const result = parseSteerSpecYaml(`
apiVersion: steerlens.dev/v0
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
apiVersion: steerlens.dev/v1alpha1
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
apiVersion: steerlens.dev/v1alpha1
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

  it('rejects a bet that references a missing outcome', () => {
    const result = parseSteerSpecYaml(`
apiVersion: steerlens.dev/v1alpha1
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
apiVersion: steerlens.dev/v1alpha1
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
