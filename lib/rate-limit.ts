/**
 * Lightweight in-memory per-IP rate limiter. No Redis or external services —
 * just a Map of recent request timestamps, pruned as we go. Good enough to stop
 * casual hammering during a short demo; it resets on redeploy and does not span
 * multiple serverless instances, which is fine for that purpose.
 */

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

export const PER_MINUTE = 5;
export const PER_DAY = 30;

// IP -> request timestamps (ms) within the last day, oldest first.
const hits = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds the caller should wait before retrying, for the Retry-After header. */
  retryAfter: number;
}

/**
 * Records a request for `ip` and reports whether it stays within both the
 * per-minute and per-day limits. A blocked request is NOT counted, so a caller
 * who keeps hammering can't push their own reset further out.
 */
export function checkRateLimit(ip: string, now = Date.now()): RateLimitResult {
  const dayAgo = now - DAY;
  const minuteAgo = now - MINUTE;

  const recent = (hits.get(ip) ?? []).filter((t) => t > dayAgo);

  const inLastMinute = recent.filter((t) => t > minuteAgo).length;
  const inLastDay = recent.length;

  if (inLastMinute >= PER_MINUTE) {
    hits.set(ip, recent);
    const oldestInWindow = recent.find((t) => t > minuteAgo) ?? now;
    return { allowed: false, retryAfter: Math.ceil((oldestInWindow + MINUTE - now) / 1000) };
  }

  if (inLastDay >= PER_DAY) {
    hits.set(ip, recent);
    const oldest = recent[0] ?? now;
    return { allowed: false, retryAfter: Math.ceil((oldest + DAY - now) / 1000) };
  }

  recent.push(now);
  hits.set(ip, recent);
  return { allowed: true, retryAfter: 0 };
}

/**
 * Best-effort client IP from proxy headers. Falls back to a shared bucket when
 * no IP is available so the limit still applies (conservatively) rather than
 * letting everyone through.
 */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
