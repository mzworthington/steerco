import { useParams } from 'wouter';
import { BetDetailView } from '../components/bets/BetDetailView';

export function BetDetailPage() {
  const params = useParams<{ betId: string }>();
  const betId = params.betId ?? '';

  return <BetDetailView betId={betId} layout="page" />;
}
