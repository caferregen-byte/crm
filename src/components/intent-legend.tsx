export function IntentLegend({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-[11px] text-[var(--muted)] ${className}`}
      role="note"
    >
      <span className="inline-flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-[var(--apple-green)]" />
        70+ sıcak
      </span>
      <span className="mx-1.5">·</span>
      <span className="inline-flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-[var(--apple-orange)]" />
        40–69 orta
      </span>
      <span className="mx-1.5">·</span>
      <span className="inline-flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-[var(--apple-red)]/80" />
        &lt;40 düşük
      </span>
    </p>
  );
}
