/**
 * Tek kaynak: “şimdi ne yapılmalı?” — satış odaklı, kural tabanlı.
 */

export type NextActionKind =
  | "call_now"
  | "follow_up"
  | "qualify"
  | "offer"
  | "zoom"
  | "note"
  | "review";

export type AutoNextAction = {
  headline: string;
  subline: string;
  cta: string;
  href?: string;
  tone: "now" | "hot" | "schedule" | "nurture" | "review";
  /** Sistem önerdiği aksiyon tipi */
  kind: NextActionKind;
};

type LeadLike = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  stage: string;
  completeness: string;
  isBlacklisted: boolean;
  seenAt: Date | null;
  nextFollowUpAt: Date | null;
  zoomScheduledAt: Date | null;
  intentScore: number | null;
  lastContactAt: Date | null;
};

function fmt(d: Date) {
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function computeAutoNextAction(lead: LeadLike): AutoNextAction {
  if (lead.isBlacklisted) {
    return {
      headline: "Blacklist",
      subline: "Bu kayıt için yeni iletişim önerilmez.",
      cta: "Leadlere dön",
      href: "/leads",
      tone: "review",
      kind: "review",
    };
  }

  const now = new Date();
  const phone = lead.phone?.trim();
  const displayName =
    lead.name?.trim() ||
    lead.email?.trim() ||
    lead.phone?.trim() ||
    "Lead";

  const followDue =
    lead.nextFollowUpAt && new Date(lead.nextFollowUpAt) <= now;

  if (
    followDue &&
    [
      "FOLLOW_UP",
      "ZOOM_DONE",
      "CONTACTED",
      "CONTACT_ATTEMPT",
      "UNREACHABLE",
      "NEW_LEAD",
      "REVIEWING",
    ].includes(lead.stage)
  ) {
    return {
      headline: "SONRAKİ EN İYİ AKSİYON: Ara",
      subline: `${displayName} — takip tarihi geldi veya geçti. Önce temas, sonra kısa not.`,
      cta: phone ? "HEMEN ARA" : "Kayda git",
      href: phone ? `tel:${phone}` : `/leads/${lead.id}`,
      tone: "now",
      kind: "call_now",
    };
  }

  if (!lead.seenAt && lead.completeness === "INCOMPLETE") {
    return {
      headline: "SONRAKİ EN İYİ AKSİYON: İlk temas",
      subline: `${displayName} — yeni lead. Aç, ara, ihtiyacı işaretle.`,
      cta: phone ? "HEMEN ARA" : "Kaydı aç",
      href: phone ? `tel:${phone}` : `/leads/${lead.id}`,
      tone: "now",
      kind: "call_now",
    };
  }

  if (lead.stage === "ZOOM_SCHEDULED" && lead.zoomScheduledAt) {
    const z = new Date(lead.zoomScheduledAt);
    const today =
      z.getDate() === now.getDate() &&
      z.getMonth() === now.getMonth() &&
      z.getFullYear() === now.getFullYear();
    return {
      headline: "SONRAKİ EN İYİ AKSİYON: Zoom",
      subline: `${displayName} — ${today ? "Bugün" : "Yakında"} ${fmt(z)}`,
      cta: "Kaydı ve notları aç",
      href: `/leads/${lead.id}`,
      tone: "schedule",
      kind: "zoom",
    };
  }

  if (lead.intentScore != null && lead.intentScore >= 70 && lead.completeness === "COMPLETE") {
    return {
      headline: "SONRAKİ EN İYİ AKSİYON: Sıcak lead — kapat",
      subline: `${displayName} — intent yüksek. Teklif / net adım zamanı.`,
      cta: phone ? "HEMEN ARA" : "Aksiyon merkezi",
      href: phone ? `tel:${phone}` : `/leads/${lead.id}#lead-aksiyon`,
      tone: "hot",
      kind: "offer",
    };
  }

  if (lead.lastContactAt) {
    const days = Math.floor(
      (now.getTime() - new Date(lead.lastContactAt).getTime()) / 86400000
    );
    if (days >= 14) {
      return {
        headline: "SONRAKİ EN İYİ AKSİYON: Yeniden temas",
        subline: `${displayName} — ~${days} gündür sessiz. Tekrar ara veya nurture mesajı.`,
        cta: phone ? "Tekrar ara" : "Not ekle",
        href: phone ? `tel:${phone}` : `/leads/${lead.id}#lead-notlar`,
        tone: "nurture",
        kind: "follow_up",
      };
    }
  }

  if (lead.completeness === "INCOMPLETE" || lead.stage === "QUALIFICATION_CALL") {
    return {
      headline: "SONRAKİ EN İYİ AKSİYON: Kalifiye et",
      subline: `${displayName} — 5 kapıyı tamamla; Zoom ve teklif için zemin hazır olsun.`,
      cta: "Kalifikasyon akışı",
      href: `/leads/${lead.id}/quali`,
      tone: "review",
      kind: "qualify",
    };
  }

  return {
    headline: "SONRAKİ EN İYİ AKSİYON: Not + pipeline",
    subline: `${displayName} — görüşmeyi kayda yaz, uygunsa teklif veya follow-up tarihi seç.`,
    cta: "Not gir",
    href: `/leads/${lead.id}#lead-notlar`,
    tone: "review",
    kind: "note",
  };
}

export type PriorityBucket =
  | "newLeads"
  | "zoomToday"
  | "zoomThisWeek"
  | "followUp"
  | "waiting"
  | "greens"
  | "unreachables"
  | "yellows"
  | "recallables";

const BUCKET_LABEL: Record<PriorityBucket, string> = {
  newLeads: "Yeni lead",
  zoomToday: "Bugün Zoom",
  zoomThisWeek: "Bu hafta Zoom",
  followUp: "Follow-up",
  waiting: "Aramayı bekle",
  greens: "Sıcak (yeşil)",
  unreachables: "Ulaşılamayan",
  yellows: "Sarı form",
  recallables: "Tekrar ara",
};

export function labelForPriorityBucket(bucket: PriorityBucket): string {
  return BUCKET_LABEL[bucket] ?? bucket;
}
