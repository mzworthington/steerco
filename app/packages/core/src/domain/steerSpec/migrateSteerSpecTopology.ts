/**
 * Migrate older Slice 3 shapes into streams / domains / platform groupings.
 * - `groupings` with `kind: value_stream` → `streams[]` + team `streamIds`
 * - `teams[].withinTeamId` → inherit parent’s `streamIds` (CSS lives in a stream, not a team)
 * - drop retired `bets[].systemRefs` (ArchLens suite link deferred; field removed)
 */
export function migrateSteerSpecTopologyRaw(raw: unknown): unknown {
  if (!isRecord(raw) || !isRecord(raw.spec)) return raw;

  const spec = { ...raw.spec };
  const streams = asObjectArray(spec.streams).map((item) => ({ ...item }));
  const domains = asObjectArray(spec.domains).map((item) => ({ ...item }));
  const groupingsIn = asObjectArray(spec.groupings);
  const teams = asObjectArray(spec.teams).map((item) => ({ ...item }));
  const bets = asObjectArray(spec.bets).map((item) => {
    const next = { ...item };
    delete next.systemRefs;
    return next;
  });
  const existingStreamIds = new Set(
    streams.map((stream) => (typeof stream.id === 'string' ? stream.id : '')).filter(Boolean),
  );

  const keptGroupings: Record<string, unknown>[] = [];
  for (const grouping of groupingsIn) {
    if (grouping.kind === 'value_stream' && typeof grouping.id === 'string') {
      if (!existingStreamIds.has(grouping.id)) {
        streams.push({
          id: grouping.id,
          title: typeof grouping.title === 'string' ? grouping.title : grouping.id,
        });
        existingStreamIds.add(grouping.id);
      }
      const memberIds = Array.isArray(grouping.memberTeamIds)
        ? grouping.memberTeamIds.filter((id): id is string => typeof id === 'string')
        : [];
      for (const teamId of memberIds) {
        const team = teams.find((item) => item.id === teamId);
        if (!team) continue;
        team.streamIds = uniqueStrings([
          ...(Array.isArray(team.streamIds)
            ? team.streamIds.filter((id): id is string => typeof id === 'string')
            : []),
          grouping.id,
        ]);
      }
      continue;
    }
    keptGroupings.push(grouping);
  }

  for (const team of teams) {
    if (typeof team.withinTeamId !== 'string') continue;
    const parent = teams.find((item) => item.id === team.withinTeamId);
    const parentStreams = Array.isArray(parent?.streamIds)
      ? parent.streamIds.filter((id): id is string => typeof id === 'string')
      : [];
    team.streamIds = uniqueStrings([
      ...(Array.isArray(team.streamIds)
        ? team.streamIds.filter((id): id is string => typeof id === 'string')
        : []),
      ...parentStreams,
    ]);
    delete team.withinTeamId;
  }

  return {
    ...raw,
    spec: {
      ...spec,
      streams,
      domains,
      groupings: keptGroupings,
      teams,
      bets,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asObjectArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}
