import type { Metadata } from "next";
import { headers } from "next/headers";
import { WufooSetupPanel } from "@/components/wufoo-setup-panel";

export const metadata: Metadata = {
  title: "Wufoo bağlantısı",
  description: "Wufoo formunu Closer CRM’e bağlama",
};

function baseUrlFromHeaders(h: Headers): string {
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3450";
  const proto = h.get("x-forwarded-proto");
  if (proto === "http" || proto === "https") {
    return `${proto}://${host}`;
  }
  const local =
    host.startsWith("localhost") ||
    host.startsWith("127.") ||
    host.includes(".local");
  return local ? `http://${host}` : `https://${host}`;
}

export default async function WufooSetupPage() {
  const h = await headers();
  const baseUrl = baseUrlFromHeaders(h);

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Wufoo ile bağlan
        </h1>
        <p className="max-w-2xl text-lg text-zinc-500">
          Formdan gelen her başvuru otomatik lead olur. Aşağıdaki adımlar herkes için yazıldı; kopyala–yapıştır
          yeterli.
        </p>
      </header>

      <WufooSetupPanel baseUrl={baseUrl} />
    </div>
  );
}
