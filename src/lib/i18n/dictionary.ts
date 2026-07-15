export type MarketingLang = 'uz' | 'uzc' | 'ru';

interface StepItem {
  title: string;
  desc: string;
}

interface FaqItem {
  q: string;
  a: string;
}

interface LegalSection {
  heading: string;
  body: string;
}

export interface MarketingDict {
  nav: {
    home: string;
    users: string;
    sellers: string;
    download: string;
  };
  footer: {
    tagline: string;
    contactTitle: string;
    linksTitle: string;
    legalTitle: string;
    terms: string;
    privacy: string;
    rights: string;
  };
  home: {
    badge: string;
    title1: string;
    titleHighlight: string;
    title2: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    trustMap: string;
    trustDelivery: string;
    trustLang: string;
    stats: { value: string; label: string }[];
    howTitle: string;
    howSubtitle: string;
    howSteps: StepItem[];
    featuresTitle: string;
    featuresSubtitle: string;
    features: StepItem[];
    dualTitle: string;
    dualCustomerTitle: string;
    dualCustomerDesc: string;
    dualCustomerCta: string;
    dualSellerTitle: string;
    dualSellerDesc: string;
    dualSellerCta: string;
  };
  download: {
    title: string;
    desc: string;
    ctaReady: string;
    ctaSoon: string;
    soonNote: string;
    version: string;
  };
  contact: {
    title: string;
    desc: string;
    name: string;
    phone: string;
    message: string;
    namePh: string;
    phonePh: string;
    messagePh: string;
    submit: string;
    submitting: string;
    success: string;
    newMsg: string;
    error: string;
  };
  users: {
    badge: string;
    title: string;
    subtitle: string;
    stepsTitle: string;
    steps: StepItem[];
    rightsTitle: string;
    rightsSubtitle: string;
    rights: StepItem[];
    extraTitle: string;
    extra: StepItem[];
    faqTitle: string;
    faq: FaqItem[];
  };
  sellers: {
    badge: string;
    title: string;
    subtitle: string;
    whyTitle: string;
    why: StepItem[];
    stepsTitle: string;
    stepsSubtitle: string;
    steps: StepItem[];
    reqTitle: string;
    reqMinimalTitle: string;
    reqMinimalItems: string[];
    reqApprovalTitle: string;
    reqApprovalItems: string[];
    commissionTitle: string;
    commissionDesc: string;
    warehouseTitle: string;
    warehouse: StepItem[];
    ctaTitle: string;
    ctaDesc: string;
  };
  legal: {
    updatedPrefix: string;
    termsTitle: string;
    termsIntro: string;
    termsSections: LegalSection[];
    privacyTitle: string;
    privacyIntro: string;
    privacySections: LegalSection[];
  };
}

