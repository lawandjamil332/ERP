import { tri } from '@/lib/i18n/tri';

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-8 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold">{tri(locale, { ar: 'الشروط والأحكام', ku: 'مەرج و ڕێساکان', en: 'Terms & Conditions' })}</h1>
      <p>
        {tri(locale, {
          ar: 'باستخدامك لهذا النظام فإنك توافق على الالتزام بالشروط والأحكام التالية، وعلى التشريعات النافذة في جمهورية العراق.',
          ku: 'بە بەکارهێنانی ئەم سیستەمە تۆ ڕازی دەبیت بە پابەندبوون بە ئەم مەرج و ڕێسایانە و یاساکانی کۆماری عێراق.',
          en: 'By using this system you agree to comply with these terms and with the laws of the Republic of Iraq.',
        })}
      </p>
      <p>
        {tri(locale, {
          ar: 'النظام مقدّم كما هو. نسعى لضمان توفّر الخدمة، إلا أننا لا نضمن خلوها من الأخطاء بشكل مطلق.',
          ku: 'سیستەمەکە وەک هەر ئاوایە پێشکەش دەکرێت. هەوڵ دەدەین خزمەتگوزارییەکە بەردەست بێت، بەڵام دڵنیایی تەواو لە نەبوونی هەڵە نادەین.',
          en: 'The system is provided as-is. We strive for service availability but do not guarantee complete absence of errors.',
        })}
      </p>
    </div>
  );
}
