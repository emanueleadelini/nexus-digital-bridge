/**
 * Rate limiter in memoria a finestra scorrevole per le Server Action.
 *
 * Limita gli abusi di un singolo utente autenticato su una istanza.
 * VINCOLO OPERATIVO: stato per-processo. Vale su una singola istanza
 * long-lived; con piu istanze serve un limitatore distribuito (Redis o
 * transazione Firestore). Vedi runbook di deploy.
 */

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

interface Bucket {
  hits: number[];
  windowMs: number;
}

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 5000;

function isExpired(bucket: Bucket, nowMs: number): boolean {
  return bucket.hits.every((hit) => nowMs - hit >= bucket.windowMs);
}

function prune(nowMs: number): void {
  // Spazza solo le chiavi scadute secondo la LORO finestra.
  for (const [key, bucket] of Array.from(buckets)) {
    if (isExpired(bucket, nowMs)) {
      buckets.delete(key);
    }
  }
  // Oltre il tetto, butta le chiavi scadute; se non basta, logga e
  // rifiuta nuove chiavi (fail-closed) invece di azzerare quote attive.
  if (buckets.size > MAX_TRACKED_KEYS) {
    console.error(
      `Rate limiter saturo (${buckets.size} chiavi): nuove chiavi rifiutate fino a spazio libero.`
    );
  }
}

/** Registra un tentativo per la chiave e dice se e consentito. */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const nowMs = Date.now();
  prune(nowMs);

  if (!buckets.has(key) && buckets.size >= MAX_TRACKED_KEYS) {
    return { allowed: false, remaining: 0, retryAfterMs: options.windowMs };
  }

  const bucket = buckets.get(key) ?? { hits: [], windowMs: options.windowMs };
  bucket.windowMs = options.windowMs;
  const hits = bucket.hits.filter((hit) => nowMs - hit < bucket.windowMs);

  if (hits.length >= options.limit) {
    bucket.hits = hits;
    buckets.set(key, bucket);
    const oldest = hits[0] ?? nowMs;
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, bucket.windowMs - (nowMs - oldest)),
    };
  }

  hits.push(nowMs);
  bucket.hits = hits;
  buckets.set(key, bucket);

  return {
    allowed: true,
    remaining: Math.max(0, options.limit - hits.length),
    retryAfterMs: 0,
  };
}

/** Azzera il contatore (utile nei test). */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/**
 * Restituisce una tacca consumata (es. analisi fallita prima di Gemini).
 * Rimuove l'ultimo hit registrato per la chiave.
 */
export function refundRateLimit(key: string): void {
  const bucket = buckets.get(key);
  if (!bucket || bucket.hits.length === 0) return;
  bucket.hits.pop();
  if (bucket.hits.length === 0) {
    buckets.delete(key);
  } else {
    buckets.set(key, bucket);
  }
}
