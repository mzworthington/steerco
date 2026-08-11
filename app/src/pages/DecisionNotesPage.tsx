import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { takeDecisionNoteMeasured } from '../application/decisionNoteSeed';
import {
  applyDecisionNoteDraft,
  decisionRecommendationOptions,
  draftFromDecisionNote,
  presentDecisionNotes,
  type DecisionNoteDraft,
} from '../application/presentDecisionNotes';
import { useWorkspaceSession } from '../workspace/WorkspaceSession';

export function DecisionNotesPage() {
  const { session, setSession } = useWorkspaceSession();
  const [, setLocation] = useLocation();
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<DecisionNoteDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  const [teamQuery, setTeamQuery] = useState('');
  const evidenceSeedApplied = useRef(false);

  useEffect(() => {
    if (!session) {
      setLocation('/workspace');
    }
  }, [session, setLocation]);

  useEffect(() => {
    const seed = takeDecisionNoteMeasured();
    if (!seed) return;
    evidenceSeedApplied.current = true;
    setSelectedId('new');
    setDraft({ ...draftFromDecisionNote(null), measuredText: seed.join('\n') });
    setSavedFlash('Pre-filled measured lines from Evidence.');
  }, []);

  const model = useMemo(() => (session ? presentDecisionNotes(session.spec) : null), [session]);

  useEffect(() => {
    if (!model) return;
    document.title = `Decision notes · ${model.workspaceTitle} · SteerCo`;
    if (evidenceSeedApplied.current) return;
    if (selectedId === null && model.notes[0]) {
      setSelectedId(model.notes[0].id);
    }
  }, [model, selectedId]);

  useEffect(() => {
    if (!session || !model) return;
    if (selectedId === 'new') {
      setDraft((prev) => (prev && prev.id === null ? prev : draftFromDecisionNote(null)));
      return;
    }
    if (!selectedId) {
      setDraft(null);
      return;
    }
    const note = session.spec.spec.decisionNotes.find((item) => item.id === selectedId) ?? null;
    setDraft(draftFromDecisionNote(note));
  }, [session, selectedId, model?.notes.length]);

  const recommendationOptions = useMemo(() => decisionRecommendationOptions(), []);

  const filteredTeamGroups = useMemo(() => {
    if (!model) return [];
    const query = teamQuery.trim().toLowerCase();
    if (!query) return model.teamGroups;
    return model.teamGroups
      .map((group) => ({
        ...group,
        teams: group.teams.filter(
          (team) =>
            team.displayName.toLowerCase().includes(query) ||
            group.title.toLowerCase().includes(query),
        ),
      }))
      .filter((group) => group.teams.length > 0);
  }, [model, teamQuery]);

  if (!session || !model) return null;

  const activeCard = model.notes.find((note) => note.id === selectedId) ?? null;

  const toggleTeam = (teamId: string) => {
    if (!draft) return;
    const selected = new Set(draft.affectedTeamIds);
    if (selected.has(teamId)) selected.delete(teamId);
    else selected.add(teamId);
    setDraft({ ...draft, affectedTeamIds: [...selected] });
    setSavedFlash(null);
  };

  const appendSuggestion = (suggestion: string, metricId: string) => {
    if (!draft) return;
    const next = draft.measuredText.trim()
      ? `${draft.measuredText.trim()}\n${suggestion}`
      : suggestion;
    const measuredMetricIds = draft.measuredMetricIds.includes(metricId)
      ? draft.measuredMetricIds
      : [...draft.measuredMetricIds, metricId];
    setDraft({ ...draft, measuredText: next, measuredMetricIds });
    setSavedFlash(null);
  };

  const toggleMeasuredMetric = (metricId: string) => {
    if (!draft) return;
    const selected = new Set(draft.measuredMetricIds);
    if (selected.has(metricId)) selected.delete(metricId);
    else selected.add(metricId);
    setDraft({ ...draft, measuredMetricIds: [...selected] });
    setSavedFlash(null);
  };

  const onSave = () => {
    if (!draft) return;
    const applied = applyDecisionNoteDraft(session.spec, draft);
    if (!applied.ok) {
      setError(applied.error);
      setSavedFlash(null);
      return;
    }
    const savedId =
      draft.id ??
      applied.value.spec.decisionNotes[applied.value.spec.decisionNotes.length - 1]?.id ??
      null;
    setSession({ ...session, spec: applied.value });
    setSelectedId(savedId);
    setError(null);
    setSavedFlash('Saved decision note to this workspace session.');
  };

  return (
    <section className="decision-notes-page" data-testid="decision-notes-page">
      <header className="decision-notes-header">
        <p className="eyebrow">Decision note · for board review</p>
        <h1 className="decision-notes-title">Decision notes</h1>
        <p className="decision-notes-lead">
          One-page start / continue / stop / re-scope recommendations - lightweight governance, not
          a slide archaeology dig.
        </p>
      </header>

      <div className="decision-notes-layout">
        <aside className="decision-notes-list" aria-label="Saved decision notes">
          <div className="decision-notes-list-header">
            <h2 className="decision-notes-section-title">Saved notes</h2>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSelectedId('new');
                setDraft(draftFromDecisionNote(null));
                setError(null);
                setSavedFlash(null);
              }}
            >
              New note
            </button>
          </div>
          {model.notes.length === 0 ? (
            <p className="decision-notes-empty">No decision notes yet.</p>
          ) : (
            <ul>
              {model.notes.map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    className={
                      selectedId === note.id
                        ? 'decision-notes-list-item decision-notes-list-item-active'
                        : 'decision-notes-list-item'
                    }
                    onClick={() => {
                      setSelectedId(note.id);
                      setError(null);
                      setSavedFlash(null);
                    }}
                  >
                    <span
                      className={
                        note.recommendationTone === 'stop'
                          ? 'status-stop'
                          : note.recommendationTone === 'continue' ||
                              note.recommendationTone === 'start'
                            ? 'status-on-track'
                            : 'text-ink-muted'
                      }
                    >
                      {note.recommendationLabel}
                    </span>
                    <span className="decision-notes-list-title">{note.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {draft ? (
          <article className="decision-note-editor" aria-labelledby="decision-note-editor-title">
            <div className="decision-note-editor-top">
              <label className="decision-notes-field decision-notes-field-grow">
                <span>Title</span>
                <input
                  id="decision-note-editor-title"
                  value={draft.title}
                  onChange={(event) => {
                    setDraft({ ...draft, title: event.target.value });
                    setSavedFlash(null);
                  }}
                  placeholder="Stop Loyalty ledger unification?"
                />
              </label>
              <label className="decision-notes-field">
                <span>Recommendation</span>
                <select
                  value={draft.recommendation}
                  onChange={(event) => {
                    setDraft({
                      ...draft,
                      recommendation: event.target.value as DecisionNoteDraft['recommendation'],
                    });
                    setSavedFlash(null);
                  }}
                >
                  {recommendationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {activeCard && selectedId !== 'new' ? (
              <div
                className={
                  activeCard.recommendationTone === 'stop'
                    ? 'callout-stop'
                    : 'decision-note-callout'
                }
              >
                <p className="eyebrow-signal">Board recommendation</p>
                <p
                  className={
                    activeCard.recommendationTone === 'stop'
                      ? 'decision-note-callout-label status-stop'
                      : 'decision-note-callout-label'
                  }
                >
                  {activeCard.recommendationLabel}
                </p>
              </div>
            ) : null}

            <label className="decision-notes-field">
              <span>Linked bet (optional)</span>
              <select
                value={draft.betId ?? ''}
                onChange={(event) => {
                  setDraft({
                    ...draft,
                    betId: event.target.value ? event.target.value : null,
                  });
                  setSavedFlash(null);
                }}
              >
                <option value="">No linked bet</option>
                {model.bets.map((bet) => (
                  <option key={bet.id} value={bet.id}>
                    {bet.title}
                  </option>
                ))}
              </select>
            </label>

            <section className="decision-note-section" aria-labelledby="decision-why">
              <h2 id="decision-why" className="decision-notes-section-title">
                Why
              </h2>
              <label className="decision-notes-field">
                <span className="sr-only">Why</span>
                <textarea
                  rows={4}
                  value={draft.why}
                  onChange={(event) => {
                    setDraft({ ...draft, why: event.target.value });
                    setSavedFlash(null);
                  }}
                />
              </label>
            </section>

            <section className="decision-note-section" aria-labelledby="decision-measured">
              <h2 id="decision-measured" className="decision-notes-section-title">
                What we measured
              </h2>
              <p className="decision-notes-helper">{model.helperMeasured}</p>
              {model.metricOptions.length > 0 ? (
                <div className="decision-notes-suggestions">
                  {model.metricOptions.map((metric) => (
                    <button
                      key={metric.id}
                      type="button"
                      className="decision-notes-suggestion"
                      onClick={() => appendSuggestion(metric.suggestion, metric.id)}
                    >
                      + {metric.suggestion}
                    </button>
                  ))}
                </div>
              ) : null}
              <label className="decision-notes-field">
                <span className="sr-only">Measured bullets</span>
                <textarea
                  rows={5}
                  value={draft.measuredText}
                  onChange={(event) => {
                    setDraft({ ...draft, measuredText: event.target.value });
                    setSavedFlash(null);
                  }}
                  placeholder={
                    'One measure per line\nPromise hit rate unchanged quarter-on-quarter'
                  }
                />
              </label>
              {model.metricOptions.length > 0 ? (
                <fieldset className="decision-notes-teams">
                  <legend className="decision-notes-metrics-legend">
                    Measures of Success we point to
                  </legend>
                  {model.metricOptions.map((metric) => (
                    <label key={metric.id} className="decision-notes-team">
                      <input
                        type="checkbox"
                        checked={draft.measuredMetricIds.includes(metric.id)}
                        onChange={() => toggleMeasuredMetric(metric.id)}
                      />
                      <span>{metric.title}</span>
                    </label>
                  ))}
                </fieldset>
              ) : null}
            </section>

            <section className="decision-note-section" aria-labelledby="decision-affected">
              <h2 id="decision-affected" className="decision-notes-section-title">
                Who is affected
              </h2>
              <p className="decision-notes-affected-meta" data-testid="decision-affected-count">
                {draft.affectedTeamIds.length === 0
                  ? 'No teams selected'
                  : `${draft.affectedTeamIds.length} team${draft.affectedTeamIds.length === 1 ? '' : 's'} selected`}
              </p>
              <label className="decision-notes-field decision-notes-team-search">
                <span className="sr-only">Search teams</span>
                <input
                  type="search"
                  value={teamQuery}
                  onChange={(event) => setTeamQuery(event.target.value)}
                  placeholder="Search teams or domains"
                  data-testid="decision-affected-search"
                />
              </label>
              {filteredTeamGroups.length === 0 ? (
                <p className="decision-notes-empty" data-testid="decision-affected-empty">
                  No teams match “{teamQuery.trim()}”.
                </p>
              ) : (
                <div className="decision-notes-team-groups" data-testid="decision-affected-groups">
                  {filteredTeamGroups.map((group) => (
                    <fieldset key={group.id} className="decision-notes-team-group">
                      <legend className="decision-notes-team-group-title">{group.title}</legend>
                      <div className="decision-notes-teams">
                        {group.teams.map((team) => (
                          <label key={team.id} className="decision-notes-team">
                            <input
                              type="checkbox"
                              checked={draft.affectedTeamIds.includes(team.id)}
                              onChange={() => toggleTeam(team.id)}
                            />
                            <span>{team.displayName}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>
              )}
            </section>

            <section className="decision-note-section" aria-labelledby="decision-next">
              <h2 id="decision-next" className="decision-notes-section-title">
                Next step
              </h2>
              <label className="decision-notes-field">
                <span className="sr-only">Next step</span>
                <textarea
                  rows={3}
                  value={draft.nextStep}
                  onChange={(event) => {
                    setDraft({ ...draft, nextStep: event.target.value });
                    setSavedFlash(null);
                  }}
                />
              </label>
            </section>

            {(error || savedFlash) && (
              <div className="decision-notes-feedback" role="status">
                {error ? <p className="decision-notes-error">{error}</p> : null}
                {!error && savedFlash ? <p className="decision-notes-saved">{savedFlash}</p> : null}
              </div>
            )}

            <div className="decision-notes-actions">
              <Link href="/workspace/export" className="btn-secondary">
                Export board pack
              </Link>
              <button type="button" className="btn-primary" onClick={onSave}>
                Save
              </button>
            </div>
          </article>
        ) : (
          <p className="decision-notes-empty">Select a note or create a new one.</p>
        )}
      </div>
    </section>
  );
}
