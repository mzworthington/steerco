import { useEffect } from 'react';
import {
  SITE_AUTHOR_NAME,
  SITE_AUTHOR_URL,
  SITE_NAME,
  SITE_ORIGIN,
  SITE_REPO_URL,
} from '../siteConfig';

export function PrivacyPage() {
  useEffect(() => {
    document.title = `Privacy policy · ${SITE_NAME}`;
  }, []);

  return (
    <article className="mx-auto max-w-prose px-4 py-12 text-left">
      <h1>Privacy policy</h1>
      <p>Last updated 3 September 2026.</p>
      <p>
        This page says what {SITE_NAME} does with information when you use{' '}
        <a href={SITE_ORIGIN}>{SITE_ORIGIN.replace(/^https:\/\//, '')}</a>. It is a plain-language
        notice, not legal advice.
      </p>
      <p>
        {SITE_NAME} is built by{' '}
        <a href={SITE_AUTHOR_URL} rel="noopener noreferrer">
          {SITE_AUTHOR_NAME}
        </a>
        .
      </p>
      <h2>What stays on your machine</h2>
      <p>
        Workspace files you edit are meant to stay local. We do not get a copy of those files unless
        you publish them yourself.
      </p>
      <h2>Product analytics (PostHog)</h2>
      <p>
        The public site uses <a href="https://posthog.com">PostHog</a> Cloud EU (via a first-party
        ingest host) so we can see which pages people open, how the app is used, errors, and session
        replay of the UI.
      </p>
      <p>
        We configure PostHog with <strong>cookieless tracking</strong>: it does not write PostHog
        cookies or use local/session storage for identity, and we do not call{' '}
        <code>identify()</code>. Counts use a privacy-preserving hash on PostHog’s servers.
      </p>
      <p>
        That is why this site does not show a cookie banner for PostHog. Cloudflare or the browser
        may still use their own cookies for hosting, security, or the installable app (service
        worker).
      </p>
      <p>
        Session replay can still show whatever is on screen in the workspace, so treat files with
        secrets the way you would a screen share.
      </p>
      <p>PostHog’s own terms and privacy policy apply to data they process for us.</p>
      <h2>Hosting</h2>
      <p>
        The website is static files on <strong>Cloudflare Pages</strong>. Those systems receive
        normal web-request metadata (for example IP address at the edge) as part of serving the
        site. A separate Cloudflare Web Analytics beacon may also run for visit counts.
      </p>
      <h2>What we do not do</h2>
      <p>
        We do not sell your data. We do not run ads. You do not need an account to use {SITE_NAME}{' '}
        in the browser.
      </p>
      <h2>Asking us to delete something</h2>
      <p>
        If you think we hold personal data about you in PostHog or elsewhere, open an issue on{' '}
        <a href={`${SITE_REPO_URL}/issues`}>{SITE_REPO_URL.replace(/^https:\/\//, '')}</a> and say
        what you want removed. We will use PostHog’s deletion tools where they apply.
      </p>
      <h2>Changes</h2>
      <p>If this notice changes in a material way, we will update the date at the top.</p>
    </article>
  );
}