const uz: MarketingDict = {
  nav: {
    home: "Bosh sahifa",
    users: "Foydalanuvchilar",
    sellers: "Sotuvchilar",
    download: "Ilovani yuklab olish",
  },
  footer: {
    tagline: "Yaqin atrofingizdagi do'konlardan tez va ishonchli yetkazib berish.",
    contactTitle: "Aloqa",
    linksTitle: "Sahifalar",
    legalTitle: "Huquqiy",
    terms: "Foydalanish shartlari",
    privacy: "Maxfiylik siyosati",
    rights: "Barcha huquqlar himoyalangan.",
  },
  home: {
    badge: "Giperlokal FMCG marketpleys",
    title1: "Yaqin atrofingizdagi do'konlardan",
    titleHighlight: "eng tez",
    title2: "yetkazib berish",
    subtitle:
      "Oziq-ovqat va kundalik mahsulotlarni yaqin atrofdagi do'konlardan buyurtma qiling. Bir nechta do'kondan bitta ilovada, real vaqtda kuzatib boring va daqiqalar ichida qabul qiling.",
    ctaPrimary: "Ilovani yuklab olish",
    ctaSecondary: "Qanday ishlaydi",
    trustMap: "Yaqin do'konlar xaritada",
    trustDelivery: "1-4 km radiusda yetkazish",
    trustLang: "3 tilda interfeys",
    stats: [
      { value: "5 daqiqa", label: "Sotuvchining buyurtmani qabul qilish vaqti" },
      { value: "1-4 km", label: "Yetkazib berish radiusi" },
      { value: "3 til", label: "O'zbek, kirill va rus tilida" },
      { value: "24/7", label: "Ba'zi do'konlar tungi ishlash imkoniyati" },
    ],
    howTitle: "Qanday ishlaydi",
    howSubtitle: "To'rt qadamda buyurtma bering — ro'yxatdan o'tishdan yetkazib berilgunga qadar",
    howSteps: [
      {
        title: "Ro'yxatdan o'ting",
        desc: "Telefon raqamingiz bilan SMS-kod orqali bir zumda kiring — parol shart emas.",
      },
      {
        title: "Do'kon va mahsulot tanlang",
        desc: "Xaritada atrofingizdagi do'konlarni ko'ring, bir nechtasidan mahsulot tanlang — har biri uchun alohida savat yig'iladi.",
      },
      {
        title: "Buyurtma bering",
        desc: "Naqd to'lov bilan buyurtma yuboring — sotuvchi 5 daqiqa ichida javob beradi.",
      },
      {
        title: "Real vaqtda kuzating",
        desc: "Yig'ilmoqda, yetkazilmoqda — har bosqichni ilovada ko'rib boring va mahsulotni baholang.",
      },
    ],
    featuresTitle: "Imkoniyatlar",
    featuresSubtitle:
      "Mijozlar uchun qulay xarid, sotuvchilar uchun kuchli sklad boshqaruvi — barchasi bitta ilovada",
    features: [
      {
        title: "Yaqin do'konlar xaritada",
        desc: "Atrofingizdagi do'konlarni xaritada pin sifatida ko'ring va eng yaqinini tanlang.",
      },
      {
        title: "Tez yetkazib berish",
        desc: "Yaqinligi tufayli buyurtmalar daqiqalar ichida eshigingizgacha yetib keladi.",
      },
      {
        title: "Bir ilovada ko'p do'kon",
        desc: "Bir nechta do'kondan mahsulotlarni tanlang — har biri uchun alohida savat va buyurtma yaratiladi.",
      },
      {
        title: "Sotuvchi bilan chat",
        desc: "Sotuvchi bilan real vaqtda yozishing, savol bering va buyurtmani aniqlashtiring.",
      },
      {
        title: "Sharhlar va reyting",
        desc: "Mahsulotlarni baholang, boshqa xaridorlarning fikrlariga ishoning.",
      },
      {
        title: "3 tilda interfeys",
        desc: "O'zbek (lotin/kirill) va rus tillarida qulay foydalanish imkoniyati.",
      },
      {
        title: "Mobil sklad boshqaruvi",
        desc: "Sotuvchilar uchun ombor, mahsulot va narxlarni telefon orqali boshqarish.",
      },
      {
        title: "Nasiya (qarz) hisobi",
        desc: "Doimiy mijozlar bilan nasiya savdosini yuriting, qarzlarni shaffof hisobga oling.",
      },
      {
        title: "Statistika va xodimlar",
        desc: "Sotuvlar statistikasi, kassir va yetkazib beruvchi kabi xodimlarni boshqaring.",
      },
    ],
    dualTitle: "Sizga qaysi biri mos?",
    dualCustomerTitle: "Mijozman",
    dualCustomerDesc: "Yaqin atrofdagi do'konlardan xarid qilmoqchiman",
    dualCustomerCta: "Mijozlar uchun",
    dualSellerTitle: "Sotuvchiman",
    dualSellerDesc: "O'z do'konimni ochib, Yaqin Market orqali sotmoqchiman",
    dualSellerCta: "Sotuvchilar uchun",
  },
  download: {
    title: "Yaqin Market ilovasini yuklab oling",
    desc: "Android qurilmangizga APK faylni o'rnating va yaqin atrofdagi do'konlardan xarid qilishni boshlang.",
    ctaReady: "APK yuklab olish",
    ctaSoon: "Tez kunda",
    soonNote: "Ilova hozircha tayyorlanmoqda — tez orada yuklab olish mumkin bo'ladi.",
    version: "Versiya",
  },
  contact: {
    title: "Biz bilan bog'laning",
    desc: "Savol yoki taklifingiz bormi? Ma'lumotlaringizni qoldiring, tez orada bog'lanamiz.",
    name: "Ism",
    phone: "Telefon",
    message: "Xabar",
    namePh: "Ismingiz",
    phonePh: "+998 90 123 45 67",
    messagePh: "Xabaringizni yozing...",
    submit: "Yuborish",
    submitting: "Yuborilmoqda…",
    success: "Murojaatingiz qabul qilindi, tez orada bog'lanamiz",
    newMsg: "Yangi murojaat yuborish",
    error: "Xatolik yuz berdi, birozdan so'ng qayta urinib ko'ring.",
  },
  users: {
    badge: "Mijozlar uchun",
    title: "Xarid qilish — bir necha bosishda",
    subtitle:
      "Yaqin atrofingizdagi do'konlardan kundalik mahsulotlarni buyurtma qiling, real vaqtda kuzating va naqd to'lang.",
    stepsTitle: "Buyurtma qanday amalga oshiriladi",
    steps: [
      {
        title: "Manzilingizni tanlang",
        desc: "GPS avtomatik aniqlanadi, yoki saqlangan manzillaringizdan (Uy, Ish) birini tanlang.",
      },
      {
        title: "Yaqin do'konlarni ko'ring",
        desc: "Faqat yetkazib berish zonasi ichidagi do'konlar ko'rsatiladi — xaritada yoki ro'yxatda.",
      },
      {
        title: "Savatga qo'shing",
        desc: "Bir nechta do'kondan tanlasangiz, har biri uchun alohida savat va buyurtma yaratiladi.",
      },
      {
        title: "Naqd to'lov bilan buyurtma bering",
        desc: "Sotuvchi 5 daqiqa ichida javob beradi, aks holda buyurtma avtomatik bekor bo'ladi.",
      },
    ],
    rightsTitle: "Mijoz sifatidagi huquqlaringiz",
    rightsSubtitle: "Yaqin Market'da xarid qilishda sizga aynan shu qoidalar kafolat beradi",
    rights: [
      {
        title: "Faqat butun mahsulot qaytariladi",
        desc: "Agar biror mahsulot kerak bo'lmasa, kuryer eshik oldida — naqd to'lashdan oldin — uni butun birlik holida qaytarib olishi mumkin (masalan 1 dona non, lekin 0.5 kg emas). To'lov qolgan summaga hisoblanadi.",
      },
      {
        title: "Faqat mahsulotni baholaysiz",
        desc: "Har bir xariddan so'ng mahsulotni 1-5 yulduz bilan baholaysiz. Do'kon reytingi shu baholardan avtomatik hisoblanadi.",
      },
      {
        title: "Naqd to'lov, naqd qaytarish",
        desc: "Hozircha barcha to'lovlar naqd amalga oshiriladi — pul qaytarish ham qo'l-qo'lga, hech qanday yashirin to'lov yo'q.",
      },
      {
        title: "Faqat sizga yetadigan do'konlar ko'rinadi",
        desc: "Yetkazib berish zonasidan tashqaridagi do'konlar ro'yxatda umuman chiqmaydi — behuda buyurtma berib, rad javobi olmaysiz.",
      },
      {
        title: "5 daqiqa qabul kafolati",
        desc: "Sotuvchi buyurtmangizga 5 daqiqa ichida javob berishi shart, aks holda buyurtma avtomatik bekor qilinadi.",
      },
      {
        title: "Real vaqtda status kuzatuvi",
        desc: "Yangi → Qabul qilindi → Yig'ilmoqda → Yetkazilmoqda → Yetkazildi — har bosqichni ilovada ko'rib turasiz.",
      },
    ],
    extraTitle: "Yana nimalar bor",
    extra: [
      {
        title: "Interaktiv xarita",
        desc: "Barcha yaqin do'konlarni xaritada pin sifatida ko'ring.",
      },
      {
        title: "To'g'ridan-to'g'ri chat",
        desc: "Sotuvchi bilan ilovada yozishib, buyurtmani aniqlashtiring.",
      },
      {
        title: "3 tilda interfeys",
        desc: "O'zbek lotin, o'zbek kirill va rus tillarida foydalaning.",
      },
    ],
    faqTitle: "Ko'p beriladigan savollar",
    faq: [
      {
        q: "To'lov qanday amalga oshiriladi?",
        a: "Hozircha faqat naqd pul bilan — kuryerga qo'lma-qo'l to'laysiz.",
      },
      {
        q: "Mahsulotni qaytarib bo'ladimi?",
        a: "Ha, lekin faqat butun birlik holida va yetkazish vaqtida, to'lovdan oldin. Sabab yozish ixtiyoriy.",
      },
      {
        q: "Nega ba'zi do'konlar ko'rinmayapti?",
        a: "Faqat sizning manzilingizga yetkazib bera oladigan do'konlar ko'rsatiladi — masofa sotuvchi tomonidan belgilanadi.",
      },
      {
        q: "Buyurtmam qabul qilinmasa nima bo'ladi?",
        a: "5 daqiqa ichida sotuvchi javob bermasa, buyurtma avtomatik bekor qilinadi. To'lov naqd bo'lgani uchun oldindan yechilgan pul bo'lmaydi.",
      },
    ],
  },
  sellers: {
    badge: "Sotuvchilar uchun",
    title: "O'z do'koningizni Yaqin Market'da oching",
    subtitle:
      "Yaqin atrofingizdagi mijozlarga to'g'ridan-to'g'ri soting — o'z vaqtingizda, o'z shartlaringizda.",
    whyTitle: "Nega Yaqin Market'da sotish qulay",
    why: [
      {
        title: "Yaqin mijozlar",
        desc: "Faqat siz yetkazib bera oladigan radiusdagi mijozlarga ko'rinasiz — raqobat kamroq, ishonch yuqoriroq.",
      },
      {
        title: "O'zingiz yetkazasiz",
        desc: "Alohida kuryer xizmatiga muhtoj emassiz — o'zingiz yoki xodimingiz 1-4 km radiusda yetkazadi.",
      },
      {
        title: "To'liq nazorat",
        desc: "Ish vaqti, yetkazish zonasi, minimal buyurtma summasi — barchasini o'zingiz belgilaysiz.",
      },
      {
        title: "Mobil sklad boshqaruvi",
        desc: "Mahsulot, narx va qoldiqni telefon orqali istalgan joydan yangilang.",
      },
    ],
    stepsTitle: "Sotuvchi bo'lish yo'li",
    stepsSubtitle: "Arizadan do'kon ochilishigacha — to'rt bosqich",
    steps: [
      {
        title: "Ariza yuboring",
        desc: "Ilovani yuklab oling, Profil bo'limidan \"Sotuvchi bo'lish\" arizasini yuboring — ism, familiya va telefon raqamingiz yetarli.",
      },
      {
        title: "Admin siz bilan bog'lanadi",
        desc: "Yaqin Market jamoasi arizangizni ko'rib chiqib, telefon orqali siz bilan bog'lanadi.",
      },
      {
        title: "Rasmiylashtiring",
        desc: "Tasdiqlash bosqichida STIR/PINFL, bank karta va shartnoma ma'lumotlaringiz to'ldiriladi.",
      },
      {
        title: "Do'koningizni oching",
        desc: "Tasdiqdan so'ng ilova ichida do'kon yaratasiz, mahsulot qo'shasiz va sotishni boshlaysiz.",
      },
    ],
    reqTitle: "Nima talab qilinadi?",
    reqMinimalTitle: "Ariza uchun (hoziroq)",
    reqMinimalItems: ["Ism va familiya", "Telefon raqam", "Qisqacha izoh (ixtiyoriy)"],
    reqApprovalTitle: "Tasdiqlash uchun (admin bilan)",
    reqApprovalItems: ["STIR yoki PINFL", "Bank karta ma'lumotlari", "Shartnomani rasmiylashtirish"],
    commissionTitle: "Komissiya tizimi",
    commissionDesc:
      "Har bir buyurtmadan platforma xizmat haqi sifatida kichik komissiya olinadi — aniq stavka admin panelda ko'rsatiladi va Prime obunachilar uchun pasaytiriladi. Naqd buyurtmalarda komissiya avtomatik balansingizdan hisoblanadi — qo'shimcha to'lov qilish shart emas.",
    warehouseTitle: "Mobil sklad imkoniyatlari",
    warehouse: [
      {
        title: "To'liq sklad CRUD",
        desc: "Mahsulot qo'shish, narx va qoldiqni istalgan vaqtda yangilash.",
      },
      {
        title: "Kirim-chiqim tarixi",
        desc: "Har bir partiya (FIFO) va harakatni kuzatib boring.",
      },
      {
        title: "Kam qoldiq ogohlantirishi",
        desc: "Mahsulot tugab qolishidan oldin push-bildirishnoma oling.",
      },
      {
        title: "Xodimlar tizimi",
        desc: "QR-kod orqali xodim taklif qiling, kassir, sklad ishchisi va yetkazib beruvchi kabi ruxsatlarni belgilang.",
      },
    ],
    ctaTitle: "Sotishni boshlashga tayyormisiz?",
    ctaDesc: "Ilovani yuklab oling, Profil bo'limidan ariza yuboring — biz sizga qo'ng'iroq qilamiz.",
  },
  legal: {
    updatedPrefix: "Oxirgi yangilanish",
    termsTitle: "Foydalanish shartlari",
    termsIntro:
      "Ushbu shartlar Yaqin Market ilovasi va veb-saytidan foydalanish tartibini belgilaydi. Ilovadan foydalanish orqali siz quyidagi shartlarga rozilik bildirasiz.",
    termsSections: [
      {
        heading: "1. Xizmat tavsifi",
        body: "Yaqin Market — foydalanuvchilarni yaqin atrofdagi mustaqil do'konlar (sotuvchilar) bilan bog'laydigan giperlokal platforma. Yaqin Market o'zi tovar sotmaydi va yetkazib bermaydi — bu vazifalarni sotuvchining o'zi yoki uning xodimi bajaradi.",
      },
      {
        heading: "2. Ro'yxatdan o'tish va akkaunt",
        body: "Ilovaga kirish telefon raqami va bir martalik SMS-kod (OTP) orqali amalga oshiriladi. Siz taqdim etgan ma'lumotlarning to'g'riligi uchun javobgarsiz. Akkauntingiz xavfsizligini ta'minlash — sizning mas'uliyatingiz.",
      },
      {
        heading: "3. Buyurtma va to'lov",
        body: "Hozirgi bosqichda barcha buyurtmalar faqat naqd pul bilan to'lanadi. Sotuvchi buyurtmani 5 daqiqa ichida qabul qilishi shart; aks holda buyurtma avtomatik bekor qilinadi. Har bir do'kon o'z minimal buyurtma summasini belgilashi mumkin.",
      },
      {
        heading: "4. Yetkazib berish",
        body: "Yaqin Market alohida kuryer xizmatini yuritmaydi. Yetkazib berish sotuvchining o'zi yoki uning xodimi tomonidan, sotuvchi belgilagan radius (odatda 1-4 km) doirasida amalga oshiriladi.",
      },
      {
        heading: "5. Qaytarish siyosati",
        body: "Yetkazish vaqtida, to'lovdan oldin, mahsulot faqat butun birlik holida qaytarilishi mumkin (masalan, 1 dona mahsulot; qismli miqdorni qaytarib bo'lmaydi). Qaytarilgan mahsulot summasi umumiy hisobdan avtomatik ayiriladi.",
      },
      {
        heading: "6. Sotuvchi majburiyatlari",
        body: "Sotuvchilar mahsulot sifati, narx aniqligi va yetkazib berish muddatlariga javobgardir. Yaqin Market seller arizalarini ko'rib chiqadi, lekin har bir sotuvchining tadbirkorlik faoliyati mustaqildir. Sotuvchi platformadan foydalanish uchun kelishilgan komissiya to'lovini amalga oshiradi.",
      },
      {
        heading: "7. Foydalanuvchini bloklash",
        body: "Sotuvchi o'z do'koni doirasida muayyan foydalanuvchini bloklashi mumkin — bu faqat o'sha do'konga tegishli bo'lib, platformaning boshqa qismlariga ta'sir qilmaydi. Yaqin Market administratsiyasi qoidabuzarlik holatlarida akkauntni butun platforma bo'yicha to'xtatib qo'yish huquqini saqlab qoladi.",
      },
      {
        heading: "8. Javobgarlikni cheklash",
        body: "Yaqin Market — vositachi platforma. Mahsulot sifati, miqdori va yetkazib berish sifati bo'yicha bevosita javobgarlik sotuvchida bo'ladi. Platforma texnik nosozliklar yoki uchinchi tomon xizmatlari (masalan, SMS-provayder) sabab yuzaga kelgan uzilishlar uchun javobgar emas.",
      },
      {
        heading: "9. Shartlarning o'zgarishi",
        body: "Ushbu shartlar vaqti-vaqti bilan yangilanishi mumkin. Muhim o'zgarishlar haqida ilova orqali xabar beramiz.",
      },
      {
        heading: "10. Bog'lanish",
        body: "Savol va murojaatlar uchun sayt pastidagi aloqa ma'lumotlaridan yoki ilovadagi \"Bog'lanish\" bo'limidan foydalaning.",
      },
    ],
    privacyTitle: "Maxfiylik siyosati",
    privacyIntro:
      "Ushbu sahifa Yaqin Market qanday ma'lumot to'plashi, undan qanday foydalanishi va uni qanday himoya qilishini tushuntiradi.",
    privacySections: [
      {
        heading: "1. Qanday ma'lumot to'planadi",
        body: "Telefon raqamingiz (kirish uchun), joylashuvingiz (GPS — yaqin do'konlarni ko'rsatish uchun), buyurtmalar tarixi, saqlangan manzillar, sevimlilar ro'yxati va qurilma tokeni (push-bildirishnomalar uchun).",
      },
      {
        heading: "2. Ma'lumotdan qanday foydalaniladi",
        body: "Yig'ilgan ma'lumot faqat xizmatni ko'rsatish uchun ishlatiladi: yaqin do'konlarni topish, buyurtmani yetkazish, bildirishnoma yuborish va xizmat sifatini yaxshilash. Ma'lumotlaringiz uchinchi shaxslarga sotilmaydi.",
      },
      {
        heading: "3. Uchinchi tomon xizmatlari",
        body: "SMS orqali tasdiqlash kodi (OTP) yuborish uchun Eskiz.uz xizmatidan foydalanamiz — bu jarayonda telefon raqamingiz ushbu provayderga uzatiladi.",
      },
      {
        heading: "4. Ma'lumotni saqlash",
        body: "Ma'lumotlaringiz xizmat ko'rsatish davomida saqlanadi. Akkauntni o'chirishni so'rasangiz, shaxsiy ma'lumotlaringiz amaldagi qonunchilikka muvofiq o'chiriladi yoki anonimlashtiriladi.",
      },
      {
        heading: "5. Sizning huquqlaringiz",
        body: "O'z ma'lumotlaringizni ko'rish, tuzatish yoki o'chirishni so'rash huquqiga egasiz. Bu uchun ilovadagi profil sozlamalaridan yoki \"Bog'lanish\" bo'limidan murojaat qiling.",
      },
      {
        heading: "6. Xavfsizlik",
        body: "Ma'lumotlaringiz shifrlangan aloqa kanallari (HTTPS) orqali uzatiladi va parolsiz, faqat SMS-kod orqali kirish tizimi qo'llaniladi.",
      },
      {
        heading: "7. Bolalar maxfiyligi",
        body: "Xizmat 18 yoshdan katta foydalanuvchilar uchun mo'ljallangan.",
      },
      {
        heading: "8. Siyosatning o'zgarishi",
        body: "Ushbu maxfiylik siyosati vaqti-vaqti bilan yangilanishi mumkin, muhim o'zgarishlar haqida ilova orqali xabar beramiz.",
      },
    ],
  },
};

