/**
 * Setter kalifikasyon metni — canlı cockpit ile birebir eşleşir (satır satır).
 * Sahne yönergeleri (➤, “Cevabı al” vb.) metinde yer almaz; sadece konuşulacak metin.
 */

/** Müsait değil seçildiğinde intro bölümünde gösterilen takip metni */
export const INTRO_MUSAIT_DEGIL_LINES = [
  "Müsait değilse: Anlıyorum, Dijital alanda işinizi nasıl büyütebileceğimizi değerlendirmek için 5-10 dakikalık kısa bir ön görüşme yapmamız gerekiyor. Bugün öğleden sonra 16:30 mu size daha uygun olur, yoksa yarın öğlen 13 mü?",
  'Whatsapp: "Ben şimdi size WhatsApp\'tan müsait olduğum iki farklı saat dilimini gönderiyorum. Sizden ricam, mesajı görür görmez hangisinin size uyduğunu onaylamanız. Eğer ikisi de uymazsa, sizin önerdiğiniz saati oradan netleştirelim. Mutabık mıyız?"',
] as const;

export const SETTER_SCRIPT_SECTIONS = [
  {
    id: "intro",
    title: "Görüşme başlangıcı",
    lines: [
      "Merhabalar [İSİM] Bey/Hanım. Ben Berat, Semih Mayil'in ekibinden arıyorum. Semih beyle görüşmek için başvuru yapmışsınız, değil mi?",
      "Müsait misiniz şu anda?",
    ],
  },
  {
    id: "bilgilendirme",
    title: "Bilgilendirme",
    lines: [
      "Süper. Şu an bize başvuranlara sırayla geri dönüş yapıyoruz. Ve herkesle çalışma gibi bir amacımız veya daha doğrusu kapasitemiz olmadığı için bu kısa görüşmenin tek bir amacı var: Sizin şu anki durumunuzu analiz etmek ve size gerçekten faydalı olup olamayacağımızı anlamaktır.",
      "Biliyorsunuz herkesin zamanı çok değerli, bu yüzden size de %100 faydalı olabileceğimize emin olursak (Semih Bey ile) ücretsiz bir ön görüşme randevusu oluştururuz. Orada size de özel yol haritası hazırlayabilir ve çözümleri detaylıca konuşabiliriz.",
    ],
  },
  {
    id: "mevcut_durum",
    title: "Adım 1: Mevcut Durum",
    lines: [
      "Süper. O zaman şöyle başlayalım:",
      "Şu anda tam olarak neyle meşgulsünüz? Hangi alanda aktifsiniz?",
      "Peki şu anda müşteri kazanımı ve pazarlama konusunda tam olarak nasıl bir yol izliyorsunuz? Meta (Facebook/Instagram) reklamları aktif mi?",
      "Aylık reklam bütçeniz ne kadar şu anda?",
      "Ajansla mı çalışıyorsunuz, yoksa reklamlarınızı kendiniz mi yönetiyorsunuz?",
      "Peki şu anki bu süreçten (ajansla çalışmaktan / reklamsız kalmaktan) memnun musunuz?",
    ],
  },
  {
    id: "aci_noktalari",
    title: "Adım 2: Acı Noktaları (Derinleş: Burada yarayı deş)",
    lines: [
      'Sizi müşteri bulma veya reklam tarafında en çok zorlayan, "artık burama kadar geldi" dediğiniz nokta neresi? Yani \'Şunu bir çözsem işler uçacak\' dediğiniz o problem nedir?',
      "Bu durum işinize nasıl yansıyor? (Ciro kaybı mı, stres mi, belirsizlik mi?)",
      "Tam olarak eksiğinizi nerede hissediyorsunuz?",
    ],
  },
  {
    id: "cozum",
    title: "Adım 3: Çözüm Sunumu (Şimdi Tam Zamanı)",
    lines: [
      "Anlıyorum... Aslında bu anlattıklarınız bize başvuran danışanlarımızın %90'ının yaşadığı ortak sorun.",
      "Tam bu noktada bizim yaklaşımımız devreye giriyor:",
      "Biz bir reklam ajansı değiliz. Bizim işimiz, sizinle birlikte şirketinize ait bir (In-house) Dijital Pazarlama Sistemi kurmak.",
      "Böylece reklamcılara veya ajanslara bağımlı kalmadan bütçenizin boşa gitmediği bir yapıya geçiyorsunuz. Kontrol sizin elinizde oluyor. Bu sistemi kurmak için ekstra bir elemana veya reklamcıya ihtiyacınız olmuyor.",
      "Böyle bir yapıya geçmek, bu bağımlılıktan kurtulmak sizin için de mantıklı bir hedef mi? İstenilen şey bu mu?",
    ],
  },
  {
    id: "hedef",
    title: "Adım 4: Hedef ve Motivasyon",
    lines: [
      "Süper, öyleyse bu sistemi kurduğumuzda, önümüzdeki 6-12 ayda ulaşmak istediğiniz somut hedef nedir? Kafanızdaki o somut ciro artışı veya müşteri sayısı hedefi nedir?",
      "Bu biraz düşündürücü soru olabilir. Hatta belki kulağa tuhaf gelebilir ama çok önemli. Bu hedef sizin için neden önemli? Yani neden artık bu işi ertelemek veya olduğu gibi bırakmak sizin için bir seçenek değil?",
    ],
  },
  {
    id: "butce",
    title: "Adım 5a: Bütçe — prensip",
    lines: [
      "Harika. Hedefleriniz ve durumunuz gayet net.",
      "Şimdi, Semih Bey ile yapacağınız görüşmeyi planlamadan önce, bu işin finansal uygulanabilirliğini netleştirmemiz lazım.",
      "Şöyle ki, Tecrübelerimize göre, bahsettiğiniz bu hedeflere %100 ulaşmak için, önümüzdeki dönemde ortalama 6.000-7.000 Euro arasında bir yatırımı gözden çıkarmanız gerekir.",
      "Bu hemen bugün hepsi ödenecek diye bir şey yok…",
      "Ama prensip olarak:",
      '👉 Bu aralıkta bir yatırımı işinize yapmak sizin için şu an "yapılabilir" bir durum mu?',
    ],
  },
  {
    id: "butce_itiraz",
    title: "Bütçe — itiraz karşılama (bilgilendirme)",
    lines: [
      "🛑 KRİTİK İTİRAZ KARŞILAMA BLOKLARI:",
      '"Bakın şu an size bir şey sunmuyoruz. Yani herhangi bir teklif mevzu bahis değil. Semih bey size herhangi bir teklif yapar mı, onu da bilmiyorum. Şu an sadece şunu anlamaya çalışıyorum: Eğer bu sorunu gerçekten çözmek istiyorsanız, şu anda prensip olarak işinize/kendinize yatırım yapabilecek bu finansal imkanınız var mı? Çünkü bu imkanınız yoksa, Semih Bey\'in size sunacağı stratejinin bir anlamı olmayacaktır. Bunu netleştirmek istiyorum."',
      'Senaryo B: "Semih Bey beni ikna etsin / Bakarız" derse:',
      '"Şunu çok açık söyleyeyim: Semih Bey\'in takvimi çok yoğun olduğu için sadece gerçekten harekete geçmeye hazır ve uygulayacak adaylarla görüşüyor. Yani bu görüşme bir \'bilgi alma\' veya \'ikna edilme\' seansı değil, sizin durumunuza özel bir strateji belirleme toplantısıdır. Eğer sizin bu sorunu çözmek için bütçe ayırma niyetiniz yoksa, Semih Bey\'in vaktini almayalım, sizin de vaktinizi harcamayalım. Ama \'Eğer çözüm aklıma yatarsa, bu bütçeyi ayırabilirim\' diyorsanız devam edelim. Durum hangisi?"',
    ],
  },
  {
    id: "butce_teyit",
    title: "Adım 5b: Bütçe — teyit",
    lines: [
      "Eğer böyle bir yatırım mantığınıza yatarsa sizin için bu hemen mümkün müdür? Yoksa maddi olarak birikim yapmanız gerekecek mi?",
      "Yani kısacası bu bütçeye likit olarak erişiminiz var mı? (Vadeli değilde nakit veya kredi kartı vs. şeklinde hemen kullanabilir misiniz?).",
    ],
  },
  {
    id: "karar_verici",
    title: "Adım 6: Karar Verici",
    lines: [
      "Peki bu tarz ticari kararları tek başınıza mı alırsınız, yoksa bir ortağınız, eşiniz veya fikir danıştığınız biri var mı?",
      "Harika. Semih Bey prensip gereği, tüm karar vericilerin olduğu toplantılarda stratejiyi anlatıyor. Çünkü süreç teknik ve detaylı, sonradan kulaktan dolma anlatılsın istemiyoruz.",
      "O yüzden toplantıya [Ortağınız/Eşiniz] ile birlikte katılmanızı rica edeceğim. Bu mümkün mü?",
      "(Mümkün değilse randevu verme veya ertele).",
    ],
  },
  {
    id: "zaman",
    title: "Adım 7: Zaman ve Başlangıç",
    lines: [
      "Sistem kurulurken haftada 5-6 saat bu işe odaklanabilir misiniz? Yani günlük yarım saat bir saat…",
      "Her şey aklınıza yatarsa, hemen (bu hafta/ay) başlayabilecek durumda mısınız? Yoksa engelleyen bir tatil, sağlık durumu vs. var mı?.",
    ],
  },
  {
    id: "kapanis",
    title: "Adım 8: Kapanış ve randevu — bilgilendirme",
    lines: [
      "Harika, size Semih bey %100 gerçekten faydalı olabileceğine inanıyorum. Yeni şimdilik benim açımdan yeşil ışıklar yandı. Çünkü sizden önce aynı, benzer durumda olan onlarca kişiye Semih bey bu alanda faydalı oldu.",
      "Bir sonraki adım olarak sizin için Semih beyle Zoom üzerinden birebir bir toplantı planlayacağım.",
      "Bu görüşme yaklaşık bir, en fazla birbuçuk saat sürecek. Size en yakın tarihe randevuyu ayarlamaya çalışacağım.",
      "Sizin için bugün veya yarın en uygun zaman aralığı nedir? (11:00 - 15:00 Almanya saati tercih edilir)",
      "Sizin için [Gün/Saat] uygun mudur?",
      "(Randevuyu ver).",
      "Son Hatırlatma",
      "Size WhatsApptan Zoom linkini atacağım.",
      "Size WhatsApp üzerinden hem Zoom linkini hem de birkaç video göndereceğim - onları da toplantıdan önce mutlaka izleyin, size ciddi fayda sağlayacaktır.",
      "Kapatmadan önce küçük ama önemli bir ricam var:",
      "Bu görüşme sizin için tamamen ücretsiz ve Semih Bey size ciddi bir zaman ayıracak.",
      "Sizden tek beklentimiz NETLİK.",
      'Görüşme sonunda Semih Bey size bir yol haritası sunacak. O görüşmenin sonunda sizden, "Evet" veya "Hayır" şeklinde net bir karar duymak isterse "Düşüneyim" gibi belirsiz süreçler iki tarafı da yoruyor.',
      '👉 Görüşme sonunda olumlu veya olumsuz net bir karar verebilirsiniz, değil mi?',
      "Tamamdır, eğer herhangi bir sebepten dolayı bu toplantıya katılamayacak olursanız, lütfen en geç birkaç saat önceden bize bilgi verin. Çünkü ben doğrudan bu sürecin sorumlusuyum ve Semih Bey'e karşı mahcup olmak istemem. %100 katılacağınızı katılırsınız değil mi?",
      "Harika. O halde tüm detayları şimdi size WhatsApp'tan gönderiyorum.",
      "Şimdiden başarılar dilerim!",
      "Birebir programımızda tekrar görüşmek dileğiyle,",
      "İyi günler, hoşcakalın.",
    ],
  },
] as const;

export type SectionId = (typeof SETTER_SCRIPT_SECTIONS)[number]["id"];
