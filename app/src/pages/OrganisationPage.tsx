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
import { OrganisationCapacityBoard } from '../components/organisation/OrganisationCapacityBoard';
import {
  OrganisationDomainZoom,
  OrganisationFlowOverview,
} from '../components/organisation/OrganisationViewCanvases';
import { OrganisationTeamEditorModal } from '../components/organisation/OrganisationTeamEditorModal';
import { OrganisationTopologyTimeline } from '../components/organisation/OrganisationTopologyTimeline';
import { OrganisationRelationshipGraph } from '../components/organisation/OrganisationRelationshipGraph';
import { useWorkspaceSession } from '../workspace/WorkspaceSession';

const VIEW_OPTIONS: Array<{ value: OrganisationViewMode; label: string }> = [
  { value: 'flow_of_change', label: 'Flow of change' },
  { value: 'as_is', label: 'As-is' },
  { value: 'domain', label: 'Domain' },
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
  const [asOf, setAsOf] = useState('');
  const [viewMode, setViewMode] = useState<OrganisationViewMode>('flow_of_change');
  const [domainId, setDomainId] = useState('');
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
            asOf: asOf || null,
            viewMode,
            domainId: domainId || null,
          })
        : null,
    [session, asOf, viewMode, domainId],
  );

  useEffect(() => {
    if (!model) return;
    if (viewMode === 'domain' && !domainId && model.domainOptions[0]) {
      setDomainId(model.domainOptions[0].id);
    }
  }, [model, viewMode, domainId]);

  useEffect(() => {
    if (model) {
      document.title = `How work is organised · ${model.workspaceTitle} · SteerLens`;
    }
  }, [model]);

  if (!session || !model) return null;

  const allTeams = model.zones.flatMap((zone) => zone.teams);
  const showAsOf = viewMode === 'as_is' || viewMode === 'domain' || viewMode === 'timeline';
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
        {viewMode === 'domain' && model.domainOptions.length > 0 ? (
          <label className="organisation-field organisation-as-of">
            <span>Domain</span>
            <select
              value={domainId || model.domainOptions[0]?.id || ''}
              onChange={(event) => setDomainId(event.target.value)}
              data-testid="organisation-domain-select"
            >
              {model.domainOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.title} ({option.streamCount} streams)
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {showAsOf ? (
          <label className="organisation-field organisation-as-of">
            <span>As of</span>
            <input
              type="date"
              value={asOf}
              onChange={(event) => setAsOf(event.target.value)}
              data-testid="organisation-as-of"
            />
          </label>
        ) : null}
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
            Add the teams that deliver your bets - names, Team Topologies type, and domain.
          </p>
          <p className="organisation-empty-tip">
            Tip: Stick to the four fundamental shapes. Platform teams accelerate stream-aligned
            teams by reducing cognitive load; enabling teams facilitate temporarily;
            complicated-subsystem teams hold rare specialty.
          </p>
          <button type="button" className="btn-primary" onClick={openCreateTeam}>
            Add a team
          </button>
        </div>
      ) : viewMode === 'flow_of_change' && model.overview ? (
        <OrganisationFlowOverview overview={model.overview} />
      ) : viewMode === 'domain' && model.domainFocus ? (
        <OrganisationDomainZoom focus={model.domainFocus} />
      ) : viewMode === 'domain' && model.domainOptions.length === 0 ? (
        <p className="organisation-teaching" data-testid="organisation-domain-empty">
          Add a domain that groups streams to use domain zoom.
        </p>
      ) : viewMode === 'timeline' ? (
        <OrganisationTopologyTimeline timeline={model.timeline} />
      ) : (
        <OrganisationCapacityBoard
          zones={model.zones}
          flow={model.flow}
          disciplineOptions={disciplineOptions}
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
      )}

      {viewMode !== 'timeline' ? (
        <section
          className="organisation-relationships"
          aria-labelledby="organisation-relationships"
        >
          <h2 id="organisation-relationships" className="organisation-section-title">
            How work flows
          </h2>
          <p className="organisation-zone-empty">{model.interactionTeaching}</p>
          <p className="organisation-zone-empty">
            Edit a team to add or remove interaction modes. The graph shows the organisation-wide
            view; filter by domain when the picture gets noisy.
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
            }))}
          />
        </section>
      ) : null}

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
