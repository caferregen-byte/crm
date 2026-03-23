"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SetterCloserNotesForm({
  leadId,
  setterNote,
  closerNote,
}: {
  leadId: string;
  setterNote: string | null;
  closerNote: string | null;
}) {
  const router = useRouter();
  const [setter, setSetter] = useState(setterNote ?? "");
  const [closer, setCloser] = useState(closerNote ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setterNote: setter, closerNote: closer }),
      });
      if (res.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-slate-500">Setter notu</label>
        <textarea
          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-600 dark:bg-slate-800"
          rows={3}
          value={setter}
          onChange={(e) => setSetter(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500">Closer notu</label>
        <textarea
          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-600 dark:bg-slate-800"
          rows={3}
          value={closer}
          onChange={(e) => setCloser(e.target.value)}
        />
      </div>
      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
      >
        {saving ? "Kaydediliyor…" : "Notları kaydet"}
      </button>
    </div>
  );
}
