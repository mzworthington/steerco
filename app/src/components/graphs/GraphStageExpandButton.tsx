import { useLgUp } from '../../hooks/useMediaQuery';

type Props = {
  expanded: boolean;
  onToggle: () => void;
  testId?: string;
  /** `primary` makes Full view a strong CTA (org graph). */
  variant?: 'quiet' | 'primary';
};

/** Desktop-only: full-view overlays assume the workspace sidebar layout. */
export function GraphStageExpandButton({ expanded, onToggle, testId, variant = 'quiet' }: Props) {
  const desktop = useLgUp();
  if (!desktop) return null;

  const className =
    variant === 'primary'
      ? expanded
        ? 'graph-stage-expand-btn graph-stage-expand-btn--primary is-exit'
        : 'graph-stage-expand-btn graph-stage-expand-btn--primary'
      : 'graph-stage-expand-btn';

  return (
    <button
      type="button"
      className={className}
      onClick={onToggle}
      aria-pressed={expanded}
      data-testid={testId ?? 'graph-stage-expand'}
    >
      {expanded ? 'Exit full view' : 'Full view'}
    </button>
  );
}
