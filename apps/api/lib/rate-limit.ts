/**
 * AI request rate limiting via Cloudflare KV.
 *
 * Uses hourly buckets to limit each user to 20 AI requests per hour.
 * Rate limit state is stored in KV with a 2-hour TTL for automatic cleanup.
 */

const MAX_REQUESTS_PER_HOUR = 20;
const HOUR_MS = 3_600_000;
const TTL_SECONDS = 7200; // 2 hours

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number | null;
}

/**
 * Checks and increments the rate limit counter for a user's AI requests.
 *
 * @param kv - Cloudflare KV namespace binding (AI_RATE_LIMIT)
 * @param userId - The authenticated user's ID
 * @returns Rate limit check result with remaining quota and retry info
 */
export async function checkRateLimit(
  kv: KVNamespace | undefined,
  userId: string,
): Promise<RateLimitResult> {
  // When KV is unavailable (e.g., local dev without wrangler), allow all requests
  if (!kv) {
    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_HOUR,
      retryAfter: null,
    };
  }

  const hourBucket = Math.floor(Date.now() / HOUR_MS);
  const key = `ratelimit:ai:${userId}:${hourBucket}`;

  const currentStr = await kv.get(key);
  const current = currentStr ? parseInt(currentStr, 10) : 0;

  if (current >= MAX_REQUESTS_PER_HOUR) {
    const nextBucketMs = (hourBucket + 1) * HOUR_MS;
    const retryAfter = Math.ceil((nextBucketMs - Date.now()) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfter,
    };
  }

  await kv.put(key, String(current + 1), { expirationTtl: TTL_SECONDS });

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_HOUR - current - 1,
    retryAfter: null,
  };
}
