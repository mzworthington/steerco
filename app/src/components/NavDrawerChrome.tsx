import { useEffect, useEffectEvent } from 'react';

type NavDrawerToggleProps = {
  open: boolean;
  onToggle: () => void;
  controlsId: string;
  label?: string;
};

/** Menu button for off-canvas navigation below the lg breakpoint. */
export function NavDrawerToggle({
  open,
  onToggle,
  controlsId,
  label = 'Open navigation',
}: NavDrawerToggleProps) {
  return (
    <button
      type="button"
      className="nav-drawer-toggle"
      data-testid="nav-drawer-toggle"
      aria-expanded={open}
      aria-controls={controlsId}
      onClick={onToggle}
    >
      <span className="nav-drawer-toggle-icon" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="sr-only">{open ? 'Close navigation' : label}</span>
    </button>
  );
}

type NavDrawerBackdropProps = {
  open: boolean;
  onClose: () => void;
};

export function NavDrawerBackdrop({ open, onClose }: NavDrawerBackdropProps) {
  if (!open) return null;
  return (
    <button
      type="button"
      className="nav-drawer-backdrop"
      data-testid="nav-drawer-backdrop"
      aria-label="Close navigation"
      onClick={onClose}
    />
  );
}

type UseNavDrawerOptions = {
  open: boolean;
  onClose: () => void;
  /** When true (desktop), Escape handling is skipped. */
  desktop: boolean;
};

/** Escape-to-close and body scroll lock while the mobile drawer is open. */
export function useNavDrawerEffects({ open, onClose, desktop }: UseNavDrawerOptions) {
  const handleClose = useEffectEvent(onClose);

  useEffect(() => {
    if (desktop || !open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, desktop]);
}

type NavDrawerCloseProps = {
  onClose: () => void;
};

export function NavDrawerClose({ onClose }: NavDrawerCloseProps) {
  return (
    <button
      type="button"
      className="nav-drawer-close"
      data-testid="nav-drawer-close"
      onClick={onClose}
    >
      Close
    </button>
  );
}

export function navDrawerPanelClass(base: string, open: boolean) {
  return open ? `${base} is-open` : base;
}
