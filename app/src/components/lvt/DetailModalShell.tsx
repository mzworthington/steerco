import { useCallback, useEffect, useRef, type ReactNode } from 'react';

type Props = {
  title: string;
  testId?: string;
  onClose: () => void;
  /** When true, Escape/backdrop call onClose only after confirmLeave returns true. */
  confirmLeave?: () => boolean;
  children: ReactNode;
};

export function DetailModalShell({
  title,
  testId = 'detail-modal',
  onClose,
  confirmLeave,
  children,
}: Props) {
  const confirmLeaveRef = useRef(confirmLeave);
  confirmLeaveRef.current = confirmLeave;

  const requestClose = useCallback(() => {
    if (confirmLeaveRef.current && !confirmLeaveRef.current()) return;
    onClose();
  }, [onClose]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        requestClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [requestClose]);

  return (
    <div className="bet-detail-modal-root" data-testid={testId}>
      <button
        type="button"
        className="bet-detail-modal-backdrop"
        aria-label={`Close ${title}`}
        onClick={requestClose}
      />
      <div className="bet-detail-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="bet-detail-modal-panel">{children}</div>
      </div>
    </div>
  );
}
