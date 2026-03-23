/**
 * Zoom sonrası satış olmadıysa — kalifikasyon notları ve lostReason'a göre
 * follow-up önerisi üretir.
 */

export type FollowUpAdvice = {
  summary: string;
  whenToCall: string;
  angle: string;
  talkingPoints: string[];
};

function heuristicFollowUp(notes: string, lostReason: string | null): FollowUpAdvice {
  const text = `${notes} ${lostReason ?? ""}`.toLowerCase();
  let when = "2–3 hafta sonra tekrar ara.";
  let angle = "ROI ve zaman kazancı üzerinden yaklaş.";
  const points: string[] = [];

  if (/para|bütçe|pahalı|€|budget/i.test(text)) {
    points.push("Taksit veya küçük başlangıç paketi öner.");
    angle = "Ödeme planı ve fırsat maliyeti.";
  }
  if (/zaman|meşgul|yoğun|busy/i.test(text)) {
    points.push("Biz yükü alıyoruz — zaman kazancı vurgula.");
    when = "1–2 hafta sonra ara.";
  }
  if (/kararsız|düşün|belki|later/i.test(text)) {
    points.push("Karar vermemenin maliyetini göster.");
    angle = "Güven inşa et; vaka örneği paylaş.";
    when = "1 hafta sonra ara.";
  }
  if (/eğitim|hazır değil|not ready/i.test(text)) {
    points.push("Eğitim eksikliği ve fırsat maliyeti.");
    when = "3 hafta sonra ara.";
  }

  if (points.length === 0) points.push("Acı noktasına ve hedefe odaklan.");

  return {
    summary: "Zoom yapıldı ancak satış olmadı. Kalifikasyon notlarına göre follow-up stratejisi.",
    whenToCall: when,
    angle,
    talkingPoints: points,
  };
}

export async function generateFollowUpAdvice(params: {
  qualificationNotes: string | null;
  lostReason: string | null;
  aiSummary: string | null;
  aiRecommendedAngle: string | null;
  name: string | null;
}): Promise<FollowUpAdvice> {
  const { qualificationNotes, lostReason, aiSummary, aiRecommendedAngle, name } = params;
  const combined = [
    qualificationNotes ?? "",
    lostReason ?? "",
    aiSummary ?? "",
    aiRecommendedAngle ?? "",
  ].join("\n");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return heuristicFollowUp(combined, lostReason);
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
        temperature: 0.5,
        messages: [
          {
            role: "system",
            content: `Sen 3000€+ high-ticket satışında uzman bir closer'sın. Zoom yapıldı ama satış olmadı.
JSON döndür: summary (kısa), whenToCall (Türkçe ne zaman ara), angle (hangi açıdan yaklaş), talkingPoints (string array, 2-4 madde).`,
          },
          {
            role: "user",
            content: `Lead: ${name ?? "İsimsiz"}
Kalifikasyon notları: ${qualificationNotes ?? "—"}
Kaybedilme sebebi: ${lostReason ?? "—"}
Önceki AI özet: ${aiSummary ?? "—"}
Önceki önerilen açı: ${aiRecommendedAngle ?? "—"}

Bu kişiyle follow-up için ne zaman arayayım, hangi açıdan yaklaşayım, neler söyleyeyim?`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) return heuristicFollowUp(combined, lostReason);

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return heuristicFollowUp(combined, lostReason);

    const parsed = JSON.parse(raw) as FollowUpAdvice;
    return {
      summary: parsed.summary ?? heuristicFollowUp(combined, lostReason).summary,
      whenToCall: parsed.whenToCall ?? "2–3 hafta sonra tekrar ara.",
      angle: parsed.angle ?? "Acı noktası ve hedefe odaklan.",
      talkingPoints: Array.isArray(parsed.talkingPoints)
        ? parsed.talkingPoints.filter((p): p is string => typeof p === "string")
        : heuristicFollowUp(combined, lostReason).talkingPoints,
    };
  } catch {
    return heuristicFollowUp(combined, lostReason);
  }
}
