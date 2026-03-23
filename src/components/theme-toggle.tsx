"use client";

import { Moon, Sun } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "closer-theme";

function subscribe(onStoreChange: () => void) {
  const el = document.documentElement;
  const obs = new MutationObserver(onStoreChange);
  obs.observe(el, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return false;
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      suppressHydrationWarning
      className="inline-flex h-8 min-w-[7.25rem] items-center justify-center gap-2 rounded-full border border-[var(--apple-border)] bg-[var(--apple-surface)] px-3 py-1.5 text-[13px] font-medium text-[var(--foreground)] shadow-[var(--apple-shadow)] transition hover:scale-[1.02] active:scale-[0.98]"
      aria-label={isDark ? "Açık görünüme geç" : "Koyu görünüme geç"}
    >
      {isDark ? (
        <Sun className="h-3.5 w-3.5 shrink-0 text-[var(--apple-orange)]" strokeWidth={2} />
      ) : (
        <Moon className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" strokeWidth={2} />
      )}
      <span className="tabular-nums">Görünüm</span>
    </button>
  );
}
