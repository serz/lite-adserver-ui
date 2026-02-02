import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Redirect www.affset.com → affset.com so www is not treated as tenant namespace.
 * Runs before any page/API; tenant namespace is derived from hostname elsewhere.
 */
export const config = {
  matcher: [
    // run on pages, not on next internals/assets
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};

export function middleware(request: NextRequest) {
  const host = request.nextUrl.hostname;
  if (host === 'www.affset.com') {
    const url = request.nextUrl.clone();
    url.hostname = 'affset.com';
    return NextResponse.redirect(url.toString(), 301);
  }
  return NextResponse.next();
}
