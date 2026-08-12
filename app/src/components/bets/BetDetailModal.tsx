import { useState } from 'react';
import { BetDetailView, confirmLeaveIfDirty } from './BetDetailView';
import { DetailModalShell } from '../lvt/DetailModalShell';

type Props = {
  betId: string;
  onClose: () => void;
};

export function BetDetailModal({ betId, onClose }: Props) {
  const [dirty, setDirty] = useState(false);

  return (
    <DetailModalShell
      title="Edit bet"
      testId="bet-detail-modal"
      onClose={onClose}
      confirmLeave={() => confirmLeaveIfDirty(dirty)}
    >
      <BetDetailView betId={betId} layout="modal" onClose={onClose} onDirtyChange={setDirty} />
    </DetailModalShell>
  );
}
