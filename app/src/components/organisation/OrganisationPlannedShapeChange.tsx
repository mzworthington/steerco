import { useId, useState } from 'react';
import {
  INTERACTION_MODE_COPY,
  INTERACTION_MODES,
  MEMBER_DISCIPLINES,
  type MemberDiscipline,
} from '@steerco/core';
import type {
  OrganisationInteractionMode,
  OrganisationPlannedChange,
  RecordPlannedShapeChangeInput,
} from '../../application/presentOrganisation';

function asDiscipline(value: string): MemberDiscipline {
  for (const discipline of MEMBER_DISCIPLINES) {
    if (discipline === value) return discipline;
  }
  return 'engineering';
}

function asInteractionMode(value: string): OrganisationInteractionMode {
  for (const mode of INTERACTION_MODES) {
    if (mode === value) return mode;
  }
  return 'x_as_a_service';
}

type TeamOption = { id: string; displayName: string };
type DisciplineOption = { value: MemberDiscipline; label: string };

type OrganisationPlannedShapeChangeProps = {
  plannedChanges: OrganisationPlannedChange[];
  cue: string | null;
  teams: TeamOption[];
  disciplineOptions: DisciplineOption[];
  onRecord: (input: RecordPlannedShapeChangeInput) => { ok: true } | { ok: false; error: string };
  onClear: (plannedId: string) => { ok: true } | { ok: false; error: string };
};

type DraftKind = RecordPlannedShapeChangeInput['kind'];

