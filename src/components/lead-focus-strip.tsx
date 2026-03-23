import Link from "next/link";
import { Brain, Target, Zap, Phone, StickyNote, FileCheck, Send } from "lucide-react";
import {
  parseQualJson,
  canScheduleZoom,
  qualificationGateSteps,
} from "@/lib/qualification";
import { computeAutoNextAction, type AutoNextAction } from "@/lib/next-action";
import {
  estimateCloseProbability,
  heuristicRisks,
  intentBand,
} from "@/lib/sales-heuristics";

type Lead = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  stage: string;
  completeness: string;
  isBlacklisted: boolean;
  seenAt: Date | null;
  nextFollowUpAt: Date | null;
  zoomScheduledAt: Date | null;
  intentScore: number | null;
  lastContactAt: Date | null;
  qualJson: string | null;
  aiSummary: string | null;
  aiBudgetAnalysis: string | null;
  aiRecommendedAngle: string | null;
  aiNextStepHint: string | null;
  qualificationScore: number | null;
};

function toneRing(tone: AutoNextAction["tone"]) {
  switch (tone) {
    case "now":
      return "ring-2 ring-[var(--apple-red)]/35";
    case "hot":
      return "ring-2 ring-[var(--apple-orange)]/40";
    case "schedule":
      return "ring-2 ring-[var(--apple-blue)]/35";
    default:
      return "ring-1 ring-[var(--apple-border)]";
  }
}

function pickSayThis(lead: Lead): string | null {
  if (lead.aiRecommendedAngle?.trim()) {
    const t = lead.aiRecommendedAngle.trim();
    return t.length > 160 ? `${t.slice(0, 157)}…` : t;
  }
  if (lead.aiNextStepHint?.trim()) return lead.aiNextStepHint.trim();
  return null;
}

