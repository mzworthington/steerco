import type { SteerSpec } from './steerSpecSchema';
import { detectSteerSpecMismatches, type SteerMismatch } from './detectMismatches';
import { parseSteerSpecYaml } from './parseSteerSpecYaml';

export type SteerSpecCheckResult = {
  ok: boolean;
  parseError: string | null;
  errors: SteerMismatch[];
  warnings: SteerMismatch[];
};

/**
 * Parse YAML (or accept a document) and report mismatch severity for CI / gates.
 * Fails when any error-severity mismatch is present (warnings alone pass).
 */
export function checkSteerSpecYaml(
  raw: string,
  options: { failOnWarning?: boolean } = {},
): SteerSpecCheckResult {
  const parsed = parseSteerSpecYaml(raw);
  if (!parsed.ok) {
    return {
      ok: false,
      parseError: parsed.error,
      errors: [],
      warnings: [],
    };
  }
  return checkSteerSpecDocument(parsed.value, options);
}

export function checkSteerSpecDocument(
  doc: SteerSpec,
  options: { failOnWarning?: boolean } = {},
): SteerSpecCheckResult {
  const mismatches = detectSteerSpecMismatches(doc);
  const errors = mismatches.filter((item) => item.severity === 'error');
  const warnings = mismatches.filter((item) => item.severity === 'warning');
  const ok = errors.length === 0 && (!options.failOnWarning || warnings.length === 0);
  return { ok, parseError: null, errors, warnings };
}
