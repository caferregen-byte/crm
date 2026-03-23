"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function QualificationNotesForm({
  leadId,
  initial,
}: {
  leadId: string;
  initial: string;
}) {
  const router = useRouter();
  const [text, setText] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qualificationNotes: text }),
      });
      if (res.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        className="min-h-[120px] w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Aktüel durum, hedef, bütçe, engeller, Zoom notları…"
      />
      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
      >
        {saving ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </div>
  );
}
