import { useEffect, useState } from 'react';
import { Link, Redirect } from 'wouter';
import type { CatalogMergePlan } from '@steerco/core';
import {
  applyCatalogImportPlan,
  presentCatalogImportPreview,
  type CatalogImportPreview,
} from '../application/presentCatalogImport';
import { useWorkspaceSession } from '../workspace/WorkspaceSession';

export function TechnicalImportPage() {
  const { session, setSession } = useWorkspaceSession();
  const [raw, setRaw] = useState('');
  const [sourceLabel, setSourceLabel] = useState('catalog file');
  const [preview, setPreview] = useState<CatalogImportPreview | null>(null);
  const [plan, setPlan] = useState<CatalogMergePlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Catalog import · SteerCo';
  }, []);

  if (!session) {
    return <Redirect to="/workspace" />;
  }

  const onParse = () => {
    setFlash(null);
    const result = presentCatalogImportPreview(session.spec, raw, sourceLabel);
    if (!result.ok) {
      setError(result.error);
      setPreview(null);
      setPlan(null);
      return;
    }
    setError(null);
    setPreview(result.preview);
    setPlan(result.plan);
  };

  const onFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    setRaw(text);
    setSourceLabel(file.name);
    setFlash(null);
    setError(null);
  };

  const onApply = () => {
    if (!plan) return;
    const applied = applyCatalogImportPlan(session.spec, plan);
    if (!applied.ok) {
      setError(applied.error);
      return;
    }
    setSession({ ...session, spec: applied.value });
    setFlash(`Applied ${applied.applied} catalog change${applied.applied === 1 ? '' : 's'}.`);
    setError(null);
    const refreshed = presentCatalogImportPreview(applied.value, raw, sourceLabel);
    if (refreshed.ok) {
      setPreview(refreshed.preview);
      setPlan(refreshed.plan);
    }
  };

  return (
    <section className="technical-page" data-testid="technical-import">
      <header className="technical-header">
        <p className="technical-crumb">
          <Link href="/workspace/technical">Technical</Link> / Catalog import
        </p>
        <h1 className="technical-title">Catalog import</h1>
        <p className="technical-lead">
          Paste or pick a lightweight catalog file, preview the merge into SteerSpec teams, then
          apply. OAuth connectors are out of scope here.
        </p>
      </header>

      <div className="technical-banner" role="status" data-testid="catalog-import-banner">
        Provider and catalog imports are reference-only. SteerCo never creates directory groups (
        <code>proposesGroupYaml</code> is always false).
      </div>

      <section className="technical-section" aria-labelledby="catalog-input">
        <h2 id="catalog-input" className="technical-section-title">
          Catalog source
        </h2>
        <label className="technical-field">
          <span>File</span>
          <input
            type="file"
            accept=".yaml,.yml,.json,text/yaml,application/json"
            onChange={(event) => void onFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <label className="technical-field">
          <span>Paste YAML or JSON</span>
          <textarea
            className="technical-textarea"
            rows={12}
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
            spellCheck={false}
            data-testid="catalog-import-textarea"
          />
        </label>
        <div className="technical-actions">
          <button type="button" className="btn-primary" onClick={onParse}>
            Preview merge
          </button>
        </div>
      </section>

      {preview ? (
        <section className="technical-section" aria-labelledby="catalog-preview">
          <h2 id="catalog-preview" className="technical-section-title">
            Merge preview · {preview.sourceLabel}
          </h2>
          <p className="technical-meta">{preview.banner}</p>
          <p className="technical-meta">
            proposesGroupYaml: <code>{String(preview.proposesGroupYaml)}</code> ·{' '}
            {preview.applyCount} change{preview.applyCount === 1 ? '' : 's'} to apply
          </p>
          <div className="technical-table-wrap">
            <table className="technical-table" data-testid="catalog-import-preview">
              <thead>
                <tr>
                  <th scope="col">action</th>
                  <th scope="col">incoming</th>
                  <th scope="col">system</th>
                  <th scope="col">existing</th>
                  <th scope="col">detail</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={`${row.incomingId}-${row.externalId}`}>
                    <td>
                      <code>{row.actionLabel}</code>
                    </td>
                    <td>
                      <code>{row.incomingId}</code>
                      <span className="technical-muted"> {row.incomingName}</span>
                    </td>
                    <td>
                      <code>
                        {row.system}:{row.externalId}
                      </code>
                    </td>
                    <td>
                      <code>{row.existingTeamId ?? '—'}</code>
                      {row.existingDisplayName ? (
                        <span className="technical-muted"> {row.existingDisplayName}</span>
                      ) : null}
                    </td>
                    <td>{row.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="technical-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={onApply}
              disabled={preview.applyCount === 0}
              data-testid="catalog-import-apply"
            >
              Apply to workspace
            </button>
          </div>
        </section>
      ) : null}

      {(error || flash) && (
        <div className="technical-feedback" role="status">
          {error ? <p className="technical-error">{error}</p> : null}
          {!error && flash ? <p className="technical-saved">{flash}</p> : null}
        </div>
      )}
    </section>
  );
}
