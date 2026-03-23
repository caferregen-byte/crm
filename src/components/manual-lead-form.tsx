"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const SOURCES = [
  { value: "MANUAL", label: "Manuel" },
  { value: "INSTAGRAM_DM", label: "Instagram DM" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "REFERRAL", label: "Tavsiye" },
  { value: "EMAIL", label: "E-posta" },
  { value: "WEBSITE", label: "Web sitesi" },
] as const;

export function ManualLeadForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState<string>("MANUAL");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/leads/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, source, note }),
      });
      const text = await res.text();
      let j: { error?: string; detail?: string; leadId?: string } = {};
      try {
        j = text ? (JSON.parse(text) as typeof j) : {};
      } catch {
        setErr(
          res.ok
            ? "Sunucu yanıtı okunamadı."
            : `Sunucu hatası (${res.status}). Sayfayı yenileyip tekrar dene; geliştirici konsolunda Network sekmesine bak.`
        );
        return;
      }
      if (!res.ok) {
        const hint = j.detail ? ` ${j.detail}` : "";
        setErr((j.error ?? "Kayıt başarısız") + hint);
        return;
      }
      if (j.leadId) router.push(`/leads/${j.leadId}`);
      else setErr("Kayıt oluşturuldu ama lead ID alınamadı.");
    } catch (net) {
      setErr(
        net instanceof TypeError
          ? "Ağ hatası: sunucu çalışıyor mu ve adres çubuğundaki siteyle aynı origin’de misin?"
          : "Kayıt başarısız."
      );
    } finally {
      setBusy(false);
    }
  }

  const field =
    "mt-1 w-full rounded-xl border border-zinc-200/80 bg-white px-3 py-2.5 text-sm outline-none ring-zinc-900/5 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950";

  return (
    <form
      noValidate
      onSubmit={(e) => void submit(e)}
      className="space-y-5"
    >
      {err && (
        <p className="rounded-xl border border-zinc-200/80 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          {err}
        </p>
      )}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-zinc-500">Kaynak</label>
          <select className={field}
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500">İsim</label>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500">E-posta</label>
          <input
            type="text"
            inputMode="email"
            autoComplete="email"
            placeholder="ornek@firma.com"
            className={field}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500">Telefon</label>
          <input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500">Not</label>
          <textarea className={field} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-zinc-900 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {busy ? "…" : "Kaydet"}
      </button>
    </form>
  );
}
