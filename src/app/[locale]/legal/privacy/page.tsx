import { tri } from '@/lib/i18n/tri';

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-8 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold">{tri(locale, { ar: 'سياسة الخصوصية', ku: 'سیاسەتی تایبەتمەندی', en: 'Privacy Policy' })}</h1>
      <p>
        {tri(locale, {
          ar: 'نحن نلتزم بحماية خصوصيتك وبياناتك المالية. لا نشارك بياناتك مع أطراف ثالثة دون موافقتك الصريحة، ونلتزم بالقوانين العراقية ذات الصلة.',
          ku: 'ئێمە پابەندین بە پاراستنی تایبەتمەندی و داتا داراییەکانت. داتاکانت لەگەڵ لایەنی سێیەم هاوبەش ناکەین بەبێ ڕەزامەندی ئاشکرات، و پابەندین بە هەموو یاساکانی پەیوەندیداری عێراق.',
          en: 'We are committed to protecting your privacy and financial data. We do not share your data with third parties without your explicit consent, and we comply with all relevant Iraqi laws.',
        })}
      </p>
      <p>
        {tri(locale, {
          ar: 'البيانات المخزنة على خوادمنا مشفرة، والوصول إليها محصور بفريقنا المختص بأمن المعلومات. تستطيع طلب تصدير بياناتك أو حذفها في أي وقت.',
          ku: 'داتاکانی هەڵگیراو لە سێرڤەرەکانمان شفرکراون، و دەستگەیشتن سنووردارکراوە بۆ تیمی ئاسایشی زانیارییەکانمان. دەتوانیت داواکاری ناردنی دەرەوە یان سڕینەوەی داتاکانت بکەیت لە هەر کاتێکدا.',
          en: 'Data stored on our servers is encrypted, and access is restricted to our information security team. You can request export or deletion of your data at any time.',
        })}
      </p>
    </div>
  );
}
