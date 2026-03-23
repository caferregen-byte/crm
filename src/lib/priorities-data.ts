import { prisma } from "@/lib/db";

const select = {
  id: true,
  name: true,
  email: true,
  phone: true,
  stage: true,
  completeness: true,
  callCount: true,
  unreachableCount: true,
  nextFollowUpAt: true,
  zoomScheduledAt: true,
  seenAt: true,
  intentScore: true,
  idealClient: true,
  createdAt: true,
} as const;

/** Öncelik sırası: 1 Yeni → … → 9 Tekrar aranabilir — API ve ana sayfa ortak kullanır */
export async function fetchPrioritiesPayload() {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);
  const endOfWeek = new Date(startOfToday);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  const [
    newLeads,
    zoomToday,
    zoomThisWeek,
    followUp,
    waiting,
    greens,
    unreachables,
    yellows,
    recallables,
  ] = await Promise.all([
    prisma.lead.findMany({
      where: { isBlacklisted: false, seenAt: null },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { ...select },
    }),
    prisma.lead.findMany({
      where: {
        isBlacklisted: false,
        stage: "ZOOM_SCHEDULED",
        OR: [
          { zoomScheduledAt: { gte: startOfToday, lt: endOfToday } },
          {
            zoomScheduledAt: null,
            nextFollowUpAt: { gte: startOfToday, lt: endOfToday },
          },
        ],
      },
      orderBy: { zoomScheduledAt: "asc" },
      take: 20,
      select: { ...select },
    }),
    prisma.lead.findMany({
      where: {
        isBlacklisted: false,
        stage: "ZOOM_SCHEDULED",
        OR: [
          { zoomScheduledAt: { gte: endOfToday, lte: endOfWeek } },
          {
            zoomScheduledAt: null,
            nextFollowUpAt: { gte: endOfToday, lte: endOfWeek },
          },
        ],
      },
      orderBy: { zoomScheduledAt: "asc" },
      take: 20,
      select: { ...select },
    }),
    prisma.lead.findMany({
      where: {
        isBlacklisted: false,
        stage: { in: ["ZOOM_DONE", "FOLLOW_UP"] },
        nextFollowUpAt: { lte: now },
      },
      orderBy: { nextFollowUpAt: "asc" },
      take: 30,
      select: { ...select },
    }),
    prisma.lead.findMany({
      where: {
        isBlacklisted: false,
        stage: { in: ["CONTACTED", "UNREACHABLE"] },
        nextFollowUpAt: { lte: now },
      },
      orderBy: { nextFollowUpAt: "asc" },
      take: 30,
      select: { ...select },
    }),
    prisma.lead.findMany({
      where: {
        isBlacklisted: false,
        completeness: "COMPLETE",
        stage: { in: ["NEW_LEAD", "REVIEWING", "CONTACT_ATTEMPT"] },
      },
      orderBy: [{ intentScore: "desc" }, { createdAt: "desc" }],
      take: 30,
      select: { ...select },
    }),
    prisma.lead.findMany({
      where: {
        isBlacklisted: false,
        unreachableCount: { gt: 0 },
        stage: "UNREACHABLE",
        nextFollowUpAt: { lte: now },
      },
      orderBy: { nextFollowUpAt: "asc" },
      take: 20,
      select: { ...select },
    }),
    prisma.lead.findMany({
      where: {
        isBlacklisted: false,
        completeness: "INCOMPLETE",
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { ...select },
    }),
    prisma.lead.findMany({
      where: {
        isBlacklisted: false,
        stage: { in: ["LOST_NOT_NOW", "FOLLOW_UP"] },
        lastContactAt: { not: null },
      },
      orderBy: { lastContactAt: "asc" },
      take: 20,
      select: { ...select },
    }),
  ]);

  return {
    newLeads,
    zoomToday,
    zoomThisWeek,
    followUp,
    waiting,
    greens,
    unreachables,
    yellows,
    recallables,
  };
}

export type PrioritiesPayload = Awaited<ReturnType<typeof fetchPrioritiesPayload>>;
