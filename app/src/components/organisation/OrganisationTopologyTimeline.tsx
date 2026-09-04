import type { TopologyTimelineModel } from '../../application/presentTopologyTimeline';

type Props = {
  timeline: TopologyTimelineModel;
};

export function OrganisationTopologyTimeline({ timeline }: Props) {
  if (timeline.empty) {
    return (
      <div className="organisation-timeline" data-testid="organisation-timeline">
        <p className="organisation-timeline-lead" data-testid="organisation-timeline-empty">
          {timeline.lead}
        </p>
      </div>
    );
  }

  return (
    <div className="organisation-timeline" data-testid="organisation-timeline">
      <p className="organisation-timeline-lead">{timeline.lead}</p>

      <div
        className="organisation-timeline-chart"
        data-testid="organisation-timeline-chart"
        role="img"
        aria-label={`Topology timeline from ${timeline.rangeStart} to ${timeline.rangeEnd}`}
      >
        <div className="organisation-timeline-axis" aria-hidden="true">
          <span>{timeline.rangeStart}</span>
          <span>{timeline.rangeEnd}</span>
        </div>

        {timeline.asOfPercent !== null ? (
          <div
            className="organisation-timeline-asof"
            style={{ left: `${timeline.asOfPercent}%` }}
            title={timeline.asOf ?? undefined}
            data-testid="organisation-timeline-asof-marker"
          >
            <span className="organisation-timeline-asof-label">As of</span>
          </div>
        ) : null}

        <div className="organisation-timeline-section">
          <h3 className="organisation-timeline-section-title">Capacity</h3>
          {timeline.capacityMarkers.length === 0 ? (
            <p className="organisation-timeline-detail-empty">
              No dated capacity joins or leaves in this window yet.
            </p>
          ) : (
            <ul
              className="organisation-timeline-capacity"
              data-testid="organisation-timeline-capacity"
            >
              {timeline.capacityMarkers.map((marker) => (
                <li key={`${marker.teamId}-${marker.at}-${marker.memberLabel}-${marker.kind}`}>
                  <div className="organisation-timeline-band-meta">
                    <span>
                      {marker.label}
                      <span className="organisation-timeline-band-window"> · {marker.at}</span>
                    </span>
                  </div>
                  <div className="organisation-timeline-track">
                    <div
                      className={`organisation-timeline-marker organisation-timeline-marker--${marker.kind}`}
                      style={{ left: `${marker.percent}%` }}
                      title={marker.label}
                    >
                      {marker.deltaLabel}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="organisation-timeline-section">
          <h3 className="organisation-timeline-section-title">Interactions</h3>
          {timeline.relationshipBands.length === 0 ? (
            <p className="organisation-timeline-detail-empty">
              No relationships in this window yet.
            </p>
          ) : (
            <ul className="organisation-timeline-bands" data-testid="organisation-timeline-bands">
              {timeline.relationshipBands.map((band) => {
                const width = Math.max(1.5, band.endPercent - band.startPercent);
                return (
                  <li key={band.key} className="organisation-timeline-band-row">
                    <div className="organisation-timeline-band-meta">
                      <span
                        className={`organisation-mode-glyph organisation-mode-glyph--${band.shape}`}
                        aria-hidden="true"
                      />
                      <span>
                        {band.sentence}
                        <span className="organisation-timeline-band-window">
                          {' '}
                          · {band.startLabel} → {band.endLabel}
                        </span>
                      </span>
                    </div>
                    <div className="organisation-timeline-track">
                      <div
                        className={`organisation-timeline-band organisation-timeline-band--${band.mode}`}
                        style={{ left: `${band.startPercent}%`, width: `${width}%` }}
                        title={`${band.modeLabel}: ${band.sentence}`}
                      >
                        <span className="organisation-timeline-band-label">{band.modeLabel}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {timeline.events.length > 0 ? (
        <section
          className="organisation-timeline-events"
          aria-labelledby="organisation-timeline-events-heading"
          data-testid="organisation-timeline-events"
        >
          <h3
            id="organisation-timeline-events-heading"
            className="organisation-timeline-section-title"
          >
            Dated events
          </h3>
          <p className="organisation-timeline-events-lead">
            Capacity joins/leaves and relationship changes with explicit dates.
          </p>
          <table className="organisation-timeline-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Kind</th>
                <th scope="col">Summary</th>
                <th scope="col">Teams</th>
              </tr>
            </thead>
            <tbody>
              {timeline.events.map((event) => (
                <tr key={event.id}>
                  <td>{event.at}</td>
                  <td>{event.kindLabel}</td>
                  <td>{event.summary}</td>
                  <td>{event.teamLabels.join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}
