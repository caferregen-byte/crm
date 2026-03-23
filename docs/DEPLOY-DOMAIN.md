# Gerçek domain ile canlıya alma (Closer CRM)

Bu proje **Next.js**; en sorunsuz yol **Vercel** üzerinde host etmek ve domain’i oraya bağlamaktır. SSL (HTTPS) Vercel tarafında otomatik gelir.

## 1. Ön koşullar

- Domain satın almış olman veya mevcut bir domain’in yönetim paneline erişimin (DNS ayarları).
- Kodun bir **Git** deposunda (GitHub / GitLab / Bitbucket) — Vercel buradan deploy alır.

## 2. Veritabanı (canlı ortam)

Yerelde **SQLite** (`file:./dev.db`) kullanılır. **Vercel’de kalıcı dosya sistemi yok**; canlıda **PostgreSQL** kullanman gerekir.

1. Ücretsiz/uygun bir Postgres oluştur: [Neon](https://neon.tech), [Supabase](https://supabase.com), [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) vb.
2. **Connection string**’i kopyala (`postgresql://...`).
3. Projede `prisma/schema.prisma` içinde `datasource` bölümünü canlıya uygun şekilde `postgresql` yap ve `npx prisma migrate dev` veya `npx prisma db push` ile şemayı veritabanına uygula (ilk kurulumda bir kez).
4. Yerel geliştirme için `.env` içinde SQLite, Vercel’de ise yalnızca **Environment Variables** içinde `DATABASE_URL` = Postgres URL kullanmak yaygın bir düzendir.

## 3. Vercel’e deploy

1. [vercel.com](https://vercel.com) → giriş yap → **Add New** → **Project**.
2. Git reposunu seç → **Framework Preset**: Next.js (otomatik).
3. **Environment Variables** ekle (en azından):

   | Değişken | Açıklama |
   |----------|----------|
   | `DATABASE_URL` | PostgreSQL bağlantı adresi |
   | `WUFOO_WEBHOOK_SECRET` | Wufoo webhook güvenliği |
   | `OPENAI_API_KEY` | Varsa AI özellikleri |

4. **Deploy** et. İlk URL genelde `https://proje-adi.vercel.app` olur.

## 4. Kendi domain’ini bağlama

1. Vercel’de proje → **Settings** → **Domains**.
2. **Add** ile domain yaz: örn. `crm.senin-domain.com` veya kök domain `senin-domain.com`.
3. Vercel sana **hangi DNS kayıtlarını** nereye yazacağını gösterir. Özet:

   - **Alt domain** (`crm.example.com`): çoğu zaman **CNAME** → Vercel’in verdiği hedef (ör. `cname.vercel-dns.com`).
   - **Kök domain** (`example.com`): genelde **A** kayıtları (Vercel’in IP listesi) veya önerilen yönlendirme; paneldeki talimatları aynen uygula.

4. Domain’i nerede aldıysan (GoDaddy, Namecheap, Cloudflare, IONOS…) **DNS yönetimi**ne gir, Vercel’in istediği kayıtları ekle.
5. Yayılması **birkaç dakika–48 saat** sürebilir; Vercel panelinde “Valid Configuration” görünür.
6. Sertifika (HTTPS) birkaç dakika içinde otomatik oluşur.

**www** ve kök domain: Vercel’de birini ekleyip diğerini “redirect” ile ana adrese yönlendirebilirsin (Settings → Domains).

## 5. Wufoo / harici servisler

- Webhook URL’leri artık **`https://crm.senin-domain.com/api/webhooks/wufoo?secret=...`** gibi **canlı domain** üzerinden olmalı.
- Wufoo kurulum sayfasındaki “Wufoo’nun göreceği site adresi” alanına da bu **https** kökünü yaz.

## 6. Kontrol listesi

- [ ] Postgres `DATABASE_URL` canlıda tanımlı, migration uygulandı.
- [ ] `npm run build` yerelde hatasız.
- [ ] Vercel deploy yeşil.
- [ ] Domain DNS doğrulandı, HTTPS açılıyor.
- [ ] Wufoo webhook ve gizli anahtarlar canlı `.env` / Vercel env ile uyumlu.

Daha fazla detay: [Vercel – Custom Domains](https://vercel.com/docs/concepts/projects/domains).
