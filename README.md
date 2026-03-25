# Closer CRM
 
Wufoo’dan lead alan, sarı/yeşil ayıran, tam başvurularda AI özet + skor üreten ve satış pipeline’ını (kalifikasyon, Zoom, follow-up, blacklist) tek ekranda yöneten hafif CRM. **Setter-Closer prensibine göre:** Canlı Quali formu (script+cevap yan yana), Pipeline Kanban, öncelik motoru, 5 kapılı Altın Standart, blacklist, follow-up önerisi.

## Özellikler

- Wufoo entegrasyonu (sarı/yeşil ayrımı) · AI analiz (özet, bütçe, intent)
- Canlı Quali formu: Script modu / Hızlı not modu
- Pipeline Kanban · Öncelik listesi · Arama takibi · Follow-up AI önerisi

**Kendi domain’in ile canlıya alma (Vercel, DNS, PostgreSQL):** [docs/DEPLOY-DOMAIN.md](docs/DEPLOY-DOMAIN.md)

## Kurulum

```bash
cp .env.example .env
# Varsayılan: SQLite (Postgres kurmana gerek yok) — DATABASE_URL="file:./dev.db"
npx prisma db push
npm run db:seed   # örnek 2 lead
npm run dev
```

### Online (canlı) performans

- **Ana sayfa** öncelik listesi sunucuda tek seferde hesaplanır; tarayıcı ikinci bir `/api/priorities` isteğiyle vakit kaybetmez.
- **Prisma** sunucusuz ortamda tek bağlantı örneği kullanır; `Lead` / `CallLog` / `Task` için indeksler sık sorguları hızlandırır.
- **`lucide-react`** paket içe aktarımı küçültülür (`next.config` `optimizePackageImports`).
- **Üst çubuk istatistikleri** (`/api/stats`) kısa süreli önbellek başlığı kullanır (30 sn).
- **Üretimde** SQLite dosyası çoğu hostta kalıcı ve eşzamanlı yazma için uygun değildir; canlı yük için **PostgreSQL** (Vercel Postgres, Neon, Supabase vb.) + `DATABASE_URL` önerilir.

### Sayfa açılmıyor / tarayıcı sürekli „bağlanıyor“

1. **Önce terminali kontrol et** — `npm run dev` çalışırken **“Ready”** yazana kadar bekle; Webpack **ilk istekte** 30–90 sn derleyebilir, bu normal.
2. Adresi **`http://127.0.0.1:3450`** dene (`localhost` yerine).
3. Port meşgulse: `npm run dev:clean` veya `package.json` içinde portu değiştir.
4. Telefondan / başka PC’den erişeceksen: `npm run dev:host` (0.0.0.0 dinler).
5. Şema değiştirdysen bir kez: `npx prisma generate` (her `dev`’de artık çalışmıyor — hız için).

### Sadece „Internal Server Error“ görüyorum

Artık çoğu Prisma hatası sayfada **Türkçe yönergelerle** gösterilir (`Veritabanına bağlanılamıyor` kartı veya **Tekrar dene** butonu). Hâlâ düz 500 görürsen terminaldeki kırmızı stack trace’e bak; genelde `DATABASE_URL` veya `npx prisma db push` eksiktir.

### `Unknown argument source` (Prisma) / manuel lead kaydı

Şema güncellendi ama **Turbopack / `.next` eski Prisma client** kullanıyorsa bu hatayı görürsün. Çözüm:

```bash
npm run fresh
npm run dev
```

`postinstall` ve `npm run build` sırasında `prisma generate` çalışır. Şema değişince: `npm run db:generate`. Mümkünse **`npm run dev:turbo` yerine `npm run dev`** (Webpack) kullan.

### Dev overlay: `measure` / `Type error` / `[native code]` (Turbopack)

Next.js 16 varsayılan olarak geliştirmede **Turbopack** kullanabilir; bazı tarayıcılarda veya önizleme panellerinde hata ayıklayıcı yığınında **`measure` + TypeError** görülebilir. Bu projede **`npm run dev` Webpack ile çalışır** (daha sakin). Daha hızlı denemek istersen: `npm run dev:turbo`.

