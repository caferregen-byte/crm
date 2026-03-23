import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  CallOutcome,
  LeadTag,
  PipelineStage,
  TaskType,
} from "@/lib/crm-constants";
import { addDays, parseFollowUpDays } from "@/lib/follow-up";
import { canScheduleZoom, parseQualJson } from "@/lib/qualification";

type Ctx = { params: Promise<{ id: string }> };

type ActionBody = {
  action: string;
  note?: string;
  blacklistReason?: string;
  blacklistedBy?: string;
  followUpDays?: number;
  zoomScheduledAt?: string;
  /** true = Zoom’u kalifikasyon olmadan zorla (acil istisna) */
  forceZoom?: boolean;
};

export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = (await request.json()) as ActionBody;

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (lead.isBlacklisted && body.action !== "note") {
    return NextResponse.json(
      { error: "Lead is blacklisted; actions locked." },
      { status: 403 }
    );
  }

  const now = new Date();
  const note = body.note?.trim();

  switch (body.action) {
    case "no_answer":
    case "unreachable": {
      const days = parseFollowUpDays();
      const next = addDays(now, body.followUpDays ?? days[0] ?? 1);
      const updated = await prisma.lead.update({
        where: { id },
        data: {
          callCount: { increment: 1 },
          unreachableCount: { increment: 1 },
          lastCallAt: now,
          stage: PipelineStage.UNREACHABLE,
          nextFollowUpAt: next,
        },
      });
      await prisma.callLog.create({
        data: {
          leadId: id,
          outcome: CallOutcome.NO_ANSWER,
          note: note ?? "Ulaşılamadı / açmadı",
        },
      });
      await prisma.task.create({
        data: {
          leadId: id,
          type: TaskType.CALLBACK,
          title: "Tekrar ara — ulaşılamadı",
          dueAt: next,
        },
      });
      await prisma.statusHistory.create({
        data: {
          leadId: id,
          fromStage: lead.stage,
          toStage: PipelineStage.UNREACHABLE,
          note: "Arandı, ulaşılamadı",
        },
      });
      return NextResponse.json({ ok: true, lead: updated });
    }

    case "contacted": {
      const updated = await prisma.lead.update({
        where: { id },
        data: {
          callCount: { increment: 1 },
          lastCallAt: now,
          lastContactAt: now,
          stage: PipelineStage.CONTACTED,
        },
      });
      await prisma.callLog.create({
        data: {
          leadId: id,
          outcome: CallOutcome.CONTACTED,
          note: note ?? "Görüşüldü",
        },
      });
      await prisma.statusHistory.create({
        data: {
          leadId: id,
          fromStage: lead.stage,
          toStage: PipelineStage.CONTACTED,
          note: "Görüşüldü",
        },
      });
      return NextResponse.json({ ok: true, lead: updated });
    }

    case "qualified": {
      const updated = await prisma.lead.update({
        where: { id },
        data: {
          stage: PipelineStage.QUALIFIED,
          tag: LeadTag.QUALIFIED,
          leadType: "QUALIFIED",
        },
      });
      await prisma.statusHistory.create({
        data: {
          leadId: id,
          fromStage: lead.stage,
          toStage: PipelineStage.QUALIFIED,
          note: note ?? "Kalifiye edildi",
        },
      });
      return NextResponse.json({ ok: true, lead: updated });
    }

    case "unqualified": {
      const updated = await prisma.lead.update({
        where: { id },
        data: {
          stage: PipelineStage.UNQUALIFIED,
          tag: LeadTag.UNQUALIFIED,
          leadType: "UNQUALIFIED",
          lostReason: note ?? lead.lostReason,
        },
      });
      await prisma.statusHistory.create({
        data: {
          leadId: id,
          fromStage: lead.stage,
          toStage: PipelineStage.UNQUALIFIED,
          note: note ?? "Kalifiye değil",
        },
      });
      return NextResponse.json({ ok: true, lead: updated });
    }

    case "ideal_client": {
      const updated = await prisma.lead.update({
        where: { id },
        data: {
          idealClient: true,
          tag: LeadTag.IDEAL_CLIENT,
          leadType: "IDEAL_CLIENT",
        },
      });
      return NextResponse.json({ ok: true, lead: updated });
    }

    case "zoom_scheduled": {
      if (!body.forceZoom) {
        const check = canScheduleZoom(parseQualJson(lead.qualJson));
        if (!check.ok) {
          return NextResponse.json(
            { error: check.reasons.join(" "), code: "QUALIFICATION_INCOMPLETE" },
            { status: 422 }
          );
        }
      }
      let zoomDate: Date | undefined;
      if (body.zoomScheduledAt) {
        const d = new Date(body.zoomScheduledAt);
        if (!Number.isNaN(d.getTime())) zoomDate = d;
      }
      const updated = await prisma.lead.update({
        where: { id },
        data: {
          stage: PipelineStage.ZOOM_SCHEDULED,
          ...(zoomDate && { zoomScheduledAt: zoomDate, nextFollowUpAt: zoomDate }),
        },
      });
      await prisma.statusHistory.create({
        data: {
          leadId: id,
          fromStage: lead.stage,
          toStage: PipelineStage.ZOOM_SCHEDULED,
          note: note ?? "Zoom planlandı",
        },
      });
      return NextResponse.json({ ok: true, lead: updated });
    }

    case "zoom_done": {
      const updated = await prisma.lead.update({
        where: { id },
        data: { stage: PipelineStage.ZOOM_DONE },
      });
      await prisma.statusHistory.create({
        data: {
          leadId: id,
          fromStage: lead.stage,
          toStage: PipelineStage.ZOOM_DONE,
          note: note ?? "Zoom yapıldı",
        },
      });
      return NextResponse.json({ ok: true, lead: updated });
    }

    case "follow_up": {
      const days = body.followUpDays ?? parseFollowUpDays()[1] ?? 7;
      const due = addDays(now, days);
      const updated = await prisma.lead.update({
        where: { id },
        data: {
          stage: PipelineStage.FOLLOW_UP,
          nextFollowUpAt: due,
          tag: LeadTag.FOLLOW_UP_NEEDED,
          leadType: "FOLLOW_UP_NEEDED",
        },
      });
      await prisma.task.create({
        data: {
          leadId: id,
          type: TaskType.FOLLOW_UP,
          title: "Follow-up — Zoom sonrası",
          dueAt: due,
        },
      });
      await prisma.statusHistory.create({
        data: {
          leadId: id,
          fromStage: lead.stage,
          toStage: PipelineStage.FOLLOW_UP,
          note: note ?? "Follow-up gerekli",
        },
      });
      return NextResponse.json({ ok: true, lead: updated });
    }

    case "won": {
      const updated = await prisma.lead.update({
        where: { id },
        data: { stage: PipelineStage.WON },
      });
      await prisma.statusHistory.create({
        data: {
          leadId: id,
          fromStage: lead.stage,
          toStage: PipelineStage.WON,
          note: note ?? "Kazanıldı",
        },
      });
      return NextResponse.json({ ok: true, lead: updated });
    }

    case "qualification_call": {
      const updated = await prisma.lead.update({
        where: { id },
        data: { stage: PipelineStage.QUALIFICATION_CALL },
      });
      await prisma.statusHistory.create({
        data: {
          leadId: id,
          fromStage: lead.stage,
          toStage: PipelineStage.QUALIFICATION_CALL,
          note: note ?? "Kalifikasyon görüşmesi",
        },
      });
      return NextResponse.json({ ok: true, lead: updated });
    }

    case "offer_made": {
      const updated = await prisma.lead.update({
        where: { id },
        data: { stage: PipelineStage.OFFER_MADE },
      });
      await prisma.statusHistory.create({
        data: {
          leadId: id,
          fromStage: lead.stage,
          toStage: PipelineStage.OFFER_MADE,
          note: note ?? "Teklif verildi",
        },
      });
      return NextResponse.json({ ok: true, lead: updated });
    }

    case "lost_not_now": {
      const updated = await prisma.lead.update({
        where: { id },
        data: {
          stage: PipelineStage.LOST_NOT_NOW,
          leadType: "LOST_FOR_NOW",
          lostReason: note ?? lead.lostReason,
        },
      });
      await prisma.statusHistory.create({
        data: {
          leadId: id,
          fromStage: lead.stage,
          toStage: PipelineStage.LOST_NOT_NOW,
          note: note ?? "Şu an olmadı",
        },
      });
      return NextResponse.json({ ok: true, lead: updated });
    }

    case "lost_forever": {
      const updated = await prisma.lead.update({
        where: { id },
        data: {
          stage: PipelineStage.LOST_FOREVER,
          leadType: "LOST_FOREVER",
          lostReason: note ?? lead.lostReason,
        },
      });
      await prisma.statusHistory.create({
        data: {
          leadId: id,
          fromStage: lead.stage,
          toStage: PipelineStage.LOST_FOREVER,
          note: note ?? "Kalıcı kayıp",
        },
      });
      return NextResponse.json({ ok: true, lead: updated });
    }

    case "not_now": {
      const updated = await prisma.lead.update({
        where: { id },
        data: {
          stage: PipelineStage.NOT_NOW,
          leadType: "LOST_FOR_NOW",
          lostReason: note ?? lead.lostReason,
        },
      });
      await prisma.statusHistory.create({
        data: {
          leadId: id,
          fromStage: lead.stage,
          toStage: PipelineStage.NOT_NOW,
          note: note ?? "Şimdi değil",
        },
      });
      return NextResponse.json({ ok: true, lead: updated });
    }

    case "reactivation": {
      const updated = await prisma.lead.update({
        where: { id },
        data: {
          stage: PipelineStage.REACTIVATION,
          leadType: "REACTIVATION",
        },
      });
      await prisma.statusHistory.create({
        data: {
          leadId: id,
          fromStage: lead.stage,
          toStage: PipelineStage.REACTIVATION,
          note: note ?? "Reactivation",
        },
      });
      return NextResponse.json({ ok: true, lead: updated });
    }

    case "blacklist": {
      await prisma.task.updateMany({
        where: { leadId: id, completed: false },
        data: { completed: true, completedAt: now },
      });
      const updated = await prisma.lead.update({
        where: { id },
        data: {
          isBlacklisted: true,
          blacklistReason: body.blacklistReason ?? note ?? "Blacklist",
          blacklistedBy: body.blacklistedBy ?? null,
          stage: PipelineStage.BLACKLIST,
          tag: LeadTag.NONE,
          leadType: "BLACKLIST_TAG",
        },
      });
      await prisma.statusHistory.create({
        data: {
          leadId: id,
          fromStage: lead.stage,
          toStage: PipelineStage.BLACKLIST,
          note: body.blacklistReason ?? note ?? "Blacklist",
        },
      });
      return NextResponse.json({ ok: true, lead: updated });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
