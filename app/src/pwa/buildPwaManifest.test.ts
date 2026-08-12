import { describe, expect, it } from 'vitest';
import { SITE_DESCRIPTION, SITE_NAME } from '../siteConfig';
import { PWA_BACKGROUND_COLOR, PWA_THEME_COLOR, buildPwaManifest } from './buildPwaManifest';

describe('buildPwaManifest', () => {
  it('describes an installable standalone app shell', () => {
    const manifest = buildPwaManifest();

    expect(manifest.name).toBe(SITE_NAME);
    expect(manifest.short_name).toBe(SITE_NAME);
    expect(manifest.description).toBe(SITE_DESCRIPTION);
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(manifest.scope).toBe('/');
    expect(manifest.theme_color).toBe(PWA_THEME_COLOR);
    expect(manifest.background_color).toBe(PWA_BACKGROUND_COLOR);
  });

  it('includes 192, 512, and maskable icons', () => {
    const sizes = buildPwaManifest().icons.map((icon) => icon.sizes);
    const purposes = buildPwaManifest().icons.map((icon) => icon.purpose);

    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
    expect(purposes).toContain('maskable');
  });
});
