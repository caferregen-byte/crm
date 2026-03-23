import type { QualificationJson } from "@/lib/qualification";

/** Canlı quali formundan doldurulmuş alan var mı? (5 kapı dışı veya metin alanları) */
export function hasLiveQualiDetails(q: QualificationJson | null): boolean {
  if (!q) return false;
  const s = (v: unknown) =>
    typeof v === "string" ? v.trim().length > 0 : v != null && String(v).length > 0;

  if (s(q.satisAcisi)) return true;
  if (q.setterDegerlendirme && Object.values(q.setterDegerlendirme).some((v) => s(v))) return true;

  const cs = q.callStart;
  if (
    cs &&
    (cs.firstImpression ||
      cs.available != null ||
      cs.status ||
      cs.callbackAt ||
      cs.callbackNote ||
      cs.quickOutcome)
  )
    return true;

  const md = q.mevcutDurum;
  if (md && Object.values(md).some((v) => s(v))) return true;

  const ac = q.aciNoktalari;
  if (ac && Object.values(ac).some((v) => s(v))) return true;

  if (q.cozum?.offerUygun != null) return true;

  const he = q.hedef;
  if (he && Object.values(he).some((v) => s(v))) return true;

  const bu = q.butce;
  if (bu && Object.values(bu).some((v) => s(v))) return true;

  const kv = q.kararVerici;
  if (kv) {
    if (s(kv.kim) || s(kv.riskNotu)) return true;
    if (kv.digerKatilacak === true || kv.katilabilirMi === true) return true;
  }

  const zm = q.zamanlama;
  if (zm && Object.values(zm).some((v) => s(v))) return true;

  const mn = q.mentalite;
  if (mn && Object.values(mn).some((v) => s(v))) return true;

  const sn = q.sonuc;
  if (sn && Object.values(sn).some((v) => (typeof v === "boolean" ? v === true : s(v)))) return true;

  if (
    q.need?.confirmed ||
    q.budget?.confirmed ||
    q.decisionMaker?.confirmed ||
    q.urgency?.confirmed ||
    q.goldenStandard?.confirmed
  ) {
    return true;
  }

  return false;
}

export const KARAR_LABEL: Record<string, string> = {
  self: "Kendisi",
  spouse: "Eşi",
  partner: "Ortağı",
  team: "Ekip",
  other: "Diğer",
};

export const YATIRIM_LABEL: Record<string, string> = {
  yes: "Evet",
  maybe: "Belki",
  no: "Hayır",
};

export const ACILIYET_LABEL: Record<string, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek",
};

export const HAFTALIK_LABEL: Record<string, string> = {
  yes: "Evet",
  partial: "Kısmen",
  no: "Hayır",
};
