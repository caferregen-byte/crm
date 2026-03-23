"use client";

import type { RefObject } from "react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Phone, PhoneOff, Video, Ban } from "lucide-react";
import type { QualificationJson } from "@/lib/qualification";
import { SETTER_SCRIPT_SECTIONS, INTRO_MUSAIT_DEGIL_LINES } from "@/lib/setter-script";
import {
  zoomGateDashboardRowsDetailed,
  mentaliteStatusLabel,
  type GateUiStatus,
} from "@/lib/live-quali-sync";

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const TAG_OPTIONS: { id: string; label: string; neg: boolean }[] = [
  { id: "acik_fikirli", label: "Açık fikirli", neg: false },
  { id: "saygili", label: "Saygılı", neg: false },
  { id: "kararli", label: "Kararlı", neg: false },
  { id: "bahaneli", label: "Bahaneli", neg: true },
  { id: "egolu", label: "Egolu", neg: true },
  { id: "zor_musteri", label: "Zor müşteri", neg: true },
  { id: "blacklist_adayi", label: "Blacklist adayı", neg: true },
];

function dot(s: GateUiStatus) {
  if (s === "ok") return "bg-emerald-500";
  if (s === "warn") return "bg-amber-500";
  if (s === "bad") return "bg-red-500";
  return "bg-zinc-300 opacity-50 dark:bg-zinc-600";
}

function TapBtn({
  active,
  children,
  onClick,
  tone,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  tone?: "default" | "good" | "mid" | "bad";
}) {
  const ring =
    tone === "good" && active
      ? "border-emerald-500 bg-emerald-500/12 text-emerald-800 dark:text-emerald-100"
      : tone === "mid" && active
        ? "border-amber-500 bg-amber-500/12 text-amber-900 dark:text-amber-100"
        : tone === "bad" && active
          ? "border-red-500 bg-red-500/12 text-red-900 dark:text-red-100"
          : active
            ? "border-[var(--apple-blue)] bg-[var(--apple-blue)]/12 text-[var(--apple-blue)]"
            : "border-[var(--apple-border)] bg-[var(--apple-surface)] text-[var(--foreground)] hover:bg-[var(--apple-bg)]";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] flex-1 rounded-xl border px-3 py-2 text-[13px] font-medium transition active:scale-[0.99] ${ring}`}
    >
      {children}
    </button>
  );
}

function StickyZoomStrip({
  q,
  activeId,
}: {
  q: QualificationJson;
  activeId: string;
}) {
  const rows = zoomGateDashboardRowsDetailed(q);

  function scrollToSection(sectionId: string) {
    const el = document.getElementById(`cockpit-${sectionId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div
      className="pointer-events-none fixed bottom-4 left-3 right-3 z-40 sm:bottom-auto sm:left-auto sm:right-5 sm:top-24 sm:w-[min(300px,calc(100vw-2rem))]"
      aria-live="polite"
    >
      <div className="pointer-events-auto max-h-[min(60vh,520px)] overflow-y-auto rounded-2xl border border-[var(--apple-border)] bg-[var(--apple-bg)]/95 p-3 shadow-lg backdrop-blur-md dark:bg-zinc-950/90">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
          Uygunluk skoru
        </p>
        <ul className="mt-2 space-y-1">
          {(() => {
            const out: ReactNode[] = [];
            for (let i = 0; i < rows.length; i++) {
              const r = rows[i];
              const next = rows[i + 1];
              if (r.id === "timeFit" && next?.id === "neZamanBasla") {
                const groupActive = activeId === "zaman";
                out.push(
                  <li key="zaman-group">
                    <div
                      className={`overflow-hidden rounded-lg transition ${
                        groupActive
                          ? "border border-[var(--apple-blue)]/40 bg-[var(--apple-blue)]/12 shadow-[inset_0_0_0_1px_rgba(0,122,255,0.2)]"
                          : "border border-[var(--apple-border)]/35 bg-[var(--apple-surface)]/30"
                      }`}
                    >
                      {[r, next].map((row, j) => {
                        const tip = `${row.why}\n\n→ ${row.fix}`;
                        return (
                          <button
                            key={row.id}
                            type="button"
                            title={tip}
                            onClick={() => scrollToSection(row.sectionId)}
                            className={`flex w-full items-start gap-2 px-2 py-1.5 text-left text-[12px] text-[var(--foreground)] transition hover:bg-black/[0.04] dark:hover:bg-white/[0.05] ${
                              j > 0 ? "border-t border-[var(--apple-border)]/25" : ""
                            }`}
                          >
                            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot(row.status)}`} />
                            <span className="min-w-0 flex-1 leading-snug">
                              <span className="font-medium">{row.label}</span>
                              {(row.status === "bad" || row.status === "warn") && (
                                <span className="mt-0.5 block text-[11px] text-[var(--muted)]">{row.why}</span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </li>
                );
                i++;
                continue;
              }
              const inBudgetFlow =
                r.id === "budget" &&
                (activeId === "butce" ||
                  activeId === "butce_itiraz" ||
                  activeId === "butce_teyit");
              const stripActive = activeId === r.sectionId || inBudgetFlow;
              const tip = `${r.why}\n\n→ ${r.fix}`;
              out.push(
                <li key={r.id}>
                  <button
                    type="button"
                    title={tip}
                    onClick={() => scrollToSection(r.sectionId)}
                    className={`flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] text-[var(--foreground)] transition ${
                      stripActive
                        ? "border border-[var(--apple-blue)]/40 bg-[var(--apple-blue)]/12 shadow-[inset_0_0_0_1px_rgba(0,122,255,0.2)]"
                        : "hover:bg-[var(--apple-surface)]/80"
                    }`}
                  >
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot(r.status)}`} />
                    <span className="min-w-0 flex-1 leading-snug">
                      <span className="font-medium">{r.label}</span>
                      {(r.status === "bad" || r.status === "warn") && (
                        <span className="mt-0.5 block text-[11px] text-[var(--muted)]">{r.why}</span>
                      )}
                    </span>
                  </button>
                </li>
              );
            }
            return out;
          })()}
        </ul>
      </div>
    </div>
  );
}

/** Kalifikasyon metni — sol çizgi yok; sade tipografi */
function ScriptLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[15px] leading-[1.65] tracking-[-0.01em] text-zinc-800 dark:text-zinc-100/90">
      {children}
    </p>
  );
}

