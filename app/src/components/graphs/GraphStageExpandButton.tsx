type Props = {
  expanded: boolean;
  onToggle: () => void;
  testId?: string;
};

export function GraphStageExpandButton({ expanded, onToggle, testId }: Props) {
  return (
    <button
      type="button"
      className="graph-stage-expand-btn"
      onClick={onToggle}
      aria-pressed={expanded}
      data-testid={testId ?? 'graph-stage-expand'}
    >
      {expanded ? 'Exit full view' : 'Full view'}
    </button>
  );
}
