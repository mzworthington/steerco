import { useState } from 'react';
import {
  INTERACTION_MODE_COPY,
  INTERACTION_MODES,
  MEMBER_DISCIPLINES,
  type MemberDiscipline,
  type PlannedShapeChange,
} from '@steerco/core';
import type {
  OrganisationInteractionMode,
  OrganisationTeamCard,
} from '../../application/presentOrganisation';

type CapacityDraft = {
  teamId: string;
  displayName: string;
  title: string;
  ftePercent: number;
  discipline: MemberDiscipline;
  effectiveFrom: string;
};

type RelationshipDraft = {
  fromTeamId: string;
  toTeamId: string;
  mode: OrganisationInteractionMode;
  effectiveFrom: string;
};

type Props = {
  teams: OrganisationTeamCard[];
  plannedChanges: PlannedShapeChange[];
  disciplineOptions: Array<{ value: MemberDiscipline; label: string }>;
  onPlanCapacity: (input: CapacityDraft) => { ok: true } | { ok: false; error: string };
  onPlanRelationship: (input: RelationshipDraft) => { ok: true } | { ok: false; error: string };
  onClear: (changeId: string) => { ok: true } | { ok: false; error: string };
};

export function OrganisationPlannedShapePanel({
  teams,
  plannedChanges,
  disciplineOptions,
  onPlanCapacity,
  onPlanRelationship,
  onClear,
}: Props) {
  const [kind, setKind] = useState<'capacity' | 'relationship'>('capacity');
  const [startsOn, setStartsOn] = useState('');
  const [teamId, setTeamId] = useState(teams[0]?.id ?? '');
  const [displayName, setDisplayName] = useState('');
  const [title, setTitle] = useState('');
  const [ftePercent, setFtePercent] = useState(100);
  const [discipline, setDiscipline] = useState<MemberDiscipline>(
    disciplineOptions[0]?.value ?? 'engineering',
  );
  const [fromTeamId, setFromTeamId] = useState(teams[0]?.id ?? '');
  const [toTeamId, setToTeamId] = useState(teams[1]?.id ?? teams[0]?.id ?? '');
  const [mode, setMode] = useState<OrganisationInteractionMode>('collaboration');
  const [formError, setFormError] = useState<string | null>(null);

  const submit = () => {
    if (!startsOn.trim()) {
      setFormError('Pick a start date for the planned change.');
      return;
    }
    const result =
      kind === 'capacity'
        ? onPlanCapacity({
            teamId,
            displayName,
            title,
            ftePercent,
            discipline,
            effectiveFrom: startsOn,
          })
        : onPlanRelationship({
            fromTeamId,
            toTeamId,
            mode,
            effectiveFrom: startsOn,
          });
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setFormError(null);
    setDisplayName('');
    setTitle('');
  };

  return (
    <section
      className="organisation-planned"
      aria-labelledby="organisation-planned-heading"
      data-testid="organisation-planned-change"
    >
      <h2 id="organisation-planned-heading" className="organisation-section-title">
        Planned shape change
      </h2>
      <p className="organisation-planned-lead">
        Record a future capacity or interaction window. Today stays as it is until you scrub as-of
        to that date.
      </p>

      {plannedChanges.length > 0 ? (
        <div
          className="organisation-planned-cue"
          data-testid="organisation-planned-cue"
          role="status"
        >
          <p>Recorded for a later date:</p>
          <ul>
            {plannedChanges.map((change) => (
              <li key={change.id}>
                <span>{change.summary}</span>
                <button type="button" onClick={() => onClear(change.id)}>
                  Clear planned change
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="organisation-planned-form">
        <label className="organisation-field">
          <span>Kind of change</span>
          <select
            value={kind}
            onChange={(event) =>
              setKind(event.target.value === 'relationship' ? 'relationship' : 'capacity')
            }
            aria-label="Kind of change"
          >
            <option value="capacity">Capacity</option>
            <option value="relationship">Interaction</option>
          </select>
        </label>
        <label className="organisation-field">
          <span>Starts on</span>
          <input
            type="date"
            value={startsOn}
            onChange={(event) => setStartsOn(event.target.value)}
            aria-label="Starts on"
          />
        </label>
        {kind === 'capacity' ? (
          <>
            <label className="organisation-field">
              <span>Team</span>
              <select
                value={teamId}
                onChange={(event) => setTeamId(event.target.value)}
                aria-label="Team"
              >
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.displayName}
                  </option>
                ))}
              </select>
            </label>
            <label className="organisation-field">
              <span>Person name</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                aria-label="Person name"
              />
            </label>
            <label className="organisation-field">
              <span>Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                aria-label="Title"
              />
            </label>
            <label className="organisation-field">
              <span>Discipline</span>
              <select
                value={discipline}
                onChange={(event) => {
                  const next = MEMBER_DISCIPLINES.find((item) => item === event.target.value);
                  if (next) setDiscipline(next);
                }}
                aria-label="Discipline"
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
                onChange={(event) => setFtePercent(Number(event.target.value))}
                aria-label="FTE percent"
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
                aria-label="From team"
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
                aria-label="To team"
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
                onChange={(event) => {
                  const next = INTERACTION_MODES.find((item) => item === event.target.value);
                  if (next) setMode(next);
                }}
                aria-label="Interaction mode"
              >
                {INTERACTION_MODES.map((item) => (
                  <option key={item} value={item}>
                    {INTERACTION_MODE_COPY[item].modeName}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        {formError ? <p className="organisation-error">{formError}</p> : null}
        <button type="button" className="btn-primary" onClick={submit}>
          Record planned change
        </button>
      </div>
    </section>
  );
}
