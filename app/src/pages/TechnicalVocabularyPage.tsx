import { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { presentTechnicalVocabulary } from '../application/presentTechnicalVocabulary';
import { useWorkspaceSession } from '../workspace/WorkspaceSession';

export function TechnicalVocabularyPage() {
  const { session } = useWorkspaceSession();
  const [, setLocation] = useLocation();
  const model = presentTechnicalVocabulary();

  useEffect(() => {
    if (!session) {
      setLocation('/workspace');
    }
  }, [session, setLocation]);

  useEffect(() => {
    document.title = 'Vocabulary bridge · SteerLens';
  }, []);

  if (!session) return null;

  return (
    <section className="technical-page" data-testid="technical-vocabulary">
      <header className="technical-header">
        <p className="technical-crumb">
          <Link href="/workspace/technical">Technical</Link> / Vocabulary
        </p>
        <h1 className="technical-title">EDGE / TT vocabulary bridge</h1>
        <p className="technical-lead">{model.lead}</p>
      </header>

      <VocabularyTable id="lvt" title="Lean Value Tree" rows={model.lvtBridge} />
      <VocabularyTable id="beyond" title="EDGE beyond LVT" rows={model.beyondLvt} />
      <VocabularyTable id="tt" title="Team Topologies" rows={model.teamTopologies} />

      <section className="technical-section" aria-labelledby="tech-principles">
        <h2 id="tech-principles" className="technical-section-title">
          Six EDGE principles
        </h2>
        <ul className="technical-principle-list">
          {model.principles.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.note}</span>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}

function VocabularyTable({
  id,
  title,
  rows,
}: {
  id: string;
  title: string;
  rows: Array<{ term: string; alias: string; note: string }>;
}) {
  return (
    <section className="technical-section" aria-labelledby={`vocab-${id}`}>
      <h2 id={`vocab-${id}`} className="technical-section-title">
        {title}
      </h2>
      <div className="technical-table-wrap">
        <table className="technical-table">
          <thead>
            <tr>
              <th scope="col">Framework term</th>
              <th scope="col">SteerLens</th>
              <th scope="col">Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.term}>
                <td>{row.term}</td>
                <td>
                  <code>{row.alias}</code>
                </td>
                <td>{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
