export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isAr = locale === 'ar';
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-8 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold">{isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}</h1>
      <p>
        {isAr
          ? 'باستخدامك لهذا النظام فإنك توافق على الالتزام بالشروط والأحكام التالية، وعلى التشريعات النافذة في جمهورية العراق.'
          : 'By using this system you agree to comply with these terms and with the laws of the Republic of Iraq.'}
      </p>
      <p>
        {isAr
          ? 'النظام مقدّم كما هو. نسعى لضمان توفّر الخدمة، إلا أننا لا نضمن خلوها من الأخطاء بشكل مطلق.'
          : 'The system is provided as-is. We strive for service availability but do not guarantee complete absence of errors.'}
      </p>
    </div>
  );
}
