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
          <BrandMark variant="lockup" className="h-14 w-auto sm:h-16" />
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
