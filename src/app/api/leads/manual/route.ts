import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { PipelineStage, LeadTag } from "@/lib/crm-constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: {
    name?: string;
    email?: string;
    phone?: string;
    source?: string;
    note?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "İstek gövdesi okunamadı (JSON bekleniyor)." },
      { status: 400 }
    );
  }

  const name = body.name?.trim();
  const email = body.email?.trim();
  const phone = body.phone?.trim();
  if (!name && !email && !phone) {
    return NextResponse.json(
      { error: "En az isim, e-posta veya telefon gerekli" },
      { status: 400 }
    );
  }

  const source = body.source?.trim() || "MANUAL";
  const allowed = [
    "MANUAL",
    "INSTAGRAM_DM",
    "WHATSAPP",
    "REFERRAL",
    "EMAIL",
    "WEBSITE",
    "WUFOO",
  ];
  const src = allowed.includes(source) ? source : "MANUAL";

  try {
    const lead = await prisma.lead.create({
      data: {
        name: name ?? null,
        email: email ?? null,
        phone: phone ?? null,
        source: src,
        leadType: "INCOMPLETE_LEAD",
        completeness: "INCOMPLETE",
        stage: PipelineStage.NEW_LEAD,
        tag: LeadTag.INCOMPLETE_LEAD,
        rawWufooPayload: JSON.stringify({
          manual: true,
          note: body.note?.trim() ?? "",
        }),
        statusHistory: {
          create: {
            fromStage: null,
            toStage: PipelineStage.NEW_LEAD,
            note: `Manuel eklendi — ${src}`,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, leadId: lead.id });
  } catch (e) {
    const dev = process.env.NODE_ENV === "development";
    if (e instanceof Error && e.name === "PrismaClientValidationError") {
      return NextResponse.json(
        {
          error:
            "Prisma şema ile uyumsuzluk. `npm run fresh` ve `npx prisma db push` çalıştırıp sunucuyu yeniden başlat.",
          ...(dev && { detail: e.message }),
        },
        { status: 400 }
      );
    }
    if (e instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        {
          error:
            "Veritabanı açılamıyor. Kök dizinde `.env` içinde `DATABASE_URL` tanımlı mı? Örnek: `file:./dev.db` — ardından `npx prisma db push`.",
          ...(dev && { detail: e.message }),
        },
        { status: 503 }
      );
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      const human =
        e.code === "P1001"
          ? "Veritabanı sunucusuna ulaşılamıyor (ağ / bağlantı dizesi)."
          : e.code === "P2002"
            ? "Bu kayıt benzersiz alan çakışması (ör. aynı Wufoo ID)."
            : `Veritabanı hatası (${e.code}).`;
      return NextResponse.json(
        { error: human, ...(dev && { detail: e.message }) },
        { status: 503 }
      );
    }
    const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
    console.error("[manual lead]", e);
    return NextResponse.json(
      { error: "Lead kaydedilemedi.", ...(dev && { detail: msg }) },
      { status: 500 }
    );
  }
}
