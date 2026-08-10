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

  for (const bet of doc.spec.bets) {
    if (!outcomeIds.has(bet.outcomeId)) {
      return `Bet "${bet.id}" references unknown outcome "${bet.outcomeId}"`;
    }
  }

  return null;
}
