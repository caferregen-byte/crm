import { Suspense } from "react";
import Link from "next/link";
import { runPrisma } from "@/lib/safe-prisma";
import { fetchDashboardCounts } from "@/lib/dashboard-counts";
import { fetchPrioritiesPayload } from "@/lib/priorities-data";
import { DbConnectionProblem } from "@/components/db-connection-problem";
import { NotificationTrigger } from "@/components/notification-trigger";
import { NotificationPrompt } from "@/components/notification-prompt";
import { PriorityList } from "@/components/priority-list";
import { NowFocusHero } from "@/components/now-focus-hero";
import { CommandCenterStrip } from "@/components/command-center-strip";

export const dynamic = "force-dynamic";

function HomeLoading() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--apple-border)] border-t-[var(--apple-blue)]"
        aria-hidden
      />
      <p className="text-[13px] text-[var(--muted)]">Yükleniyor…</p>
    </div>
  );
}

async function HomeContent() {
  const bundle = await runPrisma(() =>
    Promise.all([fetchDashboardCounts(), fetchPrioritiesPayload()])
  );

  if (!bundle.ok) {
    return <DbConnectionProblem detail={bundle.message} />;
  }

  const [countsTuple, prioritiesInitial] = bundle.data;
  const [
    total,
    incomplete,
    complete,
    dueCount,
    blacklisted,
    hot,
    newCount,
    dueToday,
    overdueFollowUps,
  ] = countsTuple;

  return (
    <div className="space-y-14">
      <NotificationTrigger dueCount={dueCount} />

      <header className="max-w-2xl space-y-2">
        <h1 className="text-apple-heading text-[var(--foreground)]">Komuta merkezi</h1>
        <p className="text-[15px] leading-relaxed text-[var(--muted)]">
          {newCount > 0
            ? `${newCount} yeni lead`
            : dueCount > 0
              ? `${dueCount} takip bekliyor`
              : "Öncelik listen aşağıda"}
        </p>
      </header>

      <section className="mx-auto w-full max-w-2xl space-y-4">
        <CommandCenterStrip dueToday={dueToday} overdue={overdueFollowUps} />
      </section>

      <section className="mx-auto w-full max-w-2xl">
        <NowFocusHero />
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[13px] text-[var(--muted)]">
          <Link href="/leads/new" className="text-[var(--apple-blue)] hover:underline">
            Yeni lead ekle
          </Link>
          <span className="text-[var(--apple-border)]">·</span>
          <Link href="/leads?filter=due" className="hover:text-[var(--foreground)]">
            {dueCount > 0 ? `Takip (${dueCount})` : "Takip"}
          </Link>
          <span className="text-[var(--apple-border)]">·</span>
          <Link href="/pipeline" className="hover:text-[var(--foreground)]">
            Pipeline
          </Link>
        </div>
      </section>

      <PriorityList initialData={prioritiesInitial} />

      {dueCount > 0 && (
        <div className="max-w-md">
          <NotificationPrompt dueCount={dueCount} />
        </div>
      )}

      <section>
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Sayılar
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Toplam" value={total} href="/leads" />
          <StatCard title="Takip" value={dueCount} href="/leads?filter=due" />
          <StatCard title="Sarı" value={incomplete} href="/leads?completeness=INCOMPLETE" />
          <StatCard title="Yeşil" value={complete} href="/leads?completeness=COMPLETE" />
          <StatCard title="Intent 70+" value={hot} href="/leads" />
          <StatCard title="Blacklist" value={blacklisted} href="/leads" />
        </div>
      </section>

      <p className="text-center text-[13px] text-[var(--muted)]">
        <Link
          href="/leads"
          className="text-[var(--apple-blue)] transition hover:underline"
        >
          Tüm leadler →
        </Link>
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent />
    </Suspense>
  );
}

function StatCard({
  title,
  value,
  href,
}: {
  title: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="apple-card apple-card--interactive block"
    >
      <p className="text-[13px] font-medium text-[var(--muted)]">{title}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-[var(--foreground)]">
        {value}
      </p>
    </Link>
  );
}
