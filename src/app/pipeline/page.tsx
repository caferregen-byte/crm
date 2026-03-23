import { prisma } from "@/lib/db";
import { runPrisma } from "@/lib/safe-prisma";
import { DbConnectionProblem } from "@/components/db-connection-problem";
import { PipelineKanban } from "@/components/pipeline-kanban";
import { PipelineStage } from "@/lib/crm-constants";

export const dynamic = "force-dynamic";

const COLUMNS: { stage: string; title: string; color: string }[] = [
  { stage: PipelineStage.NEW_LEAD, title: "Yeni", color: "neutral" },
  { stage: "INCOMPLETE", title: "Yarım", color: "neutral" },
  { stage: PipelineStage.REVIEWING, title: "İnceleme", color: "neutral" },
  { stage: PipelineStage.CONTACT_ATTEMPT, title: "Arandı", color: "neutral" },
  { stage: PipelineStage.QUALIFICATION_CALL, title: "Kalifikasyon", color: "neutral" },
  { stage: PipelineStage.QUALIFIED, title: "Kalifiye", color: "neutral" },
  { stage: PipelineStage.ZOOM_SCHEDULED, title: "Zoom", color: "neutral" },
  { stage: PipelineStage.ZOOM_DONE, title: "Zoom bitti", color: "neutral" },
  { stage: PipelineStage.FOLLOW_UP, title: "Takip", color: "neutral" },
  { stage: PipelineStage.UNQUALIFIED, title: "Uygun değil", color: "neutral" },
  { stage: PipelineStage.BLACKLIST, title: "Blacklist", color: "neutral" },
];

export default async function PipelinePage() {
  const leadsRes = await runPrisma(() =>
    prisma.lead.findMany({
      where: {},
      orderBy: [{ stage: "asc" }, { createdAt: "desc" }],
    })
  );

  if (!leadsRes.ok) {
    return <DbConnectionProblem detail={leadsRes.message} />;
  }
  const leads = leadsRes.data;

  const byStage: Record<string, typeof leads> = {};
  for (const col of COLUMNS) {
    byStage[col.stage] = [];
  }
  for (const lead of leads) {
    let stage = lead.stage;
    if (lead.completeness === "INCOMPLETE" && lead.stage === PipelineStage.NEW_LEAD) {
      stage = "INCOMPLETE";
    }
    if (byStage[stage]) {
      byStage[stage].push(lead);
    } else {
      byStage[PipelineStage.NEW_LEAD] ??= [];
      byStage[PipelineStage.NEW_LEAD].push(lead);
    }
  }

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-apple-heading text-[var(--foreground)]">Pipeline</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
          Kartı sürükleyerek aşama değiştir
        </p>
      </header>
      <PipelineKanban columns={COLUMNS} leadsByStage={byStage} />
    </div>
  );
}
