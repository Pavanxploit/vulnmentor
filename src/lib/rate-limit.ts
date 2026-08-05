/**
 * In-memory sliding-window rate limiter for the local-first deployment.
 *
 * VulnMentor runs as a single Node process against a JSON file, so an in-process
 * limiter matches the deployment model. It is intentionally not shared state: if
 * the platform later moves behind multiple workers this must move with the
 * database (see docs/DATABASE_PLAN.md).
 */

export type RateLimitRule = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/** Auth endpoints are the brute-force target, so they get the tightest budget. */
export const authRateLimit: RateLimitRule = { limit: 10, windowMs: 1000 * 60 * 5 };

/** Registration is heavier (scrypt) and rarely repeated by a real student. */
export const registerRateLimit: RateLimitRule = { limit: 5, windowMs: 1000 * 60 * 15 };

/** Flag submission stays generous: guessing is part of learning, flooding is not. */
export const flagRateLimit: RateLimitRule = { limit: 30, windowMs: 1000 * 60 };

/**
 * Restarting a lab spawns a Docker command and disrupts everyone using it, so
 * it gets the tightest budget of all.
 */
export const restartRateLimit: RateLimitRule = { limit: 6, windowMs: 1000 * 60 * 5 };

const hitsByKey = new Map<string, number[]>();
const maxTrackedKeys = 5000;

export function checkRateLimit(key: string, rule: RateLimitRule): RateLimitResult {
  const now = Date.now();
  const windowStart = now - rule.windowMs;
  const hits = (hitsByKey.get(key) ?? []).filter((timestamp) => timestamp > windowStart);

  if (hits.length >= rule.limit) {
    const oldest = hits[0];
    hitsByKey.set(key, hits);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + rule.windowMs - now) / 1000)),
    };
  }

  hits.push(now);
  hitsByKey.set(key, hits);
  evictIfCrowded(windowStart);

  return {
    allowed: true,
    remaining: rule.limit - hits.length,
    retryAfterSeconds: 0,
  };
}

/**
 * Identifies the caller. Behind no proxy (the normal local case) this collapses
 * to a single bucket, which is why auth routes also key on the submitted email:
 * one student fat-fingering a password must not lock out the whole classroom.
 */
export function getClientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip")?.trim() || "local";
}

export function rateLimitResponseHeaders(result: RateLimitResult) {
  return { "retry-after": String(result.retryAfterSeconds) };
}

function evictIfCrowded(windowStart: number) {
  if (hitsByKey.size <= maxTrackedKeys) return;

  for (const [key, timestamps] of hitsByKey) {
    const live = timestamps.filter((timestamp) => timestamp > windowStart);
    if (live.length === 0) {
      hitsByKey.delete(key);
    } else {
      hitsByKey.set(key, live);
    }
  }
}

/** Test seam: lets the validation script assert limiter behaviour deterministically. */
export function resetRateLimits() {
  hitsByKey.clear();
}
