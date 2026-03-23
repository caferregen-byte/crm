"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Phone, ExternalLink } from "lucide-react";

type Lead = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  completeness: string;
  stage: string;
  callCount: number;
  unreachableCount: number;
  intentScore: number | null;
  isBlacklisted: boolean;
  nextFollowUpAt: Date | string | null;
  lastContactAt: Date | string | null;
  zoomScheduledAt: Date | string | null;
};

type Column = { stage: string; title: string; color: string };

const columnShell =
  "rounded-2xl border border-[var(--apple-border)] bg-[var(--apple-bg)] shadow-[var(--apple-shadow)]";

function fmtShort(d: Date | string | null | undefined) {
  if (d == null) return "—";
  const x = typeof d === "string" ? new Date(d) : d;
  return x.toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PipelineKanban({
  columns,
  leadsByStage,
}: {
  columns: Column[];
  leadsByStage: Record<string, Lead[]>;
}) {
  const router = useRouter();

  async function moveToStage(leadId: string, newStage: string) {
    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage: newStage,
        stageNote: "Pipeline sürükleme",
      }),
    });
    if (res.ok) router.refresh();
  }

  function handleDrop(e: React.DragEvent, targetStage: string) {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    if (!leadId) return;
    const currentStage = e.dataTransfer.getData("currentStage");
    if (currentStage === targetStage) return;
    void moveToStage(leadId, targetStage);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => {
        const leads = leadsByStage[col.stage] ?? [];
        const hasHot = leads.some(
          (l) => l.intentScore != null && l.intentScore >= 70
        );
        const hasCold = leads.some(
          (l) => l.intentScore != null && l.intentScore < 40
        );

        return (
          <div
            key={col.stage}
            className={`min-w-[280px] max-w-[280px] flex-shrink-0 p-4 transition hover:shadow-lg ${columnShell} ${
              hasHot
                ? "shadow-[0_0_24px_-4px_rgba(255,159,10,0.35)]"
                : hasCold
                  ? "opacity-[0.92]"
                  : ""
            }`}
            onDrop={(e) => handleDrop(e, col.stage === "INCOMPLETE" ? "NEW_LEAD" : col.stage)}
            onDragOver={handleDragOver}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[13px] font-medium text-[var(--foreground)]">{col.title}</h3>
              <span className="tabular-nums text-xs text-[var(--muted)]">{leads.length}</span>
            </div>
            <ul className="space-y-2">
              {leads.map((lead) => (
                <li
                  key={lead.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("leadId", lead.id);
                    e.dataTransfer.setData("currentStage", col.stage);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className={`group relative cursor-grab rounded-xl border bg-[var(--apple-surface)] p-3 shadow-[var(--apple-shadow)] transition hover:scale-[1.02] hover:shadow-md active:cursor-grabbing active:scale-[0.99] dark:shadow-[0_4px_20px_rgba(0,0,0,0.35)] ${
                    lead.intentScore != null && lead.intentScore >= 70
                      ? "border-[var(--apple-orange)]/50 shadow-[0_0_20px_-6px_rgba(255,159,10,0.45)]"
                      : lead.intentScore != null && lead.intentScore < 40
                        ? "border-[var(--apple-border)] opacity-90"
                        : "border-[var(--apple-border)]"
                  }`}
                >
                  <Link
                    href={`/leads/${lead.id}`}
                    className="block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="truncate text-[15px] font-medium text-[var(--foreground)]">
                      {lead.name ?? lead.email ?? lead.phone ?? "İsimsiz"}
                    </p>
                    <div className="mt-1.5 space-y-0.5 text-[10px] leading-tight text-[var(--muted)]">
                      <p>
                        Intent{" "}
                        <span
                          className={
                            lead.intentScore != null && lead.intentScore >= 70
                              ? "font-semibold text-[var(--apple-green)]"
                              : lead.intentScore != null && lead.intentScore >= 40
                                ? "font-semibold text-[var(--apple-orange)]"
                                : "font-semibold text-[var(--apple-red)]"
                          }
                        >
                          {lead.intentScore ?? "—"}
                        </span>
                        {" · "}
                        {lead.callCount} ar.
                        {lead.unreachableCount > 0 ? ` · ${lead.unreachableCount} ulaş.` : ""}
                      </p>
                      <p>Son: {fmtShort(lead.lastContactAt)}</p>
                      <p>
                        Sonraki:{" "}
                        <span
                          className={
                            lead.nextFollowUpAt &&
                            new Date(lead.nextFollowUpAt) < new Date()
                              ? "font-medium text-[var(--apple-red)]"
                              : ""
                          }
                        >
                          {fmtShort(lead.nextFollowUpAt)}
                        </span>
                      </p>
                    </div>
                  </Link>
                  <div className="mt-2 flex items-center justify-end gap-1 border-t border-[var(--apple-border)]/80 pt-2 opacity-0 transition group-hover:opacity-100">
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className="rounded-lg p-1.5 text-[var(--apple-blue)] hover:bg-[var(--apple-blue)]/10"
                        title="Ara"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                    )}
                    <Link
                      href={`/leads/${lead.id}`}
                      className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                      title="Detay"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
