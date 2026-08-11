import { useEffect, useId, useMemo, useState } from 'react';
import { INTERACTION_MODE_COPY, TEAM_TOPOLOGY_TYPES, TOPOLOGY_TYPE_COPY } from '@steerlens/core';
import type {
  OrganisationDomainOption,
  OrganisationInteractionMode,
  OrganisationRelationship,
  OrganisationStreamOption,
  OrganisationTeamCard,
  OrganisationTeamRole,
} from '../../application/presentOrganisation';

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
const STREAM_ROLES = new Set<OrganisationTeamRole>(['stream_aligned', 'complicated_subsystem']);

export type OrganisationTeamEditorDraft = {
  displayName: string;
  role: OrganisationTeamRole;
  domainId: string;
  streamId: string;
};

export type OrganisationTeamEditorSaveInput = OrganisationTeamEditorDraft & {
  teamId: string | null;
};

export type OrganisationTeamRelationshipDraft = {
  direction: 'outbound' | 'inbound';
  otherTeamId: string;
  mode: OrganisationInteractionMode;
  expectedUntil: string;
};

type OrganisationTeamEditorModalProps = {
  open: boolean;
  mode: 'create' | 'edit';
  team: OrganisationTeamCard | null;
  teams: OrganisationTeamCard[];
  domainOptions: OrganisationDomainOption[];
  streamOptions: OrganisationStreamOption[];
  relationships: OrganisationRelationship[];
  onClose: () => void;
  onSaveTeam: (
    input: OrganisationTeamEditorSaveInput,
  ) => { ok: true; teamId: string } | { ok: false; error: string };
  onAddRelationship: (
    input: OrganisationTeamRelationshipDraft & { teamId: string },
  ) => { ok: true } | { ok: false; error: string };
  onRemoveRelationship: (input: {
    fromTeamId: string;
    toTeamId: string;
    mode: OrganisationInteractionMode;
  }) => { ok: true } | { ok: false; error: string };
  /** After create, parent can reopen in edit mode with the new team id. */
  onCreated?: (teamId: string) => void;
};

function initialDraft(
  team: OrganisationTeamCard | null,
  domainOptions: OrganisationDomainOption[],
  streamOptions: OrganisationStreamOption[],
): OrganisationTeamEditorDraft {
  if (!team) {
    return {
      displayName: '',
      role: 'stream_aligned',
      domainId: domainOptions[0]?.id ?? '',
      streamId: streamOptions.find((stream) => stream.domainId === domainOptions[0]?.id)?.id ?? '',
    };
  }
  const streamId = team.streamIds[0] ?? '';
  const stream = streamOptions.find((item) => item.id === streamId);
  return {
    displayName: team.displayName,
    role: team.role,
    domainId: stream?.domainId ?? '',
    streamId,
  };
}

