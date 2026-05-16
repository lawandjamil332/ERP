export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isAr = locale === 'ar';
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-8 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</h1>
      <p>
        {isAr
          ? 'نحن نلتزم بحماية خصوصيتك وبياناتك المالية. لا نشارك بياناتك مع أطراف ثالثة دون موافقتك الصريحة، ونلتزم بالقوانين العراقية ذات الصلة.'
          : 'We are committed to protecting your privacy and financial data. We do not share your data with third parties without your explicit consent, and we comply with all relevant Iraqi laws.'}
      </p>
      <p>
        {isAr
          ? 'البيانات المخزنة على خوادمنا مشفرة، والوصول إليها محصور بفريقنا المختص بأمن المعلومات. تستطيع طلب تصدير بياناتك أو حذفها في أي وقت.'
          : 'Data stored on our servers is encrypted, and access is restricted to our information security team. You can request export or deletion of your data at any time.'}
      </p>
    </div>
  );
}
