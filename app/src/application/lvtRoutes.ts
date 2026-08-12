import type { ValueTreeNodeKind } from './presentValueTree';

export type LvtHierarchyType = ValueTreeNodeKind;

const HIERARCHY_TYPES = new Set<LvtHierarchyType>(['vision', 'goal', 'bet', 'initiative']);

export type LvtFocus = {
  type: LvtHierarchyType;
  slug: string;
};

/** Base Lean Value Tree path; optional focus selects that node and shows its value. */
export function lvtPath(type?: LvtHierarchyType, slug?: string): string {
  if (!type || !slug) return '/workspace/lvt';
  return `/workspace/lvt/${type}/${encodeURIComponent(slug)}`;
}

export function parseLvtPath(path: string): LvtFocus | null {
  const match = path.match(/^\/workspace\/lvt\/([^/?#]+)\/([^/?#]+)/);
  if (!match) return null;
  const type = match[1];
  if (!HIERARCHY_TYPES.has(type as LvtHierarchyType)) return null;
  return {
    type: type as LvtHierarchyType,
    slug: decodeURIComponent(match[2] ?? ''),
  };
}

export function isLvtHierarchyType(value: string): value is LvtHierarchyType {
  return HIERARCHY_TYPES.has(value as LvtHierarchyType);
}
