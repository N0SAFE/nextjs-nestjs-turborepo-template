import { describe, it, expect, vi } from 'vitest';

describe('CORS URL Normalization', () => {
  const normalizeUrl = (url: string): string => url.replace(/\/$/, '');

  it('should remove trailing slash from URLs', () => {
    expect(normalizeUrl('http://localhost:3000/')).toBe('http://localhost:3000');
    expect(normalizeUrl('http://localhost:3003/')).toBe('http://localhost:3003');
    expect(normalizeUrl('https://example.com/')).toBe('https://example.com');
  });

  it('should leave URLs without trailing slash unchanged', () => {
    expect(normalizeUrl('http://localhost:3000')).toBe('http://localhost:3000');
    expect(normalizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('should handle URLs with ports correctly', () => {
    expect(normalizeUrl('http://localhost:8055/')).toBe('http://localhost:8055');
    expect(normalizeUrl('http://api.example.com:3001/')).toBe('http://api.example.com:3001');
  });
});

describe('CORS Origin Matching Logic', () => {
  it('should match normalized origins regardless of trailing slash', () => {
    const allowedOrigins = ['http://localhost:3000', 'http://localhost:3003'];
    const normalizeUrl = (url: string): string => url.replace(/\/$/, '');

    // Simulate incoming origins with trailing slashes
    const origin1 = 'http://localhost:3000/';
    const origin2 = 'http://localhost:3003/';

    expect(allowedOrigins.includes(normalizeUrl(origin1))).toBe(true);
    expect(allowedOrigins.includes(normalizeUrl(origin2))).toBe(true);
  });

  it('should handle localhost variations in development', () => {
    const localhostPattern = /^https?:\/\/localhost(:\d+)?$/;
    const ipPattern = /^https?:\/\/127\.0\.0\.1(:\d+)?$/;

    // Test various localhost formats
    expect(localhostPattern.test('http://localhost:3000')).toBe(true);
    expect(localhostPattern.test('http://localhost:8055')).toBe(true);
    expect(localhostPattern.test('https://localhost:3000')).toBe(true);
    expect(localhostPattern.test('http://localhost')).toBe(true);

    // Test IP address formats
    expect(ipPattern.test('http://127.0.0.1:3000')).toBe(true);
    expect(ipPattern.test('http://127.0.0.1')).toBe(true);
    expect(ipPattern.test('https://127.0.0.1:8055')).toBe(true);

    // Test non-localhost domains should not match
    expect(localhostPattern.test('http://example.com:3000')).toBe(false);
    expect(ipPattern.test('http://192.168.1.1:3000')).toBe(false);
  });

  it('should build allowed origins from environment variables', () => {
    const buildAllowedOrigins = (env: Record<string, string | undefined>) => {
      const normalizeUrl = (url: string): string => url.replace(/\/$/, '');
      const allowedOrigins: string[] = [];

      if (env.NEXT_PUBLIC_APP_URL) {
        allowedOrigins.push(normalizeUrl(env.NEXT_PUBLIC_APP_URL));
      }

      if (env.APP_URL && env.APP_URL !== env.NEXT_PUBLIC_APP_URL) {
        allowedOrigins.push(normalizeUrl(env.APP_URL));
      }

      if (env.TRUSTED_ORIGINS) {
        env.TRUSTED_ORIGINS.split(',').forEach(origin => {
          const trimmed = origin.trim();
          if (trimmed) {
            allowedOrigins.push(normalizeUrl(trimmed));
          }
        });
      }

      return allowedOrigins.length > 0 ? allowedOrigins : ['http://localhost:3000'];
    };

    // Test with trailing slashes
    const env1 = {
      NEXT_PUBLIC_APP_URL: 'http://localhost:3003/',
      APP_URL: 'http://web-dev:3000/'
    };
    expect(buildAllowedOrigins(env1)).toEqual([
      'http://localhost:3003',
      'http://web-dev:3000'
    ]);

    // Test with TRUSTED_ORIGINS
    const env2 = {
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      TRUSTED_ORIGINS: 'http://example.com, https://app.example.com/'
    };
    expect(buildAllowedOrigins(env2)).toEqual([
      'http://localhost:3000',
      'http://example.com',
      'https://app.example.com'
    ]);

    // Test fallback to default
    const env3 = {};
    expect(buildAllowedOrigins(env3)).toEqual(['http://localhost:3000']);
  });
});
