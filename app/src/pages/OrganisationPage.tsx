import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  applyAddOrganisationMember,
  applyAddOrganisationRelationship,
  applyAddOrganisationTeam,
  applyMoveOrganisationMember,
  applyRemoveOrganisationRelationship,
  applyUpdateOrganisationMember,
  applyUpdateOrganisationTeam,
  organisationMemberDisciplineOptions,
  presentOrganisation,
  type OrganisationViewMode,
} from '../application/presentOrganisation';
import { OrganisationTeamEditorModal } from '../components/organisation/OrganisationTeamEditorModal';
import { OrganisationTopologyTimeline } from '../components/organisation/OrganisationTopologyTimeline';
import {
  OrganisationRelationshipGraph,
  organisationTodayIsoDate,
} from '../components/organisation/OrganisationRelationshipGraph';
import { useWorkspaceSession } from '../workspace/WorkspaceSession';

const VIEW_OPTIONS: Array<{ value: OrganisationViewMode; label: string }> = [
  { value: 'as_is', label: 'As-is' },
  { value: 'timeline', label: 'Timeline' },
];

type TeamEditorState =
  | { open: false }
  | { open: true; mode: 'create'; teamId: null }
  | { open: true; mode: 'edit'; teamId: string };

export function OrganisationPage() {
  const { session, setSession } = useWorkspaceSession();
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  const [rangeFrom, setRangeFrom] = useState(organisationTodayIsoDate);
  const [rangeTo, setRangeTo] = useState(organisationTodayIsoDate);
  const [viewMode, setViewMode] = useState<OrganisationViewMode>('as_is');
  const [teamEditor, setTeamEditor] = useState<TeamEditorState>({ open: false });
  const disciplineOptions = useMemo(() => organisationMemberDisciplineOptions(), []);

  useEffect(() => {
    if (!session) {
      setLocation('/workspace');
    }
  }, [session, setLocation]);

  const model = useMemo(
    () =>
      session
        ? presentOrganisation(session.spec, {
            asOf: rangeTo || null,
            rangeFrom: rangeFrom || null,
            rangeTo: rangeTo || null,
            viewMode,
          })
        : null,
    [session, rangeFrom, rangeTo, viewMode],
  );

  useEffect(() => {
    if (model) {
      document.title = `How work is organised · ${model.workspaceTitle} · SteerCo`;
    }
  }, [model]);

  if (!session || !model) return null;

  const allTeams = model.zones.flatMap((zone) => zone.teams);
  const editingTeam =
    teamEditor.open && teamEditor.mode === 'edit'
      ? (allTeams.find((team) => team.id === teamEditor.teamId) ?? null)
      : null;

  const openCreateTeam = () => setTeamEditor({ open: true, mode: 'create', teamId: null });
  const openEditTeam = (teamId: string) => setTeamEditor({ open: true, mode: 'edit', teamId });
  const closeTeamEditor = () => setTeamEditor({ open: false });

  return (
    <section className="organisation-page" data-testid="organisation-page">
      <header className="organisation-header">
        <div className="organisation-header-top">
          <div>
            <p className="eyebrow">Organisation</p>
            <h1 className="organisation-title">How work is organised</h1>
          </div>
          <button
            type="button"
            className="btn-primary"
            data-testid="organisation-add-team-cta"
            onClick={openCreateTeam}
          >
            Add a team
          </button>
        </div>
        <p className="organisation-lead">{model.lead}</p>
        <p className="organisation-teaching">{model.teachingLine}</p>
        <p className="organisation-teaching">{model.interactionTeaching}</p>
        <p className="organisation-teaching" data-testid="organisation-point-in-time">
          {model.pointInTimeLine}
        </p>
        <div
          className="organisation-view-switch"
          role="tablist"
          aria-label="Organisation views"
          data-testid="organisation-view-switch"
        >
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={viewMode === option.value}
              className={
                viewMode === option.value
                  ? 'organisation-view-tab organisation-view-tab--active'
                  : 'organisation-view-tab'
              }
              onClick={() => setViewMode(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      {model.overloadBanner ? (
        <p className="organisation-overload" role="status">
          {model.overloadBanner}
        </p>
      ) : null}

      {model.adviceByFamily.length > 0 ? (
        <section
          className="organisation-mismatches"
          aria-labelledby="organisation-mismatches-heading"
          data-testid="organisation-mismatches"
        >
          <h2 id="organisation-mismatches-heading" className="organisation-section-title">
            Analysis & advice
          </h2>
          {model.adviceByFamily.map((group) => (
            <div key={group.family} className="organisation-advice-family">
              <h3 className="organisation-advice-family-title">{group.title}</h3>
              <ul>
                {group.items.map((item, index) => (
                  <li
                    key={`${item.code}-${index}`}
                    className={
                      item.severity === 'error'
                        ? 'organisation-mismatch organisation-mismatch-error'
                        : 'organisation-mismatch'
                    }
                  >
                    <span className="organisation-advice-code">{item.code}</span>
                    {item.headline}
                    {item.rationale ? (
                      <span className="organisation-advice-rationale"> {item.rationale}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : null}

      {model.empty ? (
        <div className="organisation-empty" data-testid="organisation-empty">
          <p className="organisation-empty-lead">
            Add the teams that deliver your bets - names, Team Topologies type, and the domain /
            stream lenses they own.
          </p>
          <p className="organisation-empty-tip">
            Tip: A domain is a DDD bounded context (the problem-space fence) - domain, stream, and
            stream-aligned team are three lenses on one slice of value, not a hierarchy. Platform
            teams accelerate stream-aligned teams (their customers) by reducing cognitive load;
            enabling teams facilitate temporarily; complicated-subsystem teams hold rare specialty.
            If a team or context grows too large, find a fracture plane and split into peer streams
            - do not add a management layer. Directors stay outside the stream.
          </p>
          <button type="button" className="btn-primary" onClick={openCreateTeam}>
            Add a team
          </button>
        </div>
      ) : viewMode === 'timeline' ? (
        <OrganisationTopologyTimeline timeline={model.timeline} />
      ) : (
        <section
          className="organisation-relationships"
          aria-labelledby="organisation-relationships"
        >
          <h2 id="organisation-relationships" className="organisation-section-title">
            How work flows
          </h2>
          <p className="organisation-zone-empty">
            Interaction graph for the organisation. Select a team for people and capacity; filter by
            domain when the picture gets noisy.
          </p>
          <OrganisationRelationshipGraph
            relationships={model.relationships}
            teams={allTeams.map((team) => ({
              id: team.id,
              displayName: team.displayName,
              domainTitle: team.domainTitle,
              roleLabel: team.roleLabel,
              purpose: team.purpose,
              capacityLabel: team.capacityLabel,
              streamTitles: team.streamTitles,
              platformScopeLabel: team.platformScopeLabel,
              facilitatesLabels: team.facilitatesLabels,
              members: team.members.map((member) => ({
                id: member.id,
                displayName: member.displayName,
                title: member.title,
                discipline: member.discipline,
                disciplineLabel: member.disciplineLabel,
                ftePercent: member.ftePercent,
                initials: member.initials,
                effectiveFrom: member.effectiveFrom,
                effectiveUntil: member.effectiveUntil,
              })),
            }))}
            disciplineOptions={disciplineOptions}
            rangeFrom={rangeFrom}
            rangeTo={rangeTo}
            onRangeFromChange={setRangeFrom}
            onRangeToChange={setRangeTo}
            onEditTeam={openEditTeam}
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
        </section>
      )}

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

      <button
        type="button"
        className="organisation-fab"
        data-testid="organisation-add-team-fab"
        onClick={openCreateTeam}
        aria-label="Add a team"
      >
        + Team
      </button>

      <OrganisationTeamEditorModal
        open={teamEditor.open}
        mode={teamEditor.open ? teamEditor.mode : 'create'}
        team={editingTeam}
        teams={allTeams}
        domainOptions={model.domainOptions}
        streamOptions={model.streamOptions}
        relationships={model.relationships}
        onClose={closeTeamEditor}
        onCreated={(teamId) => {
          setTeamEditor({ open: true, mode: 'edit', teamId });
          setSavedFlash('Team added to this workspace session.');
          setError(null);
        }}
        onSaveTeam={(input) => {
          if (input.teamId) {
            const applied = applyUpdateOrganisationTeam(session.spec, {
              teamId: input.teamId,
              displayName: input.displayName,
              role: input.role,
              domainId: input.domainId || null,
              streamId: input.streamId || null,
            });
            if (!applied.ok) return applied;
            setSession({ ...session, spec: applied.value });
            setSavedFlash('Team updated.');
            setError(null);
            return { ok: true, teamId: input.teamId };
          }
          const applied = applyAddOrganisationTeam(session.spec, {
            displayName: input.displayName,
            role: input.role,
            domainId: input.domainId || null,
            streamId: input.streamId || null,
          });
          if (!applied.ok) return applied;
          setSession({ ...session, spec: applied.value });
          setSavedFlash('Team added to this workspace session.');
          setError(null);
          return { ok: true, teamId: applied.teamId };
        }}
        onAddRelationship={(input) => {
          const fromTeamId = input.direction === 'outbound' ? input.teamId : input.otherTeamId;
          const toTeamId = input.direction === 'outbound' ? input.otherTeamId : input.teamId;
          const applied = applyAddOrganisationRelationship(session.spec, {
            fromTeamId,
            toTeamId,
            mode: input.mode,
            expectedUntil: input.expectedUntil || undefined,
            effectiveFrom: input.effectiveFrom || undefined,
          });
          if (!applied.ok) return applied;
          setSession({ ...session, spec: applied.value });
          setSavedFlash('Relationship saved to this workspace session.');
          setError(null);
          return { ok: true };
        }}
        onRemoveRelationship={(input) => {
          const applied = applyRemoveOrganisationRelationship(session.spec, input);
          if (!applied.ok) return applied;
          setSession({ ...session, spec: applied.value });
          setSavedFlash('Relationship removed.');
          setError(null);
          return { ok: true };
        }}
      />
    </section>
  );
}
