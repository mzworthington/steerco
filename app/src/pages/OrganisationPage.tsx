import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { INTERACTION_MODE_COPY, TEAM_TOPOLOGY_TYPES, TOPOLOGY_TYPE_COPY } from '@steerlens/core';
import {
  applyAddOrganisationMember,
  applyAddOrganisationRelationship,
  applyAddOrganisationTeam,
  applyMoveOrganisationMember,
  applyUpdateOrganisationMember,
  organisationMemberDisciplineOptions,
  presentOrganisation,
  type OrganisationInteractionMode,
  type OrganisationTeamRole,
} from '../application/presentOrganisation';
import { OrganisationCapacityBoard } from '../components/organisation/OrganisationCapacityBoard';
import { useWorkspaceSession } from '../workspace/WorkspaceSession';

const ROLE_OPTIONS = TEAM_TOPOLOGY_TYPES.map((value) => ({
  value,
  label: TOPOLOGY_TYPE_COPY[value].topologyName,
}));

const MODE_OPTIONS = (Object.keys(INTERACTION_MODE_COPY) as OrganisationInteractionMode[]).map(
  (value) => ({
    value,
    label: INTERACTION_MODE_COPY[value].modeName,
  }),
);

const TIME_BOXABLE_MODES = new Set<OrganisationInteractionMode>(['collaboration', 'facilitation']);

