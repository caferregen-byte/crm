import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { humanizeUnderscores } from "@/lib/strings";
import { intentBand } from "@/lib/sales-heuristics";
import { IntentLegend } from "@/components/intent-legend";

type Lead = {
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string;
  stage: string | null;
  completeness: string;
  idealClient: boolean;
  isBlacklisted: boolean;
  blacklistReason: string | null;
  intentScore: number | null;
  callCount: number;
  unreachableCount: number;
  qualificationScore: number | null;
};

function Badge({
  children,
  muted,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium ${
        muted
          ? "border border-[var(--apple-border)] text-[var(--muted)]"
          : "bg-[var(--foreground)] text-[var(--apple-surface)] dark:bg-white dark:text-black"
      }`}
    >
      {children}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center sm:text-left">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-[var(--foreground)] md:text-4xl">
        {value}
      </p>
    </div>
  );
}

export function LeadDetailHero({
  lead,
  leadId,
}: {
  lead: Lead;
  leadId: string;
}) {
  const title = lead.name ?? lead.email ?? lead.phone ?? "İsimsiz lead";
  const ib = intentBand(lead.intentScore);

  return (
    <div className="relative overflow-hidden rounded-[20px] border border-[var(--apple-border)] bg-[var(--apple-surface)] p-6 shadow-[var(--apple-shadow)] md:p-8 dark:bg-[var(--apple-surface)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.45)]">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] md:text-4xl">
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-[15px] text-[var(--muted)]">
            {lead.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-4 w-4 opacity-60" />
                {lead.email}
              </span>
            )}
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="flex items-center gap-1.5 font-medium text-[var(--apple-blue)] hover:underline"
              >
                <Phone className="h-4 w-4 opacity-80" />
                {lead.phone}
              </a>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge muted={lead.completeness !== "COMPLETE"}>
              {lead.completeness === "COMPLETE" ? "Yeşil" : "Sarı"}
            </Badge>
            {humanizeUnderscores(lead.source).trim() !== "" && (
              <Badge>{humanizeUnderscores(lead.source)}</Badge>
            )}
            <Badge>{lead.stage ?? "—"}</Badge>
            {lead.idealClient && <Badge muted>İdeal</Badge>}
            {lead.isBlacklisted && (
              <Badge muted>
                Blacklist
                {lead.blacklistReason ? ` · ${lead.blacklistReason}` : ""}
              </Badge>
            )}
            {lead.intentScore != null && (
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ${
                  ib.tone === "hot"
                    ? "bg-[var(--apple-green)]/20 text-[var(--apple-green)]"
                    : ib.tone === "warm"
                      ? "bg-[var(--apple-orange)]/20 text-[var(--apple-orange)]"
                      : ib.tone === "cold"
                        ? "bg-[var(--apple-red)]/15 text-[var(--apple-red)]"
                        : "bg-black/[0.06] text-[var(--muted)] dark:bg-white/[0.08]"
                }`}
              >
                Intent {lead.intentScore} · {ib.label}
              </span>
            )}
          </div>
          <IntentLegend className="mt-1" />
        </div>

        <div className="grid w-full grid-cols-2 gap-6 sm:grid-cols-4 lg:w-auto lg:min-w-[min(100%,28rem)] lg:gap-8">
          <Stat label="Arama" value={lead.callCount} />
          <Stat label="Ulaşamadı" value={lead.unreachableCount} />
          <Stat label="Intent" value={lead.intentScore ?? "—"} />
          <Stat label="Kalifikasyon" value={lead.qualificationScore ?? "—"} />
        </div>
      </div>

      {!lead.isBlacklisted && (
        <div className="mt-8 flex flex-wrap gap-3 border-t border-[var(--apple-border)] pt-6">
          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              className="btn-apple-primary inline-flex min-h-[48px] items-center justify-center gap-2 px-8 text-[16px]"
            >
              <Phone className="h-5 w-5" />
              HEMEN ARA
            </a>
          )}
          <Link
            href={`/leads/${leadId}/quali`}
            className="btn-apple-secondary inline-flex min-h-[48px] items-center justify-center px-6 text-[15px]"
          >
            Kalifikasyon akışı
          </Link>
        </div>
      )}
    </div>
  );
}
