import 'server-only';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

type RateLimitWindow = Parameters<typeof Ratelimit.slidingWindow>[1];

type HeaderSource = Headers | Record<string, string | string[] | undefined> | undefined | null;

export type RateLimitConfig = {
  identifier: string;
  limit: number;
  namespace: string;
  window: RateLimitWindow;
};

export type RateLimitResult = {
  limit?: number;
  remaining?: number;
  reset?: number;
  success: boolean;
};

const limiterCache = new Map<string, Ratelimit>();
let redisClient: Redis | null = null;

const shouldBypassRateLimit = () =>
  process.env.NODE_ENV === 'test' && process.env.ENABLE_UPSTASH_RATE_LIMIT_TESTS !== 'true';

const isUpstashConfigured = () =>
  Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const getRedisClient = () => {
  if (!isUpstashConfigured()) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis({
      token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
      url: process.env.UPSTASH_REDIS_REST_URL as string,
    });
  }

  return redisClient;
};

const getHeaderValue = (headers: HeaderSource, name: string) => {
  if (!headers) {
    return '';
  }

  if (typeof (headers as Headers).get === 'function') {
    return (headers as Headers).get(name) || '';
  }

  const headerMap = headers as Record<string, string | string[] | undefined>;
  const value = headerMap[name] || headerMap[name.toLowerCase()];

  return Array.isArray(value) ? value[0] || '' : value || '';
};

export const getClientIp = (request?: { headers?: HeaderSource } | Request | null) => {
  const headers = request?.headers;
  const forwardedFor = getHeaderValue(headers, 'x-forwarded-for');
  const realIp = getHeaderValue(headers, 'x-real-ip');
  const cloudflareIp = getHeaderValue(headers, 'cf-connecting-ip');

  return (
    forwardedFor.split(',')[0]?.trim() ||
    realIp.trim() ||
    cloudflareIp.trim() ||
    'local-development'
  );
};

export const createRateLimitKey = (...parts: Array<string | null | undefined>) =>
  parts
    .map((part) =>
      String(part || 'anonymous')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9@._-]+/g, '_')
        .slice(0, 120)
    )
    .filter(Boolean)
    .join(':');

const getLimiter = ({ limit, namespace, window }: Omit<RateLimitConfig, 'identifier'>) => {
  const redis = getRedisClient();

  if (!redis) {
    return null;
  }

  const cacheKey = `${namespace}:${limit}:${window}`;
  const cachedLimiter = limiterCache.get(cacheKey);

  if (cachedLimiter) {
    return cachedLimiter;
  }

  const limiter = new Ratelimit({
    analytics: true,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix: `food-ordering:${namespace}`,
    redis,
  });

  limiterCache.set(cacheKey, limiter);

  return limiter;
};

export const enforceRateLimit = async ({
  identifier,
  limit,
  namespace,
  window,
}: RateLimitConfig): Promise<RateLimitResult> => {
  if (shouldBypassRateLimit() || !identifier) {
    return { success: true };
  }

  const limiter = getLimiter({ limit, namespace, window });

  if (!limiter) {
    return { success: true };
  }

  try {
    const result = await limiter.limit(identifier);

    return {
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      success: result.success,
    };
  } catch (error) {
    console.error(`Rate limit failed for ${namespace}:`, error);
    return { success: true };
  }
};

export const createRateLimitResponse = (
  result: RateLimitResult,
  message = 'Too many requests. Please try again later.'
) => {
  const headers = new Headers();

  if (typeof result.limit === 'number') {
    headers.set('X-RateLimit-Limit', String(result.limit));
  }

  if (typeof result.remaining === 'number') {
    headers.set('X-RateLimit-Remaining', String(result.remaining));
  }

  if (typeof result.reset === 'number') {
    const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
    headers.set('Retry-After', String(retryAfterSeconds));
    headers.set('X-RateLimit-Reset', String(result.reset));
  }

  return Response.json({ error: message }, { headers, status: 429 });
};
