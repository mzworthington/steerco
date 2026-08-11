const DECISION_NOTE_SEED_KEY = 'steerco.decision-note-seed';

export type DecisionNoteMeasuredSeed = {
  measuredLines: string[];
};

export function stashDecisionNoteMeasured(lines: string[]): void {
  const cleaned = lines.map((line) => line.trim()).filter(Boolean);
  if (cleaned.length === 0) return;
  sessionStorage.setItem(
    DECISION_NOTE_SEED_KEY,
    JSON.stringify({ measuredLines: cleaned } satisfies DecisionNoteMeasuredSeed),
  );
}

/** Read and clear a one-shot measured-lines seed for the decision note editor. */
export function takeDecisionNoteMeasured(): string[] | null {
  try {
    const raw = sessionStorage.getItem(DECISION_NOTE_SEED_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(DECISION_NOTE_SEED_KEY);
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const lines = (parsed as DecisionNoteMeasuredSeed).measuredLines;
    if (!Array.isArray(lines)) return null;
    const cleaned = lines.filter(
      (line): line is string => typeof line === 'string' && Boolean(line.trim()),
    );
    return cleaned.length > 0 ? cleaned : null;
  } catch {
    sessionStorage.removeItem(DECISION_NOTE_SEED_KEY);
    return null;
  }
}
