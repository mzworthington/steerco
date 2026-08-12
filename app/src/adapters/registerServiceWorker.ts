type RegisterSW = (options?: { immediate?: boolean }) => (reloadPage?: boolean) => Promise<void>;

export type PwaRegisterModule = {
  registerSW: RegisterSW;
};

export type LoadPwaRegister = () => Promise<PwaRegisterModule>;

/**
 * Register the Vite PWA service worker with auto-update semantics.
 * Callers supply the `virtual:pwa-register` loader so unit tests stay free of Vite virtuals.
 */
export async function registerServiceWorker(loadPwaRegister: LoadPwaRegister): Promise<void> {
  const { registerSW } = await loadPwaRegister();
  registerSW({ immediate: true });
}
