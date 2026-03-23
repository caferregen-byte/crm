"use client";

import { useEffect } from "react";

const STORAGE_KEY = "crm-last-notify-date";

export function NotificationTrigger({ dueCount }: { dueCount: number }) {
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted" || dueCount === 0) return;

    const today = new Date().toDateString();
    const last = localStorage.getItem(STORAGE_KEY);
    if (last === today) return;

    try {
      new Notification("Closer — Bugün aranacaklar", {
        body: `${dueCount} lead bugün aranmayı bekliyor.`,
        icon: "/favicon.ico",
      });
      localStorage.setItem(STORAGE_KEY, today);
    } catch {
      // ignore
    }
  }, [dueCount]);

  return null;
}
