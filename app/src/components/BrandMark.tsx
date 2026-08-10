/** Brand mark used in the site nav (matches `design-pack/mark.svg`). */
export function BrandMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <img
      src="/assets/logo.svg"
      alt=""
      width={28}
      height={28}
      className={className}
      decoding="async"
    />
  );
}
