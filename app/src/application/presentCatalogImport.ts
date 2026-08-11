import {
  applyTeamCatalogMerge,
  parseCatalogFile,
  proposeTeamCatalogMerge,
  type CatalogMergePlan,
  type CatalogMergeRow,
  type SteerSpec,
} from '@steerco/core';

export type CatalogImportPreviewRow = {
  action: CatalogMergeRow['action'];
  actionLabel: string;
  incomingId: string;
  incomingName: string;
  system: string;
  externalId: string;
  existingTeamId: string | null;
  existingDisplayName: string | null;
  detail: string;
};

export type CatalogImportPreview = {
  sourceLabel: string;
  banner: string;
  proposesGroupYaml: false;
  rows: CatalogImportPreviewRow[];
  applyCount: number;
};

export type CatalogImportParseResult =
  | { ok: true; preview: CatalogImportPreview; plan: CatalogMergePlan }
  | { ok: false; error: string };

export type CatalogImportApplyResult =
  { ok: true; value: SteerSpec; applied: number } | { ok: false; error: string };

const ACTION_LABELS: Record<CatalogMergeRow['action'], string> = {
  add: 'Add',
  link: 'Link',
  update_refs: 'Update',
  skip: 'Skip',
};

/** Parse catalog text and build an executive-friendly merge preview. */
export function presentCatalogImportPreview(
  spec: SteerSpec,
  raw: string,
  sourceLabel = 'catalog file',
): CatalogImportParseResult {
  const parsed = parseCatalogFile(raw, sourceLabel);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const plan = proposeTeamCatalogMerge(spec, parsed.teams, parsed.sourceLabel);
  return {
    ok: true,
    plan,
    preview: presentPlan(plan),
  };
}

function presentPlan(plan: CatalogMergePlan): CatalogImportPreview {
  const rows = plan.rows.map((row) => ({
    action: row.action,
    actionLabel: ACTION_LABELS[row.action],
    incomingId: row.incoming.id,
    incomingName: row.incoming.displayName,
    system: row.incoming.system,
    externalId: row.incoming.externalId,
    existingTeamId: row.existingTeamId,
    existingDisplayName: row.existingDisplayName,
    detail: row.detail,
  }));

  return {
    sourceLabel: plan.sourceLabel,
    banner: plan.banner,
    proposesGroupYaml: false,
    rows,
    applyCount: rows.filter((row) => row.action !== 'skip').length,
  };
}

/** Apply a previously proposed merge plan into the workspace SteerSpec. */
export function applyCatalogImportPlan(
  spec: SteerSpec,
  plan: CatalogMergePlan,
): CatalogImportApplyResult {
  if (plan.proposesGroupYaml) {
    return { ok: false, error: 'Catalog import must never propose Group YAML creation.' };
  }

  const applied = plan.rows.filter((row) => row.action !== 'skip').length;
  if (applied === 0) {
    return { ok: false, error: 'Nothing to apply - every row is already linked.' };
  }

  return {
    ok: true,
    value: applyTeamCatalogMerge(spec, plan),
    applied,
  };
}
