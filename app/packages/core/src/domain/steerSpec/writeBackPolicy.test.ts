import { describe, expect, it } from 'vitest';
import { evaluateWriteBackPolicy, summariseWriteBackPolicy } from './writeBackPolicy';
import { parseSteerSpecYaml } from './parseSteerSpecYaml';

describe('evaluateWriteBackPolicy', () => {
  it('denies Group YAML for provider provenance', () => {
    for (const provenance of ['backstage', 'github', 'entra'] as const) {
      const decision = evaluateWriteBackPolicy({ provenance, artifact: 'group_yaml' });
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toMatch(/deny group yaml/i);
    }
  });

  it('allows SteerBet overlay and SteerSpec always', () => {
    expect(
      evaluateWriteBackPolicy({ provenance: 'entra', artifact: 'steer_overlay' }).allowed,
    ).toBe(true);
    expect(evaluateWriteBackPolicy({ provenance: 'local', artifact: 'steerspec' }).allowed).toBe(
      true,
    );
  });

  it('allows catalog_file Group YAML only with opt-in', () => {
    expect(
      evaluateWriteBackPolicy({ provenance: 'catalog_file', artifact: 'group_yaml' }).allowed,
    ).toBe(false);
    expect(
      evaluateWriteBackPolicy({
        provenance: 'catalog_file',
        artifact: 'group_yaml',
        catalogFileOptIn: true,
      }).allowed,
    ).toBe(true);
  });
});

describe('summariseWriteBackPolicy', () => {
  it('counts provider-blocked teams in the sample', () => {
    const yaml = `
apiVersion: steerlens.dev/v1alpha1
kind: SteerTree
metadata:
  name: demo
spec:
  vision: A vision
  outcomes: []
  bets: []
  teams:
    - id: team_a
      displayName: A
      role: stream_aligned
      provenance: entra
      members: []
    - id: team_b
      displayName: B
      role: platform
      provenance: catalog_file
      members: []
`;
    const parsed = parseSteerSpecYaml(yaml);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const summary = summariseWriteBackPolicy(parsed.value);
    expect(summary.providerBlocked).toBe(1);
    expect(summary.catalogFileEligible).toBe(1);
  });
});
