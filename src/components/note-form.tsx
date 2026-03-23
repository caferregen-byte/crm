"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NoteForm({
  leadId,
  defaultCategory = "general",
}: {
  leadId: string;
  defaultCategory?: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, category }),
      });
      if (res.ok) {
        setBody("");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <select
        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="general">Genel</option>
        <option value="phone">Telefon</option>
        <option value="zoom">Zoom</option>
        <option value="qualification">Kalifikasyon</option>
      </select>
      <textarea
        className="min-h-[88px] rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800"
        placeholder="Hızlı not…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
      >
        {saving ? "Kaydediliyor…" : "Not ekle"}
      </button>
    </form>
  );
}
