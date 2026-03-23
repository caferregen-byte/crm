import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      notes: { orderBy: { createdAt: "desc" } },
      callLogs: { orderBy: { createdAt: "desc" } },
      tasks: { orderBy: { dueAt: "asc" } },
      statusHistory: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    let json: Record<string, unknown>;
    try {
      json = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
    }

    const allowed = [
      "name",
      "email",
      "phone",
      "company",
      "instagram",
      "country",
      "city",
      "stage",
      "tag",
      "leadType",
      "source",
      "idealClient",
      "qualificationNotes",
      "qualJson",
      "setterNote",
      "closerNote",
      "lostReason",
      "nextFollowUpAt",
      "zoomScheduledAt",
      "seenAt",
      "urgencyScore",
      "opportunityScore",
      "reactivationScore",
    ] as const;

    const data: Record<string, unknown> = {};
    for (const k of allowed) {
      if (!(k in json)) continue;
      const v = json[k];
      if (v === undefined) continue;
      if (k === "qualJson" && v !== null && typeof v !== "string") {
        data[k] = typeof v === "object" ? JSON.stringify(v) : String(v);
      } else {
        data[k] = v;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Güncellenecek alan yok — qualJson veya başka alan gönderin." },
        { status: 400 }
      );
    }

    if (typeof json.stage === "string") {
      const prev = await prisma.lead.findUnique({ where: { id } });
      if (prev && prev.stage !== json.stage) {
        await prisma.statusHistory.create({
          data: {
            leadId: id,
            fromStage: prev.stage,
            toStage: json.stage,
            note:
              typeof json.stageNote === "string"
                ? json.stageNote
                : "Manuel güncelleme",
          },
        });
      }
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: data as Parameters<typeof prisma.lead.update>[0]["data"],
    });

    return NextResponse.json({ lead });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "Lead bulunamadı" }, { status: 404 });
    }
    console.error("[PATCH /api/leads/[id]]", e);
    const message = e instanceof Error ? e.message : "Sunucu hatası";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
