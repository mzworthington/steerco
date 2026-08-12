import { useEffect, useMemo, useState } from 'react';
import type { SteerSpec } from '@steerco/core';
import {
  applyGoalEdit,
  applyInitiativeEdit,
  applyVisionEdit,
  type GoalEditDraft,
  type InitiativeEditDraft,
  type VisionEditDraft,
} from '../../application/presentLvtNodeEdit';
import { presentGoals } from '../../application/presentGoals';
import type { ValueTreeNodeKind } from '../../application/presentValueTree';
import { useWorkspaceSession } from '../../workspace/WorkspaceSession';
import { BetDetailModal } from '../bets/BetDetailModal';
import { DetailModalShell } from './DetailModalShell';

type Props = {
  kind: ValueTreeNodeKind;
  nodeId: string;
  onClose: () => void;
  onSaved?: () => void;
};

const GOAL_STATUS_OPTIONS: Array<SteerSpec['spec']['outcomes'][number]['status']> = [
  'on_track',
  'at_risk',
  'achieved',
  'abandoned',
];

export function LvtEditModal({ kind, nodeId, onClose, onSaved }: Props) {
  if (kind === 'bet') {
    return <BetDetailModal betId={nodeId} onClose={onClose} />;
  }

  const afterSave = () => {
    onSaved?.();
    onClose();
  };

  return (
    <DetailModalShell title="Edit node" testId="lvt-edit-modal" onClose={onClose}>
      {kind === 'vision' ? (
        <VisionEditForm onClose={onClose} onSaved={afterSave} />
      ) : kind === 'goal' ? (
        <GoalEditForm outcomeId={nodeId} onClose={onClose} onSaved={afterSave} />
      ) : (
        <InitiativeEditForm initiativeId={nodeId} onClose={onClose} onSaved={afterSave} />
      )}
    </DetailModalShell>
  );
}

function VisionEditForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { session, setSession } = useWorkspaceSession();
  const [draft, setDraft] = useState<VisionEditDraft>({ vision: session?.spec.spec.vision ?? '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) setDraft({ vision: session.spec.spec.vision });
  }, [session]);

  if (!session) return null;

  return (
    <form
      className="lvt-edit-form"
      data-testid="lvt-edit-vision"
      onSubmit={(event) => {
        event.preventDefault();
        const applied = applyVisionEdit(session.spec, draft);
        if (!applied.ok) {
          setError(applied.error);
          return;
        }
        setSession({ ...session, spec: applied.value });
        onSaved();
      }}
    >
      <header className="lvt-edit-header">
        <p className="eyebrow">Edit</p>
        <h2 className="lvt-edit-title">Investment vision</h2>
      </header>
      <label className="goals-mos-field">
        <span>Vision</span>
        <textarea
          rows={4}
          value={draft.vision}
          onChange={(event) => setDraft({ vision: event.target.value })}
        />
      </label>
      {error ? <p className="goals-error">{error}</p> : null}
      <div className="lvt-edit-actions">
        <button type="button" className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          Save
        </button>
      </div>
    </form>
  );
}

