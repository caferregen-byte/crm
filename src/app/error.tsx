"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  const dev = process.env.NODE_ENV === "development";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
        Bir hata oluştu
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Sayfa yüklenirken sunucu tarafında sorun çıktı. Veritabanı veya önbellek (.next) kaynaklı
        olabilir.
      </p>
      {dev && error.message && (
        <pre className="mt-4 max-h-40 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          {error.message}
        </pre>
      )}
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        Tekrar dene
      </button>
    </div>
  );
}
