import { describe, expect, it } from 'vitest';
import { createBlankSteerSpec, BLANK_WORKSPACE_LABEL } from './createBlankWorkspace';
import { serializeSteerSpec } from '@steerlens/core';
import { openWorkspaceFromYaml } from './openWorkspace';

describe('createBlankSteerSpec', () => {
  it('builds a minimal valid SteerSpec that round-trips through YAML', () => {
    const blank = createBlankSteerSpec();
    expect(blank.metadata.title).toBe(BLANK_WORKSPACE_LABEL);
    expect(blank.spec.outcomes).toEqual([]);
    expect(blank.spec.bets).toEqual([]);
    expect(blank.spec.teams).toEqual([]);

    const opened = openWorkspaceFromYaml(serializeSteerSpec(blank));
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;
    expect(opened.value.metadata.name).toBe('new-workspace');
  });

  it('accepts a custom title and slugifies the name', () => {
    const blank = createBlankSteerSpec({ name: 'Acme Q4!', title: 'Acme Q4' });
    expect(blank.metadata.name).toBe('acme-q4');
    expect(blank.metadata.title).toBe('Acme Q4');
  });
});
