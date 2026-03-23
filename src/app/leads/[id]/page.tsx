import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  PhoneCall,
  Calendar,
  StickyNote,
  ChevronDown,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { runPrisma } from "@/lib/safe-prisma";
import { DbConnectionProblem } from "@/components/db-connection-problem";
import { NoteForm } from "@/components/note-form";
import { QualificationPanel } from "@/components/qualification-panel";
import { QualificationNotesForm } from "@/components/qualification-notes-form";
import { SetterCloserNotesForm } from "@/components/setter-closer-notes-form";
import { UnreachableBanner } from "@/components/unreachable-banner";
import { FollowUpAdviceCard } from "@/components/follow-up-advice-card";
import { MarkLeadSeen } from "@/components/mark-lead-seen";
import { LiveQualiSummary } from "@/components/live-quali-summary";
import { LeadDetailHero } from "@/components/lead-detail-hero";
import { LeadFocusStrip } from "@/components/lead-focus-strip";
import { LeadActionsPanel } from "@/components/lead-actions-panel";
import { computeAutoNextAction } from "@/lib/next-action";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;
  const leadRes = await runPrisma(() =>
    prisma.lead.findUnique({
      where: { id },
      include: {
        notes: { orderBy: { createdAt: "desc" } },
        callLogs: { orderBy: { createdAt: "desc" } },
        tasks: { orderBy: { dueAt: "asc" } },
        statusHistory: { orderBy: { createdAt: "desc" }, take: 30 },
      },
    })
  );

  if (!leadRes.ok) {
    return <DbConnectionProblem detail={leadRes.message} />;
  }
  const lead = leadRes.data;

  if (!lead) notFound();

  const showFollowUpAdvice =
    (lead.stage === "FOLLOW_UP" || lead.stage === "LOST_NOT_NOW") &&
    !lead.isBlacklisted;

  let raw: Record<string, unknown> | null = null;
  if (lead.rawWufooPayload) {
    try {
      raw = JSON.parse(lead.rawWufooPayload) as Record<string, unknown>;
    } catch {
      raw = { _parseError: true, raw: lead.rawWufooPayload };
    }
  }

  const nextAction = computeAutoNextAction(lead);

  return (
    <div className="space-y-8">
      <MarkLeadSeen leadId={lead.id} />

      <Link
        href="/leads"
        className="inline-flex items-center gap-2 text-[13px] text-[var(--muted)] transition hover:text-[var(--apple-blue)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Leadler
      </Link>

      <LeadDetailHero lead={lead} leadId={lead.id} />

      <UnreachableBanner
        callCount={lead.callCount}
        unreachableCount={lead.unreachableCount}
        lastCallAt={lead.lastCallAt}
      />

      <LeadFocusStrip lead={lead} />

      {showFollowUpAdvice && (
        <FollowUpAdviceCard leadId={lead.id} show={showFollowUpAdvice} />
      )}

      <div className="border-t border-[var(--apple-border)] pt-8">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          Kayıt detayı
        </h2>
        <p className="mt-1 text-[13px] text-[var(--muted)]">
          Formlar, notlar, geçmiş — ihtiyaç olduğunda aşağıda.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {!lead.isBlacklisted && (
            <QualificationPanel
              leadId={lead.id}
              initialQualJson={lead.qualJson}
            />
          )}

          <LiveQualiSummary qualJson={lead.qualJson} />

          <Section icon={<FileText />} title="Kalifikasyon notları">
            <p className="mb-3 text-[12px] text-[var(--muted)]">
              Hedef, acı nokta, bütçe, engel — telefon ve Zoom sonrası buraya.
            </p>
            <QualificationNotesForm
              leadId={lead.id}
              initial={lead.qualificationNotes ?? ""}
            />
          </Section>

          <Section icon={<PhoneCall />} title="Arama geçmişi">
            <ul className="space-y-3">
              {lead.callLogs.map((c) => (
                <li
                  key={c.id}
                  className="flex justify-between gap-4 rounded-xl border border-[var(--apple-border)] bg-[var(--apple-bg)] px-3 py-2.5 text-[14px]"
                >
                  <span className="text-[var(--muted)]">
                    {new Date(c.createdAt).toLocaleString("tr-TR")} —{" "}
                    {c.outcome ?? "—"}
                  </span>
                  <span className="text-[var(--foreground)]">{c.note}</span>
                </li>
              ))}
              {lead.callLogs.length === 0 && (
                <li className="text-[13px] text-[var(--muted)]">Henüz kayıt yok.</li>
              )}
            </ul>
          </Section>

          <details className="apple-card overflow-hidden p-0">
            <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 font-medium text-[var(--foreground)]">
              <ChevronDown className="h-4 w-4 text-[var(--muted)]" />
              Wufoo ham veri
            </summary>
            <pre className="max-h-64 overflow-auto border-t border-[var(--apple-border)] bg-[var(--apple-bg)] p-4 text-[11px] text-[var(--foreground)]">
              {raw ? JSON.stringify(raw, null, 2) : "—"}
            </pre>
          </details>

          <Section icon={<Calendar />} title="Zaman çizelgesi">
            <ul className="space-y-2 text-[14px]">
              {lead.statusHistory.map((s) => (
                <li
                  key={s.id}
                  className="flex gap-3 border-b border-[var(--apple-border)] pb-2 last:border-0"
                >
                  <span className="shrink-0 text-[var(--muted)]">
                    {new Date(s.createdAt).toLocaleString("tr-TR")}
                  </span>
                  <span className="text-[var(--foreground)]">
                    {s.fromStage ?? "—"} → {s.toStage}
                    {s.note && (
                      <span className="ml-2 text-[var(--muted)]">({s.note})</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <div className="space-y-6 lg:col-span-1">
          {!lead.isBlacklisted ? (
            <div id="lead-aksiyon">
              <LeadActionsPanel
                leadId={lead.id}
                phone={lead.phone}
                callCount={lead.callCount}
                unreachableCount={lead.unreachableCount}
                nextAction={nextAction}
              />
            </div>
          ) : (
            <div className="apple-card border-[var(--apple-red)]/40 bg-[var(--apple-red)]/10 text-[var(--apple-red)]">
              Bu kayıt blacklist — yeni iletişim aksiyonları kilitli.
            </div>
          )}

          <Section icon={<StickyNote />} title="Setter / Closer notları">
            {!lead.isBlacklisted ? (
              <SetterCloserNotesForm
                leadId={lead.id}
                setterNote={lead.setterNote}
                closerNote={lead.closerNote}
              />
            ) : (
              <div className="space-y-2 text-[14px] text-[var(--muted)]">
                <p>
                  <span className="font-medium text-[var(--foreground)]">Setter:</span>{" "}
                  {lead.setterNote ?? "—"}
                </p>
                <p>
                  <span className="font-medium text-[var(--foreground)]">Closer:</span>{" "}
                  {lead.closerNote ?? "—"}
                </p>
              </div>
            )}
          </Section>

          <Section icon={<Calendar />} title="Görevler">
            <ul className="space-y-2 text-[14px]">
              {lead.tasks.map((t) => (
                <li
                  key={t.id}
                  className={
                    t.completed ? "text-[var(--muted)] line-through" : "text-[var(--foreground)]"
                  }
                >
                  {new Date(t.dueAt).toLocaleDateString("tr-TR")} — {t.title ?? "—"}
                </li>
              ))}
              {lead.tasks.length === 0 && (
                <li className="text-[13px] text-[var(--muted)]">Açık görev yok.</li>
              )}
            </ul>
          </Section>

          <Section id="lead-notlar" icon={<StickyNote />} title="Notlar">
            <NoteForm leadId={lead.id} />
            <ul className="mt-4 space-y-3 border-t border-[var(--apple-border)] pt-4">
              {lead.notes.map((n) => (
                <li key={n.id}>
                  <p className="text-[11px] text-[var(--muted)]">
                    {new Date(n.createdAt).toLocaleString("tr-TR")} · {n.category}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-[14px] text-[var(--foreground)]">
                    {n.body}
                  </p>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  icon,
  title,
  children,
}: {
  id?: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="apple-card scroll-mt-24">
      <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
        <span className="text-[var(--muted)]">{icon}</span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
