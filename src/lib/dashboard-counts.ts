import { prisma } from "@/lib/db";

/** Ana sayfa KPI sayıları — tek Promise.all ile paralel */
export async function fetchDashboardCounts() {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  return Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { completeness: "INCOMPLETE" } }),
    prisma.lead.count({ where: { completeness: "COMPLETE" } }),
    prisma.lead.count({
      where: {
        nextFollowUpAt: { lte: now },
        isBlacklisted: false,
      },
    }),
    prisma.lead.count({ where: { isBlacklisted: true } }),
    prisma.lead.count({
      where: { intentScore: { gte: 70 }, isBlacklisted: false },
    }),
    prisma.lead.count({ where: { seenAt: null, isBlacklisted: false } }),
    prisma.lead.count({
      where: {
        isBlacklisted: false,
        nextFollowUpAt: { gte: startOfToday, lt: endOfToday },
      },
    }),
    prisma.lead.count({
      where: {
        isBlacklisted: false,
        nextFollowUpAt: { not: null, lt: startOfToday },
      },
    }),
  ]);
}
