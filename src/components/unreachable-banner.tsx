"use client";

import { PhoneOff } from "lucide-react";

export function UnreachableBanner({
  callCount,
  unreachableCount,
  lastCallAt,
}: {
  callCount: number;
  unreachableCount: number;
  lastCallAt: Date | null;
}) {
  if (unreachableCount === 0) return null;

  const msg =
    unreachableCount >= 5
      ? `Bu kişiye ${callCount} kez aradınız, ${unreachableCount} kez ulaşılamadı. Tekrar aradığınızda: "Sizi X kez aradık, ulaşamadık. Bugün denk geldik."`
      : `Aranma: ${callCount} — Ulaşılamama: ${unreachableCount}`;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/40">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-200 dark:bg-amber-900/60">
        <PhoneOff className="h-5 w-5 text-amber-700 dark:text-amber-300" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-amber-900 dark:text-amber-100">
          {unreachableCount} kez ulaşılamadı
        </p>
        <p className="mt-0.5 text-sm text-amber-800/90 dark:text-amber-200/80">
          {msg}
        </p>
        {lastCallAt && (
          <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-300/70">
            Son arama: {new Date(lastCallAt).toLocaleString("tr-TR")}
          </p>
        )}
      </div>
    </div>
  );
}
