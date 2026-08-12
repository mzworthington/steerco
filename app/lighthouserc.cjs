/** @type {import('@lhci/cli').Config} */
module.exports = {
  ci: {
    collect: {
      url: ['http://127.0.0.1:4173/?preview=1', 'http://127.0.0.1:4173/docs/setup?preview=1'],
      startServerCommand: 'pnpm exec vite preview --host 127.0.0.1 --port 4173',
      startServerReadyPattern: 'Local',
      numberOfRuns: 1,
      settings: {
        chromeFlags: '--no-sandbox --headless',
      },
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'categories:performance': ['warn', { minScore: 0.45 }],
        // Lighthouse 12+ no longer ships a PWA category or installability audits.
        // PWA artifacts are verified by `pnpm build` → scripts/verifyPwaBuild.mjs.
        'categories:pwa': 'off',
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-report',
    },
  },
};
