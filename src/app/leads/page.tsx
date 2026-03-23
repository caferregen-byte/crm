import Link from "next/link";
import { Search, Phone, ChevronRight, Star } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { runPrisma } from "@/lib/safe-prisma";
import { DbConnectionProblem } from "@/components/db-connection-problem";
import { IntentLegend } from "@/components/intent-legend";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ completeness?: string; q?: string; filter?: string }>;
};

export default async function LeadsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const completeness = sp.completeness;
  const q = sp.q?.trim();
  const filter = sp.filter;
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const where: Prisma.LeadWhereInput = {};
  if (filter === "due") {
    where.nextFollowUpAt = { lte: now };
    where.isBlacklisted = false;
  }
  if (filter === "today") {
    where.isBlacklisted = false;
    where.nextFollowUpAt = { gte: startOfToday, lt: endOfToday };
  }
  if (filter === "overdue") {
    where.isBlacklisted = false;
    where.nextFollowUpAt = { not: null, lt: startOfToday };
  }
  if (completeness === "INCOMPLETE" || completeness === "COMPLETE") {
    where.completeness = completeness;
  }
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
    ];
  }

  const leadsResult = await runPrisma(() =>
    prisma.lead.findMany({
      where,
      orderBy:
        filter === "due" || filter === "overdue" || filter === "today"
          ? { nextFollowUpAt: "asc" }
          : { createdAt: "desc" },
      take: 200,
      include: {
        callLogs: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    })
  );

  if (!leadsResult.ok) {
    return <DbConnectionProblem detail={leadsResult.message} />;
  }
  const leads = leadsResult.data;

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-apple-heading text-[var(--foreground)]">Leadler</h1>
        <IntentLegend />
      </header>

      <form
        className="flex flex-wrap items-center gap-2"
        action="/leads"
        method="get"
      >
        <div className="relative min-w-[min(100%,16rem)] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Ara…"
            className="w-full rounded-full border border-[var(--apple-border)] bg-[var(--apple-surface)] py-2.5 pl-10 pr-4 text-[15px] outline-none transition focus:ring-2 focus:ring-[var(--apple-ring)]"
          />
        </div>
        <select
          name="filter"
          defaultValue={filter ?? ""}
          className="rounded-full border border-[var(--apple-border)] bg-[var(--apple-surface)] px-4 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-[var(--apple-ring)]"
        >
          <option value="">Tümü</option>
          <option value="due">Takip (bugüne kadar)</option>
          <option value="today">Bugün yapılacaklar</option>
          <option value="overdue">Geciken</option>
        </select>
        <select
          name="completeness"
          defaultValue={completeness ?? ""}
          className="rounded-full border border-[var(--apple-border)] bg-[var(--apple-surface)] px-4 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-[var(--apple-ring)]"
        >
          <option value="">Form</option>
          <option value="INCOMPLETE">Sarı</option>
          <option value="COMPLETE">Yeşil</option>
        </select>
        <button type="submit" className="btn-apple-primary">
          Uygula
        </button>
      </form>

      <div className="apple-card apple-card--flush overflow-hidden">
        <table className="w-full min-w-[640px] text-left text-[15px]">
          <thead className="border-b border-[var(--apple-border)]">
            <tr>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                {" "}
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                İsim
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                Aşama
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3 w-3 opacity-50" />
                  Arama
                </span>
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                Intent
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                Son aksiyon
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                Sonraki adım
              </th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr
                key={l.id}
                className="group border-b border-[var(--apple-border)]/60 transition hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        l.completeness === "COMPLETE"
                          ? "bg-[var(--apple-green)]"
                          : "bg-[var(--apple-orange)]"
                      }`}
                      title={l.completeness === "COMPLETE" ? "Tam" : "Eksik"}
                    />
                    {l.isBlacklisted && (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
                        BL
                      </span>
                    )}
                    {l.idealClient && (
                      <Star
                        className="h-3.5 w-3.5 shrink-0 text-[var(--apple-orange)]"
                        fill="currentColor"
                        aria-label="İdeal"
                      />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <Link
                    href={`/leads/${l.id}`}
                    className="inline-flex items-center gap-2 font-medium text-[var(--foreground)] hover:underline"
                  >
                    {l.name ?? l.email ?? l.phone ?? "İsimsiz"}
                  </Link>
                </td>
                <td className="px-4 py-3.5 text-[var(--muted)]">{l.stage}</td>
                <td className="px-4 py-3.5 tabular-nums text-[var(--muted)]">
                  {l.callCount}
                  {l.unreachableCount > 0 && (
                    <span className="text-[var(--muted)]"> · {l.unreachableCount} ulaş.</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex min-w-[7rem] items-center gap-2">
                    <div
                      className="h-2 w-16 overflow-hidden rounded-full bg-black/[0.08] dark:bg-white/[0.1]"
                      title={l.intentScore != null ? `Intent ${l.intentScore}` : undefined}
                    >
                      <div
                        className={`h-full rounded-full ${
                          l.intentScore == null
                            ? "bg-[var(--muted)]"
                            : l.intentScore >= 70
                              ? "bg-[var(--apple-green)]"
                              : l.intentScore >= 40
                                ? "bg-[var(--apple-orange)]"
                                : "bg-[var(--apple-red)]"
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(0, l.intentScore ?? 0))}%`,
                        }}
                      />
                    </div>
                    <span className="tabular-nums text-[var(--foreground)]">
                      {l.intentScore ?? "—"}
                    </span>
                  </div>
                </td>
                <td className="max-w-[10rem] px-4 py-3.5 text-[12px] text-[var(--muted)]">
                  {l.callLogs[0] ? (
                    <span className="line-clamp-2" title={l.callLogs[0].note ?? ""}>
                      {l.callLogs[0].outcome}
                      {l.callLogs[0].createdAt && (
                        <span className="mt-0.5 block text-[11px] text-[var(--muted)]">
                          {new Date(l.callLogs[0].createdAt).toLocaleString("tr-TR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </span>
                  ) : l.lastContactAt ? (
                    new Date(l.lastContactAt).toLocaleString("tr-TR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <Link
                    href={`/leads/${l.id}`}
                    className="inline-flex items-center gap-0.5 hover:text-[var(--apple-blue)]"
                  >
                    {l.nextFollowUpAt ? (
                      <span
                        className={
                          new Date(l.nextFollowUpAt) < startOfToday
                            ? "font-semibold text-[var(--apple-red)]"
                            : "text-[var(--foreground)]"
                        }
                      >
                        {new Date(l.nextFollowUpAt).toLocaleString("tr-TR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    ) : (
                      <span className="text-[var(--muted)]">—</span>
                    )}
                    <ChevronRight className="h-4 w-4 opacity-0 transition group-hover:opacity-60" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-[var(--muted)]">Liste boş</p>
            <p className="mt-2 text-[13px] text-[var(--muted)]">
              <Link href="/leads/new" className="text-[var(--apple-blue)] hover:underline">
                Lead ekle
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
