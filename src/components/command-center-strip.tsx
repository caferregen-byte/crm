import Link from "next/link";
import { CalendarClock, AlertTriangle } from "lucide-react";

type Props = {
  dueToday: number;
  overdue: number;
};

export function CommandCenterStrip({ dueToday, overdue }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Link
        href="/leads?filter=today"
        className="apple-card apple-card--interactive flex items-center justify-between gap-4 ring-1 ring-[var(--apple-border)]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--apple-blue)]/12">
            <CalendarClock className="h-5 w-5 text-[var(--apple-blue)]" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Bugün yapılacaklar
            </p>
            <p className="mt-0.5 text-[15px] font-semibold text-[var(--foreground)]">
              Takip / arama bugün
            </p>
          </div>
        </div>
        <span className="text-3xl font-semibold tabular-nums text-[var(--foreground)]">
          {dueToday}
        </span>
      </Link>

      <Link
        href="/leads?filter=overdue"
        className={`apple-card apple-card--interactive flex items-center justify-between gap-4 ring-2 ${
          overdue > 0
            ? "ring-[var(--apple-red)]/50 bg-[var(--apple-red)]/[0.06]"
            : "ring-[var(--apple-border)]"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
              overdue > 0 ? "bg-[var(--apple-red)]/15" : "bg-black/[0.04] dark:bg-white/[0.06]"
            }`}
          >
            <AlertTriangle
              className={`h-5 w-5 ${overdue > 0 ? "text-[var(--apple-red)]" : "text-[var(--muted)]"}`}
            />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Geciken follow-up
            </p>
            <p
              className={`mt-0.5 text-[15px] font-semibold ${
                overdue > 0 ? "text-[var(--apple-red)]" : "text-[var(--foreground)]"
              }`}
            >
              Tarihi geçmiş
            </p>
          </div>
        </div>
        <span
          className={`text-3xl font-semibold tabular-nums ${
            overdue > 0 ? "text-[var(--apple-red)]" : "text-[var(--foreground)]"
          }`}
        >
          {overdue}
        </span>
      </Link>
    </div>
  );
}
