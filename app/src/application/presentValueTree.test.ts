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
  it('builds positioned TB and LR graphs with selectable node metadata', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const tb = presentValueTree(opened.value, 'TB');
    expect(tb.vision).toMatch(/customer promises/i);
    expect(tb.nodes.some((node) => node.kind === 'vision')).toBe(true);
    expect(tb.nodes.some((node) => node.kind === 'outcome')).toBe(true);
    expect(
      tb.nodes.some((node) => node.kind === 'bet' && node.href?.startsWith('/workspace/bets/')),
    ).toBe(true);
    expect(tb.edges.length).toBeGreaterThan(0);
    expect(tb.betCount).toBeGreaterThan(0);
    expect(tb.initiativeCount).toBeGreaterThan(0);
    expect(tb.lead).toMatch(/top-down/i);

    const vision = tb.nodes.find((node) => node.id === 'vision');
    const child = tb.nodes.find((node) => node.depth === 1);
    expect(vision && child && child.position.y > vision.position.y).toBe(true);

    const lr = presentValueTree(opened.value, 'LR');
    expect(lr.lead).toMatch(/left-to-right/i);
    expect(lr.outline).toEqual(tb.outline);
    const lrVision = lr.nodes.find((node) => node.id === 'vision');
    const lrChild = lr.nodes.find((node) => node.depth === 1);
    expect(lrVision && lrChild && lrChild.position.x > lrVision.position.x).toBe(true);
  });
});
