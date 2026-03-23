import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const completeness = url.searchParams.get("completeness");
  const stage = url.searchParams.get("stage");
  const q = url.searchParams.get("q")?.trim();

  const where: Prisma.LeadWhereInput = {};

  if (completeness === "INCOMPLETE" || completeness === "COMPLETE") {
    where.completeness = completeness;
  }
  if (stage) {
    where.stage = stage;
  }
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
    ];
  }

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      completeness: true,
      stage: true,
      tag: true,
      callCount: true,
      unreachableCount: true,
      nextFollowUpAt: true,
      intentScore: true,
      idealClient: true,
      isBlacklisted: true,
      createdAt: true,
      aiSummary: true,
    },
  });

  return NextResponse.json({ leads });
}