function GoalEditForm({
  outcomeId,
  onClose,
  onSaved,
}: {
  outcomeId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { session, setSession } = useWorkspaceSession();
  const model = useMemo(() => (session ? presentGoals(session.spec) : null), [session]);
  const outcome = model?.outcomes.find((item) => item.id === outcomeId) ?? null;
  const [draft, setDraft] = useState<GoalEditDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!outcome || !session) {
      setDraft(null);
      return;
    }
    const raw = session.spec.spec.outcomes.find((item) => item.id === outcomeId);
    setDraft({
      title: outcome.title,
      summary: outcome.summary ?? '',
      status: raw?.status ?? 'on_track',
      metrics: outcome.measures.map((measure) => ({
        id: measure.id,
        current: measure.current === null ? '' : String(measure.current),
        target: measure.target === null ? '' : String(measure.target),
      })),
    });
  }, [outcome, outcomeId, session]);

  if (!session || !outcome || !draft) {
    return (
      <div data-testid="lvt-edit-goal-missing">
        <h2 className="lvt-edit-title">Goal not found</h2>
        <button type="button" className="btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  return (
    <form
      className="lvt-edit-form"
      data-testid="lvt-edit-goal"
      onSubmit={(event) => {
        event.preventDefault();
        const applied = applyGoalEdit(session.spec, outcomeId, draft);
        if (!applied.ok) {
          setError(applied.error);
          return;
        }
        setSession({ ...session, spec: applied.value });
        onSaved();
      }}
    >
      <header className="lvt-edit-header">
        <p className="eyebrow">Edit</p>
        <h2 className="lvt-edit-title">{outcome.title}</h2>
      </header>
      <label className="goals-mos-field">
        <span>Title</span>
        <input
          value={draft.title}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
        />
      </label>
      <label className="goals-mos-field">
        <span>Summary</span>
        <textarea
          rows={3}
          value={draft.summary}
          onChange={(event) => setDraft({ ...draft, summary: event.target.value })}
        />
      </label>
      <label className="goals-mos-field">
        <span>Status</span>
        <select
          value={draft.status}
          onChange={(event) =>
            setDraft({
              ...draft,
              status: event.target.value as GoalEditDraft['status'],
            })
          }
        >
          {GOAL_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status.replaceAll('_', ' ')}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="lvt-edit-metrics">
        <legend>Measures</legend>
        {draft.metrics.map((metric, index) => {
          const label = outcome.measures[index]?.title ?? metric.id;
          return (
            <div key={metric.id} className="lvt-edit-metric-row">
              <p className="lvt-edit-metric-title">{label}</p>
              <label className="goals-mos-field">
                <span>Current</span>
                <input
                  inputMode="decimal"
                  aria-label={`${label} current`}
                  value={metric.current}
                  onChange={(event) => {
                    const metrics = [...draft.metrics];
                    metrics[index] = { ...metric, current: event.target.value };
                    setDraft({ ...draft, metrics });
                  }}
                />
              </label>
              <label className="goals-mos-field">
                <span>Target</span>
                <input
                  inputMode="decimal"
                  aria-label={`${label} target`}
                  value={metric.target}
                  onChange={(event) => {
                    const metrics = [...draft.metrics];
                    metrics[index] = { ...metric, target: event.target.value };
                    setDraft({ ...draft, metrics });
                  }}
                />
              </label>
            </div>
          );
        })}
      </fieldset>
      {error ? <p className="goals-error">{error}</p> : null}
      <div className="lvt-edit-actions">
        <button type="button" className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          Save
        </button>
      </div>
    </form>
  );
}

function InitiativeEditForm({
  initiativeId,
  onClose,
  onSaved,
}: {
  initiativeId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { session, setSession } = useWorkspaceSession();
  const initiative = session?.spec.spec.initiatives?.find((item) => item.id === initiativeId);
  const [draft, setDraft] = useState<InitiativeEditDraft>({
    title: '',
    successSignal: '',
    externalUrl: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initiative) return;
    setDraft({
      title: initiative.title,
      successSignal: initiative.successSignal,
      externalUrl: initiative.externalUrl ?? '',
    });
  }, [initiative]);

  if (!session) return null;

  if (!initiative) {
    return (
      <div data-testid="lvt-edit-initiative-missing">
        <h2 className="lvt-edit-title">Initiative not found</h2>
        <button type="button" className="btn-secondary" onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  return (
    <form
      className="lvt-edit-form"
      data-testid="lvt-edit-initiative"
      onSubmit={(event) => {
        event.preventDefault();
        const applied = applyInitiativeEdit(session.spec, initiativeId, draft);
        if (!applied.ok) {
          setError(applied.error);
          return;
        }
        setSession({ ...session, spec: applied.value });
        onSaved();
      }}
    >
      <header className="lvt-edit-header">
        <p className="eyebrow">Edit</p>
        <h2 className="lvt-edit-title">{initiative.title}</h2>
      </header>
      <label className="goals-mos-field">
        <span>Title</span>
        <input
          value={draft.title}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
        />
      </label>
      <label className="goals-mos-field">
        <span>Success signal</span>
        <textarea
          rows={3}
          value={draft.successSignal}
          onChange={(event) => setDraft({ ...draft, successSignal: event.target.value })}
        />
      </label>
      <label className="goals-mos-field">
        <span>External tracker URL</span>
        <input
          value={draft.externalUrl}
          onChange={(event) => setDraft({ ...draft, externalUrl: event.target.value })}
        />
      </label>
      {error ? <p className="goals-error">{error}</p> : null}
      <div className="lvt-edit-actions">
        <button type="button" className="btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          Save
        </button>
      </div>
    </form>
  );
}
