import { parse as parseYaml } from 'yaml';
import { migrateSteerSpecTopologyRaw } from './migrateSteerSpecTopology';
import { steerSpecSchema, type SteerSpec } from './steerSpecSchema';
import { formatSteerSpecIssues, validateSteerSpecReferences } from './validateSteerSpec';

export type ParseSteerSpecResult = { ok: true; value: SteerSpec } | { ok: false; error: string };

export function parseSteerSpecYaml(text: string): ParseSteerSpecResult {
  let raw: unknown;
  try {
    raw = parseYaml(text);
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown syntax error';
    return { ok: false, error: `Could not parse YAML: ${detail}` };
  }

  if (raw === null || raw === undefined) {
    return { ok: false, error: 'YAML document is empty' };
  }

  const migrated = migrateSteerSpecTopologyRaw(raw);
  const parsed = steerSpecSchema.safeParse(migrated);
  if (!parsed.success) {
    const apiVersionIssue = parsed.error.issues.find((issue) => issue.path.includes('apiVersion'));
    if (apiVersionIssue) {
      return {
        ok: false,
        error: `Unsupported or missing apiVersion. SteerCo currently accepts steerco.dev/v1alpha1 only.`,
      };
    }
    return { ok: false, error: formatSteerSpecIssues(parsed.error.issues) };
  }

  const referenceError = validateSteerSpecReferences(parsed.data);
  if (referenceError) {
    return { ok: false, error: referenceError };
  }

  return { ok: true, value: parsed.data };
}