export function OrganisationTeamEditorModal({
  open,
  mode,
  team,
  teams,
  domainOptions,
  streamOptions,
  relationships,
  onClose,
  onSaveTeam,
  onAddRelationship,
  onRemoveRelationship,
  onCreated,
}: OrganisationTeamEditorModalProps) {
  const titleId = useId();
  const [draft, setDraft] = useState<OrganisationTeamEditorDraft>(() =>
    initialDraft(team, domainOptions, streamOptions),
  );
  const [relDirection, setRelDirection] = useState<'outbound' | 'inbound'>('outbound');
  const [relOtherTeamId, setRelOtherTeamId] = useState('');
  const [relMode, setRelMode] = useState<OrganisationInteractionMode>('x_as_a_service');
  const [relExpectedUntil, setRelExpectedUntil] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(initialDraft(team, domainOptions, streamOptions));
    setRelDirection('outbound');
    setRelOtherTeamId('');
    setRelMode('x_as_a_service');
    setRelExpectedUntil('');
    setError(null);
    setNotice(null);
  }, [open, team, domainOptions, streamOptions]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const streamsForDomain = useMemo(
    () =>
      draft.domainId
        ? streamOptions.filter((stream) => stream.domainId === draft.domainId)
        : streamOptions,
    [draft.domainId, streamOptions],
  );

  const needsStream = STREAM_ROLES.has(draft.role);
  const teamId = team?.id ?? null;
  const teamRelationships = useMemo(() => {
    if (!teamId) return [];
    return relationships.filter(
      (relationship) => relationship.fromTeamId === teamId || relationship.toTeamId === teamId,
    );
  }, [relationships, teamId]);

  const otherTeams = teams.filter((item) => item.id !== teamId);

  if (!open) return null;

  const saveTeam = () => {
    const result = onSaveTeam({
      ...draft,
      teamId,
    });
    if (!result.ok) {
      setError(result.error);
      setNotice(null);
      return;
    }
    setError(null);
    if (mode === 'create') {
      setNotice('Team added - attach relationships below.');
      onCreated?.(result.teamId);
      return;
    }
    setNotice('Team details saved.');
  };

  const addRelationship = () => {
    if (!teamId) {
      setError('Save the team before adding relationships.');
      return;
    }
    const result = onAddRelationship({
      teamId,
      direction: relDirection,
      otherTeamId: relOtherTeamId,
      mode: relMode,
      expectedUntil: relExpectedUntil,
    });
    if (!result.ok) {
      setError(result.error);
      setNotice(null);
      return;
    }
    setError(null);
    setNotice('Relationship saved.');
    setRelOtherTeamId('');
    setRelExpectedUntil('');
  };

  return (
    <div className="organisation-team-modal-root" data-testid="organisation-team-modal">
      <button
        type="button"
        className="organisation-team-modal-backdrop"
        aria-label="Close team editor"
        onClick={onClose}
      />
      <div
        className="organisation-team-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <form
          className="organisation-team-modal-panel"
          onSubmit={(event) => {
            event.preventDefault();
            saveTeam();
          }}
        >
          <header className="organisation-team-modal-header">
            <h2 id={titleId} className="organisation-section-title">
              {mode === 'create' ? 'Add a team' : 'Edit team'}
            </h2>
            <button
              type="button"
              className="btn-secondary organisation-team-modal-close"
              onClick={onClose}
            >
              Close
            </button>
          </header>

          <p className="organisation-team-modal-lead">
            Name, Team Topologies type, and domain placement. Relationships live here too so you can
            see how this team talks to others without leaving the editor.
          </p>

          <div className="organisation-team-modal-fields">
            <label className="organisation-field">
              <span>Display name</span>
              <input
                value={draft.displayName}
                onChange={(event) => setDraft({ ...draft, displayName: event.target.value })}
                placeholder="Storefront experience"
                autoFocus={mode === 'create'}
              />
            </label>

            <label className="organisation-field">
              <span>Team type (Team Topologies)</span>
              <select
                value={draft.role}
                onChange={(event) =>
                  setDraft({ ...draft, role: event.target.value as OrganisationTeamRole })
                }
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="organisation-field">
              <span>Domain</span>
              <select
                value={draft.domainId}
                onChange={(event) => {
                  const nextDomainId = event.target.value;
                  const firstStream =
                    streamOptions.find((stream) => stream.domainId === nextDomainId)?.id ?? '';
                  setDraft({ ...draft, domainId: nextDomainId, streamId: firstStream });
                }}
                data-testid="organisation-team-modal-domain"
              >
                <option value="">
                  {needsStream ? 'Choose a domain' : 'Shared support (no domain)'}
                </option>
                {domainOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.title}
                  </option>
                ))}
              </select>
            </label>

            {needsStream ? (
              <label className="organisation-field">
                <span>Stream</span>
                <select
                  value={draft.streamId}
                  onChange={(event) => setDraft({ ...draft, streamId: event.target.value })}
                  data-testid="organisation-team-modal-stream"
                  disabled={streamsForDomain.length === 0}
                >
                  <option value="">Choose a stream</option>
                  {streamsForDomain.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="organisation-team-modal-hint">
                Platforms and enabling teams usually sit as shared support; domain is optional.
              </p>
            )}
          </div>

          <div className="organisation-team-modal-actions">
            <button type="submit" className="btn-primary">
              {mode === 'create' ? 'Add a team' : 'Save team'}
            </button>
          </div>

          <section
            className="organisation-team-modal-relationships"
            aria-labelledby={`${titleId}-relationships`}
          >
            <h3 id={`${titleId}-relationships`} className="organisation-team-modal-subtitle">
              Relationships
            </h3>
            {!teamId ? (
              <p className="organisation-team-modal-hint">
                Save the team to unlock relationship editing in this same panel.
              </p>
            ) : (
              <>
                {teamRelationships.length === 0 ? (
                  <p className="organisation-team-modal-hint">No relationships on this team yet.</p>
                ) : (
                  <ul className="organisation-team-modal-relationship-list">
                    {teamRelationships.map((relationship) => (
                      <li
                        key={`${relationship.fromTeamId}-${relationship.mode}-${relationship.toTeamId}`}
                      >
                        <span>{relationship.sentence}</span>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            const result = onRemoveRelationship({
                              fromTeamId: relationship.fromTeamId,
                              toTeamId: relationship.toTeamId,
                              mode: relationship.mode,
                            });
                            if (!result.ok) {
                              setError(result.error);
                              return;
                            }
                            setError(null);
                            setNotice('Relationship removed.');
                          }}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="organisation-team-modal-relationship-form">
                  <label className="organisation-field">
                    <span>Direction</span>
                    <select
                      value={relDirection}
                      onChange={(event) =>
                        setRelDirection(event.target.value as 'outbound' | 'inbound')
                      }
                    >
                      <option value="outbound">This team → other</option>
                      <option value="inbound">Other → this team</option>
                    </select>
                  </label>
                  <label className="organisation-field">
                    <span>Other team</span>
                    <select
                      value={relOtherTeamId}
                      onChange={(event) => setRelOtherTeamId(event.target.value)}
                    >
                      <option value="">Choose a team</option>
                      {otherTeams.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.displayName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="organisation-field">
                    <span>Interaction mode</span>
                    <select
                      value={relMode}
                      onChange={(event) =>
                        setRelMode(event.target.value as OrganisationInteractionMode)
                      }
                    >
                      {MODE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {TIME_BOXABLE_MODES.has(relMode) ? (
                    <label className="organisation-field">
                      <span>Expected until</span>
                      <input
                        type="date"
                        value={relExpectedUntil}
                        onChange={(event) => setRelExpectedUntil(event.target.value)}
                      />
                    </label>
                  ) : null}
                  <button type="button" className="btn-secondary" onClick={addRelationship}>
                    Add relationship
                  </button>
                </div>
              </>
            )}
          </section>

          {error ? (
            <p className="organisation-error" role="alert">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="organisation-saved" role="status">
              {notice}
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
