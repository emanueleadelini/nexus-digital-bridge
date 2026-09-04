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

export interface CallerProfile {
  uid: string;
  email?: string;
  role: string;
  status: string;
}

const MAX_TOKEN_LENGTH = 8192;

async function lookupUid(idToken: string): Promise<{ uid: string; email?: string }> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error('Configurazione Firebase mancante sul server.');
  }

  const endpoint = new URL('https://identitytoolkit.googleapis.com/v1/accounts:lookup');
  endpoint.searchParams.set('key', apiKey);

  const res = await fetch(endpoint.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Sessione non valida. Accedi di nuovo.');
  }

  const data = (await res.json()) as { users?: Array<{ localId?: string; email?: string }> };
  const uid = data.users?.[0]?.localId;
  if (!uid) {
    throw new Error('Sessione non valida. Accedi di nuovo.');
  }
  return { uid, email: data.users?.[0]?.email };
}

async function readUserProfile(uid: string, idToken: string): Promise<{ role: string; status: string }> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('Configurazione Firebase mancante sul server.');
  }

  const url =
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/(default)/documents/users/${encodeURIComponent(uid)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${idToken}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Profilo utente non leggibile. Accedi di nuovo.');
  }

  const doc = (await res.json()) as {
    fields?: { role?: { stringValue?: string }; status?: { stringValue?: string } };
  };
  return {
    role: doc.fields?.role?.stringValue ?? '',
    status: doc.fields?.status?.stringValue ?? '',
  };
}

/** Verifica il token e restituisce uid + ruolo + stato. Lancia se non valido. */
export async function getCallerProfile(idToken: string): Promise<CallerProfile> {
  if (!idToken || typeof idToken !== 'string' || idToken.length > MAX_TOKEN_LENGTH) {
    throw new Error('Sessione non valida. Accedi di nuovo.');
  }

  const { uid, email } = await lookupUid(idToken);
  const { role, status } = await readUserProfile(uid, idToken);
  return { uid, email, role, status };
}

/**
 * Richiede utente autenticato con ruolo Institute (o Admin) e stato Approved.
 * Usata dalle action che consumano quota AI a pagamento.
 */
export async function requireInstituteCaller(idToken: string): Promise<CallerProfile> {
  const caller = await getCallerProfile(idToken);

  if (caller.status !== 'Approved') {
    throw new Error('Account non ancora approvato.');
  }
  if (caller.role !== 'Institute' && caller.role !== 'Admin') {
    throw new Error('Operazione riservata agli istituti.');
  }
  return caller;
}
