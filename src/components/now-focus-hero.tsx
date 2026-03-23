"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Phone, Flame, Calendar, RefreshCw, Sparkles } from "lucide-react";
import type { PriorityBucket } from "@/lib/next-action";
import { labelForPriorityBucket } from "@/lib/next-action";

type Lead = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  stage: string;
  intentScore: number | null;
};

type Priorities = Record<
  PriorityBucket,
  Lead[] | undefined
>;

const ORDER: PriorityBucket[] = [
  "newLeads",
  "zoomToday",
  "followUp",
  "waiting",
  "greens",
  "zoomThisWeek",
  "unreachables",
  "yellows",
  "recallables",
];

function pickTop(p: Priorities | null): { lead: Lead; bucket: PriorityBucket } | null {
  if (!p) return null;
  for (const bucket of ORDER) {
    const list = p[bucket];
    if (list && list.length > 0) {
      return { lead: list[0], bucket };
    }
  }
  return null;
}

function bucketIcon(bucket: PriorityBucket) {
  if (bucket === "newLeads" || bucket === "greens") return Flame;
  if (bucket === "zoomToday" || bucket === "zoomThisWeek") return Calendar;
  if (bucket === "followUp" || bucket === "waiting" || bucket === "recallables")
    return RefreshCw;
  return Sparkles;
}

export function NowFocusHero() {
  const [data, setData] = useState<Priorities | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/priorities");
        if (res.ok) setData((await res.json()) as Priorities);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const top = pickTop(data);
  const Icon = top ? bucketIcon(top.bucket) : Flame;

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-[20px] border border-[var(--apple-border)] bg-[var(--apple-surface)] shadow-[var(--apple-shadow)]">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--apple-border)] border-t-[var(--apple-blue)]" />
      </div>
    );
  }

  if (!top) {
    return (
      <div className="rounded-[20px] border border-[var(--apple-border)] bg-[var(--apple-surface)] p-8 text-center shadow-[var(--apple-shadow)]">
        <p className="text-[15px] text-[var(--muted)]">
          Şu an öncelikli kuyruk boş. Harika — veya yeni lead bekleniyor.
        </p>
        <Link
          href="/leads/new"
          className="btn-apple-primary mt-5 inline-flex"
        >
          Yeni lead ekle
        </Link>
      </div>
    );
  }

  const { lead, bucket } = top;
  const name = lead.name ?? lead.email ?? lead.phone ?? "İsimsiz";
  const label = labelForPriorityBucket(bucket);
  const hot = lead.intentScore != null && lead.intentScore >= 70;

  return (
    <div
      className={`relative overflow-hidden rounded-[20px] border-2 bg-[var(--apple-surface)] p-8 shadow-[var(--apple-shadow)] md:p-10 ${
        hot
          ? "border-[var(--apple-orange)] shadow-[0_0_0_1px_rgba(255,159,10,0.25),var(--apple-shadow)]"
          : "border-[var(--apple-blue)] shadow-[0_0_0_1px_rgba(0,122,255,0.2),var(--apple-shadow)]"
      } dark:border-opacity-80`}
    >
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-[0.07]"
        style={{
          background: hot ? "var(--apple-orange)" : "var(--apple-blue)",
        }}
      />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-black/[0.04] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)] dark:bg-white/[0.06]">
            <Icon className="h-3.5 w-3.5 text-[var(--apple-blue)]" />
            Şimdi
          </div>
          <p className="text-[13px] font-medium text-[var(--apple-blue)]">{label}</p>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] md:text-3xl">
            {name}
          </h2>
          {lead.phone && (
            <p className="text-[15px] text-[var(--muted)]">{lead.phone}</p>
          )}
        </div>
        <div className="flex flex-shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
          {lead.phone ? (
            <a
              href={`tel:${lead.phone}`}
              className="btn-apple-primary inline-flex min-h-[52px] min-w-[180px] items-center justify-center gap-2 px-8 text-[17px] font-semibold"
            >
              <Phone className="h-5 w-5" strokeWidth={2.5} />
              HEMEN ARA
            </a>
          ) : null}
          <Link
            href={`/leads/${lead.id}`}
            className="btn-apple-secondary inline-flex min-h-[52px] items-center justify-center px-6 text-[15px]"
          >
            Kaydı aç
          </Link>
        </div>
      </div>
    </div>
  );
}
