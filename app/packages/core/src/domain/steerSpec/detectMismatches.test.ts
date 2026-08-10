import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSteerSpecYaml, type SteerSpec } from '../../index';
import { detectSteerSpecMismatches, DEFAULT_PLATFORM_OVERLOAD_THRESHOLD } from './detectMismatches';

const fixtureDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../fixtures');
const sampleYaml = readFileSync(path.join(fixtureDir, 'steertree.sample.yaml'), 'utf8');

function loadSample(): SteerSpec {
  const parsed = parseSteerSpecYaml(sampleYaml);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.value;
}

describe('detectSteerSpecMismatches', () => {
  it('does not flag platform_overload on the sample workspace', () => {
    const mismatches = detectSteerSpecMismatches(loadSample());
    expect(mismatches.some((item) => item.code === 'platform_overload')).toBe(false);
  });

  it('flags platform_overload when dependents meet the threshold', () => {
    const sample = loadSample();
    const dependents = Array.from({ length: DEFAULT_PLATFORM_OVERLOAD_THRESHOLD }, (_, index) => ({
      id: `team_dep_${index}`,
      displayName: `Dependent ${index}`,
      role: 'stream_aligned' as const,
      provenance: 'local' as const,
      externalRefs: [],
      members: [],
    }));
    const overloaded: SteerSpec = {
      ...sample,
      spec: {
        ...sample.spec,
        teams: [...sample.spec.teams, ...dependents],
        relationships: [
          ...sample.spec.relationships,
          ...dependents.map((team) => ({
            fromTeamId: team.id,
            toTeamId: 'team_fulfilil',
            mode: 'x_as_a_service' as const,
          })),
        ],
      },
    };

    const mismatches = detectSteerSpecMismatches(overloaded);
    const overload = mismatches.find((item) => item.code === 'platform_overload');
    expect(overload).toBeTruthy();
    expect(overload?.headline).toMatch(/cognitive-load|flow/i);
    expect(overload?.headline).toMatch(/Fulfilment platform|8/);
  });

  it('flags bet_without_team when fundedTeamIds is empty', () => {
    const sample = loadSample();
    const nextBets = sample.spec.bets.map((bet, index) =>
      index === 0 ? { ...bet, fundedTeamIds: [] } : bet,
    );
    const mismatches = detectSteerSpecMismatches({
      ...sample,
      spec: { ...sample.spec, bets: nextBets },
    });
    expect(mismatches.some((item) => item.code === 'bet_without_team')).toBe(true);
  });
});
