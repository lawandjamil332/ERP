import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { LOCALES, DEFAULT_LOCALE } from './lib/i18n/config';
import { verifySession } from './lib/auth/session';

const intlMiddleware = createMiddleware({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
});

const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/onboarding'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const pathWithoutLocale = pathname.replace(/^\/(ar|ku|en)/, '') || '/';
  const isPublic = PUBLIC_PATHS.some((p) => pathWithoutLocale.startsWith(p));

  if (!isPublic) {
    const session = await verifySession(req);
    if (!session) {
      const locale = pathname.split('/')[1] || DEFAULT_LOCALE;
      const loginUrl = new URL(`/${locale}/auth/login`, req.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api/auth|_next|favicon.ico|.*\\..*).*)'],
};
