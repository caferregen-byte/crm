import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateFollowUpAdvice } from "@/lib/ai-followup";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const advice = await generateFollowUpAdvice({
    qualificationNotes: lead.qualificationNotes,
    lostReason: lead.lostReason,
    aiSummary: lead.aiSummary,
    aiRecommendedAngle: lead.aiRecommendedAngle,
    name: lead.name,
  });

  return NextResponse.json({ advice });
}
