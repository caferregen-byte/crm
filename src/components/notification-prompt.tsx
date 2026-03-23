"use client";

import { useEffect, useState } from "react";

type Props = {
  dueCount: number;
  onDismiss?: () => void;
};

export function NotificationPrompt({ dueCount, onDismiss }: Props) {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      if (typeof window === "undefined" || !("Notification" in window)) return;
      setPermission(Notification.permission);
      if (Notification.permission === "default" && dueCount > 0) {
        setShow(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [dueCount]);

  async function requestPermission() {
    const p = await Notification.requestPermission();
    setPermission(p);
    setShow(false);
    onDismiss?.();
  }

  if (!show || permission !== "default") return null;

  return (
    <button
      type="button"
      onClick={() => void requestPermission()}
      className="w-full rounded-2xl border border-zinc-200/80 bg-white px-4 py-3.5 text-left transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-zinc-900"
    >
      <p className="text-[15px] font-medium text-zinc-900 dark:text-zinc-100">
        Bildirimleri aç
      </p>
      <p className="mt-0.5 text-sm text-zinc-500">
        {dueCount} arama için hatırlatma
      </p>
    </button>
  );
}
