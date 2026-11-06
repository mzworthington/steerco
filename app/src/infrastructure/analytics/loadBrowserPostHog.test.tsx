import { act } from '@testing-library/react';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    startExceptionAutocapture: vi.fn(),
  },
}));

import posthog from 'posthog-js';
import { mountPostHog } from './loadBrowserPostHog';

describe('mountPostHog', () => {
  let host: HTMLDivElement;
  let root: Root;

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
    vi.clearAllMocks();
  });

  it('starts analytics without remounting the painted tree', () => {
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    let mounts = 0;

    function SessionProbe() {
      useEffect(() => {
        mounts += 1;
      }, []);
      const [label, setLabel] = useState('editing');
      return (
        <button type="button" onClick={() => setLabel('saved')}>
          {label}
        </button>
      );
    }

    act(() => {
      root.render(
        <StrictMode>
          <SessionProbe />
        </StrictMode>,
      );
    });
    const mountsAfterPaint = mounts;

    act(() => {
      host.querySelector('button')?.click();
    });
    expect(host.querySelector('button')?.textContent).toBe('saved');

    act(() => {
      mountPostHog({
        enabled: true,
        apiKey: 'phc_test',
        apiHost: 'https://a.example.test',
      });
    });

    expect(host.querySelector('button')?.textContent).toBe('saved');
    expect(mounts).toBe(mountsAfterPaint);
    expect(posthog.init).toHaveBeenCalledOnce();
  });
});
