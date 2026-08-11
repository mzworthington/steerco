import { useMemo, type CSSProperties } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from 'wouter';
import type { SteeringBetCard } from '../../application/presentSteeringOverview';

type SteeringValueStackProps = {
  bets: SteeringBetCard[];
  onReorder: (orderedBetIds: string[]) => void;
};

function statusClass(tone: SteeringBetCard['statusTone']): string {
  if (tone === 'on-track') return 'status-on-track';
  if (tone === 'at-risk') return 'status-at-risk';
  if (tone === 'stop') return 'status-stop';
  return 'text-ink-muted';
}

function SortableBetCard({ bet }: { bet: SteeringBetCard }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: bet.id,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'steering-bet-item is-dragging' : 'steering-bet-item'}
      data-testid={`bet-stack-${bet.id}`}
    >
      <div className="steering-bet-card" data-status={bet.statusTone}>
        <button
          type="button"
          className="steering-bet-drag-handle"
          aria-label={`Drag to reorder ${bet.title}`}
          {...attributes}
          {...listeners}
        >
          <span aria-hidden="true">⋮⋮</span>
        </button>
        <div className="steering-bet-main">
          <p className="steering-bet-goal">{bet.outcomeTitle}</p>
          <Link href={`/workspace/bets/${bet.id}`} className="steering-bet-link">
            <h3 className="steering-bet-title">{bet.title}</h3>
            <p className="steering-bet-cue">{bet.metricCue}</p>
          </Link>
        </div>
        <span className={`steering-bet-status ${statusClass(bet.statusTone)}`}>{bet.status}</span>
      </div>
    </li>
  );
}

export function SteeringValueStack({ bets, onReorder }: SteeringValueStackProps) {
  const itemIds = useMemo(() => bets.map((bet) => bet.id), [bets]);
  const betById = useMemo(() => new Map(bets.map((bet) => [bet.id, bet])), [bets]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = itemIds.indexOf(String(active.id));
    const to = itemIds.indexOf(String(over.id));
    if (from < 0 || to < 0 || from === to) return;

    onReorder(arrayMove(itemIds, from, to));
  };

  return (
    <section className="steering-value-stack" aria-labelledby="steering-value-stack-title">
      <div className="steering-value-stack-intro">
        <h2 id="steering-value-stack-title" className="steering-value-stack-title">
          Value stack
        </h2>
        <p className="steering-value-stack-hint">
          Drag bets to set portfolio priority. Highest value sits at the top.
        </p>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <ul className="steering-bet-list" data-testid="steering-value-stack">
            {itemIds.map((id) => {
              const bet = betById.get(id);
              if (!bet) return null;
              return <SortableBetCard key={id} bet={bet} />;
            })}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  );
}
