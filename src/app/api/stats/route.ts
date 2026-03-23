import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Bugünkü arama sayısı, bugünkü görev sayısı */
export async function GET() {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const [todayCalls, todayTasks] = await Promise.all([
    prisma.callLog.count({
      where: {
        createdAt: { gte: startOfToday, lt: endOfToday },
      },
    }),
    prisma.task.count({
      where: {
        completed: false,
        dueAt: { lte: endOfToday },
      },
    }),
  ]);

  return NextResponse.json(
    {
      todayCalls,
      todayTasks,
    },
    {
      headers: {
        "Cache-Control": "private, s-maxage=30, stale-while-revalidate=120",
      },
    }
  );
}
