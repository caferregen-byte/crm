import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = (await request.json()) as { body?: string; category?: string };

  const text = body.body?.trim();
  if (!text) {
    return NextResponse.json({ error: "body required" }, { status: 400 });
  }

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const note = await prisma.leadNote.create({
    data: {
      leadId: id,
      body: text,
      category: body.category?.trim() || "general",
    },
  });

  return NextResponse.json({ note });
}