export function OrganisationPage() {
  const { session, setSession } = useWorkspaceSession();
  const [, setLocation] = useLocation();
  const [teamName, setTeamName] = useState('');
  const [teamRole, setTeamRole] = useState<OrganisationTeamRole>('stream_aligned');
  const [fromTeamId, setFromTeamId] = useState('');
  const [toTeamId, setToTeamId] = useState('');
  const [mode, setMode] = useState<OrganisationInteractionMode>('x_as_a_service');
  const [expectedUntil, setExpectedUntil] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  const disciplineOptions = useMemo(() => organisationMemberDisciplineOptions(), []);

  useEffect(() => {
    if (!session) {
      setLocation('/workspace');
    }
  }, [session, setLocation]);

  const model = useMemo(() => (session ? presentOrganisation(session.spec) : null), [session]);

  useEffect(() => {
    if (model) {
      document.title = `How work is organised · ${model.workspaceTitle} · SteerLens`;
    }
  }, [model]);

  if (!session || !model) return null;

  const allTeams = model.zones.flatMap((zone) => zone.teams);

  const addTeam = () => {
    const applied = applyAddOrganisationTeam(session.spec, {
      displayName: teamName,
      role: teamRole,
    });
    if (!applied.ok) {
      setError(applied.error);
      setSavedFlash(null);
      return;
    }
    setSession({ ...session, spec: applied.value });
    setTeamName('');
    setError(null);
    setSavedFlash('Team added to this workspace session.');
  };

  const addRelationship = () => {
    const applied = applyAddOrganisationRelationship(session.spec, {
      fromTeamId,
      toTeamId,
      mode,
      expectedUntil: expectedUntil || undefined,
    });
    if (!applied.ok) {
      setError(applied.error);
      setSavedFlash(null);
      return;
    }
    setSession({ ...session, spec: applied.value });
    setExpectedUntil('');
    setError(null);
    setSavedFlash('Relationship saved to this workspace session.');
  };

  return (
    <section className="organisation-page" data-testid="organisation-page">
      <header className="organisation-header">
        <p className="eyebrow">Organisation</p>
        <h1 className="organisation-title">How work is organised</h1>
        <p className="organisation-lead">{model.lead}</p>
        <p className="organisation-teaching">{model.teachingLine}</p>
        <p className="organisation-teaching">{model.interactionTeaching}</p>
      </header>

      {model.overloadBanner ? (
        <p className="organisation-overload" role="status">
          {model.overloadBanner}
        </p>
      ) : null}

      {model.mismatches.length > 0 ? (
        <section
          className="organisation-mismatches"
          aria-labelledby="organisation-mismatches-heading"
          data-testid="organisation-mismatches"
        >
          <h2 id="organisation-mismatches-heading" className="organisation-section-title">
            Operating-model checks
          </h2>
          <ul>
            {model.mismatches.map((mismatch, index) => (
              <li
                key={`${mismatch.code}-${index}`}
                className={
                  mismatch.severity === 'error'
                    ? 'organisation-mismatch organisation-mismatch-error'
                    : 'organisation-mismatch'
                }
              >
                {mismatch.headline}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {model.empty ? (
        <div className="organisation-empty" data-testid="organisation-empty">
          <p className="organisation-empty-lead">
            Add the teams that deliver your bets — names and Team Topologies type for now.
          </p>
          <p className="organisation-empty-tip">
            Tip: Stick to the four fundamental shapes. Platform teams accelerate stream-aligned
            teams by reducing cognitive load; enabling teams facilitate temporarily;
            complicated-subsystem teams hold rare specialty.
          </p>
        </div>
      ) : (
        <OrganisationCapacityBoard
          zones={model.zones}
          disciplineOptions={disciplineOptions}
          onQuickAdd={(input) => {
            const applied = applyAddOrganisationMember(session.spec, input);
            if (!applied.ok) {
              setError(applied.error);
              setSavedFlash(null);
              return;
            }
            setSession({ ...session, spec: applied.value });
            setError(null);
            setSavedFlash(`${input.displayName.trim()} added to the team.`);
          }}
          onMovePerson={(input) => {
            const applied = applyMoveOrganisationMember(session.spec, input);
            if (!applied.ok) {
              setError(applied.error);
              setSavedFlash(null);
              return;
            }
            setSession({ ...session, spec: applied.value });
            setError(null);
            setSavedFlash('Person moved between teams.');
          }}
          onSaveAllocation={(input) => {
            let nextSpec = session.spec;
            if (input.fromTeamId !== input.teamId) {
              const moved = applyMoveOrganisationMember(nextSpec, {
                memberId: input.memberId,
                fromTeamId: input.fromTeamId,
                toTeamId: input.teamId,
              });
              if (!moved.ok) {
                setError(moved.error);
                setSavedFlash(null);
                return;
              }
              nextSpec = moved.value;
            }
            const applied = applyUpdateOrganisationMember(nextSpec, input);
            if (!applied.ok) {
              setError(applied.error);
              setSavedFlash(null);
              return;
            }
            setSession({ ...session, spec: applied.value });
            setError(null);
            setSavedFlash('Allocation updated.');
          }}
        />
      )}

      <section className="organisation-relationships" aria-labelledby="organisation-relationships">
        <h2 id="organisation-relationships" className="organisation-section-title">
          How work flows
        </h2>
        <p className="organisation-zone-empty">{model.interactionTeaching}</p>
        {model.relationships.length === 0 ? (
          <p className="organisation-zone-empty">
            No relationships yet. Choose X-as-a-Service, Collaboration, or Facilitation.
          </p>
        ) : (
          <ul className="organisation-relationship-list">
            {model.relationships.map((relationship) => (
              <li key={`${relationship.fromTeamId}-${relationship.mode}-${relationship.toTeamId}`}>
                <span className="organisation-relationship-row">
                  <span
                    className={`organisation-mode-glyph organisation-mode-glyph--${relationship.shape}`}
                    aria-hidden="true"
                  />
                  <span>
                    {relationship.sentence}
                    {relationship.expectedUntil ? (
                      <span className="organisation-relationship-expected">
                        {' '}
                        · expected until {relationship.expectedUntil}
                      </span>
                    ) : null}
                  </span>
                </span>
                <span className="organisation-relationship-mode">{relationship.modeLabel}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="organisation-forms">
        <form
          className="organisation-form"
          onSubmit={(event) => {
            event.preventDefault();
            addTeam();
          }}
        >
          <h2 className="organisation-section-title">Add a team</h2>
          <label className="organisation-field">
            <span>Display name</span>
            <input
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              placeholder="Storefront experience"
            />
          </label>
          <label className="organisation-field">
            <span>Team type (Team Topologies)</span>
            <select
              value={teamRole}
              onChange={(event) => setTeamRole(event.target.value as OrganisationTeamRole)}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn-primary">
            Add a team
          </button>
        </form>

        <form
          className="organisation-form"
          onSubmit={(event) => {
            event.preventDefault();
            addRelationship();
          }}
        >
          <h2 className="organisation-section-title">Add a relationship</h2>
          <label className="organisation-field">
            <span>From</span>
            <select value={fromTeamId} onChange={(event) => setFromTeamId(event.target.value)}>
              <option value="">Choose a team</option>
              {allTeams.map((team) => (
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
              onChange={(event) => setMode(event.target.value as OrganisationInteractionMode)}
            >
              {MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="organisation-field">
            <span>To</span>
            <select value={toTeamId} onChange={(event) => setToTeamId(event.target.value)}>
              <option value="">Choose a team</option>
              {allTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.displayName}
                </option>
              ))}
            </select>
          </label>
          {TIME_BOXABLE_MODES.has(mode) ? (
            <label className="organisation-field">
              <span>Expected until</span>
              <input
                type="date"
                value={expectedUntil}
                onChange={(event) => setExpectedUntil(event.target.value)}
              />
            </label>
          ) : null}
          <button type="submit" className="btn-secondary" disabled={allTeams.length < 2}>
            Save relationship
          </button>
        </form>
      </div>

      {(error || savedFlash) && (
        <div className="organisation-feedback" role="status">
          {error ? <p className="organisation-error">{error}</p> : null}
          {!error && savedFlash ? <p className="organisation-saved">{savedFlash}</p> : null}
        </div>
      )}

      <div className="organisation-actions">
        <Link href="/workspace/decisions" className="btn-primary">
          Prepare decision note
        </Link>
      </div>
    </section>
  );
}
