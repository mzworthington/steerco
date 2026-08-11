import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { openWorkspaceFromYaml } from './openWorkspace';
import {
  boardPackSectionGroups,
  buildBoardPackPreview,
  defaultBoardPackSelection,
  presentBoardPack,
} from './presentBoardPack';

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../packages/core/fixtures',
);
const sampleYaml = readFileSync(path.join(fixtureDir, 'steertree.sample.yaml'), 'utf8');

describe('presentBoardPack', () => {
  it('groups sections into Invest / Work / Adapt', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const model = presentBoardPack(opened.value);
    const groups = boardPackSectionGroups(model.sections);
    expect(groups.map((group) => group.pillarLabel)).toEqual(['Invest', 'Work', 'Adapt']);
    expect(model.coverBlurb).toMatch(/how should we invest/i);
  });

  it('includes decision notes by default and omits organisation when unchecked', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const selection = defaultBoardPackSelection();
    const full = buildBoardPackPreview(opened.value, selection, {
      date: new Date('2026-08-10T12:00:00Z'),
    });
    expect(full.decisionNotes?.some((note) => /loyalty/i.test(note.title))).toBe(true);
    expect(full.organisation).not.toBeNull();
    expect(full.filenameBase).toMatch(/^steerco-board-pack-northwind-q3-alignment-20260810$/);

    const withoutOrg = buildBoardPackPreview(opened.value, {
      ...selection,
      organisation: false,
    });
    expect(withoutOrg.organisation).toBeNull();
    expect(withoutOrg.pillars.some((pillar) => pillar.id === 'work')).toBe(false);
    expect(withoutOrg.decisionNotes?.length).toBeGreaterThan(0);
  });
});
