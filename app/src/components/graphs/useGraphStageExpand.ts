import { useEffect, useState } from 'react';

/** Expand a graph stage over workspace-main while the sidebar stays visible. */
export function useGraphStageExpand() {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpanded(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    document.body.classList.add('graph-stage-lock');
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('graph-stage-lock');
    };
  }, [expanded]);

  return {
    expanded,
    setExpanded,
    toggleExpanded: () => setExpanded((value) => !value),
  };
}
