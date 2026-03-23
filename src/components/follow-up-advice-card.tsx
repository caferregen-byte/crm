"use client";

import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, Target, Phone, Lightbulb } from "lucide-react";

type Advice = {
  summary: string;
  whenToCall: string;
  angle: string;
  talkingPoints: string[];
};

export function FollowUpAdviceCard({
  leadId,
  show,
}: {
  leadId: string;
  show: boolean;
}) {
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchAdvice() {
    if (!show) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/follow-up-advice`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Yüklenemedi");
      const data = (await res.json()) as { advice: Advice };
      setAdvice(data.advice);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (show) void fetchAdvice();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tek seferlik yükleme
  }, [leadId, show]);

  if (!show) return null;

  return (
    <div className="relative overflow-hidden rounded-[20px] border border-[var(--apple-border)] bg-[var(--apple-surface)] p-6 shadow-[var(--apple-shadow)] ring-1 ring-[var(--apple-blue)]/20 md:p-8 dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
      <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[var(--apple-blue)] opacity-[0.06]" />
      <div className="relative flex flex-wrap items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--apple-blue)]/12">
          <Sparkles className="h-6 w-6 text-[var(--apple-blue)]" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[18px] font-semibold tracking-tight text-[var(--foreground)]">
            Satış koçu
          </h3>
          <p className="text-[13px] text-[var(--muted)]">
            Bu lead için takip stratejisi — Zoom sonrası
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchAdvice()}
          disabled={loading}
          className="rounded-xl border border-[var(--apple-border)] bg-[var(--apple-bg)] p-2.5 text-[var(--apple-blue)] transition hover:scale-105 active:scale-95"
          title="Yenile"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && !advice && (
        <p className="mt-6 text-[14px] text-[var(--muted)]">Koç hazırlanıyor…</p>
      )}
      {error && (
        <p className="mt-6 text-[14px] text-[var(--apple-red)]">{error}</p>
      )}
      {advice && (
        <div className="relative mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-[var(--apple-bg)] p-4 dark:bg-black/35">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
              <Lightbulb className="h-3.5 w-3.5 text-[var(--apple-orange)]" />
              Durum
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--foreground)]">
              {advice.summary}
            </p>
          </div>
          <div className="rounded-2xl bg-[var(--apple-bg)] p-4 dark:bg-black/35">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
              <Target className="h-3.5 w-3.5 text-[var(--apple-green)]" />
              Nasıl kapanır
            </p>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--foreground)]">
              {advice.angle}
            </p>
          </div>
          <div className="rounded-2xl bg-[var(--apple-bg)] p-4 dark:bg-black/35">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
              <Phone className="h-3.5 w-3.5 text-[var(--apple-blue)]" />
              Ne zaman ara
            </p>
            <p className="mt-2 text-[16px] font-semibold text-[var(--foreground)]">
              {advice.whenToCall}
            </p>
          </div>
          {advice.talkingPoints.length > 0 && (
            <div className="md:col-span-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                Söyleyeceklerin
              </p>
              <ul className="mt-2 space-y-2 text-[14px] text-[var(--foreground)]">
                {advice.talkingPoints.map((p, i) => (
                  <li key={i} className="flex gap-2 border-l-2 border-[var(--apple-blue)]/40 pl-3">
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
