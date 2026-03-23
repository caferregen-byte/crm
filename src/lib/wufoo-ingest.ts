import { prisma } from "@/lib/db";
import { LeadTag, PipelineStage } from "@/lib/crm-constants";
import {
  assessCompleteness,
  extractContactHints,
  flattenWufooBody,
} from "@/lib/wufoo";
import { analyzeLeadFromFields } from "@/lib/ai-analyze";

function requiredFieldKeysFromEnv(): string[] | null {
  const raw = process.env.WUFOO_REQUIRED_FIELDS?.trim();
  if (!raw) return null;
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function normEmail(e: string | undefined): string | null {
  if (!e?.trim()) return null;
  return e.trim().toLowerCase();
}

function normPhone(p: string | undefined): string | null {
  if (!p?.trim()) return null;
  const d = p.replace(/\D/g, "");
  return d.length >= 8 ? d : null;
}

const MERGE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type IngestWufooResult =
  | {
      ok: true;
      leadId: string;
      completeness: "INCOMPLETE" | "COMPLETE";
      missing: string[];
      updated: boolean;
    }
  | { ok: false; ignored: true; reason: "blacklisted" };

/**
 * Wufoo webhook veya Entries API’den gelen gövdeyi işler: sarı (eksik) ve yeşil (tam) lead’ler
 * aynı şekilde CRM’e yazılır; tam olanlarda AI analizi çalışır.
 */
export async function ingestWufooPayload(body: Record<string, unknown>): Promise<IngestWufooResult> {
  const fields = flattenWufooBody(body);
  const entryId =
    (fields.EntryId as string | undefined) ??
    (fields.Id as string | undefined) ??
    (fields.entryId as string | undefined);

  const formHash = fields.FormHash ?? fields.Hash ?? fields.formHash;
  const formName = fields.FormName ?? fields.formTitle;

  const { completeness, missing } = assessCompleteness(
    fields,
    requiredFieldKeysFromEnv()
  );

  const hints = extractContactHints(fields);
  const emailN = normEmail(hints.email);
  const phoneN = normPhone(hints.phone);

  const existingByEntry = entryId
    ? await prisma.lead.findUnique({
        where: { wufooEntryId: String(entryId) },
      })
    : null;

  if (existingByEntry?.isBlacklisted) {
    return { ok: false, ignored: true, reason: "blacklisted" };
  }

  let ai: Awaited<ReturnType<typeof analyzeLeadFromFields>> | undefined;
  if (completeness === "COMPLETE") {
    try {
      ai = await analyzeLeadFromFields(fields);
    } catch {
      /* AI opsiyonel */
    }
  }

  const data = {
    source: "WUFOO" as const,
    leadType:
      completeness === "COMPLETE" ? "COMPLETE_LEAD" : "INCOMPLETE_LEAD",
    wufooFormHash: formHash ? String(formHash) : null,
    wufooEntryId: entryId ? String(entryId) : null,
    wufooFormName: formName ? String(formName) : null,
    name: hints.name ?? null,
    email: hints.email ?? null,
    phone: hints.phone ?? null,
    rawWufooPayload: JSON.stringify(body),
    completeness,
    stage: PipelineStage.NEW_LEAD,
    tag:
      completeness === "COMPLETE" ? LeadTag.NONE : LeadTag.INCOMPLETE_LEAD,
    aiSummary: ai?.summary ?? null,
    aiBudgetAnalysis: ai?.budgetAnalysis ?? null,
    intentScore: ai?.intentScore ?? null,
    qualificationScore: ai?.qualificationScore ?? null,
    budgetTier: ai?.budgetTier ?? null,
    aiRecommendedAngle: ai?.recommendedAngle ?? null,
    aiNextStepHint: ai?.nextStepHint ?? null,
    aiGeneratedAt: ai ? new Date() : null,
  };

  if (existingByEntry) {
    const lead = await prisma.lead.update({
      where: { id: existingByEntry.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    return {
      ok: true,
      leadId: lead.id,
      completeness,
      missing,
      updated: true,
    };
  }

  // EntryId yeni geldi; önceki POST’ta EntryId olmadan oluşmuş kayıt varsa birleştir (yarım → tam akışı)
  if (entryId && (emailN || phoneN)) {
    const since = new Date(Date.now() - MERGE_WINDOW_MS);
    const or: { email?: string; phone?: string }[] = [];
    if (hints.email?.trim()) or.push({ email: hints.email.trim() });
    if (hints.phone?.trim()) or.push({ phone: hints.phone.trim() });

    if (or.length > 0) {
      const loose = await prisma.lead.findMany({
        where: {
          source: "WUFOO",
          wufooEntryId: null,
          createdAt: { gte: since },
          OR: or,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      const formStr = formHash ? String(formHash) : null;
      const merge = loose.find(
        (l) =>
          !l.isBlacklisted &&
          (!formStr || !l.wufooFormHash || l.wufooFormHash === formStr) &&
          ((emailN && normEmail(l.email ?? undefined) === emailN) ||
            (phoneN && normPhone(l.phone ?? undefined) === phoneN))
      );

      if (merge) {
        const lead = await prisma.lead.update({
          where: { id: merge.id },
          data: {
            ...data,
            wufooEntryId: String(entryId),
            updatedAt: new Date(),
          },
        });
        return {
          ok: true,
          leadId: lead.id,
          completeness,
          missing,
          updated: true,
        };
      }
    }
  }

  const lead = await prisma.lead.create({
    data: {
      ...data,
      statusHistory: {
        create: {
          fromStage: null,
          toStage: PipelineStage.NEW_LEAD,
          note: "Wufoo",
        },
      },
    },
  });

  return {
    ok: true,
    leadId: lead.id,
    completeness,
    missing,
    updated: false,
  };
}
