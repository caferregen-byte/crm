import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { runPrisma } from "@/lib/safe-prisma";
import { DbConnectionProblem } from "@/components/db-connection-problem";
import { LiveQualiForm } from "@/components/live-quali-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function LiveQualiPage({ params }: Props) {
  const { id } = await params;
  const leadRes = await runPrisma(() =>
    prisma.lead.findUnique({
      where: { id },
    })
  );

  if (!leadRes.ok) {
    return <DbConnectionProblem detail={leadRes.message} />;
  }
  const lead = leadRes.data;

  if (!lead || lead.isBlacklisted) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        Kalifikasyon
      </h1>
      <LiveQualiForm
        lead={{
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          source: lead.source,
          completeness: lead.completeness,
          callCount: lead.callCount,
          unreachableCount: lead.unreachableCount,
          lastCallAt: lead.lastCallAt?.toISOString() ?? null,
          aiSummary: lead.aiSummary,
        }}
        initialQualJson={lead.qualJson}
      />
    </div>
  );
}
