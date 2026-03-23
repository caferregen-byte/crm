# Closer CRM — Ürün gereksinimleri (özet)

## Amaç

Wufoo’dan gelen başvuruları gerçek zamanlı almak; eksik (sarı) ve tam (yeşil) ayırmak; tam başvurularda özet, bütçe ve niyet analizi üretmek; satış pipeline’ını (Seta Close: kalifikasyon → Zoom → follow-up) tek ekranda yönetmek.

## Kullanıcı

Yüksek fiyatlı (3000€+) hizmet satan closer — telefondayken tek tık aksiyon ve hızlı not.

## MVP (bu repo)

| Özellik | Durum |
|--------|--------|
| Wufoo webhook ile lead oluşturma | Var |
| Sarı/yeşil ayrımı | Var (`WUFOO_REQUIRED_FIELDS` ile yapılandırılabilir) |
| AI analiz (OpenAI veya heuristic) | Var |
| Pipeline + tek tık aksiyonlar | Var |
| Arama sayısı / ulaşılamama | Var |
| Notlar, arama logu, durum geçmişi | Var |
| Hatırlatma görevi (ulaşılamadı) | Var |
| Blacklist kilidi | Var |

## Sonraki sürümler

- E-posta / push bildirimi
- Dashboard’da “bugün aranacaklar” takvimi
- Wufoo’dan geriye dönük senkron (API poll)
- Çoklu kullanıcı / ekip

## Teknik

Next.js (App Router), **SQLite** (yerel `prisma/dev.db`, kurulum yok), Prisma 5, TypeScript, Tailwind CSS. İleride barındırma için PostgreSQL’e geçilebilir.
