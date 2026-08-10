import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { COLOR_TOKENS, DESIGN_SYSTEM_SECTIONS } from '../designSystem/tokens';
import { SITE_NAME } from '../siteConfig';
import { DesignSystemPage } from './DesignSystemPage';

afterEach(() => {
  cleanup();
});

describe('DesignSystemPage', () => {
  it('renders the coastal-ink design system heading', () => {
    render(<DesignSystemPage />);
    expect(screen.getByTestId('design-system')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: 'Design system' })).toBeTruthy();
    expect(document.title).toContain(SITE_NAME);
  });

  it('exposes section tabs for identity, tokens, assets, and components', () => {
    render(<DesignSystemPage />);
    for (const section of DESIGN_SYSTEM_SECTIONS) {
      expect(screen.getByRole('tab', { name: section.label })).toBeTruthy();
    }
  });

  it('shows color tokens when the Tokens tab is selected', () => {
    render(<DesignSystemPage />);
    fireEvent.click(screen.getByRole('tab', { name: 'Tokens' }));
    expect(screen.getByRole('heading', { name: 'Color tokens' })).toBeTruthy();
    expect(screen.getByText(COLOR_TOKENS[0].cssVar)).toBeTruthy();
    expect(screen.getByText(COLOR_TOKENS[0].hex)).toBeTruthy();
  });

  it('shows CTA recipes on the Components tab', () => {
    render(<DesignSystemPage />);
    fireEvent.click(screen.getByRole('tab', { name: 'Components' }));
    expect(screen.getByRole('button', { name: 'Primary' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Secondary' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tertiary' })).toBeTruthy();
  });
});
