"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { PrioritiesPayload } from "@/lib/priorities-data";

type Lead = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  stage: string;
  completeness: string;
  callCount: number;
  unreachableCount: number;
  nextFollowUpAt: string | null;
  zoomScheduledAt: string | null;
  intentScore: number | null;
};

type Priorities = {
  newLeads: Lead[];
  zoomToday: Lead[];
  zoomThisWeek: Lead[];
  followUp: Lead[];
  waiting: Lead[];
  greens: Lead[];
  unreachables: Lead[];
  yellows: Lead[];
  recallables: Lead[];
};

const EMPTY_PRIORITIES: Priorities = {
  newLeads: [],
  zoomToday: [],
  zoomThisWeek: [],
  followUp: [],
  waiting: [],
  greens: [],
  unreachables: [],
  yellows: [],
  recallables: [],
};

const sections: { key: keyof Priorities; title: string; action: string }[] = [
  { key: "newLeads", title: "Yeni", action: "Aç" },
  { key: "zoomToday", title: "Bugün Zoom", action: "Aç" },
  { key: "zoomThisWeek", title: "Bu hafta", action: "Aç" },
  { key: "followUp", title: "Zoom sonrası", action: "Aç" },
  { key: "waiting", title: "Bekleyen", action: "Aç" },
  { key: "greens", title: "Yeşil", action: "Aç" },
  { key: "unreachables", title: "Ulaşılamayan", action: "Aç" },
  { key: "yellows", title: "Sarı", action: "Aç" },
  { key: "recallables", title: "Tekrar ara", action: "Aç" },
];

const cardClass = "apple-card";

function LeadRow({ lead, action }: { lead: Lead; action: string }) {
  const name = lead.name ?? lead.email ?? lead.phone ?? "İsimsiz";
  return (
    <Link
      href={`/leads/${lead.id}`}
      className="flex items-center justify-between gap-4 rounded-xl px-2 py-2.5 transition hover:bg-black/[0.03] active:scale-[0.99] dark:hover:bg-white/[0.04]"
    >
      <span className="truncate text-[15px] text-[var(--foreground)]">{name}</span>
      <span className="flex shrink-0 items-center gap-0.5 text-[13px] text-[var(--muted)]">
        {action}
        <ChevronRight className="h-4 w-4 opacity-60" />
      </span>
    </Link>
  );
}

function toPrioritiesShape(p: PrioritiesPayload): Priorities {
  const mapLead = (row: PrioritiesPayload["newLeads"][number]): Lead => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    stage: row.stage,
    completeness: row.completeness,
    callCount: row.callCount,
    unreachableCount: row.unreachableCount,
    nextFollowUpAt:
      row.nextFollowUpAt == null
        ? null
        : typeof row.nextFollowUpAt === "string"
          ? row.nextFollowUpAt
          : row.nextFollowUpAt.toISOString(),
    zoomScheduledAt:
      row.zoomScheduledAt == null
        ? null
        : typeof row.zoomScheduledAt === "string"
          ? row.zoomScheduledAt
          : row.zoomScheduledAt.toISOString(),
    intentScore: row.intentScore,
  });

  return {
    newLeads: p.newLeads.map(mapLead),
    zoomToday: p.zoomToday.map(mapLead),
    zoomThisWeek: p.zoomThisWeek.map(mapLead),
    followUp: p.followUp.map(mapLead),
    waiting: p.waiting.map(mapLead),
    greens: p.greens.map(mapLead),
    unreachables: p.unreachables.map(mapLead),
    yellows: p.yellows.map(mapLead),
    recallables: p.recallables.map(mapLead),
  };
}

export function PriorityList({ initialData }: { initialData?: PrioritiesPayload }) {
  const [data, setData] = useState<Priorities | null>(() =>
    initialData ? toPrioritiesShape(initialData) : null
  );
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) return;

    async function fetchPriorities() {
      try {
        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), 15_000);
        const res = await fetch("/api/priorities", { signal: ctrl.signal });
        clearTimeout(to);
        if (res.ok) {
          const json = (await res.json()) as PrioritiesPayload;
          setData(toPrioritiesShape(json));
        } else {
          setData(EMPTY_PRIORITIES);
        }
      } catch {
        setData(EMPTY_PRIORITIES);
      } finally {
        setLoading(false);
      }
    }
    void fetchPriorities();
  }, [initialData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--apple-border)] border-t-[var(--apple-blue)]" />
        <p className="text-[13px] text-[var(--muted)]">Öncelikler yükleniyor…</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <section className="space-y-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
        Öncelik
      </h2>
      <div className="space-y-3">
        {sections.map(({ key, title, action }) => {
          const leads = data[key] ?? [];
          if (leads.length === 0) return null;

          return (
            <div key={key} className={cardClass}>
              <div className="mb-2 flex items-baseline justify-between gap-2 px-2">
                <h3 className="text-[15px] font-medium text-[var(--foreground)]">{title}</h3>
                <span className="text-xs tabular-nums text-[var(--muted)]">{leads.length}</span>
              </div>
              <ul className="divide-y divide-[var(--apple-border)]">
                {leads.slice(0, 8).map((lead) => (
                  <li key={lead.id}>
                    <LeadRow lead={lead} action={action} />
                  </li>
                ))}
              </ul>
              {leads.length > 8 && (
                <Link
                  href="/leads"
                  className="mt-2 block py-2 text-center text-[13px] text-[var(--apple-blue)] hover:underline"
                >
                  +{leads.length - 8} daha
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
