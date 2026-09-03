import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SITE_NAME } from '../siteConfig';
import { PrivacyPage } from './PrivacyPage';

afterEach(() => {
  cleanup();
});

describe('PrivacyPage', () => {
  it('describes cookieless PostHog and session replay', () => {
    render(<PrivacyPage />);
    expect(screen.getByRole('heading', { name: 'Privacy policy' })).toBeTruthy();
    expect(document.body.textContent).toContain(SITE_NAME);
    expect(document.body.textContent).toMatch(/cookieless tracking/i);
    expect(document.body.textContent).toMatch(/Cloud EU/);
    expect(document.body.textContent).toMatch(/Session replay/);
    expect(document.body.textContent).toMatch(/does not show a cookie banner for PostHog/);
  });
});
