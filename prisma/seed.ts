import { PrismaClient } from "@prisma/client";
import {
  LeadCompleteness,
  LeadTag,
  PipelineStage,
} from "../src/lib/crm-constants";

const prisma = new PrismaClient();

async function main() {
  await prisma.lead.deleteMany();

  await prisma.lead.create({
    data: {
      wufooEntryId: "seed-1",
      wufooFormName: "Demo form",
      name: "Eksik Başvuru",
      email: "eksik@example.com",
      completeness: LeadCompleteness.INCOMPLETE,
      stage: PipelineStage.NEW_LEAD,
      tag: LeadTag.INCOMPLETE_LEAD,
      rawWufooPayload: JSON.stringify({
        Field1: "Eksik",
        Field2: "",
        Field3: "",
      }),
    },
  });

  await prisma.lead.create({
    data: {
      wufooEntryId: "seed-2",
      wufooFormName: "Demo form",
      name: "Tam Başvuru",
      email: "tam@example.com",
      phone: "+90 555 000 00 00",
      completeness: LeadCompleteness.COMPLETE,
      stage: PipelineStage.REVIEWING,
      tag: LeadTag.NONE,
      intentScore: 72,
      qualificationScore: 68,
      budgetTier: 3,
      aiSummary:
        "Reklam ve ölçeklendirme konusunda net hedefi var; bütçe ayırabileceğini ima ediyor.",
      aiBudgetAnalysis:
        "Orta-üst bütçe bandı; 3000€ paket için ödeme kapasitesi netleştirilmeli.",
      aiRecommendedAngle:
        "ROI ve zaman kazancı; Zoom’da somut 90 günlük plan göster.",
      aiNextStepHint: "Kısa ön görüşme + Zoom linki; karar verici mi sor.",
      aiGeneratedAt: new Date(),
      rawWufooPayload: JSON.stringify({
        Field1: "Tam Başvuru",
        Field2: "tam@example.com",
        Field3: "Merhaba, eğitimimi tamamladım ve reklam bütçem aylık 2000€.",
      }),
      statusHistory: {
        create: {
          fromStage: null,
          toStage: PipelineStage.REVIEWING,
          note: "Seed",
        },
      },
    },
  });

  console.log("Seed OK: 2 lead");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
