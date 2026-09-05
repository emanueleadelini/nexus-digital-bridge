import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { runParseCV } from '@/ai/flows/parse-cv-core';

/**
 * POST /api/parse-cv — analisi IA di un CV Europass (solo istituti approvati).
 *
 * Auth-first: il token viaggia nell'header Authorization e viene verificato
 * PRIMA di leggere il corpo. Il Content-Length taglia i giganti subito.
 * Tetto corpo: ~14MB (10MB PDF + base64), oltre -> 413 senza toccare Gemini.
 */
const MAX_BODY_BYTES = 14 * 1024 * 1024;

function clientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip');
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization') ?? '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!idToken) {
    return NextResponse.json({ error: 'Non autenticato.' }, { status: 401 });
  }

  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'File troppo grande (max 10MB).' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida.' }, { status: 400 });
  }

  const pdfDataUri = (body as { pdfDataUri?: unknown })?.pdfDataUri;
  if (typeof pdfDataUri !== 'string' || pdfDataUri.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'File non valido.' }, { status: 400 });
  }

  try {
    const result = await runParseCV({ pdfDataUri, idToken }, clientIp(request));
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analisi fallita.';
    // 4xx attesi (auth/validazione/quota): niente Sentry. 5xx imprevisti: sì.
    if (err instanceof Error && !/^(Non autenticato|Sessione|Verifica|Account|Operazione|Email|Profilo|Il file|La quota|Quota|Troppe)/.test(message)) {
      try {
        Sentry.captureException(err);
      } catch {
        // noop
      }
    }
    const status = message.includes('Accedi di nuovo')
      ? 401
      : message.includes('verificat') || message.includes('approvat') || message.includes('riservata') || message.includes('non verificata')
        ? 403
        : message.includes('Quota') || message.includes('Troppe richieste')
          ? 429
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
