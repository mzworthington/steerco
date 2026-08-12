import { describe, expect, it, vi } from 'vitest';
import { registerServiceWorker } from './registerServiceWorker';

describe('registerServiceWorker', () => {
  it('registers immediately when the PWA module loads', async () => {
    const registerSW = vi.fn();
    await registerServiceWorker(async () => ({ registerSW }));
    expect(registerSW).toHaveBeenCalledWith({ immediate: true });
  });

  it('propagates loader failures', async () => {
    await expect(
      registerServiceWorker(async () => {
        throw new Error('virtual module missing');
      }),
    ).rejects.toThrow('virtual module missing');
  });
});
