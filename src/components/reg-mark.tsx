/**
 * Print registration mark (crosshair-in-circle) — the mark press operators
 * use to align color plates. Used as the site's one recurring decorative
 * signature instead of generic blobs/glows.
 */
export function RegMark({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12 1v7M12 16v7M1 12h7M16 12h7" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
