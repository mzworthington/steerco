import { parseSteerSpecYaml, type SteerSpec } from '@steerlens/core';

export type OpenWorkspaceResult = { ok: true; value: SteerSpec } | { ok: false; error: string };

/**
 * Parse and validate SteerSpec YAML into a workspace document.
 * Rejects invalid input without mutating any store.
 */
export function openWorkspaceFromYaml(text: string): OpenWorkspaceResult {
  const parsed = parseSteerSpecYaml(text);
  if (!parsed.ok) {
    return { ok: false, error: toPlainLanguageError(parsed.error) };
  }
  return { ok: true, value: parsed.value };
}

function toPlainLanguageError(detail: string): string {
  if (detail.startsWith('Could not parse YAML')) {
    return 'That file does not look like valid YAML. Check the contents and try again.';
  }
  if (detail.includes('apiVersion')) {
    return 'This SteerSpec version is not supported yet. SteerLens currently opens steerlens.dev/v1alpha1 documents.';
  }
  if (detail.includes('empty')) {
    return 'That file is empty. Choose a steertree.yaml with outcomes and bets.';
  }
  return `Could not open this workspace: ${detail}`;
}
