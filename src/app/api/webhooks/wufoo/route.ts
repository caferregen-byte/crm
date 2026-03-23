import { NextResponse } from "next/server";
import { ingestWufooPayload } from "@/lib/wufoo-ingest";

export const runtime = "nodejs";

/** Bazı doğrulayıcılar önce HEAD ister */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

/**
 * Wufoo URL doğrulaması çoğunlukla GET atar; bazı istemciler JSON değil düz metin / 200 bekler.
 * JSON dönmek “please check the url” hatasına yol açabiliyor.
 */
export async function GET() {
  return new NextResponse("OK", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function verifySecret(request: Request, body?: Record<string, unknown>): boolean {
  const secret = process.env.WUFOO_WEBHOOK_SECRET;
  if (!secret) return true;
  const header = request.headers.get("x-webhook-secret");
  const url = new URL(request.url);
  const q = url.searchParams.get("secret");
  const handshakeQuery =
    url.searchParams.get("HandshakeKey") ?? url.searchParams.get("handshakeKey");
  if (header === secret || q === secret || handshakeQuery === secret) return true;
  if (body) {
    const hk = body.HandshakeKey ?? body.handshakeKey;
    if (typeof hk === "string" && hk === secret) return true;
  }
  return false;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  const ct = request.headers.get("content-type") ?? "";

  try {
    if (ct.includes("application/json")) {
      body = (await request.json()) as Record<string, unknown>;
    } else {
      const fd = await request.formData();
      body = {};
      for (const [k, v] of fd.entries()) {
        if (typeof v === "string") body[k] = v;
      }
    }
  } catch {
    return NextResponse.json({ ok: true, ping: true, note: "body_parse" });
  }

  const keys = Object.keys(body);
  const isEmptyPayload = keys.length === 0;

  // Wufoo entegrasyonu kaydederken çoğu zaman gövdesiz veya test POST atar; 401 burada "URL hatalı" hatasına yol açar.
  if (isEmptyPayload) {
    if (verifySecret(request, body)) {
      return NextResponse.json({ ok: true, ping: true });
    }
    return NextResponse.json({
      ok: true,
      ping: true,
      message:
        "Uç nokta ayakta. Kalıcı bağlantı için URL’ye ?secret=... ekleyin veya Wufoo’daki Handshake Key’i .env WUFOO_WEBHOOK_SECRET ile aynı yapın.",
    });
  }

  // Wufoo arayüzü 401/403 görünce "please check the url" veriyor; lead oluşturmadan 200 dön.
  if (!verifySecret(request, body)) {
    return NextResponse.json(
      {
        ok: true,
        ignored: true,
        reason: "unauthorized",
        hint: "URL’ye ?secret= ekleyin veya Handshake Key’i WUFOO_WEBHOOK_SECRET ile eşleştirin.",
      },
      { status: 200 }
    );
  }

  try {
    const result = await ingestWufooPayload(body);
    if (!result.ok) {
      return NextResponse.json({
        ok: true,
        ignored: true,
        reason: result.reason,
      });
    }
    return NextResponse.json({
      ok: true,
      leadId: result.leadId,
      completeness: result.completeness,
      missing: result.missing,
      updated: result.updated,
    });
  } catch (e) {
    console.error("[wufoo webhook]", e);
    return NextResponse.json(
      {
        ok: true,
        received: true,
        stored: false,
        error: "server",
      },
      { status: 200 }
    );
  }
}
