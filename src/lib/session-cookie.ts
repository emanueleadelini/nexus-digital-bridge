'use client';

/**
 * Cookie di sessione letto dal middleware per un redirect veloce.
 *
 * Contiene l'ID token Firebase (firmato da Google). Il middleware ne
 * controlla solo presenza e scadenza: e un aiuto UX, NON un'autorizzazione.
 * L'autorizzazione vera avviene nelle Server Action (server-auth.ts) e
 * nelle Security Rules di Firestore.
 */

export const SESSION_COOKIE_NAME = 'ndb_session';
const SESSION_MAX_AGE_SECONDS = 55 * 60;

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === 'undefined') return;
  const secureFlag =
    typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secureFlag}`;
}

/** Salva l'ID token dopo login/registrazione. */
export function setSessionCookie(idToken: string): void {
  if (!idToken) return;
  writeCookie(SESSION_COOKIE_NAME, idToken, SESSION_MAX_AGE_SECONDS);
}

/** Rimuove la sessione (logout). */
export function clearSessionCookie(): void {
  writeCookie(SESSION_COOKIE_NAME, '', 0);
}
