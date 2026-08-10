export const COLOR_TOKENS = [
  {
    name: 'Ink',
    cssVar: '--color-ink',
    hex: '#041c38',
    role: 'Primary text, logo ink, dark surfaces',
    swatchClass: 'bg-ink',
  },
  {
    name: 'Ink muted',
    cssVar: '--color-ink-muted',
    hex: '#5c6570',
    role: 'Secondary copy and labels',
    swatchClass: 'bg-ink-muted',
  },
  {
    name: 'Paper',
    cssVar: '--color-paper',
    hex: '#f7f5f3',
    role: 'Page background (warm stone)',
    swatchClass: 'bg-paper',
  },
  {
    name: 'Paper soft',
    cssVar: '--color-paper-soft',
    hex: '#fbfaf8',
    role: 'Elevated / soft page wash',
    swatchClass: 'bg-paper-soft',
  },
  {
    name: 'Stone',
    cssVar: '--color-stone',
    hex: '#ebe7e2',
    role: 'Soft fields, hover fills, sidebar wash',
    swatchClass: 'bg-stone',
  },
  {
    name: 'Ocean',
    cssVar: '--color-ocean',
    hex: '#044a88',
    role: 'Primary accent / CTAs / on-track',
    swatchClass: 'bg-ocean',
  },
  {
    name: 'Ocean hover',
    cssVar: '--color-ocean-hover',
    hex: '#0a5ca0',
    role: 'Active / hover accent',
    swatchClass: 'bg-ocean-hover',
  },
  {
    name: 'Ocean soft',
    cssVar: '--color-ocean-soft',
    hex: '#e8edf3',
    role: 'Nav pills, recommendation tint',
    swatchClass: 'bg-ocean-soft',
  },
  {
    name: 'Line',
    cssVar: '--color-line',
    hex: '#ddd8d2',
    role: 'Borders and dividers',
    swatchClass: 'bg-line',
  },
  {
    name: 'Coral',
    cssVar: '--color-coral',
    hex: '#d84c40',
    role: 'Stop / decision-note emphasis',
    swatchClass: 'bg-coral',
  },
  {
    name: 'Coral soft',
    cssVar: '--color-coral-soft',
    hex: '#fcf5ef',
    role: 'Stop callout background',
    swatchClass: 'bg-coral-soft',
  },
  {
    name: 'Amber',
    cssVar: '--color-amber',
    hex: '#b87c18',
    role: 'At-risk status',
    swatchClass: 'bg-amber',
  },
  {
    name: 'Signal',
    cssVar: '--color-signal',
    hex: '#248054',
    role: 'Positive / ops excellence cues',
    swatchClass: 'bg-signal',
  },
] as const;

export const TYPE_TOKENS = [
  {
    name: 'Display',
    cssVar: '--font-display',
    family: 'Fraunces',
    role: 'Page titles and wordmarks',
  },
  {
    name: 'Sans',
    cssVar: '--font-sans',
    family: 'Plus Jakarta Sans',
    role: 'UI, body, and functional labels',
  },
] as const;

export const DESIGN_SYSTEM_SECTIONS = [
  { id: 'identity', label: 'Identity' },
  { id: 'tokens', label: 'Tokens' },
  { id: 'assets', label: 'Assets' },
  { id: 'components', label: 'Components' },
] as const;

export type DesignSystemSectionId = (typeof DESIGN_SYSTEM_SECTIONS)[number]['id'];
