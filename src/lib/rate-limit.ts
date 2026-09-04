/**
 * Rate limiter in memoria a finestra scorrevole per le Server Action.
 *
 * Limita gli abusi di un singolo utente autenticato su una istanza.
 * Con piu istanze serve un limitatore distribuito (nota per lo scale-out).
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

const buckets = new Map<string, number[]>();
const MAX_TRACKED_KEYS = 5000;

function pruneExpiredKeys(nowMs: number, windowMs: number): void {
  if (buckets.size <= MAX_TRACKED_KEYS) return;
  for (const key of Array.from(buckets.keys())) {
    const hits = buckets.get(key) ?? [];
    if (hits.every((hit) => nowMs - hit >= windowMs)) {
      buckets.delete(key);
    }
  }
}

/** Registra un tentativo per la chiave e dice se e consentito. */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const nowMs = Date.now();
  pruneExpiredKeys(nowMs, options.windowMs);

  const previous = buckets.get(key) ?? [];
  const hits = previous.filter((hit) => nowMs - hit < options.windowMs);

  if (hits.length >= options.limit) {
    buckets.set(key, hits);
    const oldest = hits[0] ?? nowMs;
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, options.windowMs - (nowMs - oldest)),
    };
  }

  hits.push(nowMs);
  buckets.set(key, hits);

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
