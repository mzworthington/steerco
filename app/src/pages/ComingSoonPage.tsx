import { useEffect } from 'react';
import { BrandMark } from '../components/BrandMark';
import { SITE_DESCRIPTION, SITE_NAME } from '../siteConfig';

export function ComingSoonPage() {
  useEffect(() => {
    document.title = `${SITE_NAME} — Coming Soon`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', SITE_DESCRIPTION);
  }, []);

  return (
    <section
      className="coming-soon"
      data-testid="coming-soon"
      aria-labelledby="coming-soon-heading"
    >
      <div className="coming-soon-inner">
        <div className="coming-soon-brand">
          <BrandMark className="h-12 w-12 sm:h-14 sm:w-14" />
          <p className="coming-soon-name">{SITE_NAME}</p>
        </div>
        <h1 id="coming-soon-heading" className="coming-soon-title">
          Coming Soon
        </h1>
        <p className="coming-soon-lead">{SITE_DESCRIPTION}</p>
      </div>
    </section>
  );
}
