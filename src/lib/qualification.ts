/**
 * 5 kapılı kalifikasyon — Zoom öncesi zorunlu (setter-closer modeli)
 * + Genişletilmiş quali form (canlı görüşme)
 */

export type QualificationJson = {
  need?: {
    currentSituation?: string;
    targetSituation?: string;
    problem?: string;
    painLevel?: "low" | "medium" | "high" | "";
    confirmed?: boolean;
  };
  budget?: {
    estimate?: string;
    hasLiquidity?: boolean | null;
    category?: "below_3000" | "3000_6000" | "6000_plus" | "unknown" | "";
    confirmed?: boolean;
  };
  decisionMaker?: {
    who?: "self" | "spouse" | "partner" | "manager" | "other" | "";
    coAttendeeWillJoin?: boolean;
    confirmed?: boolean;
  };
  urgency?: {
    level?: "HOT" | "WARM" | "COLD" | "";
    confirmed?: boolean;
  };
  goldenStandard?: {
    fit?: "suitable" | "risky" | "not_suitable" | "";
    reason?: string;
    confirmed?: boolean;
  };
  /** Canlı quali form — genişletilmiş alanlar */
  callStart?: {
    available?: boolean;
    newTimeGiven?: boolean;
    whatsappSent?: boolean;
    status?: "completed" | "partial" | "unreachable" | "callback";
    firstImpression?: string;
    /** Müsait değilse — geri arama (ISO); ana sayfa / takip ile senkron */
    callbackAt?: string;
    callbackNote?: string;
    /** Alt aksiyonlarla senkron: görüştüm / ulaşılamadı */
    quickOutcome?: "contacted" | "no_answer" | "";
  };
  mevcutDurum?: {
    neYapiyor?: string;
    alan?: string;
    musteriKazanim?: string;
    metaReklam?: "yes" | "no" | "unknown";
    aylikButce?: string;
    reklamYonetimi?: "self" | "agency" | "freelancer" | "internal" | "none";
    memnuniyet?: "yes" | "partial" | "no";
    not?: string;
  };
  aciNoktalari?: {
    enBuyukProblem?: string;
    iseYansima?: string;
    eksikHis?: string;
    aciSkoru?: number;
    aciliyet?: "low" | "medium" | "high" | "";
    not?: string;
  };
  /** Çözüm sunumu — hizmet uyumu (Evet/Hayır) */
  cozum?: {
    offerUygun?: boolean | null;
  };
  hedef?: {
    hedef612?: string;
    hedefCiro?: string;
    musteriSayisi?: string;
    nedenOnemli?: string;
    nedenSimdi?: string;
    motivasyonSkoru?: number;
    /** Hedefe bağlı motivasyon aciliyeti — canlı şerit renkleri */
    hedefAciliyeti?: "low" | "medium" | "high" | "";
  };
  butce?: {
    /** Prensip: 6–7k bandı işinize yapılabilir mi? */
    yatirimYapilabilir?: "yes" | "maybe" | "no" | "";
    /** Teyit: hemen mümkün mü / birikim gerekir mi / hayır */
    teyitHemenMumkun?: "yes" | "birikim" | "no" | "";
    /** Teyit: likit erişim — şerit rengi buradan */
    teyitLikit?: "yes" | "partial" | "no" | "";
    finansalDurum?: string;
    itirazTipi?: string;
    setterYorumu?: string;
  };
  kararVerici?: {
    kim?: "self" | "spouse" | "partner" | "team" | "other" | "";
    /** Canlı görüşmede dropdown yerine — “kendisi + eşi” */
    serbestMetin?: string;
    digerKatilacak?: boolean;
    katilabilirMi?: boolean;
    riskNotu?: string;
  };
  zamanlama?: {
    haftalikSaat?: "yes" | "partial" | "no" | "";
    /** Tek tık: hemen / 1–3 ay / belirsiz → aciliyet kapısına senkron */
    zamanHedefi?: "hemen" | "1_3_ay" | "belirsiz" | "";
    neZamanBasla?: string;
    engel?: string;
    not?: string;
  };
  mentalite?: {
    etiket?: string;
    /** Pozitif / negatif etiket id’leri — çoklu seçim */
    tagIds?: string[];
    blacklistSebebi?: string;
  };
  /** Closer için altın değerinde */
  satisAcisi?: string;
  setterDegerlendirme?: {
    leadKalitesi?: string;
    isteklilik?: number;
    kapanmaPotansiyeli?: number;
    riskler?: string;
    closerNot?: string;
  };
  sonuc?: {
    durum?: "kalifiye" | "potansiyel" | "followup" | "uygun_degil" | "blacklist";
    sonrakiAksiyon?: string;
    aksiyonTarihi?: string;
    randevuVerildi?: boolean;
    zoomTarihi?: string;
    redSebebi?: string;
  };
};

export function parseQualJson(raw: string | null | undefined): QualificationJson | null {
  if (!raw?.trim()) return null;
  try {
    return JSON.parse(raw) as QualificationJson;
  } catch {
    return null;
  }
}

export function isFiveGatesConfirmed(q: QualificationJson | null): boolean {
  if (!q) return false;
  return Boolean(
    q.need?.confirmed &&
      q.budget?.confirmed &&
      q.decisionMaker?.confirmed &&
      q.urgency?.confirmed &&
      q.goldenStandard?.confirmed
  );
}

const GATE_LABELS = [
  "İhtiyaç",
  "Bütçe",
  "Karar verici",
  "Aciliyet",
  "Mentalite",
] as const;

export function qualificationGateSteps(q: QualificationJson | null): {
  done: number;
  total: number;
  pct: number;
  steps: { label: string; ok: boolean }[];
} {
  const steps = [
    { label: GATE_LABELS[0], ok: Boolean(q?.need?.confirmed) },
    { label: GATE_LABELS[1], ok: Boolean(q?.budget?.confirmed) },
    { label: GATE_LABELS[2], ok: Boolean(q?.decisionMaker?.confirmed) },
    { label: GATE_LABELS[3], ok: Boolean(q?.urgency?.confirmed) },
    { label: GATE_LABELS[4], ok: Boolean(q?.goldenStandard?.confirmed) },
  ];
  const done = steps.filter((s) => s.ok).length;
  return { done, total: 5, pct: Math.round((done / 5) * 100), steps };
}

/** Zoom planlanabilir mi? */
export function canScheduleZoom(q: QualificationJson | null): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!isFiveGatesConfirmed(q)) {
    reasons.push("5 kalifikasyon kutusu tamamlanmalı (ihtiyaç, bütçe, karar verici, aciliyet, altın standart).");
    return { ok: false, reasons };
  }
  if (q?.goldenStandard?.fit === "not_suitable") {
    reasons.push("Altın standart: uygun değil — Zoom açılamaz.");
    return { ok: false, reasons };
  }
  if (q?.budget?.category === "below_3000") {
    reasons.push("Bütçe 3000€ altı — closer/Zoom öncesi nurture veya follow-up.");
    return { ok: false, reasons };
  }
  if (q?.decisionMaker?.who && q.decisionMaker.who !== "self") {
    if (!q.decisionMaker.coAttendeeWillJoin) {
      reasons.push(
        "Karar verici siz değilseniz: diğer kişinin Zoom’a katılacağını onaylayın."
      );
      return { ok: false, reasons };
    }
  }
  return { ok: true, reasons };
}