export function LeadFocusStrip({ lead }: { lead: Lead }) {
  const action = computeAutoNextAction(lead);
  const q = parseQualJson(lead.qualJson);
  const progress = qualificationGateSteps(q);
  const zoom = canScheduleZoom(q);
  const closePct = estimateCloseProbability({
    intentScore: lead.intentScore,
    qualificationPct: progress.pct,
    stage: lead.stage,
    isBlacklisted: lead.isBlacklisted,
  });
  const band = intentBand(lead.intentScore);
  const risks = heuristicRisks(lead.qualJson);
  const sayThis = pickSayThis(lead);

  const base = `/leads/${lead.id}`;
  const tel = lead.phone?.trim();

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="apple-card flex flex-col ring-1 ring-[var(--apple-border)]">
        <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          <Brain className="h-4 w-4 text-[var(--apple-blue)]" />
          Satış koçu
        </h3>

        <div className="mt-4 rounded-xl border border-[var(--apple-border)] bg-[var(--apple-bg)]/80 p-4 dark:bg-black/35">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
            Kapatma ihtimali (heuristik)
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-[var(--foreground)]">
            %{closePct}
          </p>
          <p className="mt-1 text-[12px] text-[var(--muted)]">
            Intent: {lead.intentScore ?? "—"} ·{" "}
            <span
              className={
                band.tone === "hot"
                  ? "text-[var(--apple-green)]"
                  : band.tone === "warm"
                    ? "text-[var(--apple-orange)]"
                    : band.tone === "cold"
                      ? "text-[var(--apple-red)]"
                      : ""
              }
            >
              {band.label}
            </span>
          </p>
        </div>

        {risks.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase text-[var(--apple-red)]">Risk</p>
            <ul className="mt-1.5 space-y-1 text-[13px] text-[var(--foreground)]">
              {risks.map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="text-[var(--muted)]">•</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 flex flex-1 flex-col gap-4 text-[14px] leading-relaxed text-[var(--foreground)]">
          {lead.aiSummary ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                Özet
              </p>
              <p className="mt-1 whitespace-pre-wrap">{lead.aiSummary}</p>
            </div>
          ) : (
            <p className="text-[13px] text-[var(--muted)]">
              AI özet için tam (yeşil) lead veya <code className="text-[12px]">OPENAI_API_KEY</code>.
            </p>
          )}
          {sayThis && (
            <div className="rounded-xl border border-[var(--apple-blue)]/25 bg-[var(--apple-blue)]/5 p-3">
              <p className="text-[11px] font-semibold uppercase text-[var(--apple-blue)]">
                Şunu söyle
              </p>
              <p className="mt-1 text-[14px] leading-snug">{sayThis}</p>
            </div>
          )}
          {lead.aiBudgetAnalysis && (
            <div>
              <p className="text-[11px] font-semibold uppercase text-[var(--muted)]">Bütçe</p>
              <p className="mt-1">{lead.aiBudgetAnalysis}</p>
            </div>
          )}
        </div>
      </section>

      <section className="apple-card flex flex-col ring-1 ring-[var(--apple-border)]">
        <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          <Target className="h-4 w-4 text-[var(--apple-green)]" />
          Kalifikasyon
        </h3>
        <p className="mt-3 text-2xl font-semibold tabular-nums text-[var(--foreground)]">
          %{progress.pct}{" "}
          <span className="text-[13px] font-normal text-[var(--muted)]">tamamlandı</span>
        </p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-[var(--apple-blue)] transition-all"
            style={{ width: `${progress.pct}%` }}
          />
        </div>
        <p className="mt-4 text-[13px] text-[var(--muted)]">
          {zoom.ok ? (
            <span className="font-medium text-[var(--apple-green)]">Zoom planlanabilir</span>
          ) : (
            <span>{zoom.reasons[0] ?? "Eksik kapılar var."}</span>
          )}
        </p>
        {lead.qualificationScore != null && (
          <p className="mt-1 text-[12px] text-[var(--muted)]">
            Skor:{" "}
            <span className="font-semibold text-[var(--foreground)]">
              {lead.qualificationScore}
            </span>
          </p>
        )}
      </section>

      <section
        className={`apple-card flex flex-col justify-between ${toneRing(action.tone)}`}
      >
        <div>
          <h3 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            <Zap className="h-4 w-4 text-[var(--apple-orange)]" />
            Sonraki en iyi aksiyon
          </h3>
          <p className="mt-4 text-[17px] font-semibold leading-snug text-[var(--foreground)]">
            {action.headline}
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--muted)]">{action.subline}</p>
        </div>
        <div className="mt-5 space-y-3">
          {action.href?.startsWith("tel:") ? (
            <a
              href={action.href}
              className="btn-apple-primary flex w-full items-center justify-center gap-2 py-3.5 text-[16px]"
            >
              {action.cta}
            </a>
          ) : action.href ? (
            <Link
              href={action.href}
              className="btn-apple-primary flex w-full justify-center py-3.5 text-[16px]"
            >
              {action.cta}
            </Link>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            {tel && (
              <a
                href={`tel:${tel}`}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--apple-border)] bg-[var(--apple-bg)] py-2.5 text-[12px] font-medium text-[var(--foreground)] transition hover:scale-[1.02] active:scale-[0.98]"
              >
                <Phone className="h-3.5 w-3.5" />
                Ara
              </a>
            )}
            <Link
              href={`${base}#lead-notlar`}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--apple-border)] bg-[var(--apple-bg)] py-2.5 text-[12px] font-medium text-[var(--foreground)] transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <StickyNote className="h-3.5 w-3.5" />
              Not
            </Link>
            <Link
              href={`${base}/quali`}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--apple-border)] bg-[var(--apple-bg)] py-2.5 text-[12px] font-medium text-[var(--foreground)] transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <FileCheck className="h-3.5 w-3.5" />
              Kalifiye
            </Link>
            <Link
              href={`${base}#lead-aksiyon`}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--apple-border)] bg-[var(--apple-bg)] py-2.5 text-[12px] font-medium text-[var(--foreground)] transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Send className="h-3.5 w-3.5" />
              Teklif
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
