import type { QualificationJson } from "@/lib/qualification";
import { parseQualJson, qualificationGateSteps } from "@/lib/qualification";

/** Intent skoru için anlamlı bant */
export function intentBand(score: number | null | undefined): {
  label: string;
  tone: "hot" | "warm" | "cold" | "unknown";
} {
  if (score == null || Number.isNaN(score))
    return { label: "Veri yok", tone: "unknown" };
  if (score >= 70) return { label: "Sıcak (70+)", tone: "hot" };
  if (score >= 40) return { label: "Orta (40–69)", tone: "warm" };
  return { label: "Düşük (<40)", tone: "cold" };
}

/**
 * Heuristik kapanış olasılığı (0–100). AI yokken bile “pasif değil” hissi verir.
 * İleride model skoru ile değiştirilebilir.
 */
export function estimateCloseProbability(input: {
  intentScore: number | null | undefined;
  qualificationPct: number;
  stage: string;
  isBlacklisted: boolean;
}): number {
  if (input.isBlacklisted) return 0;
  const intent = Math.min(100, Math.max(0, input.intentScore ?? 35));
  const qual = Math.min(100, Math.max(0, input.qualificationPct));
  let stageBoost = 0;
  if (["QUALIFIED", "ZOOM_SCHEDULED", "ZOOM_DONE"].includes(input.stage)) stageBoost = 12;
  if (input.stage === "FOLLOW_UP") stageBoost = 6;
  const raw = intent * 0.38 + qual * 0.42 + stageBoost;
  return Math.min(97, Math.max(8, Math.round(raw)));
}

export function heuristicRisks(qualJson: string | null): string[] {
  const q = parseQualJson(qualJson);
  const risks: string[] = [];
  if (!q?.budget?.confirmed) risks.push("Bütçe henüz net değil");
  if (!q?.decisionMaker?.confirmed) risks.push("Karar verici net değil");
  if (q?.budget?.category === "below_3000") risks.push("Bütçe bandı düşük (3000€ altı)");
  if (q?.goldenStandard?.fit === "risky") risks.push("Altın standart: riskli profil");
  if (risks.length === 0 && q) {
    const z = qualificationGateSteps(q);
    if (z.pct < 100) risks.push("Kalifikasyon kapıları tamamlanmadı");
  }
  return risks.slice(0, 4);
}

export type GateCheckStatus = "done" | "progress" | "open";

function needProgress(n?: QualificationJson["need"]): boolean {
  if (!n) return false;
  return Boolean(
    (n.currentSituation ?? "").trim() ||
      (n.targetSituation ?? "").trim() ||
      (n.problem ?? "").trim() ||
      (n.painLevel ?? "")
  );
}

function budgetProgress(b?: QualificationJson["budget"]): boolean {
  if (!b) return false;
  return Boolean(
    (b.estimate ?? "").trim() || (b.category ?? "") !== "" || b.hasLiquidity === true
  );
}

function dmProgress(d?: QualificationJson["decisionMaker"]): boolean {
  if (!d) return false;
  return (d.who ?? "") !== "";
}

function urgencyProgress(u?: QualificationJson["urgency"]): boolean {
  if (!u) return false;
  return (u.level ?? "") !== "";
}

function gsProgress(g?: QualificationJson["goldenStandard"]): boolean {
  if (!g) return false;
  return (g.fit ?? "") !== "" || (g.reason ?? "").trim().length > 0;
}

/** Checklist satırı: ✓ tamam · ⏳ başlandı · ○ boş */
export function gateChecklist(q: QualificationJson | null): {
  label: string;
  status: GateCheckStatus;
}[] {
  if (!q) {
    return [
      { label: "İhtiyaç", status: "open" },
      { label: "Bütçe", status: "open" },
      { label: "Karar verici", status: "open" },
      { label: "Aciliyet", status: "open" },
      { label: "Altın standart", status: "open" },
    ];
  }
  const rows: { label: string; status: GateCheckStatus }[] = [
    {
      label: "İhtiyaç",
      status: q.need?.confirmed ? "done" : needProgress(q.need) ? "progress" : "open",
    },
    {
      label: "Bütçe",
      status: q.budget?.confirmed ? "done" : budgetProgress(q.budget) ? "progress" : "open",
    },
    {
      label: "Karar verici",
      status: q.decisionMaker?.confirmed
        ? "done"
        : dmProgress(q.decisionMaker)
          ? "progress"
          : "open",
    },
    {
      label: "Aciliyet",
      status: q.urgency?.confirmed ? "done" : urgencyProgress(q.urgency) ? "progress" : "open",
    },
    {
      label: "Altın standart",
      status: q.goldenStandard?.confirmed
        ? "done"
        : gsProgress(q.goldenStandard)
          ? "progress"
          : "open",
    },
  ];
  return rows;
}

export function statusIcon(s: GateCheckStatus): string {
  if (s === "done") return "✓";
  if (s === "progress") return "⏳";
  return "○";
}