export function OrganisationPlannedShapeChange({
  plannedChanges,
  cue,
  teams,
  disciplineOptions,
  onRecord,
  onClear,
}: OrganisationPlannedShapeChangeProps) {
  const headingId = useId();
  const [kind, setKind] = useState<DraftKind>('capacity');
  const [at, setAt] = useState('');
  const [teamId, setTeamId] = useState(teams[0]?.id ?? '');
  const [displayName, setDisplayName] = useState('');
  const [title, setTitle] = useState('');
  const [discipline, setDiscipline] = useState<MemberDiscipline>(
    disciplineOptions[0]?.value ?? 'engineering',
  );
  const [ftePercent, setFtePercent] = useState('100');
  const [fromTeamId, setFromTeamId] = useState(teams[0]?.id ?? '');
  const [toTeamId, setToTeamId] = useState(teams[1]?.id ?? teams[0]?.id ?? '');
  const [mode, setMode] = useState<OrganisationInteractionMode>('x_as_a_service');
  const [expectedUntil, setExpectedUntil] = useState('');
  const [error, setError] = useState<string | null>(null);

  const resetDraft = () => {
    setDisplayName('');
    setTitle('');
    setFtePercent('100');
    setExpectedUntil('');
    setError(null);
  };

  const submit = () => {
    const recorded =
      kind === 'capacity'
        ? onRecord({
            kind: 'capacity',
            at,
            teamId,
            displayName,
            title,
            ftePercent: Number(ftePercent),
            discipline,
          })
        : onRecord({
            kind: 'relationship',
            at,
            fromTeamId,
            toTeamId,
            mode,
            expectedUntil: expectedUntil || undefined,
          });
    if (!recorded.ok) {
      setError(recorded.error);
      return;
    }
    resetDraft();
  };

  return (
    <section
      className="organisation-planned"
      aria-labelledby={headingId}
      data-testid="organisation-planned-change"
    >
      <h2 id={headingId} className="organisation-section-title">
        Planned shape change
      </h2>
      <p className="organisation-planned-lead">
        Record a future capacity or relationship move. Today stays as it is; set as-of to that date
        to see load on the planned shape.
      </p>
      {cue ? (
        <p
          className="organisation-planned-cue"
          data-testid="organisation-planned-cue"
          role="status"
        >
          {cue}
        </p>
      ) : null}

      {plannedChanges.length > 0 ? (
        <ul className="organisation-planned-list" data-testid="organisation-planned-list">
          {plannedChanges.map((change) => (
            <li key={change.id} className="organisation-planned-item">
              <p>
                <span className="organisation-planned-item-date">{change.at}</span>
                {` — ${change.summary}`}
              </p>
              <button
                type="button"
                className="btn-tertiary"
                onClick={() => {
                  const cleared = onClear(change.id);
                  if (!cleared.ok) setError(cleared.error);
                  else setError(null);
                }}
              >
                {`Clear planned change for ${change.at}`}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <form
        className="organisation-planned-form"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <fieldset className="organisation-planned-kind">
          <legend>Change type</legend>
          <label>
            <input
              type="radio"
              name="planned-kind"
              value="capacity"
              checked={kind === 'capacity'}
              onChange={() => setKind('capacity')}
              data-testid="organisation-planned-kind-capacity"
            />
            Capacity
          </label>
          <label>
            <input
              type="radio"
              name="planned-kind"
              value="relationship"
              checked={kind === 'relationship'}
              onChange={() => setKind('relationship')}
              data-testid="organisation-planned-kind-relationship"
            />
            Relationship
          </label>
        </fieldset>

        <label className="organisation-field">
          <span>Starts on</span>
          <input
            type="date"
            value={at}
            onChange={(event) => setAt(event.target.value)}
            aria-label="Planned start date"
            data-testid="organisation-planned-date"
          />
        </label>

        {kind === 'capacity' ? (
          <>
            <label className="organisation-field">
              <span>Team</span>
              <select
                value={teamId}
                onChange={(event) => setTeamId(event.target.value)}
                aria-label="Planned capacity team"
                data-testid="organisation-planned-team"
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.displayName}
                  </option>
                ))}
              </select>
            </label>
            <label className="organisation-field">
              <span>Name</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                aria-label="Planned person name"
                data-testid="organisation-planned-name"
              />
            </label>
            <label className="organisation-field">
              <span>Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                aria-label="Planned person title"
              />
            </label>
            <label className="organisation-field">
              <span>Discipline</span>
              <select
                value={discipline}
                onChange={(event) => setDiscipline(asDiscipline(event.target.value))}
                aria-label="Planned person discipline"
              >
                {disciplineOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="organisation-field">
              <span>FTE percent</span>
              <input
                type="number"
                min={0}
                max={100}
                value={ftePercent}
                onChange={(event) => setFtePercent(event.target.value)}
                aria-label="Planned FTE percent"
              />
            </label>
          </>
        ) : (
          <>
            <label className="organisation-field">
              <span>From team</span>
              <select
                value={fromTeamId}
                onChange={(event) => setFromTeamId(event.target.value)}
                aria-label="Planned relationship from team"
                data-testid="organisation-planned-from"
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.displayName}
                  </option>
                ))}
              </select>
            </label>
            <label className="organisation-field">
              <span>To team</span>
              <select
                value={toTeamId}
                onChange={(event) => setToTeamId(event.target.value)}
                aria-label="Planned relationship to team"
                data-testid="organisation-planned-to"
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.displayName}
                  </option>
                ))}
              </select>
            </label>
            <label className="organisation-field">
              <span>Interaction mode</span>
              <select
                value={mode}
                onChange={(event) => setMode(asInteractionMode(event.target.value))}
                aria-label="Planned interaction mode"
                data-testid="organisation-planned-mode"
              >
                {INTERACTION_MODES.map((value) => (
                  <option key={value} value={value}>
                    {INTERACTION_MODE_COPY[value].modeName}
                  </option>
                ))}
              </select>
            </label>
            {mode === 'collaboration' || mode === 'facilitation' ? (
              <label className="organisation-field">
                <span>Expected until</span>
                <input
                  type="date"
                  value={expectedUntil}
                  onChange={(event) => setExpectedUntil(event.target.value)}
                  aria-label="Planned relationship expected until"
                />
              </label>
            ) : null}
          </>
        )}

        {error ? <p className="organisation-error">{error}</p> : null}

        <div className="organisation-planned-actions">
          <button type="submit" className="btn-primary" data-testid="organisation-planned-save">
            Record planned change
          </button>
        </div>
      </form>
    </section>
  );
}
