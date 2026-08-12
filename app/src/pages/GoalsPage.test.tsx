import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';
import { openWorkspaceFromYaml } from '../application/openWorkspace';
import { WorkspaceSessionProvider, sessionWithBaseline } from '../workspace/WorkspaceSession';
import { GoalsPage } from './GoalsPage';

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../packages/core/fixtures',
);
const sampleYaml = readFileSync(path.join(fixtureDir, 'steertree.sample.yaml'), 'utf8');

function seedSession(spec: Parameters<typeof sessionWithBaseline>[0], label = 'sample') {
  sessionStorage.setItem(
    'steerco.workspace-session',
    JSON.stringify(sessionWithBaseline(spec, 'sample', label)),
  );
}

function renderGoals(initialPath = '/workspace/lvt') {
  const memory = memoryLocation({ path: initialPath, record: true });
  const view = render(
    <Router hook={memory.hook}>
      <WorkspaceSessionProvider>
        <GoalsPage />
      </WorkspaceSessionProvider>
    </Router>,
  );
  return { ...view, memory };
}

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

describe('GoalsPage', () => {
  it('shows MoS framing, value tree, and vision detail by default', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);
    renderGoals();

    expect(screen.getByTestId('goals-page')).toBeTruthy();
    expect(screen.getByTestId('goals-value-tree')).toBeTruthy();
    expect(screen.getByTestId('value-tree-canvas')).toBeTruthy();
    expect(screen.getByTestId('goals-selection')).toBeTruthy();
    expect(screen.getByTestId('goals-vision-detail')).toBeTruthy();
    expect(screen.getByTestId('goals-vision-facts')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /investment vision/i })).toBeTruthy();
    expect(screen.getByTestId('lvt-edit')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /add product/i })).toBeNull();
  });

  it('selects a goal from the tree, updates the LVT URL, and shows value detail', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);
    const { memory } = renderGoals();

    fireEvent.click(screen.getAllByTestId('value-tree-node-goal')[0]!);

    expect(memory.history.at(-1)).toBe('/workspace/lvt/goal/out_promise');
    expect(screen.getByTestId('goals-goal-detail')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /reliable customer promises/i })).toBeTruthy();
    expect(screen.getByText('91%')).toBeTruthy();
    expect(screen.getByTestId('lvt-edit')).toBeTruthy();
    expect(screen.getByTestId('goals-linked-products')).toBeTruthy();
  });

  it('opens the focused bet from an LVT URL and edits via the consistent Edit modal', async () => {
    const user = userEvent.setup();
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);
    renderGoals('/workspace/lvt/bet/bet_pickup');

    expect(screen.getByTestId('goals-bet-detail')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /same-day pickup reliability/i })).toBeTruthy();

    await user.click(screen.getByTestId('lvt-edit'));
    expect(screen.getByTestId('bet-detail-modal')).toBeTruthy();
    expect(screen.getByTestId('bet-detail')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /^close$/i }));
    expect(screen.queryByTestId('bet-detail-modal')).toBeNull();
    expect(screen.getByTestId('goals-bet-detail')).toBeTruthy();
  });

  it('selects a bet from a product brief link without opening the edit modal', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);
    const { memory } = renderGoals('/workspace/lvt/goal/out_promise');

    fireEvent.click(screen.getAllByTestId('goals-product-bet')[0]!);

    expect(memory.history.at(-1)).toBe('/workspace/lvt/bet/bet_pickup');
    expect(screen.getByTestId('goals-bet-detail')).toBeTruthy();
    expect(screen.queryByTestId('bet-detail-modal')).toBeNull();
  });

  it('edits a goal measure through the Edit modal', async () => {
    const user = userEvent.setup();
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);
    renderGoals('/workspace/lvt/goal/out_promise');

    await user.click(screen.getByTestId('lvt-edit'));
    expect(screen.getByTestId('lvt-edit-modal')).toBeTruthy();
    expect(screen.getByTestId('lvt-edit-goal')).toBeTruthy();

    const current = screen.getByLabelText(/promise hit rate current/i);
    await user.clear(current);
    await user.type(current, '93');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    expect(screen.queryByTestId('lvt-edit-modal')).toBeNull();
    expect(screen.getByText(/saved changes to this workspace session/i)).toBeTruthy();
    expect(screen.getByText('93%')).toBeTruthy();
  });

  it('renders the Lean Value Tree without expand or orientation controls', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);
    renderGoals();

    expect(screen.queryByTestId('value-tree-orient')).toBeNull();
    expect(screen.queryByTestId('value-tree-vision')).toBeNull();
    expect(screen.queryByTestId('value-tree-expand')).toBeNull();
    expect(screen.getByTestId('value-tree-canvas')).toBeTruthy();
  });
});
