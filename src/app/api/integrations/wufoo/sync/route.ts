import { NextResponse } from "next/server";
import { ingestWufooPayload } from "@/lib/wufoo-ingest";

export const runtime = "nodejs";
export const maxDuration = 60;

function verifySyncRequest(request: Request): boolean {
  const syncSecret =
    process.env.WUFOO_SYNC_SECRET?.trim() ||
    process.env.WUFOO_WEBHOOK_SECRET?.trim();
  if (!syncSecret) return false;
  const url = new URL(request.url);
  const q = url.searchParams.get("secret");
  const auth = request.headers.get("authorization");
  if (q === syncSecret) return true;
  if (auth === `Bearer ${syncSecret}`) return true;
  return false;
}

function entryToBody(
  entry: Record<string, unknown>,
  formHash: string,
  formName: string | null
): Record<string, unknown> {
  const body: Record<string, unknown> = { ...entry };
  if (!body.FormHash && !body.Hash) body.FormHash = formHash;
  if (formName && !body.FormName && !body.formTitle) body.FormName = formName;
  return body;
}

async function fetchWufooEntries(
  subdomain: string,
  formIdentifier: string,
  apiKey: string
): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = [];
  let pageStart = 0;
  const pageSize = 100;
  const auth = `Basic ${Buffer.from(`${apiKey}:shoe`).toString("base64")}`;

  for (;;) {
    const url = new URL(
      `https://${subdomain}.wufoo.com/api/v3/forms/${encodeURIComponent(formIdentifier)}/entries.json`
    );
    url.searchParams.set("pageStart", String(pageStart));
    url.searchParams.set("pageSize", String(pageSize));

    const res = await fetch(url.toString(), {
      headers: { Authorization: auth },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Wufoo API ${res.status}: ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as { Entries?: Record<string, unknown>[] };
    const entries = json.Entries ?? [];
    out.push(...entries);
    if (entries.length < pageSize) break;
    pageStart += pageSize;
  }

  return out;
}

/**
 * Wufoo panosundaki tüm gönderileri (eksik / tam) CRM ile eşitler.
 * Webhook kaçırsa veya yarım gönderiler farklı kanaldan geldiyse kullanılır.
 *
 * GET/POST ?secret=... veya Authorization: Bearer ...
 * Ortam: WUFOO_API_KEY, WUFOO_SUBDOMAIN, WUFOO_FORM_HASH (form URL’deki tanımlayıcı)
 */
export async function GET(request: Request) {
  return runSync(request);
}

export async function POST(request: Request) {
  return runSync(request);
}

async function runSync(request: Request) {
  if (!verifySyncRequest(request)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Yetkisiz. WUFOO_SYNC_SECRET veya WUFOO_WEBHOOK_SECRET ile ?secret= veya Bearer kullanın.",
      },
      { status: 401 }
    );
  }

  const apiKey = process.env.WUFOO_API_KEY?.trim();
  const subdomain = process.env.WUFOO_SUBDOMAIN?.trim();
  const formHash = process.env.WUFOO_FORM_HASH?.trim();
  const formName = process.env.WUFOO_FORM_NAME?.trim() ?? null;

  if (!apiKey || !subdomain || !formHash) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Eksik ortam: WUFOO_API_KEY, WUFOO_SUBDOMAIN, WUFOO_FORM_HASH (.env.example’a bakın).",
      },
      { status: 503 }
    );
  }

  try {
    const entries = await fetchWufooEntries(subdomain, formHash, apiKey);
    let created = 0;
    let updated = 0;
    let ignored = 0;
    let errors = 0;

    for (const raw of entries) {
      try {
        const body = entryToBody(raw, formHash, formName);
        const result = await ingestWufooPayload(body);
        if (!result.ok) {
          ignored += 1;
        } else if (result.updated) {
          updated += 1;
        } else {
          created += 1;
        }
      } catch {
        errors += 1;
      }
    }

    return NextResponse.json({
      ok: true,
      total: entries.length,
      created,
      updated,
      ignored,
      errors,
    });
  } catch (e) {
    console.error("[wufoo sync]", e);
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "sync_failed",
      },
      { status: 500 }
    );
  }
}
