import { SITE_AUTHOR_NAME, SITE_AUTHOR_URL } from '../siteConfig';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>
        Made by{' '}
        <a href={SITE_AUTHOR_URL} rel="noopener noreferrer">
          {SITE_AUTHOR_NAME}
        </a>
      </p>
    </footer>
  );
}
