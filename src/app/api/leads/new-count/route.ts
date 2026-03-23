import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Son X dakikada veya since tarihinden sonra gelen, görülmemiş (seenAt null) lead sayısı */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const since = url.searchParams.get("since");
  const minutes = url.searchParams.get("minutes");

  const where: { seenAt: null; createdAt?: { gte: Date } } = { seenAt: null };

  if (since) {
    const d = new Date(since);
    if (!Number.isNaN(d.getTime())) {
      where.createdAt = { gte: d };
    }
  } else if (minutes) {
    const m = parseInt(minutes, 10);
    if (!Number.isNaN(m) && m > 0) {
      const d = new Date();
      d.setMinutes(d.getMinutes() - m);
      where.createdAt = { gte: d };
    }
  }

  const count = await prisma.lead.count({ where });
  const latest = await prisma.lead.findFirst({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      completeness: true,
      source: true,
      aiSummary: true,
    },
  });

  return NextResponse.json({ count, latest });
}