### ERR_CONNECTION_REFUSED / „Website ist nicht erreichbar“

**Ursache:** Im Browser ist **kein Server gestartet** oder du nutzt den **falschen Port** (z. B. nur `http://localhost` ohne Port = Port 80 → leer).

1. Terminal **offen lassen** und im Projektordner ausführen: `npm run dev`
2. Warten bis **„Ready“** erscheint.
3. Im Browser **genau die URL aus der Terminal-Zeile „Local:“** öffnen — oft **http://localhost:3450**. Wenn dort noch ein alter Prozess blockiert: `npm run dev:clean` (beendet ggf. Prozesse auf 3450/3002 und startet neu).

Nur `localhost` oder `localhost:3000` funktioniert **nicht**, wenn der CRM-Server auf **3450** (oder einem anderen angezeigten Port) läuft.

**Aç (sırayla dene):**

1. [http://127.0.0.1:3450](http://127.0.0.1:3450)
2. [http://localhost:3450](http://localhost:3450)

Sunucu `0.0.0.0` dinliyor; aynı Wi‑Fi’deki telefondan bilgisayarının IP’si ile de denenebilir: `http://192.168.x.x:3450` (terminalde `npm run dev` çıktısındaki “Network” satırına bak).

**“Bağlantı kurulamadı” / sayfa açılmıyorsa:** Önce terminalde `npm run dev` çalıştığından ve **Ready** yazdığından emin ol. Çalışmıyorsa:

```bash
cd /Users/mayilcoachingakademie/Downloads/closer-crm
npm install
npx prisma generate
npm run dev
```

Port 3450 başka programdaysa terminalde hata görürsün; o zaman `package.json` içindeki `--port 3450` değerini örneğin `3550` yap.

**Internal Server Error / Prisma `localhost:5432`:** Eski bir `next dev` hâlâ çalışıyor olabilir. Tüm terminallerde `Ctrl+C`, gerekirse Activity Monitor’dan `node` süreçlerini kapat; sonra `rm -rf .next && npx prisma generate && npm run dev` ve yalnızca **http://localhost:3450** kullan.

## Wufoo

Uygulama içinde **menü → Wufoo** sayfasına git: kopyala–yapıştır adımları, test gönderimi ve ngrok/canlı adres alanı orada.

### Wufoo ve localhost (neden çalışmaz, nasıl çözülür?)

Wufoo sunucuları webhook için **internetten erişilebilen HTTPS URL** ister. `http://localhost:3450` veya sadece ofis ağındaki bir IP **dışarıdan görünmez** — bu bir ağ kısıtıdır; uygulama koduyla “localhost’u Wufoo’ya açmak” mümkün değildir.

**Geliştirme makinesinde test için** (biri CRM, biri tünel):

| Yöntem | Örnek komut | Not |
|--------|-------------|-----|
| **ngrok** | `ngrok http 3450` | Port, `npm run dev` ile aynı olmalı (bu projede varsayılan **3450**). Çıkan `https://…` adresini Wufoo sayfasındaki „Wufoo’nun göreceği site adresi” alanına yapıştır. |
| **Cloudflare Tunnel** | `cloudflared tunnel --url http://localhost:3450` | Ücretsiz; çıkan `https://…trycloudflare.com` adresini aynı alana yapıştır. |
| **Üretim** | Vercel / kendi sunucun | Projeyi deploy et; webhook’ta **canlı domain** + `/api/webhooks/wufoo?secret=…` kullan. Ortam değişkenlerini host panelinden tanımla. |

İsteğe bağlı: ngrok kuruluysa `npm run tunnel:ngrok` ile aynı portu dinletebilirsin.

Kısa özet:

1. Form → **Notifications** → Webhook URL: `https://SENİN-DOMAIN/api/webhooks/wufoo?secret=...` (tam adresi Wufoo sayfasından kopyala)
2. Alternatif: header `X-Webhook-Secret` ile aynı anahtar
3. **Tam başvuru** için `.env` içinde `WUFOO_REQUIRED_FIELDS` (ör. `Field1,Field2,Field5`). Boşsa ilk 3 `Field` kontrol edilir.

### Sarı (eksik) ve yeşil (tam) — ikisi de CRM’de

Webhook bir kez çalıştığında **eksik alanlı gönderiler de lead olur** (`completeness: INCOMPLETE`, sarı). Yeşil, yalnızca `WUFOO_REQUIRED_FIELDS` ile tanımlı alanların hepsi doluysa verilir. İkisi de **Leadler** listesinde ve öncelikte görünür.

Wufoo tarafında bildirim çoğu zaman **gönderim anında** tetiklenir; geçmiş kayıtları veya webhook kaçağını kapatmak için **Entries API senkronu** kullanılabilir:

```bash
curl -s "https://SENİN-DOMAIN/api/integrations/wufoo/sync?secret=WUFOO_WEBHOOK_İLE_AYNI_ANAHTAR"
```

`.env`: `WUFOO_API_KEY`, `WUFOO_SUBDOMAIN`, `WUFOO_FORM_HASH` (zorunlu). İsteğe bağlı `WUFOO_SYNC_SECRET` (yoksa aynı `WUFOO_WEBHOOK_SECRET` kullanılır).

## Ortam değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `DATABASE_URL` | Yerelde `file:./dev.db` (SQLite). Canlıda PostgreSQL kullanacaksan şemayı tekrar `postgresql` + enum’lara çevirmen gerekir. |
| `WUFOO_WEBHOOK_SECRET` | Webhook doğrulama (opsiyonel) |
| `WUFOO_REQUIRED_FIELDS` | Tam başvuru için zorunlu alanlar |
| `WUFOO_API_KEY` / `WUFOO_SUBDOMAIN` / `WUFOO_FORM_HASH` | Wufoo Entries API — toplu senkron |
| `WUFOO_SYNC_SECRET` | Senkron uç noktası için ayrı anahtar (opsiyonel) |
| `FOLLOW_UP_DAYS` | Ulaşılamadı sonrası gün listesi (varsayılan `1,3,7,30`) |
| `OPENAI_API_KEY` | Varsa gerçek AI analiz; yoksa sezgisel özet |

## Sayfalar

| Sayfa | Açıklama |
|-------|----------|
| `/` | Dashboard — Öncelik listesi (Şimdi ne yapmalıyım), KPI kartları |
| `/pipeline` | Kanban — Setter-Closer pipeline, sürükleyerek aşama değiştir |
| `/leads` | Lead listesi, filtreleme (sarı/yeşil, bugün aranacak) |
| `/leads/[id]` | Lead detay — AI özet, kalifikasyon paneli, aksiyonlar, notlar |
| `/leads/[id]/quali` | **Canlı Quali formu** — Script sol, cevap alanları sağ; Script / Hızlı not modu |
| `/leads/new` | Manuel lead ekleme |

## API

- `POST /api/webhooks/wufoo` — Wufoo bildirimi (JSON veya form-urlencoded)
- `GET/POST /api/integrations/wufoo/sync?secret=…` — Wufoo’daki tüm gönderileri CRM ile eşitle (API anahtarı gerekir)
- `GET /api/webhooks/wufoo` — Doğrulama için `200` + gövde `OK` (düz metin)
- `GET /api/leads` — Liste
- `GET/PATCH /api/leads/[id]` — Detay / güncelleme
- `POST /api/leads/[id]/actions` — `no_answer`, `contacted`, `qualified`, `zoom_scheduled`, `follow_up`, `blacklist`, …
- `POST /api/leads/[id]/notes` — Not
- `GET /api/priorities` — Öncelik listesi (yeni, Zoom bugün, follow-up, vb.)
- `GET /api/stats` — Bugünkü arama sayısı, bugünkü görev sayısı

Detaylı PRD: [docs/PRD.md](docs/PRD.md)
