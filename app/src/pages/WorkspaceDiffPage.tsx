import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { presentWorkspaceDiff } from '../application/presentWorkspaceDiff';
import { useWorkspaceSession } from '../workspace/WorkspaceSession';

export function WorkspaceDiffPage() {
  const { session, hasPendingChanges, canWriteToFolder, revertDraft, saveWorkspace } =
    useWorkspaceSession();
  const [, setLocation] = useLocation();
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session) {
      setLocation('/workspace');
    }
  }, [session, setLocation]);

  const model = useMemo(
    () =>
      session
        ? presentWorkspaceDiff(session.baselineSpec, session.spec, {
            sourceLabel: session.source,
            canWriteToFolder,
          })
        : null,
    [session, canWriteToFolder],
  );

  useEffect(() => {
    if (!model) return;
    document.title = `Pending changes · ${model.workspaceTitle} · SteerCo`;
  }, [model]);

  if (!session || !model) return null;

  const onRevert = () => {
    if (!hasPendingChanges) return;
    const confirmed = window.confirm(
      'Revert all unsaved draft changes and restore the last accepted baseline?',
    );
    if (!confirmed) return;
    revertDraft();
    setError(null);
    setFlash('Draft reverted to the last accepted baseline.');
  };

  const onSave = async () => {
    if (!hasPendingChanges || saving) return;
    setSaving(true);
    setError(null);
    try {
      const result = await saveWorkspace();
      if (!result.ok) {
        setFlash(null);
        setError(result.error);
        return;
      }
      setFlash(
        result.method === 'directory'
          ? `Saved ${result.fileName} to the open folder.`
          : `Downloaded ${result.fileName}.`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="workspace-diff-page" data-testid="workspace-diff-page">
      <header className="workspace-diff-header">
        <p className="eyebrow">Pending draft changes</p>
        <h1 className="workspace-diff-title">What changed</h1>
        <p className="workspace-diff-lead">
          Compare this session’s working SteerSpec to the last opened or saved baseline - then
          revert or save.
        </p>
        <p className="workspace-diff-summary" data-testid="workspace-diff-summary">
          {model.summary}
        </p>
      </header>

      {error ? (
        <p className="workspace-diff-error" role="alert">
          {error}
        </p>
      ) : null}
      {flash ? (
        <p className="workspace-diff-flash" role="status">
          {flash}
        </p>
      ) : null}

      {!model.hasChanges ? (
        <div className="workspace-diff-empty" data-testid="workspace-diff-empty">
          <p className="workspace-diff-empty-title">Workspace is up to date</p>
          <p className="workspace-diff-empty-body">
            No draft changes relative to the last accepted baseline.
          </p>
          <Link href="/workspace/steering" className="btn-secondary mt-6">
            ← Back to steering
          </Link>
        </div>
      ) : (
        <>
          <div className="workspace-diff-sections">
            {model.sections.map((section) => (
              <section
                key={section.section}
                className="workspace-diff-section"
                aria-labelledby={`diff-${section.section}`}
              >
                <h2 id={`diff-${section.section}`} className="workspace-diff-section-title">
                  {section.title}
                </h2>
                <ul className="workspace-diff-list">
                  {section.changes.map((change) => (
                    <li
                      key={`${change.section}:${change.id}:${change.kind}`}
                      className={`workspace-diff-item workspace-diff-item-${change.kind}`}
                    >
                      <span className="workspace-diff-kind">{change.kindLabel}</span>
                      <span className="workspace-diff-label">{change.label}</span>
                      {change.detail ? (
                        <span className="workspace-diff-detail">{change.detail}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <p className="workspace-diff-hint">{model.acceptHint}</p>

          <div className="workspace-diff-actions">
            <button
              type="button"
              className="btn-secondary"
              data-testid="workspace-diff-revert"
              onClick={onRevert}
            >
              Revert draft
            </button>
            <button
              type="button"
              className="btn-primary"
              data-testid="workspace-diff-accept"
              disabled={saving}
              onClick={() => void onSave()}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
