import { useCallback, useEffect, useRef, useState } from 'react';
import { BetDetailView, confirmLeaveIfDirty } from './BetDetailView';

type Props = {
  betId: string;
  onClose: () => void;
};

export function BetDetailModal({ betId, onClose }: Props) {
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;

  const requestClose = useCallback(() => {
    if (!confirmLeaveIfDirty(dirtyRef.current)) return;
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
    <div className="bet-detail-modal-root" data-testid="bet-detail-modal">
      <button
        type="button"
        className="bet-detail-modal-backdrop"
        aria-label="Close bet detail"
        onClick={requestClose}
      />
      <div className="bet-detail-modal" role="dialog" aria-modal="true" aria-label="Bet detail">
        <div className="bet-detail-modal-panel">
          <BetDetailView betId={betId} layout="modal" onClose={onClose} onDirtyChange={setDirty} />
        </div>
      </div>
    </div>
  );
}
