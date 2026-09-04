import { NextResponse, type NextRequest } from 'next/server';

/**
 * Buttafuori veloce per /dashboard e /admin.
 *
 * Controlla solo che il cookie di sessione esista e non sia scaduto
 * (scadenza letta dal payload, firma NON verificata qui).
 * E il primo strato: blocca i curiosi senza login e velocizza i redirect.
 * Lo strato autoritativo resta:
 * - useAuthGuard (legge ruolo+stato veri da Firestore) in ogni pagina,
 * - verifica server-side nelle Server Action (server-auth.ts),
 * - Security Rules su Firestore.
 */

const SESSION_COOKIE_NAME = 'ndb_session';

function decodePayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(atob(padded)) as { exp?: number };
  } catch {
    return null;
  }
}

function hasUsableSession(token: string | undefined): boolean {
  if (!token) return false;
  const payload = decodePayload(token);
  if (!payload || typeof payload.exp !== 'number') return false;
  // Margine di 60 secondi rispetto alla scadenza reale.
  return payload.exp * 1000 > Date.now() + 60_000;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!hasUsableSession(sessionToken)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', `${pathname}${search}`);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
