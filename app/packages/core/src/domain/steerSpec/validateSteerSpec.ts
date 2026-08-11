import type { SteerSpec } from './steerSpecSchema';

export function formatSteerSpecIssues(
  issues: readonly { path: PropertyKey[]; message: string }[],
): string {
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.map(String).join('.') : 'document';
      return `${path}: ${issue.message}`;
    })
    .join('; ');
}

export function validateSteerSpecReferences(doc: SteerSpec): string | null {
  const outcomeIds = new Set(doc.spec.outcomes.map((outcome) => outcome.id));
  const teamIds = new Set(doc.spec.teams.map((team) => team.id));
  const streamIds = new Set(doc.spec.streams.map((stream) => stream.id));

  for (const bet of doc.spec.bets) {
    if (!outcomeIds.has(bet.outcomeId)) {
      return `Bet "${bet.id}" references unknown outcome "${bet.outcomeId}"`;
    }
  }

  const betIds = new Set(doc.spec.bets.map((bet) => bet.id));

  for (const initiative of doc.spec.initiatives ?? []) {
    if (!betIds.has(initiative.betId)) {
      return `Initiative "${initiative.id}" references unknown bet "${initiative.betId}"`;
    }
  }

  for (const product of doc.spec.products ?? []) {
    for (const outcomeId of product.outcomeIds) {
      if (!outcomeIds.has(outcomeId)) {
        return `Product "${product.id}" references unknown outcome "${outcomeId}"`;
      }
    }
    for (const betId of product.betIds) {
      if (!betIds.has(betId)) {
        return `Product "${product.id}" references unknown bet "${betId}"`;
      }
    }
  }

  for (const team of doc.spec.teams) {
    for (const streamId of team.streamIds ?? []) {
      if (!streamIds.has(streamId)) {
        return `Team "${team.id}" references unknown stream "${streamId}"`;
      }
    }
  }

  for (const domain of doc.spec.domains ?? []) {
    for (const streamId of domain.memberStreamIds) {
      if (!streamIds.has(streamId)) {
        return `Domain "${domain.id}" references unknown stream "${streamId}"`;
      }
    }
  }

  for (const grouping of doc.spec.groupings ?? []) {
    for (const memberId of grouping.memberTeamIds) {
      if (!teamIds.has(memberId)) {
        return `Grouping "${grouping.id}" references unknown team "${memberId}"`;
      }
    }
  }

  return null;
}
