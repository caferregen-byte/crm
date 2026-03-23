import { MessageSquare } from "lucide-react";
import { parseQualJson } from "@/lib/qualification";
import {
  hasLiveQualiDetails,
  KARAR_LABEL,
  YATIRIM_LABEL,
  ACILIYET_LABEL,
  HAFTALIK_LABEL,
} from "@/lib/live-quali-display";

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
      <h4 className="text-xs font-medium uppercase tracking-widest text-zinc-400">{title}</h4>
      <dl className="mt-3 space-y-3">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "") return null;
  if (typeof value === "string" && !value.trim()) return null;
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-100">{value}</dd>
    </div>
  );
}

function boolTr(v: boolean | undefined) {
  if (v === true) return "Evet";
  if (v === false) return "Hayır";
  return null;
}

function hasSectionContent(v: Record<string, unknown> | undefined): boolean {
  if (!v) return false;
  return Object.values(v).some((x) => {
    if (x == null) return false;
    if (typeof x === "boolean") return true;
    return String(x).trim().length > 0;
  });
}

export function LiveQualiSummary({ qualJson }: { qualJson: string | null }) {
  const q = parseQualJson(qualJson);
  if (!q || !hasLiveQualiDetails(q)) return null;

  const sd = q.setterDegerlendirme;

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/30">
      <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-zinc-400">
        <MessageSquare className="h-4 w-4 text-zinc-400" />
        Canlı görüşme kayıtları
      </h3>
      <p className="mt-1 text-sm text-zinc-500">
        Kalifikasyon ekranında girilen notlar ve cevaplar (kayıtlı veri).
      </p>

      <div className="mt-5 space-y-4">
        {(q.need?.confirmed ||
          q.budget?.confirmed ||
          q.decisionMaker?.confirmed ||
          q.urgency?.confirmed ||
          q.goldenStandard?.confirmed) && (
          <Block title="Zoom öncesi işaretler (canlı)">
            <Row label="Acı noktası / ihtiyaç" value={q.need?.confirmed ? "Tamam" : null} />
            <Row label="Bütçe uygun" value={q.budget?.confirmed ? "Tamam" : null} />
            <Row label="Karar verici net" value={q.decisionMaker?.confirmed ? "Tamam" : null} />
            <Row label="Aciliyet uygun" value={q.urgency?.confirmed ? "Tamam" : null} />
            <Row label="Mentalite / altın standart" value={q.goldenStandard?.confirmed ? "Tamam" : null} />
          </Block>
        )}

        {q.callStart &&
          (q.callStart.firstImpression ||
            q.callStart.available != null ||
            q.callStart.status ||
            q.callStart.callbackAt ||
            q.callStart.callbackNote ||
            q.callStart.quickOutcome) && (
            <Block title="Görüşme başlangıcı">
              <Row label="Müsait miydi?" value={boolTr(q.callStart.available)} />
              <Row label="İlk izlenim" value={q.callStart.firstImpression} />
              <Row label="Durum" value={q.callStart.status} />
              {q.callStart.callbackAt && (
                <Row
                  label="Geri arama"
                  value={
                    new Date(q.callStart.callbackAt).toLocaleString("tr-TR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })
                  }
                />
              )}
              <Row label="Geri arama notu" value={q.callStart.callbackNote} />
              {q.callStart.quickOutcome && (
                <Row
                  label="Son aksiyon"
                  value={
                    q.callStart.quickOutcome === "contacted"
                      ? "Görüştüm"
                      : q.callStart.quickOutcome === "no_answer"
                        ? "Ulaşılamadı"
                        : null
                  }
                />
              )}
            </Block>
          )}

        {hasSectionContent(q.mevcutDurum as Record<string, unknown> | undefined) &&
          q.mevcutDurum && (
            <Block title="Mevcut durum">
              <Row label="Ne yapıyor?" value={q.mevcutDurum.neYapiyor} />
              <Row label="Müşteri kazanımı" value={q.mevcutDurum.musteriKazanim} />
              <Row label="Aylık bütçe" value={q.mevcutDurum.aylikButce} />
              <Row label="Not" value={q.mevcutDurum.not} />
            </Block>
          )}

        {hasSectionContent(q.aciNoktalari as Record<string, unknown> | undefined) &&
          q.aciNoktalari && (
            <Block title="Acı noktaları">
              <Row label="En büyük problem" value={q.aciNoktalari.enBuyukProblem} />
              <Row label="İşe yansıması" value={q.aciNoktalari.iseYansima} />
              <Row label="Eksik hissi" value={q.aciNoktalari.eksikHis} />
              <Row
                label="Aciliyet"
                value={
                  q.aciNoktalari.aciliyet
                    ? ACILIYET_LABEL[q.aciNoktalari.aciliyet] ?? q.aciNoktalari.aciliyet
                    : null
                }
              />
              <Row label="Not" value={q.aciNoktalari.not} />
            </Block>
          )}

        {q.cozum?.offerUygun != null && (
          <Block title="Çözüm uyumu">
            <Row label="Model / hizmet uygun" value={q.cozum?.offerUygun ? "Evet" : "Hayır"} />
          </Block>
        )}

        {hasSectionContent(q.hedef as Record<string, unknown> | undefined) && q.hedef && (
          <Block title="Hedef ve motivasyon">
            <Row label="6–12 ay hedefi" value={q.hedef.hedef612} />
            <Row label="Neden önemli?" value={q.hedef.nedenOnemli} />
            <Row label="Neden şimdi?" value={q.hedef.nedenSimdi} />
            <Row
              label="Hedef motivasyon aciliyeti"
              value={
                q.hedef.hedefAciliyeti === "high"
                  ? "Yüksek"
                  : q.hedef.hedefAciliyeti === "medium"
                    ? "Orta"
                    : q.hedef.hedefAciliyeti === "low"
                      ? "Düşük"
                      : null
              }
            />
          </Block>
        )}

        {hasSectionContent(q.butce as Record<string, unknown> | undefined) && q.butce && (
          <Block title="Bütçe (görüşme)">
            <Row
              label="6–7k€ yatırım"
              value={
                q.butce.yatirimYapilabilir
                  ? YATIRIM_LABEL[q.butce.yatirimYapilabilir] ?? q.butce.yatirimYapilabilir
                  : null
              }
            />
            <Row label="Setter yorumu" value={q.butce.setterYorumu} />
          </Block>
        )}

        {q.kararVerici &&
          (q.kararVerici.kim ||
            q.kararVerici.serbestMetin?.trim() ||
            q.kararVerici.riskNotu?.trim() ||
            q.kararVerici.digerKatilacak != null ||
            q.kararVerici.katilabilirMi != null) && (
            <Block title="Karar verici">
              <Row label="Serbest" value={q.kararVerici.serbestMetin} />
              <Row
                label="Kim karar veriyor?"
                value={
                  q.kararVerici.kim
                    ? KARAR_LABEL[q.kararVerici.kim] ?? q.kararVerici.kim
                    : null
                }
              />
              <Row label="Risk notu" value={q.kararVerici.riskNotu} />
              <Row label="Diğer katılacak mı?" value={boolTr(q.kararVerici.digerKatilacak)} />
              <Row label="Katılabilir mi?" value={boolTr(q.kararVerici.katilabilirMi)} />
            </Block>
          )}

        {hasSectionContent(q.zamanlama as Record<string, unknown> | undefined) &&
          q.zamanlama && (
            <Block title="Zamanlama">
              <Row
                label="Haftada 5–6 saat"
                value={
                  q.zamanlama.haftalikSaat
                    ? HAFTALIK_LABEL[q.zamanlama.haftalikSaat] ?? q.zamanlama.haftalikSaat
                    : null
                }
              />
              <Row
                label="Zaman hedefi"
                value={
                  q.zamanlama.zamanHedefi === "hemen"
                    ? "Hemen"
                    : q.zamanlama.zamanHedefi === "1_3_ay"
                      ? "1–3 ay"
                      : q.zamanlama.zamanHedefi === "belirsiz"
                        ? "Belirsiz"
                        : null
                }
              />
              <Row label="Ne zaman başlayabilir?" value={q.zamanlama.neZamanBasla} />
              <Row label="Engel" value={q.zamanlama.engel} />
            </Block>
          )}

        {(q.mentalite?.etiket || (q.mentalite?.tagIds && q.mentalite.tagIds.length > 0)) && (
          <Block title="Mentalite">
            {q.mentalite?.etiket && (
              <Row label="Etiket" value={q.mentalite.etiket.replace(/_/g, " ")} />
            )}
            {q.mentalite?.tagIds && q.mentalite.tagIds.length > 0 && (
              <Row
                label="Etiketler"
                value={q.mentalite.tagIds.map((t) => t.replace(/_/g, " ")).join(", ")}
              />
            )}
            <Row label="Blacklist sebebi" value={q.mentalite.blacklistSebebi} />
          </Block>
        )}

        {q.satisAcisi?.trim() && (
          <Block title="Satış açısı (Closer)">
            <p className="mt-0.5 whitespace-pre-wrap text-sm text-zinc-900 dark:text-zinc-100">
              {q.satisAcisi}
            </p>
          </Block>
        )}

        {sd &&
          (sd.closerNot ||
            sd.riskler ||
            sd.leadKalitesi ||
            sd.isteklilik != null ||
            sd.kapanmaPotansiyeli != null) && (
            <Block title="Setter değerlendirmesi">
              <Row label="Closer’a not" value={sd.closerNot} />
              <Row label="Lead kalitesi" value={sd.leadKalitesi} />
              <Row label="İsteklilik (1–10)" value={sd.isteklilik} />
              <Row label="Kapanma potansiyeli (1–10)" value={sd.kapanmaPotansiyeli} />
              <Row label="Riskler" value={sd.riskler} />
            </Block>
          )}

        {hasSectionContent(q.sonuc as Record<string, unknown> | undefined) && q.sonuc && (
          <Block title="Sonuç (form)">
            <Row label="Durum" value={q.sonuc.durum} />
            <Row label="Sonraki aksiyon" value={q.sonuc.sonrakiAksiyon} />
            <Row label="Red sebebi" value={q.sonuc.redSebebi} />
          </Block>
        )}
      </div>
    </section>
  );
}
