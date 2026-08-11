import { useEffect, useState } from 'react';
import { useLgUp } from '../../hooks/useMediaQuery';

/** Expand a graph stage over workspace-main while the sidebar stays visible (desktop only). */
export function useGraphStageExpand() {
  const [expanded, setExpanded] = useState(false);
  const desktop = useLgUp();

  useEffect(() => {
    if (!desktop && expanded) {
      setExpanded(false);
    }
  }, [desktop, expanded]);

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
    expanded: desktop && expanded,
    setExpanded,
    toggleExpanded: () => {
      if (!desktop) return;
      setExpanded((value) => !value);
    },
  };
}
