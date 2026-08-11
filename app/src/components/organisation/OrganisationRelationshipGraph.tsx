import { lazy, Suspense, useMemo, useState } from 'react';
import type { OrganisationRelationship } from '../../application/presentOrganisation';
import { presentOrganisationFlowGraph } from '../../application/presentOrganisationFlowGraph';

const MermaidPreview = lazy(() =>
  import('../MermaidPreview').then((module) => ({ default: module.MermaidPreview })),
);

type TeamMeta = {
  id: string;
  displayName: string;
  domainTitle: string | null;
};

type Props = {
  relationships: OrganisationRelationship[];
  teams: TeamMeta[];
};

export function OrganisationRelationshipGraph({ relationships, teams }: Props) {
  const [domainFilter, setDomainFilter] = useState('');

  const meta = useMemo(
    () =>
      teams.map((team) => ({
        id: team.id,
        displayName: team.displayName,
        domainTitle: team.domainTitle ?? 'Ungrouped',
      })),
    [teams],
  );

  const graph = useMemo(
    () =>
      presentOrganisationFlowGraph(relationships, meta, {
        domainTitle: domainFilter || null,
      }),
    [relationships, meta, domainFilter],
  );

  if (relationships.length === 0) {
    return <p className="organisation-zone-empty">No relationships yet.</p>;
  }

  return (
    <div className="organisation-flow-graph" data-testid="organisation-flow-graph">
      <div className="organisation-flow-graph-toolbar">
        <label className="organisation-field organisation-flow-graph-filter">
          <span>Domain focus</span>
          <select
            value={domainFilter}
            onChange={(event) => setDomainFilter(event.target.value)}
            data-testid="organisation-flow-graph-domain"
          >
            <option value="">All domains</option>
            {graph.domainOptions.map((option) => (
              <option key={option.title} value={option.title}>
                {option.title}
              </option>
            ))}
          </select>
        </label>
        <p className="organisation-flow-graph-lead">{graph.lead}</p>
      </div>

      <div className="organisation-flow-graph-legend" aria-label="Interaction mode legend">
        <span>
          <span
            className="organisation-mode-glyph organisation-mode-glyph--triangle"
            aria-hidden="true"
          />{' '}
          X-as-a-Service (solid)
        </span>
        <span>
          <span
            className="organisation-mode-glyph organisation-mode-glyph--parallelogram"
            aria-hidden="true"
          />{' '}
          Collaboration (thick)
        </span>
        <span>
          <span
            className="organisation-mode-glyph organisation-mode-glyph--circle"
            aria-hidden="true"
          />{' '}
          Facilitation (dotted)
        </span>
      </div>

      {graph.empty ? (
        <p className="organisation-zone-empty">No interactions in this domain focus.</p>
      ) : (
        <div
          className="organisation-flow-graph-canvas"
          data-testid="organisation-flow-graph-canvas"
        >
          <Suspense
            fallback={
              <div className="docs-mermaid docs-mermaid-loading" aria-busy="true">
                Loading diagram…
              </div>
            }
          >
            <MermaidPreview code={graph.mermaid} />
          </Suspense>
        </div>
      )}

      <details className="organisation-flow-graph-details">
        <summary>List alternative ({graph.edgeCount} interactions)</summary>
        <div className="organisation-flow-graph-list" data-testid="organisation-flow-graph-list">
          {graph.listGroups.map((group) => (
            <section key={group.domainTitle} className="organisation-flow-graph-list-group">
              <h3 className="organisation-flow-graph-list-title">{group.domainTitle}</h3>
              <ul className="organisation-relationship-list">
                {group.relationships.map((relationship) => (
                  <li
                    key={`${relationship.fromTeamId}-${relationship.mode}-${relationship.toTeamId}`}
                  >
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
            </section>
          ))}
        </div>
      </details>
    </div>
  );
}