const uzc: MarketingDict = {
  nav: {
    home: "Бош саҳифа",
    users: "Фойдаланувчилар",
    sellers: "Сотувчилар",
    download: "Иловани юклаб олиш",
  },
  footer: {
    tagline: "Яқин атрофингиздаги дўконлардан тез ва ишончли етказиб бериш.",
    contactTitle: "Алоқа",
    linksTitle: "Саҳифалар",
    legalTitle: "Ҳуқуқий",
    terms: "Фойдаланиш шартлари",
    privacy: "Махфийлик сиёсати",
    rights: "Барча ҳуқуқлар ҳимояланган.",
  },
  home: {
    badge: "Гиперлокал FMCG маркетплейс",
    title1: "Яқин атрофингиздаги дўконлардан",
    titleHighlight: "энг тез",
    title2: "етказиб бериш",
    subtitle:
      "Озиқ-овқат ва кундалик маҳсулотларни яқин атрофдаги дўконлардан буюртма қилинг. Бир нечта дўкондан битта иловада, реал вақтда кузатиб боринг ва дақиқалар ичида қабул қилинг.",
    ctaPrimary: "Иловани юклаб олиш",
    ctaSecondary: "Қандай ишлайди",
    trustMap: "Яқин дўконлар харитада",
    trustDelivery: "1-4 км радиусда етказиш",
    trustLang: "3 тилда интерфейс",
    stats: [
      { value: "5 дақиқа", label: "Сотувчининг буюртмани қабул қилиш вақти" },
      { value: "1-4 км", label: "Етказиб бериш радиуси" },
      { value: "3 тил", label: "Ўзбек, кирилл ва рус тилида" },
      { value: "24/7", label: "Баъзи дўконлар тунги ишлаш имконияти" },
    ],
    howTitle: "Қандай ишлайди",
    howSubtitle: "Тўрт қадамда буюртма беринг — рўйхатдан ўтишдан етказиб берилгунга қадар",
    howSteps: [
      {
        title: "Рўйхатдан ўтинг",
        desc: "Телефон рақамингиз билан SMS-код орқали бир зумда киринг — парол шарт эмас.",
      },
      {
        title: "Дўкон ва маҳсулот танланг",
        desc: "Харитада атрофингиздаги дўконларни кўринг, бир нечтасидан маҳсулот танланг — ҳар бири учун алоҳида сават йиғилади.",
      },
      {
        title: "Буюртма беринг",
        desc: "Нақд тўлов билан буюртма юборинг — сотувчи 5 дақиқа ичида жавоб беради.",
      },
      {
        title: "Реал вақтда кузатинг",
        desc: "Йиғилмоқда, етказилмоқда — ҳар босқични иловада кўриб боринг ва маҳсулотни баҳоланг.",
      },
    ],
    featuresTitle: "Имкониятлар",
    featuresSubtitle:
      "Мижозлар учун қулай харид, сотувчилар учун кучли склад бошқаруви — барчаси битта иловада",
    features: [
      {
        title: "Яқин дўконлар харитада",
        desc: "Атрофингиздаги дўконларни харитада пин сифатида кўринг ва энг яқинини танланг.",
      },
      {
        title: "Тез етказиб бериш",
        desc: "Яқинлиги туфайли буюртмалар дақиқалар ичида эшигингизгача етиб келади.",
      },
      {
        title: "Бир иловада кўп дўкон",
        desc: "Бир нечта дўкондан маҳсулотларни танланг — ҳар бири учун алоҳида сават ва буюртма яратилади.",
      },
      {
        title: "Сотувчи билан чат",
        desc: "Сотувчи билан реал вақтда ёзишинг, савол беринг ва буюртмани аниқлаштиринг.",
      },
      {
        title: "Шарҳлар ва рейтинг",
        desc: "Маҳсулотларни баҳоланг, бошқа харидорларнинг фикрларига ишонинг.",
      },
      {
        title: "3 тилда интерфейс",
        desc: "Ўзбек (лотин/кирилл) ва рус тилларида қулай фойдаланиш имконияти.",
      },
      {
        title: "Мобил склад бошқаруви",
        desc: "Сотувчилар учун омбор, маҳсулот ва нархларни телефон орқали бошқариш.",
      },
      {
        title: "Насия (қарз) ҳисоби",
        desc: "Доимий мижозлар билан насия савдосини юритинг, қарзларни шаффоф ҳисобга олинг.",
      },
      {
        title: "Статистика ва ходимлар",
        desc: "Сотувлар статистикаси, кассир ва етказиб берувчи каби ходимларни бошқаринг.",
      },
    ],
    dualTitle: "Сизга қайси бири мос?",
    dualCustomerTitle: "Мижозман",
    dualCustomerDesc: "Яқин атрофдаги дўконлардан харид қилмоқчиман",
    dualCustomerCta: "Мижозлар учун",
    dualSellerTitle: "Сотувчиман",
    dualSellerDesc: "Ўз дўконимни очиб, Яқин Market орқали сотмоқчиман",
    dualSellerCta: "Сотувчилар учун",
  },
  download: {
    title: "Яқин Market иловасини юклаб олинг",
    desc: "Android қурилмангизга APK файлни ўрнатинг ва яқин атрофдаги дўконлардан харид қилишни бошланг.",
    ctaReady: "APK юклаб олиш",
    ctaSoon: "Тез кунда",
    soonNote: "Илова ҳозирча тайёрланмоқда — тез орада юклаб олиш мумкин бўлади.",
    version: "Версия",
  },
  contact: {
    title: "Биз билан боғланинг",
    desc: "Савол ёки таклифингиз борми? Маълумотларингизни қолдиринг, тез орада боғланамиз.",
    name: "Исм",
    phone: "Телефон",
    message: "Хабар",
    namePh: "Исмингиз",
    phonePh: "+998 90 123 45 67",
    messagePh: "Хабарингизни ёзинг...",
    submit: "Юбориш",
    submitting: "Юборилмоқда…",
    success: "Мурожаатингиз қабул қилинди, тез орада боғланамиз",
    newMsg: "Янги мурожаат юбориш",
    error: "Хатолик юз берди, бироздан сўнг қайта уриниб кўринг.",
  },
  users: {
    badge: "Мижозлар учун",
    title: "Харид қилиш — бир неча босишда",
    subtitle:
      "Яқин атрофингиздаги дўконлардан кундалик маҳсулотларни буюртма қилинг, реал вақтда кузатинг ва нақд тўланг.",
    stepsTitle: "Буюртма қандай амалга оширилади",
    steps: [
      {
        title: "Манзилингизни танланг",
        desc: "GPS автоматик аниқланади, ёки сақланган манзилларингиздан (Уй, Иш) бирини танланг.",
      },
      {
        title: "Яқин дўконларни кўринг",
        desc: "Фақат етказиб бериш зонаси ичидаги дўконлар кўрсатилади — харитада ёки рўйхатда.",
      },
      {
        title: "Саватга қўшинг",
        desc: "Бир нечта дўкондан танласангиз, ҳар бири учун алоҳида сават ва буюртма яратилади.",
      },
      {
        title: "Нақд тўлов билан буюртма беринг",
        desc: "Сотувчи 5 дақиқа ичида жавоб беради, акс ҳолда буюртма автоматик бекор бўлади.",
      },
    ],
    rightsTitle: "Мижоз сифатидаги ҳуқуқларингиз",
    rightsSubtitle: "Яқин Market'да харид қилишда сизга айнан шу қоидалар кафолат беради",
    rights: [
      {
        title: "Фақат бутун маҳсулот қайтарилади",
        desc: "Агар бирор маҳсулот керак бўлмаса, курьер эшик олдида — нақд тўлашдан олдин — уни бутун бирлик ҳолида қайтариб олиши мумкин (масалан 1 дона нон, лекин 0.5 кг эмас). Тўлов қолган суммага ҳисобланади.",
      },
      {
        title: "Фақат маҳсулотни баҳолайсиз",
        desc: "Ҳар бир хариддан сўнг маҳсулотни 1-5 юлдуз билан баҳолайсиз. Дўкон рейтинги шу баҳолардан автоматик ҳисобланади.",
      },
      {
        title: "Нақд тўлов, нақд қайтариш",
        desc: "Ҳозирча барча тўловлар нақд амалга оширилади — пул қайтариш ҳам қўл-қўлга, ҳеч қандай яширин тўлов йўқ.",
      },
      {
        title: "Фақат сизга етадиган дўконлар кўринади",
        desc: "Етказиб бериш зонасидан ташқаридаги дўконлар рўйхатда умуман чиқмайди — беҳуда буюртма бериб, рад жавоби олмайсиз.",
      },
      {
        title: "5 дақиқа қабул кафолати",
        desc: "Сотувчи буюртмангизга 5 дақиқа ичида жавоб бериши шарт, акс ҳолда буюртма автоматик бекор қилинади.",
      },
      {
        title: "Реал вақтда статус кузатуви",
        desc: "Янги → Қабул қилинди → Йиғилмоқда → Етказилмоқда → Етказилди — ҳар босқични иловада кўриб турасиз.",
      },
    ],
    extraTitle: "Яна нималар бор",
    extra: [
      {
        title: "Интерактив харита",
        desc: "Барча яқин дўконларни харитада пин сифатида кўринг.",
      },
      {
        title: "Тўғридан-тўғри чат",
        desc: "Сотувчи билан иловада ёзишиб, буюртмани аниқлаштиринг.",
      },
      {
        title: "3 тилда интерфейс",
        desc: "Ўзбек лотин, ўзбек кирилл ва рус тилларида фойдаланинг.",
      },
    ],
    faqTitle: "Кўп бериладиган саволлар",
    faq: [
      {
        q: "Тўлов қандай амалга оширилади?",
        a: "Ҳозирча фақат нақд пул билан — курьерга қўлма-қўл тўлайсиз.",
      },
      {
        q: "Маҳсулотни қайтариб бўладими?",
        a: "Ҳа, лекин фақат бутун бирлик ҳолида ва етказиш вақтида, тўловдан олдин. Сабаб ёзиш ихтиёрий.",
      },
      {
        q: "Нега баъзи дўконлар кўринмаяпти?",
        a: "Фақат сизнинг манзилингизга етказиб бера оладиган дўконлар кўрсатилади — масофа сотувчи томонидан белгиланади.",
      },
      {
        q: "Буюртмам қабул қилинмаса нима бўлади?",
        a: "5 дақиқа ичида сотувчи жавоб бермаса, буюртма автоматик бекор қилинади. Тўлов нақд бўлгани учун олдиндан ечилган пул бўлмайди.",
      },
    ],
  },
  sellers: {
    badge: "Сотувчилар учун",
    title: "Ўз дўконингизни Яқин Market'да очинг",
    subtitle:
      "Яқин атрофингиздаги мижозларга тўғридан-тўғри сотинг — ўз вақтингизда, ўз шартларингизда.",
    whyTitle: "Нега Яқин Market'да сотиш қулай",
    why: [
      {
        title: "Яқин мижозлар",
        desc: "Фақат сиз етказиб бера оладиган радиусдаги мижозларга кўринасиз — рақобат камроқ, ишонч юқорироқ.",
      },
      {
        title: "Ўзингиз етказасиз",
        desc: "Алоҳида курьер хизматига муҳтож эмассиз — ўзингиз ёки ходимингиз 1-4 км радиусда етказади.",
      },
      {
        title: "Тўлиқ назорат",
        desc: "Иш вақти, етказиш зонаси, минимал буюртма суммаси — барчасини ўзингиз белгилайсиз.",
      },
      {
        title: "Мобил склад бошқаруви",
        desc: "Маҳсулот, нарх ва қолдиқни телефон орқали исталган жойдан янгиланг.",
      },
    ],
    stepsTitle: "Сотувчи бўлиш йўли",
    stepsSubtitle: "Аризадан дўкон очилишигача — тўрт босқич",
    steps: [
      {
        title: "Ариза юборинг",
        desc: "Иловани юклаб олинг, Профил бўлимидан «Сотувчи бўлиш» аризасини юборинг — исм, фамилия ва телефон рақамингиз етарли.",
      },
      {
        title: "Админ сиз билан боғланади",
        desc: "Яқин Market жамоаси аризангизни кўриб чиқиб, телефон орқали сиз билан боғланади.",
      },
      {
        title: "Расмийлаштиринг",
        desc: "Тасдиқлаш босқичида СТИР/ПИНФЛ, банк карта ва шартнома маълумотларингиз тўлдирилади.",
      },
      {
        title: "Дўконингизни очинг",
        desc: "Тасдиқдан сўнг илова ичида дўкон яратасиз, маҳсулот қўшасиз ва сотишни бошлайсиз.",
      },
    ],
    reqTitle: "Нима талаб қилинади?",
    reqMinimalTitle: "Ариза учун (ҳозироқ)",
    reqMinimalItems: ["Исм ва фамилия", "Телефон рақам", "Қисқача изоҳ (ихтиёрий)"],
    reqApprovalTitle: "Тасдиқлаш учун (админ билан)",
    reqApprovalItems: ["СТИР ёки ПИНФЛ", "Банк карта маълумотлари", "Шартномани расмийлаштириш"],
    commissionTitle: "Комиссия тизими",
    commissionDesc:
      "Ҳар бир буюртмадан платформа хизмат ҳақи сифатида кичик комиссия олинади — аниқ ставка админ панелда кўрсатилади ва Prime обуначилар учун пасайтирилади. Нақд буюртмаларда комиссия автоматик балансингиздан ҳисобланади — қўшимча тўлов қилиш шарт эмас.",
    warehouseTitle: "Мобил склад имкониятлари",
    warehouse: [
      {
        title: "Тўлиқ склад CRUD",
        desc: "Маҳсулот қўшиш, нарх ва қолдиқни исталган вақтда янгилаш.",
      },
      {
        title: "Кирим-чиқим тарихи",
        desc: "Ҳар бир партия (FIFO) ва ҳаракатни кузатиб боринг.",
      },
      {
        title: "Кам қолдиқ огоҳлантириши",
        desc: "Маҳсулот тугаб қолишидан олдин push-билдиришнома олинг.",
      },
      {
        title: "Ходимлар тизими",
        desc: "QR-код орқали ходим таклиф қилинг, кассир, склад ишчиси ва етказиб берувчи каби рухсатларни белгиланг.",
      },
    ],
    ctaTitle: "Сотишни бошлашга тайёрмисиз?",
    ctaDesc: "Иловани юклаб олинг, Профил бўлимидан ариза юборинг — биз сизга қўнғироқ қиламиз.",
  },
  legal: {
    updatedPrefix: "Охирги янгиланиш",
    termsTitle: "Фойдаланиш шартлари",
    termsIntro:
      "Ушбу шартлар Яқин Market иловаси ва веб-сайтидан фойдаланиш тартибини белгилайди. Иловадан фойдаланиш орқали сиз қуйидаги шартларга розилик билдирасиз.",
    termsSections: [
      {
        heading: "1. Хизмат тавсифи",
        body: "Яқин Market — фойдаланувчиларни яқин атрофдаги мустақил дўконлар (сотувчилар) билан боғлайдиган гиперлокал платформа. Яқин Market ўзи товар сотмайди ва етказиб бермайди — бу вазифаларни сотувчининг ўзи ёки унинг ходими бажаради.",
      },
      {
        heading: "2. Рўйхатдан ўтиш ва аккаунт",
        body: "Иловага кириш телефон рақами ва бир мартали SMS-код (OTP) орқали амалга оширилади. Сиз тақдим этган маълумотларнинг тўғрилиги учун жавобгарсиз. Аккаунтингиз хавфсизлигини таъминлаш — сизнинг масъулиятингиз.",
      },
      {
        heading: "3. Буюртма ва тўлов",
        body: "Ҳозирги босқичда барча буюртмалар фақат нақд пул билан тўланади. Сотувчи буюртмани 5 дақиқа ичида қабул қилиши шарт; акс ҳолда буюртма автоматик бекор қилинади. Ҳар бир дўкон ўз минимал буюртма суммасини белгилаши мумкин.",
      },
      {
        heading: "4. Етказиб бериш",
        body: "Яқин Market алоҳида курьер хизматини юритмайди. Етказиб бериш сотувчининг ўзи ёки унинг ходими томонидан, сотувчи белгилаган радиус (одатда 1-4 км) доирасида амалга оширилади.",
      },
      {
        heading: "5. Қайтариш сиёсати",
        body: "Етказиш вақтида, тўловдан олдин, маҳсулот фақат бутун бирлик ҳолида қайтарилиши мумкин (масалан, 1 дона маҳсулот; қисмли миқдорни қайтариб бўлмайди). Қайтарилган маҳсулот суммаси умумий ҳисобдан автоматик айирилади.",
      },
      {
        heading: "6. Сотувчи мажбуриятлари",
        body: "Сотувчилар маҳсулот сифати, нарх аниқлиги ва етказиб бериш муддатларига жавобгардир. Яқин Market seller аризаларини кўриб чиқади, лекин ҳар бир сотувчининг тадбиркорлик фаолияти мустақилдир. Сотувчи платформадан фойдаланиш учун келишилган комиссия тўловини амалга оширади.",
      },
      {
        heading: "7. Фойдаланувчини блоклаш",
        body: "Сотувчи ўз дўкони доирасида муайян фойдаланувчини блокласи мумкин — бу фақат ўша дўконга тегишли бўлиб, платформанинг бошқа қисмларига таъсир қилмайди. Яқин Market администрацияси қоидабузарлик ҳолатларида аккаунтни бутун платформа бўйича тўхтатиб қўйиш ҳуқуқини сақлаб қолади.",
      },
      {
        heading: "8. Жавобгарликни чеклаш",
        body: "Яқин Market — воситачи платформа. Маҳсулот сифати, миқдори ва етказиб бериш сифати бўйича бевосита жавобгарлик сотувчида бўлади. Платформа техник носозликлар ёки учинчи томон хизматлари (масалан, SMS-провайдер) сабаб юзага келган узилишлар учун жавобгар эмас.",
      },
      {
        heading: "9. Шартларнинг ўзгариши",
        body: "Ушбу шартлар вақти-вақти билан янгиланиши мумкин. Муҳим ўзгаришлар ҳақида илова орқали хабар берамиз.",
      },
      {
        heading: "10. Боғланиш",
        body: "Савол ва мурожаатлар учун сайт пастидаги алоқа маълумотларидан ёки иловадаги «Боғланиш» бўлимидан фойдаланинг.",
      },
    ],
    privacyTitle: "Махфийлик сиёсати",
    privacyIntro:
      "Ушбу саҳифа Яқин Market қандай маълумот тўплаши, ундан қандай фойдаланиши ва уни қандай ҳимоя қилишини тушунтиради.",
    privacySections: [
      {
        heading: "1. Қандай маълумот тўпланади",
        body: "Телефон рақамингиз (кириш учун), жойлашувингиз (GPS — яқин дўконларни кўрсатиш учун), буюртмалар тарихи, сақланган манзиллар, севимлилар рўйхати ва қурилма токени (push-билдиришномалар учун).",
      },
      {
        heading: "2. Маълумотдан қандай фойдаланилади",
        body: "Йиғилган маълумот фақат хизматни кўрсатиш учун ишлатилади: яқин дўконларни топиш, буюртмани етказиш, билдиришнома юбориш ва хизмат сифатини яхшилаш. Маълумотларингиз учинчи шахсларга сотилмайди.",
      },
      {
        heading: "3. Учинчи томон хизматлари",
        body: "SMS орқали тасдиқлаш коди (OTP) юбориш учун Eskiz.uz хизматидан фойдаланамиз — бу жараёнда телефон рақамингиз ушбу провайдерга узатилади.",
      },
      {
        heading: "4. Маълумотни сақлаш",
        body: "Маълумотларингиз хизмат кўрсатиш давомида сақланади. Аккаунтни ўчиришни сўрасангиз, шахсий маълумотларингиз амалдаги қонунчиликка мувофиқ ўчирилади ёки анонимлаштирилади.",
      },
      {
        heading: "5. Сизнинг ҳуқуқларингиз",
        body: "Ўз маълумотларингизни кўриш, тузатиш ёки ўчиришни сўраш ҳуқуқига эгасиз. Бу учун иловадаги профил созламаларидан ёки «Боғланиш» бўлимидан мурожаат қилинг.",
      },
      {
        heading: "6. Хавфсизлик",
        body: "Маълумотларингиз шифрланган алоқа каналлари (HTTPS) орқали узатилади ва паролсиз, фақат SMS-код орқали кириш тизими қўлланилади.",
      },
      {
        heading: "7. Болалар махфийлиги",
        body: "Хизмат 18 ёшдан катта фойдаланувчилар учун мўлжалланган.",
      },
      {
        heading: "8. Сиёсатнинг ўзгариши",
        body: "Ушбу махфийлик сиёсати вақти-вақти билан янгиланиши мумкин, муҳим ўзгаришлар ҳақида илова орқали хабар берамиз.",
      },
    ],
  },
};

