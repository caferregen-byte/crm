"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Copy, RefreshCw, Send } from "lucide-react";

function randomHexSecret(byteLen = 18): string {
  const a = new Uint8Array(byteLen);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    window.prompt("Kopyala (Ctrl+C):", text);
    return false;
  }
}

const STORAGE_KEY = "wufoo-public-base";

function isLikelyLocalDevUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    return (
      h === "localhost" ||
      h === "127.0.0.1" ||
      h.endsWith(".local") ||
      h.startsWith("192.168.") ||
      h.startsWith("10.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(h)
    );
  } catch {
    return true;
  }
}

export function WufooSetupPanel({ baseUrl }: { baseUrl: string }) {
  const [publicBaseOverride, setPublicBaseOverride] = useState("");
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved?.trim()) setPublicBaseOverride(saved.trim());
    } catch {
      /* ignore */
    }
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    try {
      const t = publicBaseOverride.trim();
      if (t) localStorage.setItem(STORAGE_KEY, t);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [publicBaseOverride, storageReady]);

  const root = (publicBaseOverride.trim() || baseUrl).replace(/\/$/, "");
  const showLocalWarning = !publicBaseOverride.trim() && isLikelyLocalDevUrl(baseUrl);
  const webhookPath = "/api/webhooks/wufoo";
  const webhookUrl = `${root}${webhookPath}`;

  const [secret, setSecret] = useState(() => randomHexSecret());

  const urlWithSecret = useMemo(
    () => `${webhookUrl}?secret=${encodeURIComponent(secret)}`,
    [webhookUrl, secret]
  );

  const envLine = useMemo(
    () => `WUFOO_WEBHOOK_SECRET="${secret}"`,
    [secret]
  );

  const [copied, setCopied] = useState<string | null>(null);
  const flash = (key: string) => {
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [testDetail, setTestDetail] = useState("");

  const runTest = useCallback(async () => {
    setTestStatus("loading");
    setTestDetail("");
    const fd = new FormData();
    fd.append("Field1", `Wufoo test ${new Date().toLocaleString("tr-TR")}`);
    fd.append("Field2", "test-wufoo@example.com");
    fd.append("Field3", "+905551234567");
    fd.append("EntryId", `crm-test-${Date.now()}`);
    try {
      const res = await fetch(urlWithSecret, { method: "POST", body: fd });
      const text = await res.text();
      let j: { ok?: boolean; error?: string; leadId?: string } = {};
      try {
        j = text ? (JSON.parse(text) as typeof j) : {};
      } catch {
        setTestStatus("err");
        setTestDetail(text.slice(0, 200));
        return;
      }
      if (!res.ok) {
        setTestStatus("err");
        setTestDetail(j.error ?? `HTTP ${res.status}`);
        return;
      }
      if (j.ok) {
        setTestStatus("ok");
        setTestDetail(j.leadId ? `Lead ID: ${j.leadId}` : "Kayıt alındı.");
      } else {
        setTestStatus("err");
        setTestDetail("Beklenmeyen yanıt");
      }
    } catch (e) {
      setTestStatus("err");
      setTestDetail(e instanceof Error ? e.message : "Ağ hatası");
    }
  }, [urlWithSecret]);

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border-2 border-amber-300/90 bg-amber-50/90 p-6 dark:border-amber-800/60 dark:bg-amber-950/35">
        <h2 className="text-sm font-semibold tracking-tight text-amber-950 dark:text-amber-50">
          Wufoo CRM’e neden localhost’tan ulaşamaz?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-amber-950/90 dark:text-amber-100/90">
          Wufoo sunucuları form gönderildiğinde <strong>sizin uygulamanıza internet üzerinden POST</strong> atar.{" "}
          <code className="rounded bg-amber-100/90 px-1 font-mono text-xs dark:bg-amber-900/60">localhost</code>,{" "}
          sadece ofis ağı veya VPN ile erişilen adresler dış dünyadan görünmez — bu bir güvenlik kısıtıdır, kodla
          aşılamaz. Çözüm: <strong>HTTPS ile herkese açık bir adres</strong> (aşağıdaki yöntemlerden biri).
        </p>
        <div className="mt-5 space-y-5 text-sm text-amber-950/95 dark:text-amber-50/95">
          <div>
            <p className="font-medium text-amber-950 dark:text-amber-100">1) ngrok (hızlı test, geliştirme)</p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 leading-relaxed">
              <li>
                Bir terminalde CRM’yi çalıştır:{" "}
                <code className="rounded bg-amber-100/90 px-1.5 py-0.5 font-mono text-xs dark:bg-amber-900/50">
                  npm run dev
                </code>{" "}
                (varsayılan port <strong>3450</strong>).
              </li>
              <li>
                <a
                  href="https://ngrok.com/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-2 hover:no-underline"
                >
                  ngrok
                </a>{" "}
                kur; ikinci terminalde:{" "}
                <code className="rounded bg-amber-100/90 px-1.5 py-0.5 font-mono text-xs dark:bg-amber-900/50">
                  ngrok http 3450
                </code>
              </li>
              <li>
                Ekranda görünen <strong className="font-semibold">https://…ngrok-free.app</strong> (veya benzeri)
                adresini kopyala — sondaki <code className="font-mono text-xs">/</code> olmadan.
              </li>
              <li>
                Bu adresi aşağıdaki <strong>„Wufoo’nun göreceği site adresi”</strong> kutusuna yapıştır; webhook
                URL’leri otomatik güncellenir.
              </li>
            </ol>
            <p className="mt-2 text-xs text-amber-900/85 dark:text-amber-200/80">
              Ücretsiz ngrok bazen tarayıcıda bir uyarı sayfası gösterebilir; Wufoo sunucu tarafından çağırdığı için
              genelde sorun olmaz. Sorun yaşarsan Cloudflare Tunnel veya canlı deploy dene.
            </p>
          </div>
          <div>
            <p className="font-medium text-amber-950 dark:text-amber-100">2) Cloudflare Tunnel (ücretsiz, kalıcı URL mümkün)</p>
            <p className="mt-2 leading-relaxed">
              <a
                href="https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-2 hover:no-underline"
              >
                cloudflared
              </a>{" "}
              kurup örnek:{" "}
              <code className="rounded bg-amber-100/90 px-1.5 py-0.5 font-mono text-xs dark:bg-amber-900/50">
                cloudflared tunnel --url http://localhost:3450
              </code>
              — çıkan <strong>https://…trycloudflare.com</strong> adresini aynı kutuya yapıştır.
            </p>
          </div>
          <div>
            <p className="font-medium text-amber-950 dark:text-amber-100">3) Canlı sunucu (önerilen: üretim)</p>
            <p className="mt-2 leading-relaxed">
              Projeyi{" "}
              <a
                href="https://vercel.com/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-2 hover:no-underline"
              >
                Vercel
              </a>{" "}
              veya benzeri bir host’a deploy et; ortam değişkenlerini (<code className="font-mono text-xs">DATABASE_URL</code>,{" "}
              <code className="font-mono text-xs">WUFOO_WEBHOOK_SECRET</code> vb.) panelden tanımla. Webhook için Wufoo’ya{" "}
              <strong>production domain</strong> + <code className="font-mono text-xs">/api/webhooks/wufoo?secret=…</code>{" "}
              ver.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <label className="text-xs font-medium uppercase tracking-widest text-zinc-400">
          Wufoo’nun göreceği site adresi
        </label>
        <p className="mt-2 text-sm text-zinc-500">
          Şu an tarayıcı: <span className="font-mono text-zinc-700 dark:text-zinc-300">{baseUrl}</span>.{" "}
          ngrok / canlı domain kullanıyorsan aşağıya yapıştır; webhook linkleri buna göre güncellenir (tarayıcıda
          saklanır).
        </p>
        {showLocalWarning && (
          <p className="mt-3 rounded-lg border border-amber-200/90 bg-amber-50/90 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            Bu adres dışarıdan görünmüyor — Wufoo webhook’u için yukarıdaki gibi bir <strong>HTTPS</strong> tüneli veya
            canlı domain yazmalısın.
          </p>
        )}
        <input
          type="url"
          placeholder="https://abc123.ngrok-free.app  veya  https://crm.senin-domain.com"
          value={publicBaseOverride}
          onChange={(e) => setPublicBaseOverride(e.target.value)}
          className="mt-3 w-full rounded-xl border border-zinc-200/80 bg-white px-4 py-2.5 text-sm outline-none ring-zinc-900/5 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950"
        />
      </section>

      {/* Hızlı özet */}
      <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
          3 adımda özet
        </h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <li>
            <strong className="text-zinc-900 dark:text-zinc-100">.env dosyana</strong> güvenli anahtarı yapıştır
            (aşağıda hazır satır var).
          </li>
          <li>
            <strong className="text-zinc-900 dark:text-zinc-100">Sunucuyu yeniden başlat</strong>{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">npm run dev</code>
          </li>
          <li>
            <strong className="text-zinc-900 dark:text-zinc-100">Wufoo’da</strong> bildirim URL’si olarak{" "}
            <em>gizli anahtarlı tam adresi</em> kopyala (en kolayı bu).
          </li>
        </ol>
        <p className="mt-4 text-sm text-zinc-500">
          Bilgisayarında çalışıyorsan internetten erişilemez; Wufoo için{" "}
          <strong className="font-medium text-zinc-700 dark:text-zinc-300">ngrok</strong>,{" "}
          <strong className="font-medium text-zinc-700 dark:text-zinc-300">Cloudflare Tunnel</strong> veya{" "}
          <strong className="font-medium text-zinc-700 dark:text-zinc-300">canlı sunucu</strong> (Vercel vb.)
          gerekir.
        </p>
      </section>

      {/* Güvenli anahtar */}
      <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
            1 · Güvenli anahtar (.env)
          </h2>
          <button
            type="button"
            onClick={() => setSecret(randomHexSecret())}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Yeni anahtar
          </button>
        </div>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Proje kökündeki <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">.env</code> dosyasına şu
          satırı ekle veya güncelle. Bu anahtar, sadece senin Wufoo’nun CRM’e yazmasını sağlar.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <code className="block max-w-full flex-1 overflow-x-auto rounded-xl bg-zinc-950 px-4 py-3 font-mono text-xs text-zinc-200">
            {envLine}
          </code>
          <button
            type="button"
            onClick={() =>
              void (async () => {
                await copyToClipboard(envLine);
                flash("env");
              })()
            }
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {copied === "env" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied === "env" ? "Kopyalandı" : "Kopyala"}
          </button>
        </div>
        <p className="mt-3 text-xs text-zinc-400">
          İpucu: Anahtarı boş bırakırsan doğrulama olmaz — sadece kendi bilgisayarında deneme için; canlıda mutlaka
          doldur.
        </p>
      </section>

      {/* Webhook URL */}
      <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
          2 · Wufoo’ya yapıştırılacak adres
        </h2>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Wufoo’da formunu aç → <strong className="text-zinc-800 dark:text-zinc-200">Notifications</strong> (veya
          Bildirimler) → <strong className="text-zinc-800 dark:text-zinc-200">Webhooks</strong> → yeni webhook →{" "}
          <strong className="text-zinc-800 dark:text-zinc-200">URL</strong> alanına{" "}
          <strong className="text-zinc-800 dark:text-zinc-200">aşağıdaki uzun adresin tamamını</strong> yapıştır.
          Böylece hem adres hem gizli anahtar tek satırda gider (Wufoo ek başlık istemez).
        </p>
        <p className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-100">
          Wufoo <strong>“please check the url provided”</strong> derse: (1) Adres <strong>HTTPS</strong> ve internetten
          açık olmalı (localhost olmaz). (2) <strong>Handshake Key</strong> kutusuna, .env’deki{" "}
          <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/50">WUFOO_WEBHOOK_SECRET</code> ile{" "}
          <strong>aynı</strong> değeri yaz — ya da URL’de <code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/50">?secret=</code>{" "}
          kullan; ikisi birlikte de olur.
        </p>
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-zinc-500">Önerilen (anahtarlı — tek tıkla kopyala)</p>
            <div className="mt-2 flex flex-wrap items-start gap-2">
              <code className="block max-w-full flex-1 break-all rounded-xl bg-zinc-950 px-4 py-3 font-mono text-[11px] leading-relaxed text-zinc-200 sm:text-xs">
                {urlWithSecret}
              </code>
              <button
                type="button"
                onClick={() =>
                  void (async () => {
                    await copyToClipboard(urlWithSecret);
                    flash("url");
                  })()
                }
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {copied === "url" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied === "url" ? "Kopyalandı" : "Wufoo URL’sini kopyala"}
              </button>
            </div>
          </div>
          <details className="text-sm text-zinc-500">
            <summary className="cursor-pointer font-medium text-zinc-600 dark:text-zinc-400">
              Anahtarsız adres (sadece .env’de secret yoksa veya header kullanacaksan)
            </summary>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="block max-w-full flex-1 break-all rounded-lg bg-zinc-100 px-3 py-2 font-mono text-xs dark:bg-zinc-800">
                {webhookUrl}
              </code>
              <button
                type="button"
                onClick={() =>
                  void (async () => {
                    await copyToClipboard(webhookUrl);
                    flash("plain");
                  })()
                }
                className="text-xs font-medium text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400"
              >
                Kopyala
              </button>
            </div>
            <p className="mt-2 text-xs">
              Gelişmiş: Wufoo özel HTTP başlığı verebiliyorsa{" "}
              <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">X-Webhook-Secret</code> başlığına aynı
              anahtarı yaz; URL’de <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">?secret=</code>{" "}
              kullanmana gerek kalmaz.
            </p>
          </details>
        </div>
      </section>

      {/* Test */}
      <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
          3 · Çalışıyor mu? (test)
        </h2>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Önce <strong className="text-zinc-800 dark:text-zinc-200">.env</strong>’e anahtarı kaydedip sunucuyu
          yeniden başlattığından emin ol. Sonra aşağıya bas: sahte bir form gönderimi yapılır,{" "}
          <Link href="/leads" className="font-medium text-zinc-900 underline dark:text-zinc-100">
            Leadler
          </Link>{" "}
          listesinde görünmeli.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={testStatus === "loading" || !secret}
            onClick={() => void runTest()}
            className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Send className="h-4 w-4" />
            {testStatus === "loading" ? "Gönderiliyor…" : "Test gönderimi yap"}
          </button>
          <Link
            href={webhookPath}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-500 underline hover:text-zinc-800 dark:hover:text-zinc-300"
          >
            Uç noktayı tarayıcıda aç (GET kontrolü)
          </Link>
        </div>
        {testStatus === "ok" && (
          <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">{testDetail}</p>
        )}
        {testStatus === "err" && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            {testDetail || "İstek başarısız. .env içindeki anahtar ile bu sayfadaki anahtar aynı mı?"}
          </p>
        )}
      </section>

      {/* Yeşil / sarı */}
      <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-400">
          Form alanları (sarı / yeşil)
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          <strong className="text-zinc-800 dark:text-zinc-200">Eksik (sarı) ve tam (yeşil) başvuruların ikisi de CRM’e düşer</strong> — sadece etiket
          ve öncelik farkı vardır. Yeşil sayılmak için aşağıdaki zorunlu alanların hepsi dolu olmalı; eksik olanlar
          sarı lead olarak listelenir (Leadler, „Sarı” filtresi, öncelik paneli).
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          CRM, Wufoo’dan gelen <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">Field1</code>,{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">Field2</code>… alanlarını okur.{" "}
          <strong className="text-zinc-800 dark:text-zinc-200">Yeşil (tam başvuru)</strong> sayılması için
          belirli alanların dolu olması gerekir. Ayarlamazsan varsayılan olarak ilk{" "}
          <strong className="text-zinc-800 dark:text-zinc-200">3 alan</strong> kontrol edilir.
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Kendi formuna göre düzenlemek için{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
            .env
          </code>{" "}
          içine örneğin:{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
            WUFOO_REQUIRED_FIELDS=&quot;Field1,Field2,Field5,Field8&quot;
          </code>
        </p>
        <details className="mt-4 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-950/40">
          <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Webhook kaçırıldıysa veya Wufoo geçmişini toplu çekmek için (API senkron)
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Wufoo bazen yalnızca <strong>gönderilmiş</strong> kayıtlar için webhook tetikler. Panodaki tüm
            gönderileri (eksik / tam) CRM ile eşitlemek için Wufoo API anahtarı ve form kimliği gerekir.{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">.env.example</code> içindeki{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">WUFOO_API_KEY</code>,{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">WUFOO_SUBDOMAIN</code>,{" "}
            <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">WUFOO_FORM_HASH</code> değerlerini
            doldur; ardından (sunucu çalışırken) örneğin:
          </p>
          <code className="mt-2 block overflow-x-auto rounded-lg bg-zinc-950 px-3 py-2 font-mono text-[11px] text-zinc-200">
            curl -s &quot;https://SENİN-DOMAIN/api/integrations/wufoo/sync?secret=WUFOO_WEBHOOK_SECRET_İLE_AYNI&quot;
          </code>
          <p className="mt-2 text-xs text-zinc-500">
            İsteğe bağlı: ayrı bir <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">WUFOO_SYNC_SECRET</code>{" "}
            tanımlayıp yalnızca senkron için kullanın.
          </p>
        </details>
      </section>

      {/* README ile çapraz referans */}
      <p className="text-center text-xs text-zinc-400">
        Komut satırı özeti: proje kökündeki <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">README.md</code> →{" "}
        <strong>Wufoo ve localhost</strong>.
      </p>
    </div>
  );
}
