import type {
  OrganisationDomainFocus,
  OrganisationOverview,
} from '../../application/presentOrganisation';

type OrganisationFlowOverviewProps = {
  overview: OrganisationOverview;
};

export function OrganisationFlowOverview({ overview }: OrganisationFlowOverviewProps) {
  return (
    <div className="organisation-overview" data-testid="organisation-flow-overview">
      <p className="organisation-flow-cue">{overview.cue}</p>
      <p className="organisation-overview-lvt" data-testid="organisation-lvt-placeholder">
        {overview.lvtPlaceholder}
      </p>

      <div className="organisation-overview-lanes" role="list">
        {overview.lanes.map((lane) => (
          <article key={lane.id} className="organisation-overview-lane" role="listitem">
            <h3 className="organisation-overview-lane-title">{lane.title}</h3>
            {lane.domainTitle ? (
              <p className="organisation-flow-grouping">Domain · {lane.domainTitle}</p>
            ) : null}
            <ul className="organisation-overview-labels">
              {lane.streamAlignedLabels.map((label) => (
                <li
                  key={label}
                  className="organisation-overview-chip organisation-overview-chip--stream"
                >
                  {label}
                </li>
              ))}
              {lane.complicatedSubsystemLabels.map((label) => (
                <li
                  key={label}
                  className="organisation-overview-chip organisation-overview-chip--css"
                >
                  {label}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      {overview.platforms.length > 0 || overview.enabling.length > 0 ? (
        <div className="organisation-overview-supports">
          {overview.platforms.map((platform) => (
            <div key={platform.id} className="organisation-overview-support">
              <p className="organisation-overview-support-title">{platform.title}</p>
              {platform.scopeLabel ? (
                <p className="organisation-flow-scope">Platform · {platform.scopeLabel}</p>
              ) : (
                <p className="organisation-flow-scope">Platform</p>
              )}
            </div>
          ))}
          {overview.enabling.map((item) => (
            <div key={item.id} className="organisation-overview-support">
              <p className="organisation-overview-support-title">{item.title}</p>
              <p className="organisation-flow-scope">
                Enabling
                {item.facilitatesLabels.length > 0
                  ? ` · facilitates ${item.facilitatesLabels.length}`
                  : ''}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type OrganisationDomainZoomProps = {
  focus: OrganisationDomainFocus;
};

export function OrganisationDomainZoom({ focus }: OrganisationDomainZoomProps) {
  return (
    <div className="organisation-domain-zoom" data-testid="organisation-domain-zoom">
      <header className="organisation-domain-zoom-header">
        <h2 className="organisation-section-title">{focus.domainTitle}</h2>
        <p className="organisation-teaching">{focus.lead}</p>
      </header>

      <div className="organisation-flow-streams">
        {focus.streamBands.map((band) => (
          <section
            key={band.id}
            className="organisation-flow-band"
            aria-labelledby={`domain-band-${band.id}`}
          >
            <h3 id={`domain-band-${band.id}`} className="organisation-flow-band-title">
              {band.title}
            </h3>
            <ul className="organisation-overview-labels">
              {band.streamAlignedTeams.map((team) => (
                <li
                  key={team.id}
                  className="organisation-overview-chip organisation-overview-chip--stream"
                >
                  {team.displayName}
                  <span className="organisation-overview-meta">{team.capacityLabel}</span>
                </li>
              ))}
              {band.complicatedSubsystems.map((team) => (
                <li
                  key={team.id}
                  className="organisation-overview-chip organisation-overview-chip--css"
                >
                  {team.displayName}
                  <span className="organisation-overview-meta">Complicated subsystem</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section
        className="organisation-domain-edges"
        aria-labelledby="domain-internal-edges"
        data-testid="organisation-domain-internal-edges"
      >
        <h3 id="domain-internal-edges" className="organisation-flow-band-title">
          Inside this domain
        </h3>
        {focus.internalEdges.length === 0 ? (
          <p className="organisation-flow-band-hint">
            No recorded interactions inside this domain.
          </p>
        ) : (
          <ul className="organisation-domain-edge-list">
            {focus.internalEdges.map((edge) => (
              <li key={`${edge.fromTeamId}-${edge.toTeamId}-${edge.mode}`}>{edge.sentence}</li>
            ))}
          </ul>
        )}
      </section>

      <section
        className="organisation-domain-edges organisation-domain-edges--external"
        aria-labelledby="domain-external-edges"
        data-testid="organisation-domain-external-edges"
      >
        <h3 id="domain-external-edges" className="organisation-flow-band-title">
          Leaves this domain
        </h3>
        <p className="organisation-flow-band-hint">
          Connections to teams outside the domain — keep these visible so cognitive load and
          handoffs stay honest.
        </p>
        {focus.externalEdges.length === 0 ? (
          <p className="organisation-flow-band-hint">No cross-domain interactions recorded.</p>
        ) : (
          <ul className="organisation-domain-edge-list organisation-domain-edge-list--external">
            {focus.externalEdges.map((edge) => (
              <li key={`${edge.fromTeamId}-${edge.toTeamId}-${edge.mode}`}>
                <span className="organisation-domain-edge-badge">Out of domain</span>
                {edge.sentence}
              </li>
            ))}
          </ul>
        )}
        {focus.externalTeams.length > 0 ? (
          <ul className="organisation-overview-labels organisation-domain-external-teams">
            {focus.externalTeams.map((team) => (
              <li
                key={team.id}
                className="organisation-overview-chip organisation-overview-chip--external"
              >
                {team.displayName}
                <span className="organisation-overview-meta">{team.roleLabel}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