const ru: MarketingDict = {
  nav: {
    home: "Главная",
    users: "Покупателям",
    sellers: "Продавцам",
    download: "Скачать приложение",
  },
  footer: {
    tagline: "Быстрая и надёжная доставка из магазинов рядом с вами.",
    contactTitle: "Контакты",
    linksTitle: "Разделы",
    legalTitle: "Правовая информация",
    terms: "Условия использования",
    privacy: "Политика конфиденциальности",
    rights: "Все права защищены.",
  },
  home: {
    badge: "Гиперлокальный FMCG-маркетплейс",
    title1: "Из магазинов рядом с вами —",
    titleHighlight: "самая быстрая",
    title2: "доставка",
    subtitle:
      "Заказывайте продукты и товары первой необходимости в магазинах поблизости. Собирайте заказы из нескольких магазинов в одном приложении, отслеживайте их в реальном времени и получайте за считаные минуты.",
    ctaPrimary: "Скачать приложение",
    ctaSecondary: "Как это работает",
    trustMap: "Магазины рядом на карте",
    trustDelivery: "Доставка в радиусе 1-4 км",
    trustLang: "Интерфейс на 3 языках",
    stats: [
      { value: "5 минут", label: "Время подтверждения заказа продавцом" },
      { value: "1-4 км", label: "Радиус доставки" },
      { value: "3 языка", label: "Узбекский (лат./кир.) и русский" },
      { value: "24/7", label: "Некоторые магазины работают круглосуточно" },
    ],
    howTitle: "Как это работает",
    howSubtitle: "Оформите заказ за четыре шага — от регистрации до доставки",
    howSteps: [
      {
        title: "Зарегистрируйтесь",
        desc: "Входите по номеру телефона и SMS-коду — пароль не нужен.",
      },
      {
        title: "Выберите магазин и товары",
        desc: "Смотрите магазины рядом на карте, выбирайте товары из нескольких — для каждого формируется отдельная корзина.",
      },
      {
        title: "Оформите заказ",
        desc: "Отправьте заказ с оплатой наличными — продавец ответит в течение 5 минут.",
      },
      {
        title: "Следите в реальном времени",
        desc: "Сборка, доставка — отслеживайте каждый этап в приложении и оцените товар после получения.",
      },
    ],
    featuresTitle: "Возможности",
    featuresSubtitle:
      "Удобные покупки для клиентов, мощное управление складом для продавцов — всё в одном приложении",
    features: [
      {
        title: "Магазины рядом на карте",
        desc: "Смотрите магазины поблизости в виде меток на карте и выбирайте ближайший.",
      },
      {
        title: "Быстрая доставка",
        desc: "Благодаря близости заказы доставляются к вашей двери за считаные минуты.",
      },
      {
        title: "Несколько магазинов в одном приложении",
        desc: "Выбирайте товары сразу из нескольких магазинов — для каждого создаётся своя корзина и заказ.",
      },
      {
        title: "Чат с продавцом",
        desc: "Переписывайтесь с продавцом в реальном времени, задавайте вопросы и уточняйте заказ.",
      },
      {
        title: "Отзывы и рейтинг",
        desc: "Оценивайте товары и доверяйте мнению других покупателей.",
      },
      {
        title: "Интерфейс на 3 языках",
        desc: "Удобное использование на узбекском (лат./кир.) и русском языках.",
      },
      {
        title: "Мобильное управление складом",
        desc: "Управляйте складом, товарами и ценами прямо с телефона.",
      },
      {
        title: "Учёт долгов (насия)",
        desc: "Ведите продажи в долг для постоянных клиентов с прозрачным учётом задолженности.",
      },
      {
        title: "Статистика и сотрудники",
        desc: "Статистика продаж, управление сотрудниками — кассирами и курьерами.",
      },
    ],
    dualTitle: "Что вам подходит?",
    dualCustomerTitle: "Я покупатель",
    dualCustomerDesc: "Хочу заказывать в магазинах рядом с домом",
    dualCustomerCta: "Покупателям",
    dualSellerTitle: "Я продавец",
    dualSellerDesc: "Хочу открыть свой магазин на Yaqin Market",
    dualSellerCta: "Продавцам",
  },
  download: {
    title: "Скачайте приложение Yaqin Market",
    desc: "Установите APK-файл на устройство Android и начните покупки в магазинах рядом с вами.",
    ctaReady: "Скачать APK",
    ctaSoon: "Скоро",
    soonNote: "Приложение пока готовится — скоро будет доступно для загрузки.",
    version: "Версия",
  },
  contact: {
    title: "Свяжитесь с нами",
    desc: "Есть вопрос или предложение? Оставьте свои данные, мы скоро свяжемся с вами.",
    name: "Имя",
    phone: "Телефон",
    message: "Сообщение",
    namePh: "Ваше имя",
    phonePh: "+998 90 123 45 67",
    messagePh: "Напишите сообщение...",
    submit: "Отправить",
    submitting: "Отправка…",
    success: "Ваше обращение принято, скоро мы свяжемся с вами",
    newMsg: "Отправить новое обращение",
    error: "Произошла ошибка, попробуйте ещё раз чуть позже.",
  },
  users: {
    badge: "Покупателям",
    title: "Покупки в несколько нажатий",
    subtitle:
      "Заказывайте повседневные товары в магазинах рядом с вами, следите за заказом в реальном времени и платите наличными.",
    stepsTitle: "Как оформляется заказ",
    steps: [
      {
        title: "Выберите адрес",
        desc: "GPS определяется автоматически, либо выберите сохранённый адрес (Дом, Работа).",
      },
      {
        title: "Смотрите магазины рядом",
        desc: "Показываются только магазины в зоне доставки — на карте или в списке.",
      },
      {
        title: "Добавляйте в корзину",
        desc: "Если выбираете товары из нескольких магазинов, для каждого создаётся отдельная корзина и заказ.",
      },
      {
        title: "Оформите заказ с оплатой наличными",
        desc: "Продавец ответит в течение 5 минут, иначе заказ отменяется автоматически.",
      },
    ],
    rightsTitle: "Ваши права как покупателя",
    rightsSubtitle: "Эти правила гарантированы вам при покупках на Yaqin Market",
    rights: [
      {
        title: "Возврат только целыми единицами",
        desc: "Если товар не нужен, курьер может забрать его обратно у двери — до оплаты наличными — только целой единицей (например, 1 хлеб, но не 0.5 кг). Оплата пересчитывается на оставшуюся сумму.",
      },
      {
        title: "Оцениваете только товар",
        desc: "После каждой покупки вы оцениваете товар от 1 до 5 звёзд. Рейтинг магазина рассчитывается автоматически на основе этих оценок.",
      },
      {
        title: "Оплата и возврат наличными",
        desc: "Пока все платежи производятся наличными — возврат денег также из рук в руки, без скрытых платежей.",
      },
      {
        title: "Видны только доступные вам магазины",
        desc: "Магазины вне зоны доставки вообще не показываются в списке — вы не получите отказ на пустом месте.",
      },
      {
        title: "Гарантия ответа за 5 минут",
        desc: "Продавец обязан ответить на ваш заказ в течение 5 минут, иначе заказ отменяется автоматически.",
      },
      {
        title: "Отслеживание статуса в реальном времени",
        desc: "Новый → Принят → Собирается → Доставляется → Доставлен — вы видите каждый этап в приложении.",
      },
    ],
    extraTitle: "Что ещё есть",
    extra: [
      {
        title: "Интерактивная карта",
        desc: "Смотрите все ближайшие магазины в виде меток на карте.",
      },
      {
        title: "Прямой чат",
        desc: "Переписывайтесь с продавцом в приложении и уточняйте заказ.",
      },
      {
        title: "Интерфейс на 3 языках",
        desc: "Пользуйтесь приложением на узбекском (лат./кир.) и русском языках.",
      },
    ],
    faqTitle: "Часто задаваемые вопросы",
    faq: [
      {
        q: "Как производится оплата?",
        a: "Пока только наличными — вы платите курьеру при получении.",
      },
      {
        q: "Можно ли вернуть товар?",
        a: "Да, но только целой единицей и во время доставки, до оплаты. Указывать причину необязательно.",
      },
      {
        q: "Почему не видны некоторые магазины?",
        a: "Показываются только магазины, способные доставить по вашему адресу — радиус определяет сам продавец.",
      },
      {
        q: "Что будет, если заказ не примут?",
        a: "Если продавец не ответит за 5 минут, заказ отменяется автоматически. Поскольку оплата наличная, заранее списанных денег не будет.",
      },
    ],
  },
  sellers: {
    badge: "Продавцам",
    title: "Откройте свой магазин на Yaqin Market",
    subtitle:
      "Продавайте напрямую клиентам рядом с вами — в удобное время и на своих условиях.",
    whyTitle: "Почему выгодно продавать на Yaqin Market",
    why: [
      {
        title: "Клиенты рядом",
        desc: "Вас видят только клиенты в радиусе, куда вы можете доставить, — меньше конкуренции, больше доверия.",
      },
      {
        title: "Доставляете сами",
        desc: "Отдельная курьерская служба не нужна — вы или ваш сотрудник доставляете в радиусе 1-4 км.",
      },
      {
        title: "Полный контроль",
        desc: "Часы работы, зона доставки, минимальная сумма заказа — всё настраиваете сами.",
      },
      {
        title: "Мобильное управление складом",
        desc: "Обновляйте товары, цены и остатки с телефона из любого места.",
      },
    ],
    stepsTitle: "Путь к статусу продавца",
    stepsSubtitle: "От заявки до открытия магазина — четыре шага",
    steps: [
      {
        title: "Подайте заявку",
        desc: "Скачайте приложение и в разделе «Профиль» отправьте заявку «Стать продавцом» — достаточно имени, фамилии и номера телефона.",
      },
      {
        title: "С вами свяжется администратор",
        desc: "Команда Yaqin Market рассмотрит заявку и свяжется с вами по телефону.",
      },
      {
        title: "Оформите документы",
        desc: "На этапе подтверждения заполняются данные ИНН/ПИНФЛ, банковской карты и договора.",
      },
      {
        title: "Откройте магазин",
        desc: "После подтверждения вы создаёте магазин в приложении, добавляете товары и начинаете продавать.",
      },
    ],
    reqTitle: "Что требуется?",
    reqMinimalTitle: "Для заявки (прямо сейчас)",
    reqMinimalItems: ["Имя и фамилия", "Номер телефона", "Короткий комментарий (необязательно)"],
    reqApprovalTitle: "Для подтверждения (с администратором)",
    reqApprovalItems: ["ИНН или ПИНФЛ", "Данные банковской карты", "Оформление договора"],
    commissionTitle: "Система комиссии",
    commissionDesc:
      "С каждого заказа взимается небольшая комиссия за пользование платформой — точная ставка указывается в панели администратора и снижается для подписчиков Prime. При заказах с оплатой наличными комиссия автоматически учитывается на вашем балансе — дополнительно платить не нужно.",
    warehouseTitle: "Возможности мобильного склада",
    warehouse: [
      {
        title: "Полноценный CRUD склада",
        desc: "Добавляйте товары, обновляйте цены и остатки в любое время.",
      },
      {
        title: "История прихода-расхода",
        desc: "Отслеживайте каждую партию (FIFO) и движение товара.",
      },
      {
        title: "Уведомление о низком остатке",
        desc: "Получайте push-уведомление до того, как товар закончится.",
      },
      {
        title: "Система сотрудников",
        desc: "Приглашайте сотрудников по QR-коду, назначайте права — кассир, кладовщик, курьер.",
      },
    ],
    ctaTitle: "Готовы начать продавать?",
    ctaDesc: "Скачайте приложение и отправьте заявку в разделе «Профиль» — мы вам позвоним.",
  },
  legal: {
    updatedPrefix: "Последнее обновление",
    termsTitle: "Условия использования",
    termsIntro:
      "Настоящие условия определяют порядок использования приложения и сайта Yaqin Market. Используя приложение, вы соглашаетесь с указанными ниже условиями.",
    termsSections: [
      {
        heading: "1. Описание сервиса",
        body: "Yaqin Market — гиперлокальная платформа, связывающая пользователей с независимыми магазинами (продавцами) рядом с ними. Yaqin Market сам не продаёт товары и не осуществляет доставку — это делает продавец или его сотрудник.",
      },
      {
        heading: "2. Регистрация и аккаунт",
        body: "Вход в приложение осуществляется по номеру телефона и одноразовому SMS-коду (OTP). Вы несёте ответственность за достоверность предоставленных данных. Обеспечение безопасности аккаунта — ваша обязанность.",
      },
      {
        heading: "3. Заказ и оплата",
        body: "На текущем этапе все заказы оплачиваются только наличными. Продавец обязан принять заказ в течение 5 минут, иначе заказ отменяется автоматически. Каждый магазин может установить свою минимальную сумму заказа.",
      },
      {
        heading: "4. Доставка",
        body: "Yaqin Market не содержит отдельной курьерской службы. Доставку осуществляет сам продавец или его сотрудник в радиусе, установленном продавцом (обычно 1-4 км).",
      },
      {
        heading: "5. Политика возврата",
        body: "Во время доставки, до оплаты, товар может быть возвращён только целой единицей (например, одна единица товара; частичное количество вернуть нельзя). Сумма возвращённого товара автоматически вычитается из общей суммы заказа.",
      },
      {
        heading: "6. Обязанности продавца",
        body: "Продавцы несут ответственность за качество товара, точность цены и сроки доставки. Yaqin Market рассматривает заявки продавцов, но предпринимательская деятельность каждого продавца независима. Продавец уплачивает согласованную комиссию за пользование платформой.",
      },
      {
        heading: "7. Блокировка пользователя",
        body: "Продавец может заблокировать конкретного пользователя в рамках своего магазина — это касается только этого магазина и не влияет на остальную часть платформы. Администрация Yaqin Market оставляет за собой право приостановить аккаунт по всей платформе при нарушении правил.",
      },
      {
        heading: "8. Ограничение ответственности",
        body: "Yaqin Market — платформа-посредник. Прямую ответственность за качество, количество товара и качество доставки несёт продавец. Платформа не несёт ответственности за сбои, вызванные техническими неполадками или сторонними сервисами (например, SMS-провайдером).",
      },
      {
        heading: "9. Изменение условий",
        body: "Настоящие условия могут время от времени обновляться. О существенных изменениях мы уведомим через приложение.",
      },
      {
        heading: "10. Контакты",
        body: "По вопросам и обращениям используйте контактные данные внизу сайта или раздел «Связаться» в приложении.",
      },
    ],
    privacyTitle: "Политика конфиденциальности",
    privacyIntro:
      "Эта страница объясняет, какие данные собирает Yaqin Market, как их использует и как защищает.",
    privacySections: [
      {
        heading: "1. Какие данные собираются",
        body: "Номер телефона (для входа), местоположение (GPS — для отображения ближайших магазинов), история заказов, сохранённые адреса, список избранного и токен устройства (для push-уведомлений).",
      },
      {
        heading: "2. Как используются данные",
        body: "Собранные данные используются только для предоставления сервиса: поиска ближайших магазинов, доставки заказа, отправки уведомлений и улучшения качества обслуживания. Ваши данные не продаются третьим лицам.",
      },
      {
        heading: "3. Сторонние сервисы",
        body: "Для отправки кода подтверждения (OTP) по SMS мы используем сервис Eskiz.uz — в этом процессе ваш номер телефона передаётся данному провайдеру.",
      },
      {
        heading: "4. Хранение данных",
        body: "Ваши данные хранятся в течение оказания услуги. При запросе на удаление аккаунта ваши персональные данные удаляются или обезличиваются в соответствии с действующим законодательством.",
      },
      {
        heading: "5. Ваши права",
        body: "Вы имеете право просматривать, исправлять или запрашивать удаление своих данных. Для этого обратитесь через настройки профиля в приложении или раздел «Связаться».",
      },
      {
        heading: "6. Безопасность",
        body: "Ваши данные передаются по зашифрованным каналам связи (HTTPS), используется система входа без пароля — только по SMS-коду.",
      },
      {
        heading: "7. Конфиденциальность детей",
        body: "Сервис предназначен для пользователей старше 18 лет.",
      },
      {
        heading: "8. Изменение политики",
        body: "Настоящая политика конфиденциальности может время от времени обновляться, о существенных изменениях мы уведомим через приложение.",
      },
    ],
  },
};

export const dictionary: Record<MarketingLang, MarketingDict> = { uz, uzc, ru };

export const LANG_LABELS: Record<MarketingLang, string> = {
  uz: "UZ",
  uzc: "ЎЗ",
  ru: "RU",
};
