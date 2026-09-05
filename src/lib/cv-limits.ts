/**
 * Limiti condivisi del parsing CV (modulo puro: importabile anche dai test).
 *
 * Tenuti fuori da parse-cv-flow.ts perche i file 'use server' possono
 * esportare solo funzioni async e tipi.
 */

export const MAX_PDF_BYTES = 10 * 1024 * 1024;

/** Prefisso data URI accettato: solo PDF in base64. */
export const PDF_DATA_URI_PREFIX = 'data:application/pdf;base64,';

export const PDF_MAGIC = '%PDF-';

/** Quota anti-abuso: 10 analisi IA all'ora per utente. */
export const CV_RATE_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 };

/** Stima i byte da una stringa base64 (padding incluso, margine prudente). */
export function estimateBase64Bytes(base64Body: string): number {
  return Math.floor(base64Body.length * 3 / 4);
}

/** Verifica i magic bytes %PDF- decodificando solo la testa del base64. */
export function startsWithPdfMagic(base64Body: string): boolean {
  try {
    const head = Buffer.from(base64Body.slice(0, 16), 'base64').toString('latin1');
    return head.startsWith(PDF_MAGIC);
  } catch {
    return false;
  }
}
