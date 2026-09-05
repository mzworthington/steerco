import { useEffect, useMemo, useState } from 'react';
import { Link, Redirect } from 'wouter';
import {
  applyAddOrganisationMember,
  applyAddOrganisationRelationship,
  applyAddOrganisationTeam,
  applyClearPlannedShapeChange,
  applyMoveOrganisationMember,
  applyRemoveOrganisationRelationship,
  applyUpdateOrganisationMember,
  applyUpdateOrganisationTeam,
  organisationMemberDisciplineOptions,
  presentOrganisation,
  type OrganisationViewMode,
} from '../application/presentOrganisation';
import { OrganisationPlannedShapePanel } from '../components/organisation/OrganisationPlannedShapePanel';
import { OrganisationTeamEditorModal } from '../components/organisation/OrganisationTeamEditorModal';
import { OrganisationTopologyTimeline } from '../components/organisation/OrganisationTopologyTimeline';
import {
  OrganisationRelationshipGraph,
  organisationTodayIsoDate,
} from '../components/organisation/OrganisationRelationshipGraph';
import { useWorkspaceSession } from '../workspace/WorkspaceSession';
import { PageHeader } from '../components/PageHeader';

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
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  const [asOf, setAsOf] = useState(organisationTodayIsoDate);
  const [rangeFrom, setRangeFrom] = useState(organisationTodayIsoDate);
  const [rangeTo, setRangeTo] = useState(organisationTodayIsoDate);
  const [viewMode, setViewMode] = useState<OrganisationViewMode>('as_is');
  const [teamEditor, setTeamEditor] = useState<TeamEditorState>({ open: false });
  const disciplineOptions = useMemo(() => organisationMemberDisciplineOptions(), []);

  const model = useMemo(
    () =>
      session
        ? presentOrganisation(session.spec, {
            asOf: asOf || null,
            rangeFrom: rangeFrom || null,
            rangeTo: rangeTo || null,
            viewMode,
          })
        : null,
    [session, asOf, rangeFrom, rangeTo, viewMode],
  );

  useEffect(() => {
    if (model) {
      document.title = `How work is organised · ${model.workspaceTitle} · SteerCo`;
    }
  }, [model]);

  if (!session) {
    return <Redirect to="/workspace" />;
  }

  if (!model) return null;

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
      <PageHeader
        eyebrow="Organisation"
        title="How work is organised"
        framing={<p>{model.lead}</p>}
        action={
          model.empty ? undefined : (
            <button
              type="button"
              className="btn-primary"
              data-testid="organisation-add-team-cta"
              onClick={openCreateTeam}
            >
              Add team
            </button>
          )
        }
      />
      <p className="organisation-teaching">{model.teachingLine}</p>
      <p className="organisation-teaching" data-testid="organisation-point-in-time">
        {model.pointInTimeLine}
      </p>
      <label className="organisation-field organisation-as-of" data-testid="organisation-as-of">
        <span>As of</span>
        <input
          type="date"
          value={asOf}
          onChange={(event) => {
            const next = event.target.value;
            setAsOf(next);
            setRangeFrom(next);
            setRangeTo(next);
          }}
          aria-label="As-of date"
        />
      </label>
      <div
        className="organisation-view-switch"
        role="group"
        aria-label="Organisation views"
        data-testid="organisation-view-switch"
      >
        {VIEW_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={viewMode === option.value}
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

      <OrganisationPlannedShapePanel
        teams={allTeams}
        plannedChanges={model.plannedChanges}
        disciplineOptions={disciplineOptions}
        onPlanCapacity={(input) => {
          const applied = applyAddOrganisationMember(session.spec, input);
          if (!applied.ok) return applied;
          setSession({ ...session, spec: applied.value });
          setSavedFlash('Planned capacity change recorded.');
          setError(null);
          return { ok: true };
        }}
        onPlanRelationship={(input) => {
          const applied = applyAddOrganisationRelationship(session.spec, input);
          if (!applied.ok) return applied;
          setSession({ ...session, spec: applied.value });
          setSavedFlash('Planned interaction recorded.');
          setError(null);
          return { ok: true };
        }}
        onClear={(changeId) => {
          const applied = applyClearPlannedShapeChange(session.spec, changeId);
          if (!applied.ok) return applied;
          setSession({ ...session, spec: applied.value });
          setSavedFlash('Planned change cleared.');
          setError(null);
          return { ok: true };
        }}
      />

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
            Add the teams that deliver your bets - name, type and the domain they own.
          </p>
          <p className="organisation-empty-tip">
            Team types and interaction modes are in the{' '}
            <Link href="/docs/product-guide">product guide</Link>.
          </p>
          <button
            type="button"
            className="btn-primary"
            data-testid="organisation-add-team-cta"
            onClick={openCreateTeam}
          >
            Add team
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
