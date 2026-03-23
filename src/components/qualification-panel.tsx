"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import {
  type QualificationJson,
  canScheduleZoom,
  parseQualJson,
  qualificationGateSteps,
} from "@/lib/qualification";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { gateChecklist, statusIcon } from "@/lib/sales-heuristics";

const empty: QualificationJson = {
  need: { confirmed: false, painLevel: "" },
  budget: { confirmed: false, category: "" },
  decisionMaker: { confirmed: false, who: "" },
  urgency: { confirmed: false, level: "" },
  goldenStandard: { confirmed: false, fit: "" },
};

export function QualificationPanel({
  leadId,
  initialQualJson,
}: {
  leadId: string;
  initialQualJson: string | null;
}) {
  const router = useRouter();
  const parsed = useMemo(
    () => parseQualJson(initialQualJson) ?? empty,
    [initialQualJson]
  );
  const [q, setQ] = useState<QualificationJson>(() => ({
    need: { ...empty.need, ...parsed.need },
    budget: { ...empty.budget, ...parsed.budget },
    decisionMaker: { ...empty.decisionMaker, ...parsed.decisionMaker },
    urgency: { ...empty.urgency, ...parsed.urgency },
    goldenStandard: { ...empty.goldenStandard, ...parsed.goldenStandard },
  }));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const p = parseQualJson(initialQualJson) ?? empty;
    setQ({
      need: { ...empty.need, ...p.need },
      budget: { ...empty.budget, ...p.budget },
      decisionMaker: { ...empty.decisionMaker, ...p.decisionMaker },
      urgency: { ...empty.urgency, ...p.urgency },
      goldenStandard: { ...empty.goldenStandard, ...p.goldenStandard },
    });
  }, [initialQualJson]);

  const zoomCheck = useMemo(() => canScheduleZoom(q), [q]);
  const progress = useMemo(() => qualificationGateSteps(q), [q]);
  const checklist = useMemo(() => gateChecklist(q), [q]);

  async function save() {
    setSaving(true);
    try {
      const base = parseQualJson(initialQualJson) ?? {};
      const merged: QualificationJson = {
        ...base,
        need: q.need,
        budget: q.budget,
        decisionMaker: q.decisionMaker,
        urgency: q.urgency,
        goldenStandard: q.goldenStandard,
      };
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qualJson: JSON.stringify(merged) }),
      });
      if (res.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div id="lead-kalifikasyon" className="apple-card space-y-6 ring-1 ring-[var(--apple-border)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-6 w-6 shrink-0 text-[var(--apple-blue)]" />
          <div>
            <h3 className="text-[17px] font-semibold text-[var(--foreground)]">
              Kalifikasyon akışı
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--muted)]">
              5 kapı tamamlanmadan Zoom planlanamaz (zorla istisna — aksiyon panelinden).
            </p>
          </div>
        </div>
        <div className="w-full min-w-[200px] sm:max-w-[240px]">
          <div className="flex justify-between text-[12px] text-[var(--muted)]">
            <span className="font-medium text-[var(--foreground)]">
              %{progress.pct} tamamlandı
            </span>
            <span>
              {progress.done}/{progress.total}
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
            <div
              className="h-full rounded-full bg-[var(--apple-blue)] transition-all duration-300"
              style={{ width: `${progress.pct}%` }}
            />
          </div>
          <ul className="mt-3 space-y-1.5">
            {checklist.map((row) => (
              <li
                key={row.label}
                className="flex items-center justify-between gap-2 text-[12px] text-[var(--foreground)]"
              >
                <span className="text-[var(--muted)]">{row.label}</span>
                <span className="tabular-nums" title={row.status}>
                  {statusIcon(row.status)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] text-[var(--muted)]">
            ✓ tamam · ⏳ başladın · ○ boş
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* 1 İhtiyaç */}
        <fieldset className="rounded-2xl border border-[var(--apple-border)] bg-[var(--apple-bg)]/50 p-4 dark:bg-black/25">
          <legend className="px-1 text-sm font-semibold">1. İhtiyaç analizi</legend>
          <div className="mt-2 grid gap-2">
            <input
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              placeholder="Mevcut durum"
              value={q.need?.currentSituation ?? ""}
              onChange={(e) =>
                setQ((p) => ({
                  ...p,
                  need: { ...p.need, currentSituation: e.target.value },
                }))
              }
            />
            <input
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              placeholder="Hedeflenen durum"
              value={q.need?.targetSituation ?? ""}
              onChange={(e) =>
                setQ((p) => ({
                  ...p,
                  need: { ...p.need, targetSituation: e.target.value },
                }))
              }
            />
            <textarea
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              placeholder="Problem tanımı"
              rows={2}
              value={q.need?.problem ?? ""}
              onChange={(e) =>
                setQ((p) => ({ ...p, need: { ...p.need, problem: e.target.value } }))
              }
            />
            <select
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              value={q.need?.painLevel ?? ""}
              onChange={(e) =>
                setQ((p) => ({
                  ...p,
                  need: {
                    ...p.need,
                    painLevel: e.target.value as
                      | ""
                      | "low"
                      | "medium"
                      | "high",
                  },
                }))
              }
            >
              <option value="">Acı seviyesi seç</option>
              <option value="low">Düşük</option>
              <option value="medium">Orta</option>
              <option value="high">Yüksek</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(q.need?.confirmed)}
                onChange={(e) =>
                  setQ((p) => ({
                    ...p,
                    need: { ...p.need, confirmed: e.target.checked },
                  }))
                }
              />
              İhtiyaç analizi tamamlandı
            </label>
          </div>
        </fieldset>

        {/* 2 Bütçe */}
        <fieldset className="rounded-2xl border border-[var(--apple-border)] bg-[var(--apple-bg)]/50 p-4 dark:bg-black/25">
          <legend className="px-1 text-sm font-semibold">2. Finansal uygunluk</legend>
          <div className="mt-2 grid gap-2">
            <input
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              placeholder="Tahmini bütçe / rakam"
              value={q.budget?.estimate ?? ""}
              onChange={(e) =>
                setQ((p) => ({
                  ...p,
                  budget: { ...p.budget, estimate: e.target.value },
                }))
              }
            />
            <select
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              value={q.budget?.category ?? ""}
              onChange={(e) =>
                setQ((p) => ({
                  ...p,
                  budget: {
                    ...p.budget,
                    category: e.target.value as
                      | ""
                      | "below_3000"
                      | "3000_6000"
                      | "6000_plus"
                      | "unknown",
                  },
                }))
              }
            >
              <option value="">Bütçe bandı</option>
              <option value="below_3000">3000€ altı</option>
              <option value="3000_6000">3000–6000€</option>
              <option value="6000_plus">6000€+</option>
              <option value="unknown">Belirsiz</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={q.budget?.hasLiquidity === true}
                onChange={(e) =>
                  setQ((p) => ({
                    ...p,
                    budget: { ...p.budget, hasLiquidity: e.target.checked },
                  }))
                }
              />
              Nakit / likidite uygun
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(q.budget?.confirmed)}
                onChange={(e) =>
                  setQ((p) => ({
                    ...p,
                    budget: { ...p.budget, confirmed: e.target.checked },
                  }))
                }
              />
              Bütçe sorusu netleştirildi
            </label>
          </div>
        </fieldset>

        {/* 3 Karar verici */}
        <fieldset className="rounded-2xl border border-[var(--apple-border)] bg-[var(--apple-bg)]/50 p-4 dark:bg-black/25">
          <legend className="px-1 text-sm font-semibold">3. Karar verici</legend>
          <select
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            value={q.decisionMaker?.who ?? ""}
            onChange={(e) =>
              setQ((p) => ({
                ...p,
                decisionMaker: {
                  ...p.decisionMaker,
                  who: e.target.value as
                    | ""
                    | "self"
                    | "spouse"
                    | "partner"
                    | "manager"
                    | "other",
                },
              }))
            }
          >
            <option value="">Seçin</option>
            <option value="self">Kendisi</option>
            <option value="spouse">Eşi</option>
            <option value="partner">Ortağı</option>
            <option value="manager">Yönetici</option>
            <option value="other">Diğer</option>
          </select>
          {q.decisionMaker?.who && q.decisionMaker.who !== "self" && (
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(q.decisionMaker?.coAttendeeWillJoin)}
                onChange={(e) =>
                  setQ((p) => ({
                    ...p,
                    decisionMaker: {
                      ...p.decisionMaker,
                      coAttendeeWillJoin: e.target.checked,
                    },
                  }))
                }
              />
              Karar verici Zoom&apos;a katılacak
            </label>
          )}
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(q.decisionMaker?.confirmed)}
              onChange={(e) =>
                setQ((p) => ({
                  ...p,
                  decisionMaker: {
                    ...p.decisionMaker,
                    confirmed: e.target.checked,
                  },
                }))
              }
            />
            Karar verici netleştirildi
          </label>
        </fieldset>

        {/* 4 Aciliyet */}
        <fieldset className="rounded-2xl border border-[var(--apple-border)] bg-[var(--apple-bg)]/50 p-4 dark:bg-black/25">
          <legend className="px-1 text-sm font-semibold">4. Zamanlama / aciliyet</legend>
          <select
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            value={q.urgency?.level ?? ""}
            onChange={(e) =>
              setQ((p) => ({
                ...p,
                urgency: {
                  ...p.urgency,
                  level: e.target.value as "" | "HOT" | "WARM" | "COLD",
                },
              }))
            }
          >
            <option value="">Seçin</option>
            <option value="HOT">Sıcak — hemen</option>
            <option value="WARM">Ilık</option>
            <option value="COLD">Soğuk</option>
          </select>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(q.urgency?.confirmed)}
              onChange={(e) =>
                setQ((p) => ({
                  ...p,
                  urgency: { ...p.urgency, confirmed: e.target.checked },
                }))
              }
            />
            Aciliyet netleştirildi
          </label>
        </fieldset>

        {/* 5 Altın standart */}
        <fieldset className="rounded-2xl border border-[var(--apple-border)] bg-[var(--apple-bg)]/50 p-4 dark:bg-black/25">
          <legend className="px-1 text-sm font-semibold">5. Kişisel uygunluk (altın standart)</legend>
          <select
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            value={q.goldenStandard?.fit ?? ""}
            onChange={(e) =>
              setQ((p) => ({
                ...p,
                goldenStandard: {
                  ...p.goldenStandard,
                  fit: e.target.value as
                    | ""
                    | "suitable"
                    | "risky"
                    | "not_suitable",
                },
              }))
            }
          >
            <option value="">Seçin</option>
            <option value="suitable">Uygun</option>
            <option value="risky">Riskli</option>
            <option value="not_suitable">Uygun değil</option>
          </select>
          <input
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            placeholder="Red / risk notu"
            value={q.goldenStandard?.reason ?? ""}
            onChange={(e) =>
              setQ((p) => ({
                ...p,
                goldenStandard: {
                  ...p.goldenStandard,
                  reason: e.target.value,
                },
              }))
            }
          />
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(q.goldenStandard?.confirmed)}
              onChange={(e) =>
                setQ((p) => ({
                  ...p,
                  goldenStandard: {
                    ...p.goldenStandard,
                    confirmed: e.target.checked,
                  },
                }))
              }
            />
            Altın standart değerlendirmesi tamam
          </label>
        </fieldset>
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--apple-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="btn-apple-primary px-6 py-3 text-[15px]"
        >
          {saving ? "Kaydediliyor…" : "Kalifiye et"}
        </button>
        {zoomCheck.ok ? (
          <span className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--apple-green)]">
            <ShieldCheck className="h-4 w-4" />
            Closer / Zoom hazır
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[13px] text-[var(--muted)]">
            <AlertTriangle className="h-4 w-4 text-[var(--apple-orange)]" />
            {zoomCheck.reasons[0] ?? "Eksik kapılar var"}
          </span>
        )}
      </div>
    </div>
  );
}
