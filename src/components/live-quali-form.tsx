"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  FileText,
  PhoneOff,
  PhoneCall,
  Save,
} from "lucide-react";
import type { QualificationJson } from "@/lib/qualification";
import { parseQualJson, canScheduleZoom } from "@/lib/qualification";
import { applyLiveSyncToQualification } from "@/lib/live-quali-sync";
import { SalesCockpitFlow } from "@/components/sales-cockpit-flow";

type Lead = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string;
  completeness: string;
  callCount: number;
  unreachableCount: number;
  lastCallAt: string | null;
  aiSummary: string | null;
};

export function LiveQualiForm({
  lead,
  initialQualJson,
}: {
  lead: Lead;
  initialQualJson: string | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"script" | "quick">("script");
  const parsed = useMemo(
    () => parseQualJson(initialQualJson) ?? ({} as QualificationJson),
    [initialQualJson]
  );
  const [q, setQ] = useState<QualificationJson>(() =>
    applyLiveSyncToQualification({ ...parsed })
  );

  const setQWithSync = useCallback(
    (fn: React.SetStateAction<QualificationJson>) => {
      setQ((prev) => {
        const next = typeof fn === "function" ? fn(prev) : fn;
        return applyLiveSyncToQualification(next);
      });
    },
    []
  );

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const synced = useMemo(() => applyLiveSyncToQualification(q), [q]);
  const zoomCheck = useMemo(() => canScheduleZoom(synced), [synced]);

  async function save(qualOverride?: QualificationJson): Promise<boolean> {
    setSaveError(null);
    setSaving(true);
    try {
      let body: string;
      try {
        const merged = applyLiveSyncToQualification(qualOverride ?? q);
        const patch: Record<string, unknown> = { qualJson: JSON.stringify(merged) };
        const closerNot = merged.setterDegerlendirme?.closerNot?.trim();
        if (closerNot) patch.closerNote = closerNot;

        const cb = merged.callStart?.callbackAt;
        if (merged.callStart?.available === false && cb) {
          const d = new Date(cb);
          if (!Number.isNaN(d.getTime())) {
            patch.nextFollowUpAt = d.toISOString();
          }
        }

        body = JSON.stringify(patch);
      } catch {
        setSaveError("Form verisi kaydedilemedi (geçersiz içerik).");
        return false;
      }
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (!res.ok) {
        let msg = `Kayıt başarısız (${res.status})`;
        try {
          const err = (await res.json()) as { error?: string };
          if (err.error) msg = err.error;
        } catch {
          /* ignore */
        }
        setSaveError(msg);
        return false;
      }
      router.push(`/leads/${lead.id}`);
      return true;
    } catch {
      setSaveError("Ağ hatası — bağlantınızı kontrol edin.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function quickAction(
    action: string,
    extra?: Record<string, unknown>
  ): Promise<boolean> {
    const res = await fetch(`/api/leads/${lead.id}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note: q.setterDegerlendirme?.closerNot, ...extra }),
    });
    if (!res.ok) return false;

    const withOutcome: QualificationJson | undefined =
      action === "contacted"
        ? { ...q, callStart: { ...q.callStart, quickOutcome: "contacted" } }
        : action === "no_answer"
          ? { ...q, callStart: { ...q.callStart, quickOutcome: "no_answer" } }
          : undefined;

    if (withOutcome) {
      setQWithSync(() => withOutcome);
    }

    const saved = await save(withOutcome);
    if (!saved) return false;
    return true;
  }

  const input =
    "rounded-xl border border-zinc-200/80 bg-white px-3 py-2 text-sm outline-none ring-zinc-900/5 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950";

  const cockpitScrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-[calc(100vh-12rem)] overflow-hidden rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="sticky top-0 z-30 border-b border-zinc-100 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={`/leads/${lead.id}`}
              className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Geri
            </Link>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                {lead.name ?? lead.email ?? lead.phone ?? "İsimsiz"}
              </p>
              <p className="text-xs text-zinc-400">
                {lead.source} · {lead.completeness === "COMPLETE" ? "Yeşil" : "Sarı"} · {lead.callCount} arama
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode(mode === "script" ? "quick" : "script")}
              className={`rounded-full px-4 py-2 text-sm font-medium ${mode === "script" ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100" : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}
            >
              {mode === "script" ? "Cockpit" : "Not"}
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Save className="h-4 w-4" />
              {saving ? "…" : "Kaydet"}
            </button>
          </div>
        </div>
        {saveError && (
          <p className="border-t border-zinc-100 bg-zinc-50 px-5 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            {saveError}
          </p>
        )}
      </div>

      {mode === "quick" ? (
        <QuickNoteMode q={q} setQ={setQWithSync} onAction={quickAction} inputClass={input} />
      ) : (
        <div
          ref={cockpitScrollRef}
          className="max-h-[calc(100vh-8rem)] overflow-y-auto overscroll-contain"
        >
          <SalesCockpitFlow
            scrollRootRef={cockpitScrollRef}
            q={q}
            setQ={setQWithSync}
            inputClass={input}
            zoomCheck={zoomCheck}
            onQuickAction={quickAction}
          />
        </div>
      )}
    </div>
  );
}

function QuickNoteMode({
  q,
  setQ,
  onAction,
  inputClass,
}: {
  q: QualificationJson;
  setQ: React.Dispatch<React.SetStateAction<QualificationJson>>;
  onAction: (a: string, e?: Record<string, unknown>) => Promise<boolean>;
  inputClass: string;
}) {
  const [followUpDays, setFollowUpDays] = useState(7);
  return (
    <div className="space-y-5 p-6">
      <textarea
        className={`w-full ${inputClass}`}
        rows={6}
        placeholder="Not…"
        value={q.setterDegerlendirme?.closerNot ?? ""}
        onChange={(e) =>
          setQ((p) => ({
            ...p,
            setterDegerlendirme: {
              ...p.setterDegerlendirme,
              closerNot: e.target.value,
            },
          }))
        }
      />
      <div>
        <label className="text-xs font-medium text-zinc-500">Takip (gün)</label>
        <input
          type="number"
          min={1}
          max={90}
          className={`mt-1 ${inputClass}`}
          value={followUpDays}
          onChange={(e) => setFollowUpDays(parseInt(e.target.value, 10) || 7)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void onAction("contacted")}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <PhoneCall className="h-4 w-4 opacity-60" />
          Görüştüm
        </button>
        <button
          type="button"
          onClick={() => void onAction("no_answer", { followUpDays })}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <Phone className="h-4 w-4 opacity-60" />
          Ulaşılamadı
        </button>
        <button
          type="button"
          onClick={() => void onAction("follow_up", { followUpDays })}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <FileText className="h-4 w-4 opacity-60" />
          Takip {followUpDays}g
        </button>
      </div>
    </div>
  );
}
