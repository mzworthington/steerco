import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import {
  boardPackSectionGroups,
  buildBoardPackPreview,
  defaultBoardPackSelection,
  presentBoardPack,
  type BoardPackSectionId,
  type BoardPackSelection,
} from '../application/presentBoardPack';
import { useWorkspaceSession } from '../workspace/WorkspaceSession';

export function ExportBoardPackPage() {
  const { session } = useWorkspaceSession();
  const [, setLocation] = useLocation();
  const [packTitle, setPackTitle] = useState('');
  const [selection, setSelection] = useState<BoardPackSelection>(() => defaultBoardPackSelection());

  useEffect(() => {
    if (!session) {
      setLocation('/workspace');
    }
  }, [session, setLocation]);

  const model = useMemo(() => (session ? presentBoardPack(session.spec) : null), [session]);

  useEffect(() => {
    if (!model) return;
    document.title = `Export · ${model.workspaceTitle} · SteerLens`;
    setPackTitle((current) => current || model.packTitle);
  }, [model]);

  const preview = useMemo(() => {
    if (!session || !model) return null;
    return buildBoardPackPreview(session.spec, selection, {
      packTitle: packTitle.trim() || model.packTitle,
    });
  }, [session, model, selection, packTitle]);

  if (!session || !model || !preview) return null;

  const groups = boardPackSectionGroups(model.sections);

  const toggleSection = (id: BoardPackSectionId) => {
    setSelection((current) => ({ ...current, [id]: !current[id] }));
  };

  const onPrint = () => {
    const previousTitle = document.title;
    document.title = preview.filenameBase;
    window.print();
    document.title = previousTitle;
  };

  return (
    <section className="export-page" data-testid="export-board-pack-page">
      <header className="export-header no-print">
        <p className="eyebrow">Export · board pack</p>
        <h1 className="export-title">Share with leadership</h1>
        <p className="export-lead">
          Create a board-ready PDF pack structured around how we invest, how we work, and how we
          adapt.
        </p>
      </header>

      <div className="export-layout">
        <aside className="export-config no-print" aria-label="Board pack options">
          <div className="export-panel">
            <h2 className="export-panel-title">Board pack details</h2>
            <label className="export-field">
              <span>Pack title</span>
              <input
                value={packTitle}
                onChange={(event) => setPackTitle(event.target.value)}
                aria-label="Pack title"
              />
            </label>
          </div>

          <div className="export-panel">
            <h2 className="export-panel-title">Select sections to include</h2>
            {groups.map((group) => (
              <fieldset key={group.pillar} className="export-section-group">
                <legend className="export-section-pillar">
                  {group.pillarLabel}
                  <span className="export-section-pillar-hint">
                    {group.pillar === 'invest'
                      ? 'How should we invest?'
                      : group.pillar === 'work'
                        ? 'How should work be organised?'
                        : 'What should we start, stop, or continue?'}
                  </span>
                </legend>
                {group.sections.map((section) => (
                  <label key={section.id} className="export-section-option">
                    <input
                      type="checkbox"
                      checked={selection[section.id]}
                      onChange={() => toggleSection(section.id)}
                    />
                    <span>
                      <span className="export-section-label">{section.label}</span>
                      <span className="export-section-desc">{section.description}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            ))}
            <p className="export-config-note">
              Print to PDF keeps everything on this device - no account required.
            </p>
          </div>

          <button
            type="button"
            className="btn-primary"
            data-testid="export-print"
            onClick={onPrint}
          >
            Download PDF
          </button>
          <p className="export-technical" aria-disabled="true">
            Technical exports… <span>(coming in a later slice)</span>
          </p>
        </aside>

        <div className="export-preview-shell" aria-label="PDF preview">
          <div className="export-preview-toolbar no-print">
            <p className="export-preview-toolbar-title">PDF preview</p>
            <p className="export-preview-filename">{preview.filenameBase}.pdf</p>
          </div>

          <article
            className="export-preview"
            data-testid="export-preview"
            tabIndex={0}
            aria-label="Board pack preview document"
          >
            <header className="export-cover">
              <p className="export-cover-brand">SteerLens</p>
              <h2 className="export-cover-title">{preview.coverTitle}</h2>
              <p className="export-cover-date">{preview.coverDateLabel}</p>
              <p className="export-cover-blurb">{preview.coverBlurb}</p>
              <ul className="export-cover-pillars">
                {preview.pillars.map((pillar) => (
                  <li key={pillar.id}>
                    <span className="export-cover-pillar-label">{pillar.label}</span>
                    <span>{pillar.question}</span>
                  </li>
                ))}
              </ul>
            </header>

            {preview.steering ? (
              <section className="export-preview-section" data-testid="export-section-steering">
                <p className="export-preview-pillar">Invest</p>
                <h3>Steering overview</h3>
                <p className="export-preview-vision">{preview.steering.vision}</p>
                <p>{preview.steering.alignmentSummary}</p>
                {preview.steering.mismatchSummary ? (
                  <p className="export-preview-muted">{preview.steering.mismatchSummary}</p>
                ) : null}
                {preview.steering.outcomes.map((outcome) => (
                  <div key={outcome.id} className="export-preview-block">
                    <h4>{outcome.title}</h4>
                    <ul>
                      {outcome.bets.map((bet) => (
                        <li key={bet.id}>
                          <strong>{bet.title}</strong> - {bet.status}. {bet.metricCue}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            ) : null}

            {preview.outcomes ? (
              <section className="export-preview-section" data-testid="export-section-outcomes">
                <p className="export-preview-pillar">Invest</p>
                <h3>Outcomes - measures of success</h3>
                {preview.outcomes.map((outcome) => (
                  <div key={outcome.id} className="export-preview-block">
                    <h4>{outcome.title}</h4>
                    <ul>
                      {outcome.measures.map((measure) => (
                        <li key={measure.id}>
                          <strong>{measure.title}</strong>: {measure.displayValue}.{' '}
                          {measure.interpretation}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            ) : null}

            {preview.organisation ? (
              <section className="export-preview-section" data-testid="export-section-organisation">
                <p className="export-preview-pillar">Work</p>
                <h3>How work is organised</h3>
                <p>{preview.organisation.lead}</p>
                {preview.organisation.overloadBanner ? (
                  <p className="export-preview-alert">{preview.organisation.overloadBanner}</p>
                ) : null}
                {preview.organisation.zones
                  .filter((zone) => zone.teams.length > 0)
                  .map((zone) => (
                    <div key={zone.role} className="export-preview-block">
                      <h4>
                        {zone.topologyName} - {zone.title}
                      </h4>
                      <ul>
                        {zone.teams.map((team) => (
                          <li key={team.id}>
                            <strong>{team.displayName}</strong> · {team.capacityLabel}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                {preview.organisation.relationships.length > 0 ? (
                  <div className="export-preview-block">
                    <h4>Interaction modes</h4>
                    <ul>
                      {preview.organisation.relationships.map((rel) => (
                        <li key={`${rel.fromTeamId}-${rel.toTeamId}-${rel.mode}`}>
                          {rel.sentence}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            ) : null}

            {preview.decisionNotes ? (
              <section className="export-preview-section" data-testid="export-section-decisions">
                <p className="export-preview-pillar">Adapt</p>
                <h3>Decision notes</h3>
                {preview.decisionNotes.map((note) => (
                  <div key={note.id} className="export-preview-block export-decision-note">
                    <h4>
                      {note.recommendationLabel}: {note.title}
                    </h4>
                    <p>
                      <strong>Why.</strong> {note.whyPreview}
                    </p>
                    {note.measured.length > 0 ? (
                      <p>
                        <strong>Measured.</strong> {note.measured.join(' · ')}
                      </p>
                    ) : null}
                    <p>
                      <strong>Next step.</strong> {note.nextStep}
                    </p>
                  </div>
                ))}
              </section>
            ) : null}

            {preview.evidence ? (
              <section className="export-preview-section" data-testid="export-section-evidence">
                <p className="export-preview-pillar">Adapt</p>
                <h3>Evidence</h3>
                <ul>
                  {preview.evidence.map((card) => (
                    <li key={card.metricId}>
                      <strong>{card.title}</strong> {card.displayValue} - {card.learning}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </article>
        </div>
      </div>
    </section>
  );
}
