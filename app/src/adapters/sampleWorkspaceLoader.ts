import sampleYaml from '../../packages/core/fixtures/steertree.sample.yaml?raw';
import { openWorkspaceFromYaml, type OpenWorkspaceResult } from '../application/openWorkspace';

export const SAMPLE_WORKSPACE_LABEL = 'Northwind Q3 alignment (sample)';

export function loadSampleWorkspace(): OpenWorkspaceResult {
  return openWorkspaceFromYaml(sampleYaml);
}
