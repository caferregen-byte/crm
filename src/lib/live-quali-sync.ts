import type { QualificationJson } from "@/lib/qualification";

export const MENTALITE_POZITIF = new Set(["acik_fikirli", "saygili", "kararli"]);

export const MENTALITE_NEGATIF = new Set([
  "bahaneli",
  "cok_bahaneli",
  "egolu",
  "zor_musteri",
  "blacklist_adayi",
]);

export type GateUiStatus = "ok" | "warn" | "bad" | "empty";

export type ZoomGateRow = {
  id: string;
  label: string;
  status: GateUiStatus;
};

/** Sağ panel: tıklama + tooltip için */
export type ZoomGateRowDetail = ZoomGateRow & {
  sectionId: string;
  why: string;
  fix: string;
};

type KararVericiKim = NonNullable<QualificationJson["kararVerici"]>["kim"];

function mapKararVericiKimToDmWho(
  kim: KararVericiKim | undefined
): "" | NonNullable<QualificationJson["decisionMaker"]>["who"] {
  if (!kim) return "";
  if (kim === "team") return "manager";
  return kim;
}

function migrateLegacyMentalite(q: QualificationJson): QualificationJson {
  if (q.mentalite?.tagIds?.length) return q;
  const e = q.mentalite?.etiket?.trim();
  if (!e) return q;
  return {
    ...q,
    mentalite: { ...q.mentalite, tagIds: [e] },
  };
}

function triLevelStatus(
  v: "low" | "medium" | "high" | "" | undefined
): GateUiStatus {
  if (v === "high") return "ok";
  if (v === "medium") return "warn";
  if (v === "low") return "bad";
  return "empty";
}

/**
 * Sağ panel “Zaman uygunluğu”: sadece haftalık programa ayırılan süre (`haftalikSaat`).
 * Başlangıç zamanı (hemen / 1–3 ay / belirsiz) bu satırı etkilemez — o ayrı “Ne zaman başlayabiliyor?” satırında.
 */
function zamanUygunluguHaftalik(hs: string): { status: GateUiStatus; why: string; fix: string } {
  if (!hs) {
    return {
      status: "empty",
      why: "Haftalık program süresi seçilmedi.",
      fix: "Adım 7’de “Haftada 5–6 saat ayırır mı?” sorusunu işaretle.",
    };
  }
  if (hs === "yes") {
    return {
      status: "ok",
      why: "Programa haftalık süre ayırıyor (evet).",
      fix: "—",
    };
  }
  if (hs === "partial") {
    return {
      status: "warn",
      why: "Kısmen zaman ayırıyor.",
      fix: "Mümkünse “Evet”e çek veya netlik kazan.",
    };
  }
  if (hs === "no") {
    return {
      status: "bad",
      why: "Haftada 5–6 saat ayırmıyor.",
      fix: "“Evet” veya en azından “Kısmen” seç.",
    };
  }
  return { status: "empty", why: "—", fix: "—" };
}

/** Sağ panel: “Ne zaman başlayabiliyor?” — hemen yeşil, 1–3 ay turuncu, belirsiz kırmızı */
function neZamanBaslayabilirStatus(zh: string): { status: GateUiStatus; why: string; fix: string } {
  if (!zh) {
    return {
      status: "empty",
      why: "Başlangıç zamanı seçilmedi.",
      fix: "Adım 7’de “Ne zaman başlar?” → Hemen / 1–3 ay / Belirsiz.",
    };
  }
  if (zh === "hemen") {
    return {
      status: "ok",
      why: "Hemen başlayabiliyor.",
      fix: "—",
    };
  }
  if (zh === "1_3_ay") {
    return {
      status: "warn",
      why: "1–3 ay içinde başlayabilir.",
      fix: "Gerekirse netleştir veya “Hemen”e çek.",
    };
  }
  if (zh === "belirsiz") {
    return {
      status: "bad",
      why: "Başlangıç zamanı belirsiz.",
      fix: "Somut bir çerçeve seç (Hemen veya 1–3 ay).",
    };
  }
  return {
    status: "empty",
    why: "—",
    fix: "—",
  };
}

