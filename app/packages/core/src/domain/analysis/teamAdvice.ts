import type { SteerSpec } from '../steerSpec/steerSpecSchema';
import { TEAM_SIZE_GUIDANCE } from '../teamTopologies/vocabulary';
import { communicationPaths, resolveAnalysisOptions } from './thresholds';
import type { AdviceRecommendation } from './types';

type ResolvedOptions = ReturnType<typeof resolveAnalysisOptions>;

/**
 * Team advice family: size, breadth (streams/domains), and chatter (communication paths).
 */
export function analyzeTeamAdvice(
  doc: SteerSpec,
  options: ResolvedOptions,
): AdviceRecommendation[] {
  const advice: AdviceRecommendation[] = [];
  const teamsById = new Map(doc.spec.teams.map((team) => [team.id, team]));
  const streamTitleById = new Map(doc.spec.streams.map((stream) => [stream.id, stream.title]));
  const domainByStreamId = new Map<string, { id: string; title: string }>();
  for (const domain of doc.spec.domains ?? []) {
    for (const streamId of domain.memberStreamIds ?? []) {
      if (!domainByStreamId.has(streamId)) {
        domainByStreamId.set(streamId, { id: domain.id, title: domain.title });
      }
    }
  }

  for (const team of doc.spec.teams) {
    const memberCount = team.members.length;
    if (memberCount >= options.teamSizeThreshold) {
      const paths = communicationPaths(memberCount);
      advice.push({
        code: 'team_size',
        family: 'team',
        severity: 'warning',
        title: 'Team size raising cognitive load',
        headline: `“${team.displayName}” has ${memberCount} people recorded. Team Topologies aims near ${TEAM_SIZE_GUIDANCE.idealAround}; above ~${options.teamSizeThreshold} trust and coordination strain.`,
        rationale: TEAM_SIZE_GUIDANCE.evolutionTeaching,
        relatedTeamIds: [team.id],
        metrics: { memberCount, communicationPaths: paths },
      });
    }

    const streamIds = team.streamIds ?? [];
    const domains = [
      ...new Map(
        streamIds
          .map((id) => domainByStreamId.get(id))
          .filter((item): item is { id: string; title: string } => Boolean(item))
          .map((item) => [item.id, item] as const),
      ).values(),
    ];
    const tooManyStreams = streamIds.length >= options.teamBreadthStreamThreshold;
    const tooManyDomains = domains.length >= options.teamBreadthDomainThreshold;
    if (tooManyStreams || tooManyDomains) {
      const domainLabel = domains.map((item) => item.title).join(', ') || 'none linked';
      advice.push({
        code: 'team_breadth',
        family: 'team',
        severity: 'warning',
        title: 'Team spanning too much problem space',
        headline: `“${team.displayName}” is aligned to ${streamIds.length} stream${streamIds.length === 1 ? '' : 's'} across ${domains.length} domain${domains.length === 1 ? '' : 's'} (${domainLabel}). Ideal is one stream-aligned team per stream per bounded-context slice.`,
        rationale:
          'Breadth multiplies cognitive load. Find a fracture plane and split into peer sub-domains each with its own stream-aligned team - do not stack ownership under one team.',
        relatedTeamIds: [team.id],
        relatedStreamIds: streamIds,
        relatedDomainIds: domains.map((item) => item.id),
        metrics: { streamCount: streamIds.length, domainCount: domains.length },
      });
    }

    if (team.role === 'stream_aligned' && streamIds.length === 0) {
      advice.push({
        code: 'stream_aligned_without_stream',
        family: 'team',
        severity: 'warning',
        title: 'Stream-aligned team without a stream',
        headline: `“${team.displayName}” is stream-aligned but not assigned to a stream - ideally one team owns one flow of change end-to-end.`,
        relatedTeamIds: [team.id],
      });
    }

    if (team.role === 'complicated_subsystem' && streamIds.length === 0) {
      advice.push({
        code: 'css_without_stream',
        family: 'team',
        severity: 'warning',
        title: 'Complicated subsystem outside a stream',
        headline: `“${team.displayName}” is a complicated subsystem with no stream - place it in a stream and use interaction modes (X-as-a-Service / Collaboration) to show how embedded it is.`,
        relatedTeamIds: [team.id],
      });
    }

    if (team.role === 'stream_aligned' && memberCount > 0) {
      const hasProduct = team.members.some((member) => member.discipline === 'product');
      if (!hasProduct) {
        advice.push({
          code: 'stream_missing_product',
          family: 'team',
          severity: 'warning',
          title: 'Stream team without product capacity',
          headline: `“${team.displayName}” has members recorded but no product discipline FTE - discovery and goal framing may stall.`,
          relatedTeamIds: [team.id],
        });
      }
    }

    const paths = communicationPaths(memberCount);
    if (memberCount >= 2 && paths >= options.teamChatterPathsThreshold) {
      advice.push({
        code: 'team_chatter',
        family: 'team',
        severity: 'warning',
        title: 'Team chatter raising coordination cost',
        headline: `“${team.displayName}” has ~${paths} within-team communication paths (${memberCount} people). High chatter slows decisions and raises cognitive load.`,
        rationale:
          'Communication paths grow as n(n-1)/2. Reduce size, split along fracture planes, or pull shared complexity into a platform / complicated subsystem.',
        relatedTeamIds: [team.id],
        metrics: { memberCount, communicationPaths: paths },
      });
    }

    const collabEdges = doc.spec.relationships.filter(
      (relationship) =>
        (relationship.fromTeamId === team.id || relationship.toTeamId === team.id) &&
        (relationship.mode === 'collaboration' || relationship.mode === 'facilitation'),
    );
    if (collabEdges.length >= options.teamChatterRelationshipThreshold) {
      advice.push({
        code: 'team_chatter_external',
        family: 'team',
        severity: 'warning',
        title: 'High external collaboration chatter',
        headline: `“${team.displayName}” has ${collabEdges.length} collaboration/facilitation edges - high-bandwidth chatter that should stay time-boxed or become X-as-a-Service.`,
        rationale:
          'Treat stream-aligned teams as customers of platforms. Replace permanent collaboration with clearer service boundaries where discovery is done.',
        relatedTeamIds: [team.id],
        metrics: { relationshipCount: collabEdges.length },
      });
    }
  }

  const streamAlignedByStream = new Map<string, string[]>();
  for (const team of doc.spec.teams) {
    if (team.role !== 'stream_aligned') continue;
    for (const streamId of team.streamIds ?? []) {
      const list = streamAlignedByStream.get(streamId) ?? [];
      list.push(team.id);
      streamAlignedByStream.set(streamId, list);
    }
  }
  for (const [streamId, teamIds] of streamAlignedByStream) {
    if (teamIds.length < 2) continue;
    const names = teamIds.map((id) => teamsById.get(id)?.displayName ?? id);
    advice.push({
      code: 'stream_multi_team',
      family: 'team',
      severity: 'warning',
      title: 'Multiple stream-aligned teams on one stream',
      headline: `Stream “${streamTitleById.get(streamId) ?? streamId}” has ${teamIds.length} stream-aligned teams (${names.join(', ')}). Ideal is one team owning one flow - if load is high, find a fracture plane and split into peer bounded-context slices each with its own stream.`,
      relatedTeamIds: teamIds,
      relatedStreamIds: [streamId],
      metrics: { streamAlignedTeamCount: teamIds.length },
    });
  }

  for (const team of doc.spec.teams) {
    if (team.role !== 'platform') continue;
    const dependents = doc.spec.relationships.filter(
      (relationship) => relationship.toTeamId === team.id && relationship.mode === 'x_as_a_service',
    );
    if (dependents.length >= options.platformOverloadThreshold) {
      advice.push({
        code: 'platform_overload',
        family: 'team',
        severity: 'warning',
        title: 'Platform under heavy load',
        headline: `“${team.displayName}” has ${dependents.length} teams using it as a service - a cognitive-load and flow risk for those dependents, not a headcount problem.`,
        relatedTeamIds: [team.id, ...dependents.map((item) => item.fromTeamId)],
        metrics: { dependentCount: dependents.length },
      });
    }
  }

  const TIME_BOXABLE_MODES = new Set(['collaboration', 'facilitation']);
  for (const relationship of doc.spec.relationships) {
    if (!TIME_BOXABLE_MODES.has(relationship.mode) || relationship.expectedUntil) continue;
    const from = teamsById.get(relationship.fromTeamId);
    const to = teamsById.get(relationship.toTeamId);
    advice.push({
      code: 'collab_without_end',
      family: 'team',
      severity: 'warning',
      title: 'Time-boxed interaction without an end date',
      headline: `“${from?.displayName ?? relationship.fromTeamId}” → “${to?.displayName ?? relationship.toTeamId}” (${relationship.mode}) has no expectedUntil - collaboration and facilitation are meant to be temporary.`,
      relatedTeamIds: [relationship.fromTeamId, relationship.toTeamId],
    });
  }

  const WIP_BET_STATUSES = new Set(['proposed', 'on_track', 'at_risk', 'stop_ready']);
  const STREAM_BET_WIP_THRESHOLD = 2;
  for (const team of doc.spec.teams) {
    if (team.role !== 'stream_aligned') continue;
    const activeBets = doc.spec.bets.filter(
      (bet) => WIP_BET_STATUSES.has(bet.status) && bet.fundedTeamIds.includes(team.id),
    );
    if (activeBets.length > STREAM_BET_WIP_THRESHOLD) {
      advice.push({
        code: 'stream_bet_wip',
        family: 'team',
        severity: 'warning',
        title: 'Stream-aligned team stretched across too many active bets',
        headline: `“${team.displayName}” is funded on ${activeBets.length} active bets at once - a work-in-progress risk, not a headcount problem.`,
        relatedTeamIds: [team.id],
        relatedBetIds: activeBets.map((bet) => bet.id),
        metrics: { activeBetCount: activeBets.length },
      });
    }
  }

  const ACTIVE_BET_STATUSES = new Set(['on_track', 'at_risk', 'stop_ready']);
  for (const bet of doc.spec.bets) {
    if (!ACTIVE_BET_STATUSES.has(bet.status) || bet.fundedTeamIds.length !== 1) continue;
    const soleTeam = teamsById.get(bet.fundedTeamIds[0]);
    if (soleTeam?.role === 'enabling') {
      advice.push({
        code: 'enabling_owns_delivery',
        family: 'team',
        severity: 'warning',
        title: 'Enabling team carrying sole delivery ownership',
        headline: `“${soleTeam.displayName}” is the only funded team on “${bet.title}” - enabling teams should coach delivery, not own it long-term.`,
        relatedTeamIds: [soleTeam.id],
        relatedBetIds: [bet.id],
      });
    }
  }

  const fundedTeamIds = new Set(doc.spec.bets.flatMap((bet) => bet.fundedTeamIds));
  for (const team of doc.spec.teams) {
    if (team.role === 'stream_aligned' && !fundedTeamIds.has(team.id)) {
      advice.push({
        code: 'team_without_bet',
        family: 'team',
        severity: 'warning',
        title: 'Customer-facing team without a bet',
        headline: `“${team.displayName}” is not funding any bet yet.`,
        relatedTeamIds: [team.id],
      });
    }
  }

  return advice;
}
