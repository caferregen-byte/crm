"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
  PhoneOff,
  Phone,
  CheckCircle2,
  XCircle,
  Star,
  Video,
  Calendar,
  ThumbsUp,
  Clock,
  Ban,
  ClipboardList,
  Banknote,
  CalendarX,
  RotateCcw,
  Skull,
  RefreshCw,
} from "lucide-react";
import type { AutoNextAction } from "@/lib/next-action";

const baseBtn =
  "flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-[13px] font-medium transition hover:scale-[1.02] active:scale-[0.98]";

export function LeadActionsPanel({
  leadId,
  phone,
  callCount,
  unreachableCount,
  nextAction,
}: {
  leadId: string;
  phone: string | null;
  callCount: number;
  unreachableCount: number;
  nextAction: AutoNextAction;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function run(
    action: string,
    extra?: Record<string, unknown>
  ): Promise<boolean> {
    setBusy(action);
    try {
      const payload = {
        action,
        note: note || undefined,
        ...extra,
      };
      const res = await fetch(`/api/leads/${leadId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };

      if (!res.ok) {
        if (
          res.status === 422 &&
          action === "zoom_scheduled" &&
          j.code === "QUALIFICATION_INCOMPLETE"
        ) {
          setBusy(null);
          const go = window.confirm(
            `${j.error ?? "Kalifikasyon eksik"}\n\nKalifikasyonu atlayıp ZORLA Zoom planlansın mı?`
          );
          if (!go) return false;
          setBusy(action);
          const res2 = await fetch(`/api/leads/${leadId}/actions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, forceZoom: true }),
          });
          if (!res2.ok) {
            const j2 = (await res2.json().catch(() => ({}))) as {
              error?: string;
            };
            alert(j2.error ?? "İşlem başarısız");
            return false;
          }
          setNote("");
          router.refresh();
          return true;
        }
        alert(j.error ?? "İşlem başarısız");
        return false;
      }
      setNote("");
      router.refresh();
      return true;
    } finally {
      setBusy(null);
    }
  }

  const followBusy = busy === "follow_up";

  return (
    <div className="apple-card space-y-5 ring-1 ring-[var(--apple-border)] dark:bg-[var(--apple-surface)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Aksiyon merkezi
        </h3>
        <p className="mt-1 text-[13px] text-[var(--muted)]">
          Tek tık — satış akışı
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-xl bg-[var(--apple-bg)] p-4 dark:bg-black/40">
        <div>
          <p className="text-[11px] font-medium uppercase text-[var(--muted)]">Arama</p>
          <p className="mt-1 text-4xl font-semibold tabular-nums text-[var(--foreground)]">
            {callCount}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase text-[var(--muted)]">Ulaşamadı</p>
          <p className="mt-1 text-4xl font-semibold tabular-nums text-[var(--apple-orange)]">
            {unreachableCount}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--apple-blue)]/35 bg-[var(--apple-blue)]/8 p-4 dark:bg-[var(--apple-blue)]/15">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--apple-blue)]">
          Sonraki adım
        </p>
        <p className="mt-1 text-[15px] font-semibold text-[var(--foreground)]">
          {nextAction.headline}
        </p>
        <p className="mt-1 text-[13px] text-[var(--muted)]">{nextAction.subline}</p>
        {nextAction.href && (
          <div className="mt-3">
            {nextAction.href.startsWith("tel:") && phone ? (
              <a href={nextAction.href} className="btn-apple-primary flex w-full justify-center py-3 text-[15px]">
                {nextAction.cta}
              </a>
            ) : (
              <Link href={nextAction.href} className="btn-apple-primary flex w-full justify-center py-3 text-[15px]">
                {nextAction.cta}
              </Link>
            )}
          </div>
        )}
      </div>

      <textarea
        className="w-full rounded-xl border border-[var(--apple-border)] bg-[var(--apple-bg)] p-3 text-[14px] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--apple-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--apple-ring)] dark:bg-black/30"
        rows={2}
        placeholder="İsteğe bağlı not — aksiyonlara eklenir"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase text-[var(--muted)]">
          Hızlı (1 tık)
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <ActionBtn
            icon={<Phone />}
            label="Görüştüm"
            onClick={() => void run("contacted")}
            busy={busy === "contacted"}
            variant="emerald"
          />
          <ActionBtn
            icon={<PhoneOff />}
            label="Ulaşamadım"
            onClick={() => void run("no_answer")}
            busy={busy === "no_answer"}
            variant="amber"
          />
          <ActionBtn
            icon={<RefreshCw />}
            label="Tekrar ara"
            onClick={() => void run("follow_up", { followUpDays: 3 })}
            busy={followBusy}
            variant="slate"
          />
        </div>
      </div>

      <div className="border-t border-[var(--apple-border)] pt-4">
        <p className="mb-2 text-[11px] font-medium text-[var(--muted)]">Pipeline</p>
        <div className="grid grid-cols-2 gap-2">
          <ActionBtn
            icon={<ClipboardList />}
            label="Kalifikasyon görüşmesi"
            onClick={() => void run("qualification_call")}
            busy={busy === "qualification_call"}
            variant="slate"
          />
          <ActionBtn
            icon={<Banknote />}
            label="Teklif verildi"
            onClick={() => void run("offer_made")}
            busy={busy === "offer_made"}
            variant="blue"
          />
          <ActionBtn
            icon={<CalendarX />}
            label="Şimdi değil"
            onClick={() => void run("not_now")}
            busy={busy === "not_now"}
            variant="slate"
          />
          <ActionBtn
            icon={<Skull />}
            label="Kalıcı kayıp"
            onClick={() => void run("lost_forever")}
            busy={busy === "lost_forever"}
            variant="slate"
          />
          <ActionBtn
            icon={<RotateCcw />}
            label="Reactivation"
            onClick={() => void run("reactivation")}
            busy={busy === "reactivation"}
            variant="yellow"
          />
        </div>
      </div>

      <div className="border-t border-[var(--apple-border)] pt-4">
        <p className="mb-2 text-[11px] font-medium text-[var(--muted)]">Kalifikasyon etiketi</p>
        <div className="grid grid-cols-2 gap-2">
          <ActionBtn
            icon={<CheckCircle2 />}
            label="Kalifiye"
            onClick={() => void run("qualified")}
            busy={busy === "qualified"}
            variant="emerald"
          />
          <ActionBtn
            icon={<XCircle />}
            label="Kalifiye değil"
            onClick={() => void run("unqualified")}
            busy={busy === "unqualified"}
            variant="slate"
          />
          <ActionBtn
            icon={<Star />}
            label="İdeal müşteri"
            onClick={() => void run("ideal_client")}
            busy={busy === "ideal_client"}
            variant="yellow"
          />
        </div>
      </div>

      <div className="border-t border-[var(--apple-border)] pt-4">
        <p className="mb-2 text-[11px] font-medium text-[var(--muted)]">Zoom</p>
        <div className="grid grid-cols-2 gap-2">
          <ActionBtn
            icon={<Video />}
            label="Zoom planlandı"
            onClick={() => {
              const raw = window.prompt(
                "Zoom tarihi? (YYYY-MM-DD veya boş bırak)",
                new Date().toISOString().slice(0, 10)
              );
              if (raw === null) return;
              void run(
                "zoom_scheduled",
                raw.trim() ? { zoomScheduledAt: raw.trim() } : undefined
              );
            }}
            busy={busy === "zoom_scheduled"}
            variant="blue"
          />
          <ActionBtn
            icon={<Calendar />}
            label="Zoom yapıldı"
            onClick={() => void run("zoom_done")}
            busy={busy === "zoom_done"}
            variant="emerald"
          />
        </div>
      </div>

      <div className="border-t border-[var(--apple-border)] pt-4">
        <p className="mb-2 text-[11px] font-medium text-[var(--muted)]">Sonuç</p>
        <div className="grid grid-cols-2 gap-2">
          <ActionBtn
            icon={<Clock />}
            label="Follow-up 7 gün"
            onClick={() => void run("follow_up", { followUpDays: 7 })}
            busy={followBusy}
            variant="slate"
          />
          <ActionBtn
            icon={<Clock />}
            label="Follow-up 14 gün"
            onClick={() => void run("follow_up", { followUpDays: 14 })}
            busy={followBusy}
            variant="slate"
          />
          <ActionBtn
            icon={<Clock />}
            label="Follow-up 30 gün"
            onClick={() => void run("follow_up", { followUpDays: 30 })}
            busy={followBusy}
            variant="slate"
          />
          <ActionBtn
            icon={<ThumbsUp />}
            label="Satış — kazanıldı"
            onClick={() => void run("won")}
            busy={busy === "won"}
            variant="emerald"
          />
          <ActionBtn
            icon={<Clock />}
            label="Şu an olmadı"
            onClick={() => void run("lost_not_now")}
            busy={busy === "lost_not_now"}
            variant="slate"
          />
          <ActionBtn
            icon={<Ban />}
            label="Blacklist"
            onClick={() => {
              const reason = window.prompt("Blacklist sebebi?");
              if (reason === null) return;
              const by =
                window.prompt("Kim ekledi? (isteğe bağlı, örn. isim)") ?? "";
              void run("blacklist", {
                blacklistReason: reason || undefined,
                blacklistedBy: by.trim() || undefined,
              });
            }}
            busy={busy === "blacklist"}
            variant="red"
          />
        </div>
      </div>
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  onClick,
  busy,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  busy: boolean;
  variant: "emerald" | "amber" | "slate" | "blue" | "yellow" | "red";
}) {
  const variants: Record<typeof variant, string> = {
    emerald:
      "border-emerald-200/80 bg-emerald-50 text-emerald-900 hover:bg-emerald-100/90 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-100",
    amber:
      "border-amber-200/80 bg-amber-50 text-amber-900 hover:bg-amber-100/90 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-100",
    slate:
      "border-[var(--apple-border)] bg-[var(--apple-bg)] text-[var(--foreground)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
    blue:
      "border-blue-200/80 bg-blue-50 text-blue-900 hover:bg-blue-100/90 dark:border-blue-900/40 dark:bg-blue-950/25 dark:text-blue-100",
    yellow:
      "border-yellow-200/80 bg-yellow-50 text-yellow-900 hover:bg-yellow-100/90 dark:border-yellow-900/40 dark:bg-yellow-950/25 dark:text-yellow-100",
    red:
      "border-red-200/80 bg-red-50 text-red-900 hover:bg-red-100/90 dark:border-red-900/40 dark:bg-red-950/25 dark:text-red-100",
  };
  return (
    <button
      type="button"
      className={`${baseBtn} ${variants[variant]} ${busy ? "opacity-60" : ""}`}
      disabled={!!busy}
      onClick={onClick}
    >
      {busy ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      <span className="truncate text-left leading-tight">{label}</span>
    </button>
  );
}
