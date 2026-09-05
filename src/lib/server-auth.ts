/**
 * Verifica server-side del chiamante per le Server Action.
 *
 * Strategia (senza Admin SDK, quindi senza nuove chiavi segrete):
 * 1. L'ID token Firebase viene verificato con Identity Toolkit (accounts:lookup).
 *    La chiave usata e NEXT_PUBLIC_FIREBASE_API_KEY: e pubblica per disegno
 *    (sta gia in ogni pagina del sito), qui serve solo a interrogare Google,
 *    NON e un segreto.
 * 2. Ruolo e stato vengono letti da Firestore via REST con il token
 *    dell'utente come Bearer: valgono le Security Rules, come da browser.
 *
 * Niente in questo file e affidato ai cookie: i cookie servono solo al
 * middleware per un redirect veloce, l'autorizzazione vera e qui.
 */

import { checkRateLimit } from './rate-limit';

export interface CallerProfile {
  uid: string;
  email?: string;
  emailVerified: boolean;
  role: string;
  status: string;
  firstName: string;
  lastName: string;
}

const MAX_TOKEN_LENGTH = 8192;
const GOOGLE_TIMEOUT_MS = 10_000;

function googleFetch(input: string, init: RequestInit): Promise<Response> {
  return fetch(input, { ...init, cache: 'no-store', signal: AbortSignal.timeout(GOOGLE_TIMEOUT_MS) });
}

/** Throttle leggero per IP prima delle verifiche costose (anti-flood). */
export function throttleIp(ip: string | null): void {
  if (!ip) return;
  const quota = checkRateLimit(`ip-lookup:${ip}`, {
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!quota.allowed) {
    throw new Error('Troppe richieste. Riprova tra poco.');
  }
}

async function lookupUid(
  idToken: string
): Promise<{ uid: string; email?: string; emailVerified: boolean }> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error('Configurazione Firebase mancante sul server.');
  }

  const endpoint = new URL('https://identitytoolkit.googleapis.com/v1/accounts:lookup');
  endpoint.searchParams.set('key', apiKey);

  let res: Response;
  try {
    res = await googleFetch(endpoint.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
  } catch {
    throw new Error('Verifica sessione non riuscita. Riprova.');
  }

  if (!res.ok) {
    throw new Error('Sessione non valida. Accedi di nuovo.');
  }

  const data = (await res.json()) as {
    users?: Array<{ localId?: string; email?: string; emailVerified?: boolean; disabled?: boolean }>;
  };
  const record = data.users?.[0];
  // Account disabilitato o revocato: token non piu valido anche se non scaduto.
  if (!record?.localId || record.disabled === true) {
    throw new Error('Sessione non valida. Accedi di nuovo.');
  }
  return {
    uid: record.localId,
    email: record.email,
    emailVerified: record.emailVerified === true,
  };
}

async function readUserProfile(
  uid: string,
  idToken: string
): Promise<{ role: string; status: string; firstName: string; lastName: string }> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('Configurazione Firebase mancante sul server.');
  }

  const url =
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/(default)/documents/users/${encodeURIComponent(uid)}`;

  let res: Response;
  try {
    res = await googleFetch(url, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
  } catch {
    throw new Error('Verifica profilo non riuscita. Riprova.');
  }

  if (!res.ok) {
    throw new Error('Profilo utente non leggibile. Accedi di nuovo.');
  }

  const doc = (await res.json()) as {
    fields?: {
      role?: { stringValue?: string };
      status?: { stringValue?: string };
      firstName?: { stringValue?: string };
      lastName?: { stringValue?: string };
    };
  };
  return {
    role: doc.fields?.role?.stringValue ?? '',
    status: doc.fields?.status?.stringValue ?? '',
    firstName: doc.fields?.firstName?.stringValue ?? '',
    lastName: doc.fields?.lastName?.stringValue ?? '',
  };
}

/**
 * Verifica il token e restituisce uid + ruolo + stato. Lancia se non valido.
 * Il chiamante puo passare l'IP (header) per il throttle anti-flood.
 */
export async function getCallerProfile(idToken: string, ip: string | null = null): Promise<CallerProfile> {
  if (!idToken || typeof idToken !== 'string' || idToken.length > MAX_TOKEN_LENGTH) {
    throw new Error('Sessione non valida. Accedi di nuovo.');
  }

  throttleIp(ip);

  const { uid, email, emailVerified } = await lookupUid(idToken);
  const { role, status, firstName, lastName } = await readUserProfile(uid, idToken);
  return { uid, email, emailVerified, role, status, firstName, lastName };
}

/**
 * Richiede amministratore approvato con email verificata.
 * Usata dalle action di approvazione/rifiuto (email ufficiali).
 */
export async function requireAdminCaller(idToken: string, ip: string | null = null): Promise<CallerProfile> {
  const caller = await getCallerProfile(idToken, ip);

  if (!caller.emailVerified) {
    throw new Error('Email non verificata.');
  }
  if (caller.status !== 'Approved') {
    throw new Error('Account non approvato.');
  }
  if (caller.role !== 'Admin') {
    throw new Error('Operazione riservata agli amministratori.');
  }
  return caller;
}

/**
 * Richiede utente autenticato con ruolo Institute (o Admin) e stato Approved.
 * Usata dalle action che consumano quota AI a pagamento.
 */
export async function requireInstituteCaller(idToken: string, ip: string | null = null): Promise<CallerProfile> {
  const caller = await getCallerProfile(idToken, ip);

  if (!caller.emailVerified) {
    throw new Error("Verifica la tua email prima di usare l'analisi IA.");
  }
  if (caller.status !== 'Approved') {
    throw new Error('Account non ancora approvato.');
  }
  if (caller.role !== 'Institute' && caller.role !== 'Admin') {
    throw new Error('Operazione riservata agli istituti.');
  }
  return caller;
}
