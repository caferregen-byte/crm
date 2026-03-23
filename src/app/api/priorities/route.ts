import { NextResponse } from "next/server";
import { fetchPrioritiesPayload } from "@/lib/priorities-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await fetchPrioritiesPayload();
  return NextResponse.json(data);
}
