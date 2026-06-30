import { describe, expect, it } from 'vitest';
import {
  createRateLimitKey,
  createRateLimitResponse,
  enforceRateLimit,
  getClientIp,
} from '@/libs/rateLimit';

describe('rateLimit helpers', () => {
  it('builds a normalized cache key from user-controlled parts', () => {
    expect(createRateLimitKey('Login', 'User@Example.COM', 'bad value !')).toBe(
      'login:user@example.com:bad_value_'
    );
  });

  it('extracts the first forwarded IP address', () => {
    const request = new Request('http://localhost/api/test', {
      headers: {
        'x-forwarded-for': '203.0.113.10, 198.51.100.7',
      },
    });

    expect(getClientIp(request)).toBe('203.0.113.10');
  });

  it('falls back to local development when no IP headers are present', () => {
    expect(getClientIp(new Request('http://localhost/api/test'))).toBe('local-development');
  });

  it('creates a standard 429 response with rate limit headers', async () => {
    const response = createRateLimitResponse(
      {
        limit: 5,
        remaining: 0,
        reset: Date.now() + 60_000,
        success: false,
      },
      'Slow down.'
    );

    await expect(response.json()).resolves.toEqual({ error: 'Slow down.' });
    expect(response.status).toBe(429);
    expect(response.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(response.headers.get('Retry-After')).toBeTruthy();
  });

  it('bypasses external Redis calls in the test environment by default', async () => {
    await expect(
      enforceRateLimit({
        identifier: 'test-user',
        limit: 1,
        namespace: 'test',
        window: '1 m',
      })
    ).resolves.toEqual({ success: true });
  });
});
