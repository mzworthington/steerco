import { Component, type ReactNode } from 'react';

type RouteBoundaryState = {
  failed: boolean;
};

export class RouteBoundary extends Component<{ children: ReactNode }, RouteBoundaryState> {
  state: RouteBoundaryState = { failed: false };

  static getDerivedStateFromError(): RouteBoundaryState {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <section className="not-found">
          <h1>This page did not load</h1>
          <p>Refresh the page to try again.</p>
          <a href="/" className="btn-secondary mt-6">
            ← Back home
          </a>
        </section>
      );
    }
    return this.props.children;
  }
}

export function RouteFallback() {
  return (
    <p className="text-ink-muted px-5 py-16" role="status">
      Loading…
    </p>
  );
}
