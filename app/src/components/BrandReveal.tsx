import { useEffect, useState, useSyncExternalStore } from 'react';
import { SITE_NAME } from '../siteConfig';

type BrandRevealProps = {
  className?: string;
};

const ARROW_PATH = 'M 117.98 -15.16 A 18 18 0 0 1 117.98 15.16 L -130 102 Q -48 0 -130 -102 Z';

/** Arrow sweep duration; wordmark fades in immediately after. */
const SWEEP_MS = 1350;

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(onStoreChange: () => void) {
  if (typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener('change', onStoreChange);
  return () => media.removeEventListener('change', onStoreChange);
}

function getReducedMotionSnapshot() {
  if (typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
}

/**
 * Lockup intro: arrow sweeps L→R; dots fade in as it passes; then SteerCo fades in.
 * Settled layout matches BrandMark lockup + coming-soon wordmark (production coming-soon).
 */
export function BrandReveal({ className }: BrandRevealProps) {
  const reduceMotion = usePrefersReducedMotion();
  const [named, setNamed] = useState(reduceMotion);

  useEffect(() => {
    if (reduceMotion) {
      setNamed(true);
      return;
    }
    setNamed(false);
    const timer = window.setTimeout(() => setNamed(true), SWEEP_MS);
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  return (
    <div
      className={`brand-reveal ${reduceMotion ? 'is-reduced' : ''} ${named ? 'is-named' : ''} ${className ?? ''}`}
      data-testid="brand-reveal"
      data-named={named ? 'true' : 'false'}
      role="img"
      aria-label={SITE_NAME}
    >
      <svg
        className="brand-reveal-lockup"
        viewBox="0 0 249.4 82.6"
        width={249.4}
        height={82.6}
        aria-hidden
      >
        <circle cx="38" cy="38" r="38" fill="#041c38" opacity={reduceMotion ? 1 : 0}>
          {reduceMotion ? null : (
            <animate
              attributeName="opacity"
              values="0;1"
              begin="0.08s"
              dur="0.28s"
              fill="freeze"
              calcMode="spline"
              keySplines="0.4 0 0.2 1"
              keyTimes="0;1"
            />
          )}
        </circle>
        <circle cx="128" cy="38" r="38" fill="#041c38" opacity={reduceMotion ? 1 : 0}>
          {reduceMotion ? null : (
            <animate
              attributeName="opacity"
              values="0;1"
              begin="0.38s"
              dur="0.28s"
              fill="freeze"
              calcMode="spline"
              keySplines="0.4 0 0.2 1"
              keyTimes="0;1"
            />
          )}
        </circle>
        <g>
          {reduceMotion ? null : (
            <animateTransform
              attributeName="transform"
              type="translate"
              values="-200 0;0 0"
              dur="1.35s"
              fill="freeze"
              calcMode="spline"
              keySplines="0.45 0.05 0.25 1"
              keyTimes="0;1"
            />
          )}
          <g transform="translate(218 38) scale(0.293879) rotate(-45) translate(17.3702 0)">
            <path fill="#041c38" d={ARROW_PATH} />
          </g>
        </g>
      </svg>
      <p className={`coming-soon-name brand-reveal-wordmark${named ? 'is-visible' : ''}`}>
        {SITE_NAME}
      </p>
    </div>
  );
}
