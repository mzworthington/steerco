type BrandMarkProps = {
  className?: string;
  /** Square arrow-only mark, or wide circles + arrow lockup. */
  variant?: 'mark' | 'lockup';
};

/** Brand mark from `design-pack/` (synced to `/assets/logo*.svg`). */
export function BrandMark({ className, variant = 'mark' }: BrandMarkProps) {
  if (variant === 'lockup') {
    return (
      <img
        src="/assets/logo-lockup.svg"
        alt=""
        width={83}
        height={50}
        className={className ?? 'h-7 w-auto'}
        decoding="async"
      />
    );
  }

  return (
    <img
      src="/assets/logo.svg"
      alt=""
      width={28}
      height={28}
      className={className ?? 'h-7 w-7'}
      decoding="async"
    />
  );
}
