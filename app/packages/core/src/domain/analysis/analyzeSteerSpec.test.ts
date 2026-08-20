import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSteerSpecYaml, type SteerSpec } from '../../index';
import { analyzeSteerSpec } from './analyzeSteerSpec';
import { ANALYSIS_DEFAULTS, communicationPaths } from './thresholds';

const fixtureDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../fixtures');
const sampleYaml = readFileSync(path.join(fixtureDir, 'steertree.sample.yaml'), 'utf8');

function loadSample(): SteerSpec {
  const parsed = parseSteerSpecYaml(sampleYaml);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.value;
}

describe('analyzeSteerSpec', () => {
  it('returns portfolio and team advice families', () => {
    const report = analyzeSteerSpec(loadSample());
    expect(report.portfolio).toBeDefined();
    expect(report.teams).toBeDefined();
    expect(report.all.length).toBe(report.portfolio.length + report.teams.length);
  });

  it('flags team_size when member count reaches the size threshold', () => {
    const sample = loadSample();
    const extra = Array.from({ length: 12 }, (_, index) => ({
      id: `mem_big_${index}`,
      displayName: `Extra ${index}`,
      discipline: 'engineering' as const,
      title: 'Engineer',
      ftePercent: 100,
    }));
    const nextTeams = sample.spec.teams.map((team) =>
      team.id === 'team_storefront' ? { ...team, members: [...team.members, ...extra] } : team,
    );
    const report = analyzeSteerSpec({
      ...sample,
      spec: { ...sample.spec, teams: nextTeams },
    });
    const size = report.teams.find((item) => item.code === 'team_size');
    expect(size).toBeTruthy();
    expect(size?.family).toBe('team');
    expect(size?.metrics?.memberCount).toBeGreaterThanOrEqual(ANALYSIS_DEFAULTS.teamSizeThreshold);
  });

  it('flags team_chatter from within-team communication paths', () => {
    expect(communicationPaths(9)).toBe(36);
    const sample = loadSample();
    const members = Array.from({ length: 9 }, (_, index) => ({
      id: `mem_chat_${index}`,
      displayName: `Chatter ${index}`,
      discipline: index === 0 ? ('product' as const) : ('engineering' as const),
      title: 'Engineer',
      ftePercent: 100,
    }));
    const nextTeams = sample.spec.teams.map((team) =>
      team.id === 'team_catalog' ? { ...team, members } : team,
    );
    const report = analyzeSteerSpec({
      ...sample,
      spec: { ...sample.spec, teams: nextTeams },
    });
    const chatter = report.teams.find(
      (item) => item.code === 'team_chatter' && item.relatedTeamIds?.includes('team_catalog'),
    );
    expect(chatter).toBeTruthy();
    expect(chatter?.metrics?.communicationPaths).toBe(36);
  });

  it('flags team_breadth when a team spans multiple streams', () => {
    const sample = loadSample();
    const nextTeams = sample.spec.teams.map((team) =>
      team.id === 'team_storefront'
        ? { ...team, streamIds: ['stream_storefront', 'stream_catalog'] }
        : team,
    );
    const report = analyzeSteerSpec({
      ...sample,
      spec: { ...sample.spec, teams: nextTeams },
    });
    const breadth = report.teams.find(
      (item) => item.code === 'team_breadth' && item.relatedTeamIds?.includes('team_storefront'),
    );
    expect(breadth).toBeTruthy();
    expect(breadth?.metrics?.streamCount).toBe(2);
  });

  it('includes portfolio advice for orphan goals and unfunded bets', () => {
    const sample = loadSample();
    const nextBets = sample.spec.bets.map((bet, index) =>
      index === 0 ? { ...bet, fundedTeamIds: [] } : bet,
    );
    const report = analyzeSteerSpec({
      ...sample,
      spec: { ...sample.spec, bets: nextBets },
    });
    expect(report.portfolio.some((item) => item.code === 'bet_without_team')).toBe(true);
  });
});
