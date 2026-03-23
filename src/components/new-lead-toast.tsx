"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { humanizeUnderscores } from "@/lib/strings";

const POLL_INTERVAL_MS = 30_000;
const STORAGE_KEY = "crm-last-check-at";
const REMINDER_KEY = "crm-lead-reminder";

type LatestLead = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  completeness?: string | null;
  source?: string | null;
  aiSummary?: string | null;
};

type ReminderPayload = {
  id: string;
  at: number;
  displayName: string;
};

const toastWrap =
  "fixed bottom-6 right-6 z-50 w-[min(100vw-2rem,20rem)] rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900";

export function NewLeadToast() {
  const [newLead, setNewLead] = useState<{
    count: number;
    latest: LatestLead;
  } | null>(null);
  const [reminder, setReminder] = useState<ReminderPayload | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [reminderDismissed, setReminderDismissed] = useState(false);

  const checkReminder = useCallback(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem(REMINDER_KEY);
    if (!raw) return;
    try {
      const r = JSON.parse(raw) as ReminderPayload;
      if (r?.at && Date.now() >= r.at) {
        sessionStorage.removeItem(REMINDER_KEY);
        setReminder(r);
        setReminderDismissed(false);
      }
    } catch {
      sessionStorage.removeItem(REMINDER_KEY);
    }
  }, []);

  const check = useCallback(async () => {
    checkReminder();
    const last =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const since = last ?? new Date().toISOString();
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 12_000);
      const res = await fetch(
        `/api/leads/new-count?since=${encodeURIComponent(since)}`,
        { signal: ctrl.signal }
      );
      clearTimeout(to);
      if (!res.ok) return;
      const data = (await res.json()) as {
        count: number;
        latest?: LatestLead;
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, new Date().toISOString());
      }
      if (data.count > 0 && data.latest) {
        setNewLead({ count: data.count, latest: data.latest });
        setDismissed(false);
      }
    } catch {
      // ignore
    }
  }, [checkReminder]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void check();
    });
    const t = setInterval(() => {
      void check();
    }, POLL_INTERVAL_MS);
    const r = setInterval(checkReminder, 15_000);
    return () => {
      cancelled = true;
      clearInterval(t);
      clearInterval(r);
    };
  }, [check, checkReminder]);

  function scheduleReminder(id: string, displayName: string) {
    const at = Date.now() + 10 * 60 * 1000;
    sessionStorage.setItem(
      REMINDER_KEY,
      JSON.stringify({ id, at, displayName } satisfies ReminderPayload)
    );
    setDismissed(true);
  }

  if (reminder && !reminderDismissed) {
    return (
      <div className={toastWrap}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100">Hatırlatma</p>
            <p className="mt-0.5 text-sm text-zinc-500">{reminder.displayName}</p>
            <Link
              href={`/leads/${reminder.id}`}
              className="mt-3 inline-flex rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Aç
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setReminderDismissed(true)}
            className="shrink-0 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!newLead || dismissed) return null;

  const l = newLead.latest;
  const displayName = l.name ?? l.email ?? l.phone ?? "Yeni lead";
  const complete =
    l.completeness === "COMPLETE"
      ? "Yeşil"
      : l.completeness === "INCOMPLETE"
        ? "Sarı"
        : null;
  const sourceRaw = humanizeUnderscores(l.source).trim();
  const sourceLabel = sourceRaw !== "" ? sourceRaw : null;
  const summaryText =
    typeof l.aiSummary === "string" ? l.aiSummary : l.aiSummary != null ? String(l.aiSummary) : "";
  const aiSnippet =
    summaryText.length > 140 ? `${summaryText.slice(0, 140)}…` : summaryText || null;

  return (
    <div className={toastWrap}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100">Yeni lead</p>
          <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
            {newLead.count === 1
              ? displayName
              : `${newLead.count} başvuru · ${displayName}`}
          </p>
          {(complete || sourceLabel) && (
            <p className="mt-1 text-xs text-zinc-400">
              {[sourceLabel, complete].filter(Boolean).join(" · ")}
            </p>
          )}
          {aiSnippet && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-zinc-500">{aiSnippet}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`tel:${l.phone ?? ""}`}
              className={`inline-flex rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 ${!l.phone ? "pointer-events-none opacity-40" : ""}`}
            >
              Ara
            </Link>
            <Link
              href={`/leads/${l.id}`}
              className="inline-flex rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Kart
            </Link>
            <button
              type="button"
              onClick={() => scheduleReminder(l.id, displayName)}
              className="rounded-full border border-zinc-200 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              10 dk
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          aria-label="Kapat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
