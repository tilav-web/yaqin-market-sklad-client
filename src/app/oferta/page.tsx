import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Hamkorlik Ommaviy Ofertasi — Yaqin Market',
  description: '"TILAV" MCHJ (Yaqin Market) elektron tijorat vositachilik ommaviy hamkorlik shartnomasi va ofertasi.',
};

export default function OfertaPage() {
  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 sm:p-10">
        <div className="border-b border-neutral-200 pb-6 mb-8">
          <div className="inline-block px-3 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-full mb-3">
            Rasmiy Yuridik Hujjat
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
            Elektron Tijorat Vositachilik (Komissiya) Ommaviy Ofertasi
          </h1>
          <p className="text-sm text-neutral-500 mt-2">
            Amaldagi tahrir: 2026-yil • Operator: &quot;TILAV&quot; MCHJ • STIR: 313296455
          </p>
        </div>

        <div className="prose prose-neutral max-w-none text-neutral-700 space-y-6 leading-relaxed">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm">
            Ushbu hujjat O‘zbekiston Respublikasi Fuqarolik kodeksining 367–370-moddalari hamda &quot;Elektron tijorat to‘g‘risida&quot;gi Qonuniga muvofiq rasmiy Ommaviy Oferta (shartnoma tuzish to‘g‘risidagi taklif) hisoblanadi. Mobil ilovada yoki veb-saytda ushbu shartlarni qabul qilish (aksept) ikki tomonlama yozma shartnoma bilan teng yuridik kuchga ega.
          </div>

          <section>
            <h2 className="text-lg font-bold text-neutral-900 border-l-4 border-red-600 pl-3">
              1. UMUMIY QOIDALAR VA ATAMALAR
            </h2>
            <p className="mt-2 text-sm">
              <strong>1.1. &quot;Operator&quot; (Platforma)</strong> — &quot;TILAV&quot; MCHJ (STIR: 313296455), Yaqin Market elektron axborot platformasi egasi va boshqaruvchisi.
            </p>
            <p className="mt-1 text-sm">
              <strong>1.2. &quot;Hamkor&quot; (Sotuvchi)</strong> — Yaqin Market platformasi orqali xaridorlarga tovar va mahsulotlarni sotish niyatida ushbu Ofertani to‘liq qabul qilgan (akseptlagan) yuridik shaxs, YaTT yoki o‘zini o‘zi band qilgan shaxs.
            </p>
            <p className="mt-1 text-sm">
              <strong>1.3. &quot;Aksept&quot;</strong> — Hamkor tomonidan mobil ilovada yoki veb-saytda Oferta shartlariga rozilik bildirilishi va my.soliq.uz portalida Operatorni vositachi (komissioner) sifatida biriktirilishi.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-900 border-l-4 border-red-600 pl-3">
              2. SHARTNOMA PREDMETI
            </h2>
            <p className="mt-2 text-sm">
              <strong>2.1.</strong> Operator o‘zining axborot-texnologik tizimi, mobil ilovasi va kuryerlik tarmog‘i orqali Hamkorning tovarlarini xaridorlarga onlayn sotish, buyurtmalarni qabul qilish, to‘lovlarni vositachilik asosida qabul qilish va yetkazib berish bo‘yicha xizmatlarni ko‘rsatadi.
            </p>
            <p className="mt-1 text-sm">
              <strong>2.2.</strong> Tovar xaridorga yetkazib berilgunga qadar uning egalik huquqi va to‘liq sifati uchun javobgarlik Hamkorda saqlanib qoladi.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-900 border-l-4 border-red-600 pl-3">
              3. XIZMAT HAQI (KOMISSIYA) VA HISOB-KITOBLAR TARTIBI
            </h2>
            <p className="mt-2 text-sm">
              <strong>3.1.</strong> Operatorning vositachilik komissiyasi har bir muvaffaqiyatli yakunlangan buyurtmaning tovarlar umumiy qiymatidan <strong>12%</strong> miqdorida belgilanadi.
            </p>
            <p className="mt-1 text-sm">
              <strong>3.2.</strong> Do‘kon ochish va ro‘yxatdan o‘tish mutlaqo bepul (0 so‘m). Majburiy boshlang‘ich depozit talab etilmaydi.
            </p>
            <p className="mt-1 text-sm">
              <strong>3.3.</strong> Savdo tushumlari Operator tomonidan 12% vositachilik komissiyasi ushlab qolingan holda, Hamkor ko‘rsatgan bank hisob raqamiga yoki milliy bank kartasiga (Uzcard/Humo) haftalik / doimiy rejimda o‘tkazib beriladi.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-900 border-l-4 border-red-600 pl-3">
              4. BALANS VA QARZDORLIK INTIZOMI
            </h2>
            <p className="mt-2 text-sm">
              <strong>4.1.</strong> Hamkorning platformadagi Shaxsiy Balansi real vaqt rejimida yuritiladi.
            </p>
            <p className="mt-1 text-sm">
              <strong>4.2.</strong> Xaridor naqd pulda to‘lagan buyurtmalar bo‘yicha Operatorning 12% komissiyasi Hamkorning balansiga qarz sifatida yoziladi.
            </p>
            <p className="mt-1 text-sm">
              <strong>4.3.</strong> Agar Hamkorning balansi manfiy (qarz) holatga tushsa, qarzni 3 (uch) kalendar kuni ichida to‘ldirishi shart. Qarz o‘z vaqtida so‘ndirilmasa, tizim Hamkorning do‘kon faoliyatini avtomatik ravishda vaqtincha to‘xtatadi (deaktivatsiya qiladi).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-900 border-l-4 border-red-600 pl-3">
              5. TOVAR SIFATI, NARXLAR VA BUYURTMALARNI TAYYORLASH
            </h2>
            <p className="mt-2 text-sm">
              <strong>5.1.</strong> Hamkor do‘kondagi amaldagi real narx va tovar qoldig‘i ilovadagi vitrina bilan 100% bir xil bo‘lishini ta&apos;minlaydi.
            </p>
            <p className="mt-1 text-sm">
              <strong>5.2.</strong> Sotuvga qo‘yiladigan barcha tovarlar qonuniy, standartlarga muvofiq, xavfsiz va yaroqlilik muddati buzilmagan bo‘lishi shart.
            </p>
            <p className="mt-1 text-sm">
              <strong>5.3.</strong> Hamkor ilovadan buyurtma kelib tushganda uni belgilangan vaqtda sifatli qadoqlab, kuryerga topshirishga tayyor holga keltiradi. Tovar yo‘qligi sababli asossiz bekor qilingan buyurtmalar uchun do‘kon reytingi tushiriladi va takrorlanganda do‘kon faoliyati cheklanadi.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-900 border-l-4 border-red-600 pl-3">
              6. MAHSULOTNI QAYTARISH VA MODDIY JAVOBGARLIK
            </h2>
            <p className="mt-2 text-sm">
              <strong>6.1.</strong> Xaridor tomonidan olingan mahsulot yaroqlilik muddati o‘tgan, sifatsiz, buzilgan yoki buyurtmaga nomuvofiq (adashib noto‘g‘ri) yuborilganligi aniqlansa — tovar summasi xaridorga to‘liq qaytariladi hamda yetkazib berish xarajati Hamkor hisobidan qoplanadi (balansidan ushlab qolinadi).
            </p>
            <p className="mt-1 text-sm">
              <strong>6.2.</strong> O‘zbekiston Respublikasining &quot;Iste&apos;molchilar huquqlarini himoya qilish to‘g‘risida&quot;gi Qonuniga muvofiq, sifati buzilmagan va yaroqli bo‘lgan oziq-ovqat tovarlari asossiz qaytarilmaydi.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-900 border-l-4 border-red-600 pl-3">
              7. SOLIQ VA FISKAL MAJBURIYATLAR
            </h2>
            <p className="mt-2 text-sm">
              <strong>7.1.</strong> O‘zbekiston Respublikasi Soliq kodeksining 463-moddasiga muvofiq, Hamkor my3.soliq.uz davlat soliq portalida Operatorni (&quot;TILAV&quot; MCHJ, STIR: 313296455) o‘ziga rasmiy vositachi (komissioner) sifatida biriktirishi shart.
            </p>
            <p className="mt-1 text-sm">
              <strong>7.2.</strong> Operator o‘ziga tegishli 12% vositachilik daromadidan qonunchilikda belgilangan tartibda soliq to‘laydi. Hamkor o‘zining tovar aylanmasi bo‘yicha tanlagan soliq rejimiga muvofiq mustaqil hisobot beradi va soliq to‘laydi.
            </p>
            <p className="mt-1 text-sm">
              <strong>7.3.</strong> Har bir sotilgan tovar bo‘yicha O‘zbekiston Respublikasi Davlat Soliq Qo‘mitasi talablariga mos keluvchi QR-kodli elektron fiskal chek yaratilishi ta&apos;minlanadi.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-neutral-900 border-l-4 border-red-600 pl-3">
              8. SHARTNOMANING AMAL QILISHI VA BEKOR QILINISHI
            </h2>
            <p className="mt-2 text-sm">
              <strong>8.1.</strong> Ushbu shartnoma Hamkor tomonidan Aksept qilingan kundan boshlab muddatsiz tuziladi.
            </p>
            <p className="mt-1 text-sm">
              <strong>8.2.</strong> Hamkor istalgan vaqtda do‘kon faoliyatini to‘xtatish yoki shartnomani bekor qilish tashabbusi bilan chiqish huquqiga ega. Barcha faol buyurtmalar yakunlanib, tomonlar o‘rtasida o‘zaro hisob-kitoblar to‘liq amalga oshirilgach (1-3 ish kuni ichida), hisobdagi qoldiq mablag‘ Hamkorga to‘lab beriladi va do‘kon yopiladi.
            </p>
            <p className="mt-1 text-sm">
              <strong>8.3.</strong> Hamkor tomonidan qonunbuzarlik, kontrafakt yoki qalloblik holatlari sodir etilganda, Operator shartnomani bir tomonlama darhol bekor qilish va qonuniy organlarga murojaat qilish huquqini o‘zida saqlab qoladi.
            </p>
          </section>

          <section className="bg-neutral-100 p-5 rounded-xl text-xs space-y-1 text-neutral-600">
            <h3 className="font-bold text-neutral-900 text-sm mb-2">9. OPERATORNING REKVIZITLARI:</h3>
            <p><strong>Nomi:</strong> &quot;TILAV&quot; MCHJ</p>
            <p><strong>STIR:</strong> 313296455</p>
            <p><strong>Platforma:</strong> Yaqin Market (yaqin-market.uz)</p>
            <p><strong>Yuridik manzil:</strong> O‘zbekiston Respublikasi, Qashqadaryo viloyati, Muborak tumani</p>
            <p><strong>Qo‘llab-quvvatlash xizmati:</strong> +998 99 325 66 85</p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-200 flex justify-between items-center text-sm">
          <Link href="/" className="text-red-600 hover:text-red-700 font-medium">
            ← Bosh sahifaga qaytish
          </Link>
          <span className="text-neutral-400">Yaqin Market © 2026</span>
        </div>
      </div>
    </div>
  );
}
