export function trimAffixRuns(value: string, affix: string): string {
  if (!affix) return value;
  let start = 0;
  let end = value.length;
  while (start < end && value.startsWith(affix, start)) start += affix.length;
  while (end > start && value.endsWith(affix, end)) end -= affix.length;
  return value.slice(start, end);
}
