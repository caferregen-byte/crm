import { fieldsToNarrative, type FlatFields } from "./wufoo";

export type AiLeadAnalysis = {
  summary: string;
  budgetAnalysis: string;
  intentScore: number;
  qualificationScore: number;
  budgetTier: number;
  recommendedAngle: string;
  nextStepHint: string;
};

function heuristicAnalysis(text: string): AiLeadAnalysis {
  const safe = typeof text === "string" ? text : "";
  const lower = safe.toLowerCase();
  let intent = 50;
  let qual = 50;
  let budgetTier = 1;

  if (/€|eur|euro|usd|\$|bütçe|budget|reklam|ad spend/i.test(text)) {
    intent += 10;
    budgetTier = 2;
  }
  if (/acil|hemen|this week|bu hafta|asap/i.test(text)) intent += 15;
  if (/kararsız|belki|later|sonra|düşüneyim/i.test(text)) intent -= 15;
  if (/3000|3\s*000|yüksek|high ticket|premium/i.test(text)) {
    budgetTier = Math.max(budgetTier, 3);
    qual += 15;
  }

  intent = Math.max(0, Math.min(100, intent));
  qual = Math.max(0, Math.min(100, qual));

  return {
    summary:
      safe.length > 20
        ? `Özet: Başvuru metni ${safe.length} karakter; anahtar kelimelere göre orta-yüksek ilgi sinyali.`
        : "Özet: Çok kısa başvuru — önce tamamlanması veya telefonla netleştirilmesi gerekir.",
    budgetAnalysis:
      budgetTier >= 2
        ? "Bütçe: Metinde bütçe/reklam harcaması ima ediliyor; teklif öncesi rakam netleştir."
        : "Bütçe: Net rakam yok; ilk görüşmede reklam bütçesi ve hazır ödeme kapasitesi sorulmalı.",
    intentScore: intent,
    qualificationScore: qual,
    budgetTier,
    recommendedAngle:
      "Önce hedefi ve mevcut durumu netleştir; 3000€+ paket için ROI ve zaman kazancı çerçevesinde konuş.",
    nextStepHint:
      intent >= 60
        ? "Kısa bir ön görüşme + takvim linki; karar verici mi teyit et."
        : "Önce ihtiyaç ve engel (para/zaman/güven) keşfi; sonra Zoom.",
  };
}

export async function analyzeLeadFromFields(fields: FlatFields): Promise<AiLeadAnalysis> {
  const narrative = fieldsToNarrative(fields);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return heuristicAnalysis(narrative);
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: `Sen yüksek fiyatlı (3000€+) koçluk/danışmanlık satışlarında uzman bir closer'sın.
JSON döndür. Alanlar: summary (kısa Türkçe), budgetAnalysis (Türkçe), intentScore (0-100), qualificationScore (0-100), budgetTier (0-4), recommendedAngle (Türkçe satış açısı), nextStepHint (Türkçe sonraki adım).`,
          },
          {
            role: "user",
            content: `Wufoo başvuru alanları:\n${narrative}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      return heuristicAnalysis(narrative);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return heuristicAnalysis(narrative);
    const parsed = JSON.parse(raw) as AiLeadAnalysis;
    return {
      summary: parsed.summary,
      budgetAnalysis: parsed.budgetAnalysis,
      intentScore: clamp(parsed.intentScore, 0, 100),
      qualificationScore: clamp(parsed.qualificationScore, 0, 100),
      budgetTier: clamp(parsed.budgetTier, 0, 4),
      recommendedAngle: parsed.recommendedAngle,
      nextStepHint: parsed.nextStepHint,
    };
  } catch {
    return heuristicAnalysis(narrative);
  }
}

function clamp(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}