function InfoSection({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--apple-border)] bg-gradient-to-b from-zinc-50/95 to-zinc-50/40 p-4 dark:from-zinc-900/55 dark:to-zinc-950/35">
      {label ? (
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p>
      ) : null}
      <div className={label ? "mt-3 space-y-3" : "space-y-3"}>{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  inputClass,
  placeholder,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  inputClass: string;
  placeholder?: string;
}) {
  return (
    <div>
      {label && (
        <label className="block text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</label>
      )}
      <input
        className={`mt-1.5 w-full ${inputClass}`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function SalesCockpitFlow({
  scrollRootRef,
  q,
  setQ,
  inputClass,
  zoomCheck,
  onQuickAction,
}: {
  scrollRootRef?: RefObject<HTMLDivElement | null>;
  q: QualificationJson;
  setQ: React.Dispatch<React.SetStateAction<QualificationJson>>;
  inputClass: string;
  zoomCheck: { ok: boolean; reasons: string[] };
  onQuickAction: (action: string, extra?: Record<string, unknown>) => Promise<boolean>;
}) {
  const order = useMemo(() => {
    const ids = SETTER_SCRIPT_SECTIONS.map((s) => s.id);
    const k = ids.indexOf("kapanis");
    return [...ids.slice(0, k), "mentalite", ...ids.slice(k)] as string[];
  }, []);

  const [activeId, setActiveId] = useState(order[0] ?? "intro");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const root = scrollRootRef?.current ?? null;
    const els = order
      .map((id) => document.getElementById(`cockpit-${id}`))
      .filter((n): n is HTMLElement => Boolean(n));
    if (els.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting && e.intersectionRatio >= 0.15)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id?.startsWith("cockpit-")) {
          setActiveId(visible[0].target.id.replace("cockpit-", ""));
        }
      },
      {
        root,
        rootMargin: root ? "-8% 0px -35% 0px" : "-12% 0px -50% 0px",
        threshold: [0, 0.12, 0.25, 0.45, 0.65],
      }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [order, scrollRootRef]);

  useEffect(() => {
    if (!order.includes(activeId)) {
      setActiveId(order[0] ?? "intro");
    }
  }, [order, activeId]);

  const mevcutLines = SETTER_SCRIPT_SECTIONS.find((s) => s.id === "mevcut_durum")?.lines ?? [];
  const aciLines = SETTER_SCRIPT_SECTIONS.find((s) => s.id === "aci_noktalari")?.lines ?? [];
  const cozumLines = SETTER_SCRIPT_SECTIONS.find((s) => s.id === "cozum")?.lines ?? [];
  const hedefLines = SETTER_SCRIPT_SECTIONS.find((s) => s.id === "hedef")?.lines ?? [];
  const zamanLines = SETTER_SCRIPT_SECTIONS.find((s) => s.id === "zaman")?.lines ?? [];
  const introLines = SETTER_SCRIPT_SECTIONS.find((s) => s.id === "intro")?.lines ?? [];
  const bilgilendirmeLines = SETTER_SCRIPT_SECTIONS.find((s) => s.id === "bilgilendirme")?.lines ?? [];
  const kapanisLines = SETTER_SCRIPT_SECTIONS.find((s) => s.id === "kapanis")?.lines ?? [];
  const butceLines = SETTER_SCRIPT_SECTIONS.find((s) => s.id === "butce")?.lines ?? [];
  const butceItirazLines = SETTER_SCRIPT_SECTIONS.find((s) => s.id === "butce_itiraz")?.lines ?? [];
  const butceTeyitLines = SETTER_SCRIPT_SECTIONS.find((s) => s.id === "butce_teyit")?.lines ?? [];

  function renderSectionBody(sectionId: string) {
    switch (sectionId) {
      case "intro":
        return (
          <div className="mt-4 space-y-5">
            {introLines.map((line, i) => (
              <div key={i}>{line.trim() ? <ScriptLine>{line}</ScriptLine> : null}</div>
            ))}
            <div className="flex flex-wrap gap-2 pt-2">
              <TapBtn
                active={q.callStart?.available === true}
                onClick={() =>
                  setQ((p) => ({
                    ...p,
                    callStart: { ...p.callStart, available: true, status: "completed" },
                  }))
                }
              >
                Müsait (evet)
              </TapBtn>
              <TapBtn
                active={q.callStart?.available === false}
                onClick={() =>
                  setQ((p) => ({
                    ...p,
                    callStart: { ...p.callStart, available: false, status: "callback" },
                  }))
                }
              >
                Müsait değil
              </TapBtn>
            </div>
            {q.callStart?.available === false && (
              <>
                <div className="space-y-3 pt-2">
                  {INTRO_MUSAIT_DEGIL_LINES.map((line, i) => (
                    <ScriptLine key={i}>{line}</ScriptLine>
                  ))}
                </div>
                <div className="space-y-3 rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                  <p className="text-[12px] text-amber-900 dark:text-amber-200">
                    Ne zaman arayalım? Kayıtta takip tarihine yazılır.
                  </p>
                  <div>
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Geri arama</label>
                    <input
                      type="datetime-local"
                      className={`mt-1 w-full ${inputClass}`}
                      value={q.callStart?.callbackAt ? toLocalInputValue(q.callStart.callbackAt) : ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setQ((p) => ({
                          ...p,
                          callStart: {
                            ...p.callStart,
                            callbackAt: v ? new Date(v).toISOString() : undefined,
                          },
                        }));
                      }}
                    />
                  </div>
                  <Field
                    label="Not"
                    value={q.callStart?.callbackNote ?? ""}
                    onChange={(v) =>
                      setQ((p) => ({ ...p, callStart: { ...p.callStart, callbackNote: v } }))
                    }
                    inputClass={inputClass}
                    placeholder="Örn. yarın öğleden sonra"
                  />
                </div>
              </>
            )}
          </div>
        );

      case "bilgilendirme":
        return (
          <div className="mt-4">
            <InfoSection>
              {bilgilendirmeLines.map((line, i) =>
                line.trim() ? <ScriptLine key={i}>{line}</ScriptLine> : null
              )}
            </InfoSection>
          </div>
        );

      case "mevcut_durum":
        return (
          <div className="mt-4 space-y-6">
            {mevcutLines.map((line, i) => (
              <div key={i} className="space-y-2">
                {line.trim() ? <ScriptLine>{line}</ScriptLine> : null}
                {i === 1 && (
                  <Field
                    value={q.mevcutDurum?.neYapiyor ?? ""}
                    onChange={(v) =>
                      setQ((p) => ({ ...p, mevcutDurum: { ...p.mevcutDurum, neYapiyor: v } }))
                    }
                    inputClass={inputClass}
                    placeholder="Kısaca yazın…"
                  />
                )}
                {i === 2 && (
                  <Field
                    value={q.mevcutDurum?.musteriKazanim ?? ""}
                    onChange={(v) =>
                      setQ((p) => ({ ...p, mevcutDurum: { ...p.mevcutDurum, musteriKazanim: v } }))
                    }
                    inputClass={inputClass}
                    placeholder="Yol, kanallar, Meta vb."
                  />
                )}
                {i === 3 && (
                  <Field
                    value={q.mevcutDurum?.aylikButce ?? ""}
                    onChange={(v) =>
                      setQ((p) => ({ ...p, mevcutDurum: { ...p.mevcutDurum, aylikButce: v } }))
                    }
                    inputClass={inputClass}
                    placeholder="Örn. 500 € / ay"
                  />
                )}
                {i === 4 && (
                  <div>
                    <p className="text-[11px] text-zinc-500">Ajans / kendi (tek tık)</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(
                        [
                          ["agency", "Ajans"],
                          ["self", "Kendim"],
                          ["none", "Yok / diğer"],
                        ] as const
                      ).map(([k, lab]) => (
                        <TapBtn
                          key={k}
                          active={q.mevcutDurum?.reklamYonetimi === k}
                          onClick={() =>
                            setQ((p) => ({
                              ...p,
                              mevcutDurum: { ...p.mevcutDurum, reklamYonetimi: k },
                            }))
                          }
                        >
                          {lab}
                        </TapBtn>
                      ))}
                    </div>
                  </div>
                )}
                {i === 5 && (
                  <div>
                    <p className="text-[11px] text-zinc-500">Memnuniyet</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(
                        [
                          ["yes", "Evet"],
                          ["partial", "Kısmen"],
                          ["no", "Hayır"],
                        ] as const
                      ).map(([k, lab]) => (
                        <TapBtn
                          key={k}
                          active={q.mevcutDurum?.memnuniyet === k}
                          onClick={() =>
                            setQ((p) => ({
                              ...p,
                              mevcutDurum: { ...p.mevcutDurum, memnuniyet: k },
                            }))
                          }
                        >
                          {lab}
                        </TapBtn>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case "aci_noktalari":
        return (
          <div className="mt-4 space-y-6">
            {aciLines.map((line, i) => (
              <div key={i} className="space-y-2">
                {line.trim() ? <ScriptLine>{line}</ScriptLine> : null}
                {i === 0 && (
                  <textarea
                    className={`w-full ${inputClass}`}
                    rows={3}
                    placeholder="En büyük problem…"
                    value={q.aciNoktalari?.enBuyukProblem ?? ""}
                    onChange={(e) =>
                      setQ((p) => ({
                        ...p,
                        aciNoktalari: { ...p.aciNoktalari, enBuyukProblem: e.target.value },
                      }))
                    }
                  />
                )}
                {i === 1 && (
                  <textarea
                    className={`w-full ${inputClass}`}
                    rows={2}
                    placeholder="İşinize yansıması…"
                    value={q.aciNoktalari?.iseYansima ?? ""}
                    onChange={(e) =>
                      setQ((p) => ({
                        ...p,
                        aciNoktalari: { ...p.aciNoktalari, iseYansima: e.target.value },
                      }))
                    }
                  />
                )}
                {i === 2 && (
                  <textarea
                    className={`w-full ${inputClass}`}
                    rows={2}
                    placeholder="Eksikliği nerede hissediyorsunuz?"
                    value={q.aciNoktalari?.eksikHis ?? ""}
                    onChange={(e) =>
                      setQ((p) => ({
                        ...p,
                        aciNoktalari: { ...p.aciNoktalari, eksikHis: e.target.value },
                      }))
                    }
                  />
                )}
              </div>
            ))}
            <div className="border-t border-[var(--apple-border)]/80 pt-4">
              <p className="text-[12px] font-medium text-zinc-600 dark:text-zinc-400">Aciliyet</p>
              <p className="mt-1 text-[11px] text-zinc-500">Yüksek = yeşil · Orta = turuncu · Düşük = kırmızı (üstte)</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    ["low", "Düşük", "bad"],
                    ["medium", "Orta", "mid"],
                    ["high", "Yüksek", "good"],
                  ] as const
                ).map(([k, lab, tone]) => (
                  <TapBtn
                    key={k}
                    active={q.aciNoktalari?.aciliyet === k}
                    tone={tone}
                    onClick={() =>
                      setQ((p) => ({
                        ...p,
                        aciNoktalari: { ...p.aciNoktalari, aciliyet: k },
                      }))
                    }
                  >
                    {lab}
                  </TapBtn>
                ))}
              </div>
            </div>
          </div>
        );

      case "cozum":
        return (
          <div className="mt-4 space-y-5">
            {cozumLines.map((line, i) => (
              <div key={i}>{line.trim() ? <ScriptLine>{line}</ScriptLine> : null}</div>
            ))}
            <div className="rounded-xl border border-[var(--apple-border)]/80 bg-[var(--apple-bg)]/50 p-4 dark:bg-black/20">
              <p className="text-[12px] text-[var(--muted)]">
                Yukarıdaki soruya göre — hizmet uyumu (üst şerit)
              </p>
              <div className="mt-3 flex gap-2">
                <TapBtn
                  active={q.cozum?.offerUygun === true}
                  tone="good"
                  onClick={() => setQ((p) => ({ ...p, cozum: { ...p.cozum, offerUygun: true } }))}
                >
                  Evet
                </TapBtn>
                <TapBtn
                  active={q.cozum?.offerUygun === false}
                  tone="bad"
                  onClick={() => setQ((p) => ({ ...p, cozum: { ...p.cozum, offerUygun: false } }))}
                >
                  Hayır
                </TapBtn>
              </div>
            </div>
          </div>
        );

      case "hedef":
        return (
          <div className="mt-4 space-y-6">
            {hedefLines.map((line, i) => (
              <div key={i} className="space-y-2">
                {line.trim() ? <ScriptLine>{line}</ScriptLine> : null}
                {i === 0 && (
                  <Field
                    value={q.hedef?.hedef612 ?? ""}
                    onChange={(v) => setQ((p) => ({ ...p, hedef: { ...p.hedef, hedef612: v } }))}
                    inputClass={inputClass}
                    placeholder="Somut hedef…"
                  />
                )}
                {i === 1 && (
                  <Field
                    value={q.hedef?.nedenSimdi ?? ""}
                    onChange={(v) => setQ((p) => ({ ...p, hedef: { ...p.hedef, nedenSimdi: v } }))}
                    inputClass={inputClass}
                    placeholder="Neden şimdi / neden önemli…"
                  />
                )}
              </div>
            ))}
            <div className="border-t border-[var(--apple-border)]/80 pt-4">
              <p className="text-[12px] font-medium text-zinc-600 dark:text-zinc-400">Hedef motivasyon aciliyeti</p>
              <p className="mt-1 text-[11px] text-zinc-500">Üst şeritte senkron</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    ["low", "Düşük", "bad"],
                    ["medium", "Orta", "mid"],
                    ["high", "Yüksek", "good"],
                  ] as const
                ).map(([k, lab, tone]) => (
                  <TapBtn
                    key={k}
                    active={q.hedef?.hedefAciliyeti === k}
                    tone={tone}
                    onClick={() =>
                      setQ((p) => ({
                        ...p,
                        hedef: { ...p.hedef, hedefAciliyeti: k },
                      }))
                    }
                  >
                    {lab}
                  </TapBtn>
                ))}
              </div>
            </div>
          </div>
        );

      case "butce":
        return (
          <div className="mt-4 space-y-5">
            {butceLines.map((line, i) => (
              <div key={i}>{line.trim() ? <ScriptLine>{line}</ScriptLine> : null}</div>
            ))}
            <div className="rounded-xl border border-[var(--apple-border)]/80 bg-[var(--apple-bg)]/40 p-4 dark:bg-black/15">
              <p className="text-[11px] font-medium text-[var(--muted)]">
                Prensip — bu banda yatırım şu an yapılabilir mi?
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <TapBtn
                  active={q.butce?.yatirimYapilabilir === "yes"}
                  tone="good"
                  onClick={() =>
                    setQ((p) => ({
                      ...p,
                      butce: { ...p.butce, yatirimYapilabilir: "yes" },
                    }))
                  }
                >
                  Evet (yapılabilir)
                </TapBtn>
                <TapBtn
                  active={q.butce?.yatirimYapilabilir === "no"}
                  tone="bad"
                  onClick={() =>
                    setQ((p) => ({
                      ...p,
                      butce: { ...p.butce, yatirimYapilabilir: "no" },
                    }))
                  }
                >
                  Hayır
                </TapBtn>
              </div>
            </div>
          </div>
        );

      case "butce_itiraz":
        return (
          <div className="mt-4">
            <InfoSection>
              {butceItirazLines.map((line, i) =>
                line.trim() ? <ScriptLine key={i}>{line}</ScriptLine> : null
              )}
            </InfoSection>
          </div>
        );

      case "butce_teyit":
        return (
          <div className="mt-4 space-y-8">
            {butceTeyitLines.map((line, i) => (
              <div key={i} className="space-y-3">
                {line.trim() ? <ScriptLine>{line}</ScriptLine> : null}
                {i === 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Teyit — üst şerit rengi buradan
                    </p>
                    <p className="text-[11px] text-zinc-500">Hemen mümkün mü, birikim mi gerekir?</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(
                        [
                          ["yes", "Hemen mümkün", "good"],
                          ["birikim", "Birikim gerekir", "mid"],
                          ["no", "Hayır / şimdilik değil", "bad"],
                        ] as const
                      ).map(([k, lab, tone]) => (
                        <TapBtn
                          key={k}
                          active={q.butce?.teyitHemenMumkun === k}
                          tone={tone}
                          onClick={() =>
                            setQ((p) => ({
                              ...p,
                              butce: { ...p.butce, teyitHemenMumkun: k },
                            }))
                          }
                        >
                          {lab}
                        </TapBtn>
                      ))}
                    </div>
                  </div>
                )}
                {i === 1 && (
                  <div>
                    <p className="text-[11px] text-zinc-500">Likit erişim</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(
                        [
                          ["yes", "Evet", "good"],
                          ["partial", "Kısmen", "mid"],
                          ["no", "Hayır", "bad"],
                        ] as const
                      ).map(([k, lab, tone]) => (
                        <TapBtn
                          key={k}
                          active={q.butce?.teyitLikit === k}
                          tone={tone}
                          onClick={() =>
                            setQ((p) => ({
                              ...p,
                              butce: { ...p.butce, teyitLikit: k },
                            }))
                          }
                        >
                          {lab}
                        </TapBtn>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case "karar_verici":
        return (
          <div className="mt-4">
            <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Karar verici (serbest)
            </label>
            <input
              className={`mt-1.5 w-full ${inputClass}`}
              placeholder="Örn. kendisi + eşi"
              value={q.kararVerici?.serbestMetin ?? ""}
              onChange={(e) =>
                setQ((p) => ({
                  ...p,
                  kararVerici: { ...p.kararVerici, serbestMetin: e.target.value },
                }))
              }
            />
          </div>
        );

      case "zaman":
        return (
          <div className="mt-4 space-y-8">
            {zamanLines.map((line, i) => (
              <div key={i} className="space-y-3">
                {line.trim() ? <ScriptLine>{line}</ScriptLine> : null}
                {i === 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                      Zaman uygunluğu
                    </p>
                    <p className="text-[11px] text-zinc-500">Programa zaman ayırır mı?</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(
                        [
                          ["yes", "Evet", "good"],
                          ["partial", "Kısmen", "mid"],
                          ["no", "Hayır", "bad"],
                        ] as const
                      ).map(([k, lab, tone]) => (
                        <TapBtn
                          key={k}
                          active={q.zamanlama?.haftalikSaat === k}
                          tone={tone}
                          onClick={() =>
                            setQ((p) => ({
                              ...p,
                              zamanlama: { ...p.zamanlama, haftalikSaat: k },
                            }))
                          }
                        >
                          {lab}
                        </TapBtn>
                      ))}
                    </div>
                  </div>
                )}
                {i === 1 && (
                  <div>
                    <p className="text-[11px] text-zinc-500">Ne zaman başlar?</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(
                        [
                          ["hemen", "Hemen", "good"],
                          ["1_3_ay", "1–3 ay", "mid"],
                          ["belirsiz", "Belirsiz", "bad"],
                        ] as const
                      ).map(([k, lab, tone]) => (
                        <TapBtn
                          key={k}
                          active={q.zamanlama?.zamanHedefi === k}
                          tone={tone}
                          onClick={() =>
                            setQ((p) => ({
                              ...p,
                              zamanlama: { ...p.zamanlama, zamanHedefi: k },
                            }))
                          }
                        >
                          {lab}
                        </TapBtn>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case "mentalite": {
        const tags = q.mentalite?.tagIds ?? [];
        const mentalRow = zoomGateDashboardRowsDetailed(q).find((r) => r.id === "mental");
        const m = mentalRow ? mentaliteStatusLabel(mentalRow.status) : { emoji: "⚪", text: "Boş" };
        return (
          <div className="mt-4 space-y-3">
            <p className="text-[12px] text-[var(--muted)]">Pozitif / negatif — altın standart</p>
            <p className="text-[13px] font-medium text-[var(--foreground)]">
              Mentalite: {m.emoji} {m.text}
            </p>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map((t) => {
                const on = tags.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() =>
                      setQ((p) => {
                        const cur = p.mentalite?.tagIds ?? [];
                        const next = on ? cur.filter((x) => x !== t.id) : [...cur, t.id];
                        return {
                          ...p,
                          mentalite: {
                            ...p.mentalite,
                            tagIds: next,
                            etiket: undefined,
                          },
                        };
                      })
                    }
                    className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
                      on
                        ? t.neg
                          ? "border-red-400 bg-red-500/15 text-red-800 dark:text-red-200"
                          : "border-emerald-500 bg-emerald-500/15 text-emerald-900 dark:text-emerald-100"
                        : "border-[var(--apple-border)] bg-[var(--apple-surface)] text-[var(--foreground)] hover:bg-[var(--apple-bg)]"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      case "kapanis":
        return (
          <div className="mt-4 space-y-4">
            <InfoSection>
              {kapanisLines.map((line, i) =>
                line.trim() ? <ScriptLine key={i}>{line}</ScriptLine> : null
              )}
            </InfoSection>
            <div className="border-t border-[var(--apple-border)]/80 pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                Kayıt ve aksiyonlar
              </p>
              <div className="mt-4 space-y-4">
            {q.callStart?.available === false && q.callStart?.quickOutcome === "no_answer" && (
              <div className="rounded-xl border border-amber-300/80 bg-amber-50 px-3 py-2 text-[12px] text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                <span className="font-medium">Ulaşılamadı</span> (müsait değildi) — tekrar arama
                {q.callStart.callbackAt
                  ? ` · ${new Date(q.callStart.callbackAt).toLocaleString("tr-TR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}`
                  : ""}
                {q.callStart.callbackNote ? ` · ${q.callStart.callbackNote}` : ""}
              </div>
            )}
            {q.callStart?.quickOutcome === "contacted" && (
              <p className="text-[12px] text-emerald-700 dark:text-emerald-300">Görüşme tamamlandı olarak işaretlendi.</p>
            )}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Setter → closer notu
              </label>
              <textarea
                className={`mt-1 w-full ${inputClass}`}
                rows={2}
                placeholder="Tek satır not"
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
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Satış açısı</label>
              <textarea
                className={`mt-1 w-full ${inputClass}`}
                rows={2}
                value={q.satisAcisi ?? ""}
                onChange={(e) => setQ((p) => ({ ...p, satisAcisi: e.target.value }))}
              />
            </div>
            {zoomCheck.ok ? (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">Zoom planlanabilir</p>
            ) : (
              <p className="text-sm text-zinc-500">{zoomCheck.reasons[0] ?? "Kapılar tamamlanmalı"}</p>
            )}
            <div className="space-y-3 border-t border-[var(--apple-border)]/80 pt-4">
              <button
                type="button"
                onClick={() => void onQuickAction("contacted")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--apple-blue)] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 active:scale-[0.99] sm:w-auto sm:min-w-[220px]"
              >
                <Phone className="h-4 w-4 opacity-90" />
                Görüşmeyi Bitir
              </button>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void onQuickAction("no_answer")}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--apple-border)] bg-[var(--apple-surface)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--apple-bg)] sm:flex-none"
                >
                  <PhoneOff className="h-4 w-4 opacity-60" />
                  Ulaşılamadı
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const r = prompt("Blacklist sebebi?");
                    if (r) void onQuickAction("blacklist", { blacklistReason: r });
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200/80 bg-red-50/50 px-4 py-2.5 text-sm font-medium text-red-900 hover:bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200 sm:flex-none"
                >
                  <Ban className="h-4 w-4 opacity-70" />
                  Blacklist
                </button>
              </div>
              <div className="rounded-xl border border-dashed border-[var(--apple-border)] bg-[var(--apple-bg)]/60 px-3 py-2 dark:bg-zinc-900/40">
                <p className="text-[11px] font-medium text-[var(--muted)]">Zoom randevusu</p>
                <button
                  type="button"
                  onClick={() => {
                    const d = prompt("Zoom tarihi (YYYY-MM-DD)?", new Date().toISOString().slice(0, 10));
                    if (d) void onQuickAction("zoom_scheduled", { zoomScheduledAt: d });
                  }}
                  disabled={!zoomCheck.ok}
                  className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--apple-border)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--apple-surface)] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                >
                  <Video className="h-4 w-4 opacity-60" />
                  Zoom planla
                </button>
              </div>
            </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="relative">
      <StickyZoomStrip q={q} activeId={activeId} />

      <div className="mx-auto max-w-2xl space-y-6 px-4 pb-32 pt-2 sm:pr-[300px]">
        {order.map((sectionId) => {
          const script =
            sectionId === "mentalite"
              ? null
              : SETTER_SCRIPT_SECTIONS.find((s) => s.id === sectionId);
          const title =
            sectionId === "mentalite"
              ? "Mentalite"
              : script?.title ?? sectionId;
          const isActive = activeId === sectionId;
          const isHovered = hoveredId === sectionId;
          const isEmphasized = isActive || isHovered;
          const scriptLines = script?.lines ?? [];
          const showScriptFirst =
            sectionId !== "mentalite" &&
            sectionId !== "intro" &&
            sectionId !== "bilgilendirme" &&
            sectionId !== "mevcut_durum" &&
            sectionId !== "aci_noktalari" &&
            sectionId !== "cozum" &&
            sectionId !== "hedef" &&
            sectionId !== "butce" &&
            sectionId !== "butce_itiraz" &&
            sectionId !== "butce_teyit" &&
            sectionId !== "zaman" &&
            sectionId !== "kapanis";

          return (
            <section
              key={sectionId}
              id={`cockpit-${sectionId}`}
              onMouseEnter={() => setHoveredId(sectionId)}
              onMouseLeave={() => setHoveredId(null)}
              className={`scroll-mt-24 rounded-2xl border border-[var(--apple-border)] bg-[var(--apple-surface)]/80 p-5 transition-[opacity,box-shadow,background-color,border-color] duration-200 dark:bg-zinc-900/40 ${
                isEmphasized
                  ? "opacity-100 shadow-[0_0_0_1px_rgba(0,122,255,0.45),0_0_28px_rgba(0,122,255,0.2),0_8px_32px_rgba(0,122,255,0.1)] ring-2 ring-sky-500/35"
                  : "opacity-[0.52] shadow-sm"
              } ${isHovered && !isActive ? "bg-[var(--apple-surface)] ring-1 ring-sky-400/25" : ""}`}
            >
              <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
              {sectionId === "intro" && (
                <p className="mt-1 text-[12px] text-[var(--muted)]">
                  Müsaitlik kaydı bu kutuda; tüm adımlar aşağıda baştan görünür.
                </p>
              )}
              {sectionId === "bilgilendirme" && (
                <p className="mt-1 text-[12px] text-[var(--muted)]">Sadece bilgi; soru / form alanı yok.</p>
              )}
              {sectionId === "kapanis" && (
                <p className="mt-1 text-[12px] text-[var(--muted)]">
                  Üst kısım bilgilendirme; altta kayıt ve aksiyonlar.
                </p>
              )}
              {sectionId === "butce_itiraz" && (
                <p className="mt-1 text-[12px] text-[var(--muted)]">
                  Opsiyonel — itiraz çıkarsa söylenecek metinler; tıklama / puan yok.
                </p>
              )}
              {sectionId === "butce_teyit" && (
                <p className="mt-1 text-[12px] text-[var(--muted)]">
                  Üst şeritteki bütçe rengi (yeşil / turuncu / kırmızı) bu teyitlere göre hesaplanır.
                </p>
              )}
              {sectionId === "mentalite" && (
                <p className="mt-1 text-[12px] text-[var(--muted)]">
                  Pozitif / negatif — otomatik altın standart
                </p>
              )}

              {showScriptFirst && scriptLines.length > 0 && (
                <ul className="mt-4 list-none space-y-3.5 text-[15px] leading-[1.65] tracking-[-0.01em] text-zinc-800 dark:text-zinc-100/90">
                  {scriptLines.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              )}

              {renderSectionBody(sectionId)}
            </section>
          );
        })}
      </div>
    </div>
  );
}