/** Prensip (Evet/Hayır) + teyit (hemen / likit) → şerit rengi */
function budgetGateFromQualification(q: QualificationJson): {
  status: GateUiStatus;
  why: string;
  fix: string;
} {
  const y = q.butce?.yatirimYapilabilir ?? "";
  const hm = q.butce?.teyitHemenMumkun ?? "";
  const lk = q.butce?.teyitLikit ?? "";

  if (y === "no") {
    return {
      status: "bad",
      why: "Prensip olarak bu banda yatırım yapılamıyor.",
      fix: "“Bütçe — prensip” bölümünde durumu netleştir.",
    };
  }
  if (y === "maybe") {
    return {
      status: "warn",
      why: "Prensip belirsiz (kısmen).",
      fix: "Evet veya Hayır ile netleştir.",
    };
  }
  if (!y) {
    return {
      status: "empty",
      why: "Prensip sorusu seçilmedi.",
      fix: "“Bütçe — prensip” bölümünde Evet veya Hayır işaretle.",
    };
  }
  if (!hm || !lk) {
    return {
      status: "empty",
      why: "Teyit soruları eksik.",
      fix: "“Bütçe — teyit” bölümünü doldur.",
    };
  }
  if (hm === "no" || lk === "no") {
    return {
      status: "bad",
      why: "Hemen mümkün değil veya likit yok.",
      fix: "Teyit seçeneklerini güncelle.",
    };
  }
  if (lk === "yes" && hm === "yes") {
    return {
      status: "ok",
      why: "Hemen mümkün ve likit erişim var.",
      fix: "—",
    };
  }
  if (lk === "partial" || hm === "birikim") {
    return {
      status: "warn",
      why: "Kısmen likit veya birikim gerekli.",
      fix: "Mümkünse Evet’e çek veya riski not al.",
    };
  }
  return {
    status: "warn",
    why: "Teyit netleştirilmeli.",
    fix: "“Bütçe — teyit” bölümünü tamamla.",
  };
}

export function applyLiveSyncToQualification(q: QualificationJson): QualificationJson {
  const out: QualificationJson = migrateLegacyMentalite({ ...q });

  const problem = (out.aciNoktalari?.enBuyukProblem ?? "").trim();
  const aciSeviye = out.aciNoktalari?.aciliyet;
  const painOk =
    problem.length > 0 &&
    (aciSeviye === "low" || aciSeviye === "medium" || aciSeviye === "high");

  out.need = {
    ...out.need,
    problem: out.aciNoktalari?.enBuyukProblem ?? out.need?.problem,
    painLevel:
      aciSeviye === "high"
        ? "high"
        : aciSeviye === "medium"
          ? "medium"
          : aciSeviye === "low"
            ? "low"
            : out.need?.painLevel,
    confirmed: painOk,
  };

  const budgetGate = budgetGateFromQualification(out);
  const budgetOk = budgetGate.status === "ok";
  const y = out.butce?.yatirimYapilabilir;
  out.budget = {
    ...out.budget,
    confirmed: budgetOk,
    category:
      y === "yes"
        ? "3000_6000"
        : y === "maybe"
          ? "3000_6000"
          : y === "no"
            ? "below_3000"
            : out.budget?.category,
  };

  const dm = (out.kararVerici?.serbestMetin ?? "").trim();
  const legacyKim = out.kararVerici?.kim;
  const dmOk = dm.length >= 2 || Boolean(legacyKim && String(legacyKim).length > 0);
  out.decisionMaker = {
    ...out.decisionMaker,
    who: dm.length >= 2 ? "other" : mapKararVericiKimToDmWho(legacyKim) || out.decisionMaker?.who || "",
    confirmed: dmOk,
    coAttendeeWillJoin: dmOk ? true : out.decisionMaker?.coAttendeeWillJoin,
  };

  const zh = out.zamanlama?.zamanHedefi ?? "";
  const hs = out.zamanlama?.haftalikSaat ?? "";

  const timingOk = zh === "hemen" || zh === "1_3_ay";
  const capacityOk = hs === "yes" || hs === "partial";
  const timingBad = zh === "belirsiz";
  const capacityBad = hs === "no";

  let uOk = false;
  let level: "HOT" | "WARM" | "COLD" | "" = "";

  if (zh && hs) {
    if (timingBad || capacityBad) {
      uOk = false;
      level = "COLD";
    } else if (timingOk && capacityOk) {
      uOk = true;
      level = zh === "hemen" ? "HOT" : "WARM";
    } else {
      uOk = true;
      level = "WARM";
    }
  }

  out.urgency = {
    ...out.urgency,
    level: level || out.urgency?.level,
    confirmed: uOk,
  };

  const tags = out.mentalite?.tagIds ?? [];
  const hasNeg = tags.some((t) => MENTALITE_NEGATIF.has(t));
  const hasPos = tags.some((t) => MENTALITE_POZITIF.has(t));

  const offer = out.cozum?.offerUygun;

  let fit: "suitable" | "risky" | "not_suitable" | "" = "";
  let gsConfirmed = false;

  if (offer === false) {
    fit = "not_suitable";
    gsConfirmed = true;
  } else if (offer === true) {
    if (tags.length === 0) {
      fit = "";
      gsConfirmed = false;
    } else if (hasNeg) {
      fit = "not_suitable";
      gsConfirmed = true;
    } else if (hasPos) {
      fit = "suitable";
      gsConfirmed = true;
    }
  } else {
    if (tags.length === 0) {
      fit = "";
      gsConfirmed = false;
    } else if (hasNeg) {
      fit = "not_suitable";
      gsConfirmed = true;
    } else if (hasPos) {
      fit = "suitable";
      gsConfirmed = true;
    }
  }

  out.goldenStandard = {
    ...out.goldenStandard,
    fit,
    confirmed: gsConfirmed,
    reason:
      offer === false
        ? "Çözüm / model uygun değil"
        : hasNeg
          ? tags.filter((t) => MENTALITE_NEGATIF.has(t)).join(", ")
          : out.goldenStandard?.reason,
  };

  return out;
}

