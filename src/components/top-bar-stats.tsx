"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = { todayCalls: number; todayTasks: number };

export function TopBarStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 12_000);
        const res = await fetch("/api/stats", { signal: ctrl.signal });
        clearTimeout(t);
        if (res.ok) {
          const data = (await res.json()) as Stats;
          setStats(data);
        }
      } catch {
        // ignore
      }
    }
    fetchStats();
    const t = setInterval(fetchStats, 60_000);
    return () => clearInterval(t);
  }, []);

  if (!stats) return null;

  return (
    <div className="flex items-center gap-1 text-[12px] tabular-nums text-[var(--muted)] sm:text-[13px]">
      <Link
        href="/"
        className="transition hover:text-[var(--apple-blue)] hover:scale-[1.02] active:scale-[0.98]"
      >
        {stats.todayCalls} arama
      </Link>
      <span className="text-[var(--apple-border)]" aria-hidden>
        ·
      </span>
      <Link
        href="/leads?filter=due"
        className="transition hover:text-[var(--apple-blue)] hover:scale-[1.02] active:scale-[0.98]"
      >
        {stats.todayTasks} görev
      </Link>
    </div>
  );
}
