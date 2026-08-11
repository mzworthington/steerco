import { z } from 'zod';
import { parse as parseYaml } from 'yaml';
import { normalizeTeamTopologyType } from '../teamTopologies/vocabulary';
import type { SteerSpec, Team, TeamTopologyType } from './steerSpecSchema';

const catalogTeamSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  role: z.string().optional(),
  /** Provider system this catalog entry came from. */
  system: z.enum(['backstage', 'github', 'entra', 'other']).default('other'),
  externalId: z.string().optional(),
});

const catalogFileSchema = z.object({
  teams: z.array(catalogTeamSchema).min(1),
});

export type CatalogImportTeam = {
  id: string;
  displayName: string;
  role: TeamTopologyType;
  system: 'backstage' | 'github' | 'entra' | 'other';
  externalId: string;
};

export type CatalogMergeAction = 'add' | 'link' | 'update_refs' | 'skip';

export type CatalogMergeRow = {
  action: CatalogMergeAction;
  incoming: CatalogImportTeam;
  existingTeamId: string | null;
  existingDisplayName: string | null;
  detail: string;
};

export type CatalogMergePlan = {
  sourceLabel: string;
  rows: CatalogMergeRow[];
  /** Never true for provider catalogs - Group YAML emission is forbidden. */
  proposesGroupYaml: false;
  banner: string;
};

export type ParseCatalogResult =
  { ok: true; teams: CatalogImportTeam[]; sourceLabel: string } | { ok: false; error: string };

/**
 * Parse a lightweight catalog file (YAML or JSON) into importable teams.
 * Shape:
 * ```yaml
 * teams:
 *   - id: team_storefront
 *     displayName: Storefront
 *     role: stream_aligned
 *     system: backstage
 *     externalId: group:default/storefront
 * ```
 */
export function parseCatalogFile(raw: string, sourceLabel = 'catalog file'): ParseCatalogResult {
  let parsed: unknown;
  try {
    parsed = parseYaml(raw);
  } catch {
    return { ok: false, error: 'Catalog file is not valid YAML or JSON.' };
  }

  const result = catalogFileSchema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      error: 'Catalog file must list teams with id and displayName.',
    };
  }

  const teams: CatalogImportTeam[] = result.data.teams.map((team) => {
    const normalized = team.role
      ? (normalizeTeamTopologyType(team.role) as TeamTopologyType)
      : 'stream_aligned';
    const role = (
      ['stream_aligned', 'platform', 'enabling', 'complicated_subsystem'] as TeamTopologyType[]
    ).includes(normalized)
      ? normalized
      : 'stream_aligned';
    return {
      id: team.id,
      displayName: team.displayName,
      role,
      system: team.system,
      externalId: team.externalId?.trim() || team.id,
    };
  });

  return { ok: true, teams, sourceLabel };
}

/**
 * Preview merge of catalog teams into SteerSpec without mutating.
 * Links by externalRef id or matching team id; never proposes Group YAML.
 */
export function proposeTeamCatalogMerge(
  doc: SteerSpec,
  incoming: CatalogImportTeam[],
  sourceLabel = 'catalog file',
): CatalogMergePlan {
  const rows: CatalogMergeRow[] = incoming.map((team) => {
    const byExternal = doc.spec.teams.find((existing) =>
      existing.externalRefs.some((ref) => ref.id === team.externalId),
    );
    const byId = doc.spec.teams.find((existing) => existing.id === team.id);
    const existing = byExternal ?? byId ?? null;

    if (!existing) {
      return {
        action: 'add' as const,
        incoming: team,
        existingTeamId: null,
        existingDisplayName: null,
        detail: `Add ${team.displayName} with ${team.system} reference`,
      };
    }

    const alreadyLinked = existing.externalRefs.some((ref) => ref.id === team.externalId);
    if (alreadyLinked && existing.displayName === team.displayName) {
      return {
        action: 'skip' as const,
        incoming: team,
        existingTeamId: existing.id,
        existingDisplayName: existing.displayName,
        detail: 'Already linked - no change',
      };
    }

    if (alreadyLinked) {
      return {
        action: 'update_refs' as const,
        incoming: team,
        existingTeamId: existing.id,
        existingDisplayName: existing.displayName,
        detail: `Refresh display name to ${team.displayName}`,
      };
    }

    return {
      action: 'link' as const,
      incoming: team,
      existingTeamId: existing.id,
      existingDisplayName: existing.displayName,
      detail: `Attach ${team.system} ref ${team.externalId}`,
    };
  });

  return {
    sourceLabel,
    rows,
    proposesGroupYaml: false,
    banner:
      'Provider and catalog imports are reference-only. SteerLens never creates directory groups.',
  };
}

/**
 * Apply a catalog merge plan into SteerSpec (immutable).
 * New teams get provenance catalog_file; linked teams keep provenance but gain externalRefs.
 */
export function applyTeamCatalogMerge(doc: SteerSpec, plan: CatalogMergePlan): SteerSpec {
  let teams = [...doc.spec.teams];

  for (const row of plan.rows) {
    if (row.action === 'skip') continue;

    if (row.action === 'add') {
      const system = row.incoming.system === 'other' ? 'backstage' : row.incoming.system;
      const next: Team = {
        id: row.incoming.id,
        displayName: row.incoming.displayName,
        role: row.incoming.role,
        provenance: 'catalog_file',
        externalRefs: [
          {
            system:
              system === 'entra' || system === 'github' || system === 'backstage'
                ? system
                : 'other',
            id: row.incoming.externalId,
          },
        ],
        members: [],
        streamIds: [],
      };
      teams = [...teams, next];
      continue;
    }

    teams = teams.map((team) => {
      if (team.id !== row.existingTeamId) return team;
      const hasRef = team.externalRefs.some((ref) => ref.id === row.incoming.externalId);
      const system =
        row.incoming.system === 'entra' ||
        row.incoming.system === 'github' ||
        row.incoming.system === 'backstage'
          ? row.incoming.system
          : 'other';
      return {
        ...team,
        displayName: row.incoming.displayName,
        externalRefs: hasRef
          ? team.externalRefs
          : [...team.externalRefs, { system, id: row.incoming.externalId }],
        provenance: team.provenance === 'local' ? 'catalog_file' : team.provenance,
      };
    });
  }

  return {
    ...doc,
    spec: {
      ...doc.spec,
      teams,
    },
  };
}