export function mentaliteSkoru(tagIds: string[] | undefined): number {
  const tags = tagIds ?? [];
  if (tags.length === 0) return 0;
  let p = 0;
  let n = 0;
  for (const t of tags) {
    if (MENTALITE_POZITIF.has(t)) p += 1;
    if (MENTALITE_NEGATIF.has(t)) n += 1;
  }
  if (n > 0) return Math.max(0, 35 - n * 15);
  if (p === 0) return 20;
  return Math.min(100, 55 + p * 15);
}

/** Sağ panel satırları — “Zaman uygunluğu” (haftalık) ve “Ne zaman başlayabiliyor?” (başlangıç) birbirinden bağımsız */
export function zoomGateDashboardRowsDetailed(q: QualificationJson): ZoomGateRowDetail[] {
  const aci = q.aciNoktalari?.aciliyet;
  let painRow: GateUiStatus = "empty";
  if (aci) painRow = triLevelStatus(aci);
  else if ((q.aciNoktalari?.enBuyukProblem ?? "").trim()) painRow = "warn";

  const painWhy =
    aci === "low"
      ? "Aciliyet düşük seçildi."
      : aci === "medium"
        ? "Aciliyet orta — derinleştir."
        : aci === "high"
          ? "Acı ve aciliyet net."
          : (q.aciNoktalari?.enBuyukProblem ?? "").trim()
            ? "Aciliyet seçilmedi."
            : "Problem veya aciliyet eksik.";
  const painFix =
    aci === "low"
      ? "Aciliyeti “Orta” veya “Yüksek” yap veya problemi netleştir."
      : "Acı noktaları adımında problem + aciliyet doldur.";

  const ou = q.cozum?.offerUygun;
  let cozRow: GateUiStatus = "empty";
  if (ou === true) cozRow = "ok";
  else if (ou === false) cozRow = "bad";
  const cozWhy =
    ou === false
      ? "Model / hizmet uygun değil (Hayır)."
      : ou === true
        ? "Çözüm uyumu: Evet."
        : "Henüz Evet/Hayır işaretlenmedi.";
  const cozFix = ou === false ? "Uygun aday değilse Zoom öncesi kapat." : "“Evet” ile işaretle.";

  const ha = q.hedef?.hedefAciliyeti;
  let hedefRow: GateUiStatus = triLevelStatus(ha);
  const hedefWhy =
    ha === "low"
      ? "Hedef motivasyon düşük."
      : ha === "medium"
        ? "Hedef motivasyon orta."
        : ha === "high"
          ? "Hedef motivasyon güçlü."
          : "Hedef motivasyon seçilmedi.";
  const hedefFix = "Hedef adımında motivasyon aciliyetini seç.";

  const budgetG = budgetGateFromQualification(q);
  const budgetS = budgetG.status;
  const budgetWhy = budgetG.why;
  const budgetFix = budgetG.fix;
  const yB = q.butce?.yatirimYapilabilir ?? "";
  const budgetSectionId =
    yB === "no" || yB === "" || yB === "maybe" ? "butce" : "butce_teyit";

  const dm = (q.kararVerici?.serbestMetin ?? "").trim();
  const dmLegacy = Boolean(q.kararVerici?.kim);
  const dmS: GateUiStatus =
    dm.length >= 2 || dmLegacy ? "ok" : dm.length > 0 ? "warn" : "empty";
  const dmWhy =
    dm.length >= 2 || dmLegacy
      ? "Karar verici notu yeterli."
      : dm.length > 0
        ? "Kısa not — netleştir."
        : "Karar verici yazılmadı.";
  const dmFix = "“Kendisi + eşi” gibi net yaz.";

  const zh = q.zamanlama?.zamanHedefi ?? "";
  const hs = q.zamanlama?.haftalikSaat ?? "";
  const tf = zamanUygunluguHaftalik(hs);
  const neZaman = neZamanBaslayabilirStatus(zh);

  const tags = q.mentalite?.tagIds ?? [];
  let mentS: GateUiStatus = "empty";
  if (tags.some((t) => MENTALITE_NEGATIF.has(t))) mentS = "bad";
  else if (tags.some((t) => MENTALITE_POZITIF.has(t))) mentS = "ok";
  else if (tags.length > 0) mentS = "warn";

  const negLabs = tags.filter((t) => MENTALITE_NEGATIF.has(t));
  const posLabs = tags.filter((t) => MENTALITE_POZITIF.has(t));
  const mentWhy =
    negLabs.length > 0
      ? `Negatif sinyal: ${negLabs.join(", ")}.`
      : posLabs.length > 0
        ? "Pozitif sinyaller seçildi."
        : tags.length > 0
          ? "Karışık etiket."
          : "Etiket seçilmedi.";
  const mentFix =
    negLabs.length > 0
      ? "Negatif etiketleri kaldır veya uygun değil kapat."
      : "Pozitif etiket seç (açık fikirli, saygılı, kararlı).";

  return [
    { id: "pain", label: "Acı / aciliyet", status: painRow, sectionId: "aci_noktalari", why: painWhy, fix: painFix },
    { id: "cozum", label: "Çözüm uyumu", status: cozRow, sectionId: "cozum", why: cozWhy, fix: cozFix },
    { id: "hedefMot", label: "Hedef motivasyon", status: hedefRow, sectionId: "hedef", why: hedefWhy, fix: hedefFix },
    {
      id: "budget",
      label: "Bütçe",
      status: budgetS,
      sectionId: budgetSectionId,
      why: budgetWhy,
      fix: budgetFix,
    },
    { id: "dm", label: "Karar verici", status: dmS, sectionId: "karar_verici", why: dmWhy, fix: dmFix },
    {
      id: "timeFit",
      label: "Zaman uygunluğu",
      status: tf.status,
      sectionId: "zaman",
      why: tf.why,
      fix: tf.fix,
    },
    {
      id: "neZamanBasla",
      label: "Ne zaman başlayabiliyor?",
      status: neZaman.status,
      sectionId: "zaman",
      why: neZaman.why,
      fix: neZaman.fix,
    },
    { id: "mental", label: "Mentalite", status: mentS, sectionId: "mentalite", why: mentWhy, fix: mentFix },
  ];
}

export function zoomGateDashboardRows(q: QualificationJson): ZoomGateRow[] {
  return zoomGateDashboardRowsDetailed(q).map(({ id, label, status }) => ({ id, label, status }));
}

export function mentaliteStatusLabel(status: GateUiStatus): { emoji: string; text: string } {
  if (status === "ok") return { emoji: "🟢", text: "Uygun" };
  if (status === "warn") return { emoji: "🟠", text: "Riskli" };
  if (status === "bad") return { emoji: "🔴", text: "Problemli" };
  return { emoji: "⚪", text: "Boş" };
}
