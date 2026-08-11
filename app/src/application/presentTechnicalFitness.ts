import {
  detectSteerSpecMismatches,
  summariseWriteBackPolicy,
  type SteerMismatch,
  type SteerSpec,
} from '@steerco/core';

export type TechnicalFitnessMismatch = {
  code: string;
  severity: 'error' | 'warning';
  title: string;
  headline: string;
  relatedBetIds: string[];
  relatedTeamIds: string[];
  relatedOutcomeIds: string[];
  deepLink: string | null;
};

export type TechnicalWriteBackRow = {
  teamId: string;
  displayName: string;
  provenance: string;
  allowed: boolean;
  reason: string;
};

export type TechnicalFitnessModel = {
  workspaceTitle: string;
  mismatchCount: number;
  errorCount: number;
  warningCount: number;
  mismatches: TechnicalFitnessMismatch[];
  writeBack: {
    providerBlocked: number;
    catalogFileEligible: number;
    localOnly: number;
    summary: string;
    rows: TechnicalWriteBackRow[];
  };
};

export function presentTechnicalFitness(spec: SteerSpec): TechnicalFitnessModel {
  const mismatches = detectSteerSpecMismatches(spec).map(presentMismatch);
  const policy = summariseWriteBackPolicy(spec);

  return {
    workspaceTitle: spec.metadata.title ?? humanizeName(spec.metadata.name),
    mismatchCount: mismatches.length,
    errorCount: mismatches.filter((item) => item.severity === 'error').length,
    warningCount: mismatches.filter((item) => item.severity === 'warning').length,
    mismatches,
    writeBack: {
      providerBlocked: policy.providerBlocked,
      catalogFileEligible: policy.catalogFileEligible,
      localOnly: policy.localOnly,
      summary: buildWriteBackSummary(policy),
      rows: policy.rows.map((row) => ({
        teamId: row.teamId,
        displayName: row.displayName,
        provenance: row.decision.provenance,
        allowed: row.decision.allowed,
        reason: row.decision.reason,
      })),
    },
  };
}

function presentMismatch(mismatch: SteerMismatch): TechnicalFitnessMismatch {
  const betId = mismatch.relatedBetIds?.[0];
  const deepLink = betId
    ? `/workspace/bets/${betId}`
    : mismatch.relatedTeamIds?.length
      ? '/workspace/organisation'
      : mismatch.relatedOutcomeIds?.length
        ? '/workspace/outcomes'
        : '/workspace/steering';

  return {
    code: mismatch.code,
    severity: mismatch.severity,
    title: mismatch.title,
    headline: mismatch.headline,
    relatedBetIds: mismatch.relatedBetIds ?? [],
    relatedTeamIds: mismatch.relatedTeamIds ?? [],
    relatedOutcomeIds: mismatch.relatedOutcomeIds ?? [],
    deepLink,
  };
}

function buildWriteBackSummary(policy: {
  providerBlocked: number;
  catalogFileEligible: number;
  localOnly: number;
}): string {
  const parts = [
    `${policy.providerBlocked} provider-backed (Group YAML blocked)`,
    `${policy.catalogFileEligible} catalog-file (opt-in required)`,
    `${policy.localOnly} local-only`,
  ];
  return parts.join(' · ');
}

function humanizeName(name: string): string {
  return name
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
