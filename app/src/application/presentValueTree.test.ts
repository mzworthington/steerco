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
    expect(tb.nodes.some((node) => node.kind === 'goal')).toBe(true);
    expect(
      tb.nodes.some((node) => node.kind === 'bet' && node.href?.startsWith('/workspace/lvt/bet/')),
    ).toBe(true);
    expect(tb.edges.length).toBeGreaterThan(0);
    expect(tb.nodes.some((node) => node.kind === 'initiative')).toBe(true);
    expect(tb.lead).toMatch(/select a node/i);

    const vision = tb.nodes.find((node) => node.id === 'vision');
    const child = tb.nodes.find((node) => node.depth === 1);
    expect(vision && child && child.position.y > vision.position.y).toBe(true);
    expect(vision?.meta).toMatch(/goal/i);
    expect(vision?.meta).toMatch(/bet/i);
    expect(vision?.facts.some((fact) => /stance|cue/i.test(fact.label))).toBe(true);
    expect(vision?.measures).toEqual([]);
    expect(vision?.href).toBeNull();
    expect(vision?.hrefLabel).toBeNull();

    const goal = tb.nodes.find((node) => node.kind === 'goal');
    expect(goal?.measures.length).toBeGreaterThan(0);
    expect(goal?.statusLabel).toBeTruthy();
    expect(goal?.meta).toMatch(/measure|bet/i);
    expect(goal?.href).toBeNull();

    const bet = tb.nodes.find((node) => node.kind === 'bet');
    expect(bet?.facts.some((fact) => fact.label === 'Kill criteria')).toBe(true);
    expect(bet?.href?.startsWith('/workspace/lvt/bet/')).toBe(true);

    const lr = presentValueTree(opened.value, 'LR');
    expect(lr.nodes.map((node) => node.id)).toEqual(tb.nodes.map((node) => node.id));
    const lrVision = lr.nodes.find((node) => node.id === 'vision');
    const lrChild = lr.nodes.find((node) => node.depth === 1);
    expect(lrVision && lrChild && lrChild.position.x > lrVision.position.x).toBe(true);
  });
});
