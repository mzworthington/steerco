export const COLOR_TOKENS = [
  {
    name: 'Ink',
    cssVar: '--color-ink',
    hex: '#0b1220',
    role: 'Text and dark surfaces',
    swatchClass: 'bg-ink',
  },
  {
    name: 'Ink muted',
    cssVar: '--color-ink-muted',
    hex: '#4a5568',
    role: 'Secondary copy',
    swatchClass: 'bg-ink-muted',
  },
  {
    name: 'Mist',
    cssVar: '--color-mist',
    hex: '#eef2f6',
    role: 'Soft fields and hover fills',
    swatchClass: 'bg-mist',
  },
  {
    name: 'Mist soft',
    cssVar: '--color-mist-soft',
    hex: '#f7f9fb',
    role: 'Page background',
    swatchClass: 'bg-mist-soft',
  },
  {
    name: 'Accent',
    cssVar: '--color-accent',
    hex: '#0f766e',
    role: 'Primary brand / CTAs',
    swatchClass: 'bg-accent',
  },
  {
    name: 'Accent hover',
    cssVar: '--color-accent-hover',
    hex: '#0d9488',
    role: 'Active / hover accent',
    swatchClass: 'bg-accent-hover',
  },
  {
    name: 'Line',
    cssVar: '--color-line',
    hex: '#d5dde8',
    role: 'Borders and dividers',
    swatchClass: 'bg-line',
  },
] as const;

export const TYPE_TOKENS = [
  {
    name: 'Display',
    cssVar: '--font-display',
    family: 'Syne',
    role: 'Headings and wordmarks',
  },
  {
    name: 'Sans',
    cssVar: '--font-sans',
    family: 'Source Sans 3',
    role: 'UI and body copy',
  },
] as const;

export const DESIGN_SYSTEM_SECTIONS = [
  { id: 'identity', label: 'Identity' },
  { id: 'tokens', label: 'Tokens' },
  { id: 'assets', label: 'Assets' },
  { id: 'components', label: 'Components' },
] as const;

export type DesignSystemSectionId = (typeof DESIGN_SYSTEM_SECTIONS)[number]['id'];
