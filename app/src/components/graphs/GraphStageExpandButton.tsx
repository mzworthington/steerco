import { useLgUp } from '../../hooks/useMediaQuery';

type Props = {
  expanded: boolean;
  onToggle: () => void;
  testId?: string;
};

/** Desktop-only: full-view overlays assume the workspace sidebar layout. */
export function GraphStageExpandButton({ expanded, onToggle, testId }: Props) {
  const desktop = useLgUp();
  if (!desktop) return null;

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
