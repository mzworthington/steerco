import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { GraphStageExpandButton } from './GraphStageExpandButton';

function stubMatchMedia(lgUp: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: lgUp ? query.includes('min-width: 1024px') : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

afterEach(() => {
  cleanup();
  stubMatchMedia(true);
});

describe('GraphStageExpandButton', () => {
  it('renders on desktop viewports', () => {
    stubMatchMedia(true);
    render(<GraphStageExpandButton expanded={false} onToggle={() => {}} />);
    expect(screen.getByTestId('graph-stage-expand')).toBeTruthy();
  });

  it('is omitted on mobile viewports', () => {
    stubMatchMedia(false);
    render(<GraphStageExpandButton expanded={false} onToggle={() => {}} />);
    expect(screen.queryByTestId('graph-stage-expand')).toBeNull();
  });
});
