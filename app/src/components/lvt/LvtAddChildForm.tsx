import { useState } from 'react';
import type { BetDraft, GoalDraft, InitiativeDraft } from '../../application/presentLvtChildren';

export type LvtAddChildKind = 'goal' | 'bet' | 'initiative';

type DraftForKind<K extends LvtAddChildKind> = K extends 'goal'
  ? GoalDraft
  : K extends 'bet'
    ? BetDraft
    : InitiativeDraft;

type LvtAddChildFormProps<K extends LvtAddChildKind> = {
  kind: K;
  /** Compact toggle+form for detail panels; `header` is a single primary CTA. */
  layout?: 'panel' | 'header';
  onAdd: (draft: DraftForKind<K>) => { ok: true } | { ok: false; error: string };
};

const emptyGoal = (): GoalDraft => ({ title: '', summary: '' });
const emptyBet = (): BetDraft => ({ title: '', successSignal: '', killCriteria: '' });
const emptyInitiative = (): InitiativeDraft => ({
  title: '',
  successSignal: '',
  externalUrl: '',
});

function labelsFor(kind: LvtAddChildKind): {
  open: string;
  submit: string;
  heading: string;
} {
  switch (kind) {
    case 'goal':
      return {
        open: 'Add goal',
        submit: 'Add goal',
        heading: 'New goal under this vision',
      };
    case 'bet':
      return {
        open: 'Add bet',
        submit: 'Add bet',
        heading: 'New bet under this goal',
      };
    case 'initiative':
      return {
        open: 'Add initiative',
        submit: 'Add initiative',
        heading: 'New initiative under this bet',
      };
  }
}

export function LvtAddChildForm<K extends LvtAddChildKind>({
  kind,
  layout = 'panel',
  onAdd,
}: LvtAddChildFormProps<K>) {
  const labels = labelsFor(kind);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goalDraft, setGoalDraft] = useState<GoalDraft>(emptyGoal);
  const [betDraft, setBetDraft] = useState<BetDraft>(emptyBet);
  const [initiativeDraft, setInitiativeDraft] = useState<InitiativeDraft>(emptyInitiative);

  const reset = () => {
    setGoalDraft(emptyGoal());
    setBetDraft(emptyBet());
    setInitiativeDraft(emptyInitiative());
    setError(null);
  };

  const submit = () => {
    const draft = (
      kind === 'goal' ? goalDraft : kind === 'bet' ? betDraft : initiativeDraft
    ) as DraftForKind<K>;
    const result = onAdd(draft);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    reset();
    setOpen(false);
  };

  const openButtonClass = layout === 'header' ? 'btn-primary' : 'btn-secondary';

  return (
    <div
      className={layout === 'header' ? 'lvt-add-child lvt-add-child-header' : 'lvt-add-child'}
      data-testid={`lvt-add-${kind}`}
    >
      {!open ? (
        <button
          type="button"
          className={openButtonClass}
          data-testid={`lvt-add-${kind}-open`}
          onClick={() => {
            setOpen(true);
            setError(null);
          }}
        >
          {labels.open}
        </button>
      ) : (
        <form
          className="lvt-add-child-form"
          data-testid={`lvt-add-${kind}-form`}
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          {layout === 'panel' ? (
            <h3 className="lvt-add-child-heading">{labels.heading}</h3>
          ) : (
            <p className="lvt-add-child-heading">{labels.heading}</p>
          )}

          {kind === 'goal' ? (
            <>
              <label className="lvt-add-child-field">
                <span>Goal title</span>
                <input
                  type="text"
                  value={goalDraft.title}
                  data-testid="lvt-add-goal-title"
                  onChange={(event) => setGoalDraft({ ...goalDraft, title: event.target.value })}
                  required
                />
              </label>
              <label className="lvt-add-child-field">
                <span>Summary (optional)</span>
                <textarea
                  value={goalDraft.summary}
                  data-testid="lvt-add-goal-summary"
                  rows={2}
                  onChange={(event) => setGoalDraft({ ...goalDraft, summary: event.target.value })}
                />
              </label>
            </>
          ) : null}

          {kind === 'bet' ? (
            <>
              <label className="lvt-add-child-field">
                <span>Bet title</span>
                <input
                  type="text"
                  value={betDraft.title}
                  data-testid="lvt-add-bet-title"
                  onChange={(event) => setBetDraft({ ...betDraft, title: event.target.value })}
                  required
                />
              </label>
              <label className="lvt-add-child-field">
                <span>Success signal</span>
                <input
                  type="text"
                  value={betDraft.successSignal}
                  data-testid="lvt-add-bet-success"
                  onChange={(event) =>
                    setBetDraft({ ...betDraft, successSignal: event.target.value })
                  }
                  required
                />
              </label>
              <label className="lvt-add-child-field">
                <span>Kill criteria</span>
                <input
                  type="text"
                  value={betDraft.killCriteria}
                  data-testid="lvt-add-bet-kill"
                  onChange={(event) =>
                    setBetDraft({ ...betDraft, killCriteria: event.target.value })
                  }
                  required
                />
              </label>
            </>
          ) : null}

          {kind === 'initiative' ? (
            <>
              <label className="lvt-add-child-field">
                <span>Initiative title</span>
                <input
                  type="text"
                  value={initiativeDraft.title}
                  data-testid="lvt-add-initiative-title"
                  onChange={(event) =>
                    setInitiativeDraft({ ...initiativeDraft, title: event.target.value })
                  }
                  required
                />
              </label>
              <label className="lvt-add-child-field">
                <span>Success signal</span>
                <input
                  type="text"
                  value={initiativeDraft.successSignal}
                  data-testid="lvt-add-initiative-success"
                  onChange={(event) =>
                    setInitiativeDraft({
                      ...initiativeDraft,
                      successSignal: event.target.value,
                    })
                  }
                  required
                />
              </label>
              <label className="lvt-add-child-field">
                <span>External tracker URL (optional)</span>
                <input
                  type="url"
                  value={initiativeDraft.externalUrl}
                  data-testid="lvt-add-initiative-url"
                  onChange={(event) =>
                    setInitiativeDraft({
                      ...initiativeDraft,
                      externalUrl: event.target.value,
                    })
                  }
                />
              </label>
            </>
          ) : null}

          <div className="lvt-add-child-actions">
            <button type="submit" className="btn-primary" data-testid={`lvt-add-${kind}-submit`}>
              {labels.submit}
            </button>
            <button
              type="button"
              className="btn-tertiary"
              data-testid={`lvt-add-${kind}-cancel`}
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              Cancel
            </button>
          </div>
          {error ? (
            <p className="lvt-add-child-error" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}
