import { SITE_DESCRIPTION, SITE_NAME } from '../siteConfig';

/** Brand colors used by the web app manifest and HTML theme-color. */
export const PWA_THEME_COLOR = '#044a88';
export const PWA_BACKGROUND_COLOR = '#f7f5f3';

export type PwaManifestIcon = {
  src: string;
  sizes: string;
  type: string;
  purpose?: 'any' | 'maskable' | 'monochrome';
};

export type PwaManifest = {
  name: string;
  short_name: string;
  description: string;
  theme_color: string;
  background_color: string;
  display: 'standalone';
  orientation: 'any';
  scope: string;
  start_url: string;
  icons: PwaManifestIcon[];
};

/**
 * Build the installable web app manifest for SteerCo.
 * Icons are the design-pack PWA PNGs under `public/icons/`.
 */
export function buildPwaManifest(): PwaManifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    theme_color: PWA_THEME_COLOR,
    background_color: PWA_BACKGROUND_COLOR,
    display: 'standalone',
    orientation: 'any',
    scope: '/',
    start_url: '/',
    icons: [
      {
        src: 'icons/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'icons/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: 'icons/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
