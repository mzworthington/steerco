import { describe, expect, it } from 'vitest';
import { isLvtHierarchyType, lvtPath, parseLvtPath } from './lvtRoutes';

describe('lvtRoutes', () => {
  it('builds optional focus paths under /workspace/lvt', () => {
    expect(lvtPath()).toBe('/workspace/lvt');
    expect(lvtPath('bet', 'bet_pickup')).toBe('/workspace/lvt/bet/bet_pickup');
    expect(lvtPath('goal', 'out_promise')).toBe('/workspace/lvt/goal/out_promise');
    expect(lvtPath('vision', 'vision')).toBe('/workspace/lvt/vision/vision');
  });

  it('parses focus from the path and rejects unknown hierarchy types', () => {
    expect(parseLvtPath('/workspace/lvt')).toBeNull();
    expect(parseLvtPath('/workspace/lvt/bet/bet_pickup')).toEqual({
      type: 'bet',
      slug: 'bet_pickup',
    });
    expect(parseLvtPath('/workspace/lvt/team/team_x')).toBeNull();
    expect(isLvtHierarchyType('bet')).toBe(true);
    expect(isLvtHierarchyType('team')).toBe(false);
  });
});
