import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from './openWorkspace';
import { presentValueTree } from './presentValueTree';

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../packages/core/fixtures',
);
const sampleYaml = readFileSync(path.join(fixtureDir, 'steertree.sample.yaml'), 'utf8');

describe('presentValueTree', () => {
  it('builds top-down and left-to-right Lean Value Tree graphs', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const tb = presentValueTree(opened.value, 'TB');
    expect(tb.vision).toMatch(/customer promises/i);
    expect(tb.mermaid).toContain('flowchart TB');
    expect(tb.mermaid).toContain('vision');
    expect(tb.mermaid).toMatch(/-->/);
    expect(tb.outline.length).toBeGreaterThan(0);
    expect(tb.betCount).toBeGreaterThan(0);
    expect(tb.initiativeCount).toBeGreaterThan(0);
    expect(tb.lead).toMatch(/top-down/i);

    const lr = presentValueTree(opened.value, 'LR');
    expect(lr.mermaid).toContain('flowchart LR');
    expect(lr.lead).toMatch(/left-to-right/i);
    expect(lr.outline).toEqual(tb.outline);
  });
});
