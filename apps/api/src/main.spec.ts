import { describe, it, expect } from 'vitest';
import { normalizeUrl, buildAllowedOrigins, isLocalhostOrigin } from './core/utils/cors.utils';

describe('CORS URL Normalization', () => {
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

    // Simulate incoming origins with trailing slashes
    const origin1 = 'http://localhost:3000/';
    const origin2 = 'http://localhost:3003/';

    expect(allowedOrigins.includes(normalizeUrl(origin1))).toBe(true);
    expect(allowedOrigins.includes(normalizeUrl(origin2))).toBe(true);
  });

  it('should handle localhost variations in development', () => {
    // Test various localhost formats
    expect(isLocalhostOrigin('http://localhost:3000')).toBe(true);
    expect(isLocalhostOrigin('http://localhost:8055')).toBe(true);
    expect(isLocalhostOrigin('https://localhost:3000')).toBe(true);
    expect(isLocalhostOrigin('http://localhost')).toBe(true);

    // Test IP address formats
    expect(isLocalhostOrigin('http://127.0.0.1:3000')).toBe(true);
    expect(isLocalhostOrigin('http://127.0.0.1')).toBe(true);
    expect(isLocalhostOrigin('https://127.0.0.1:8055')).toBe(true);

    // Test non-localhost domains should not match
    expect(isLocalhostOrigin('http://example.com:3000')).toBe(false);
    expect(isLocalhostOrigin('http://192.168.1.1:3000')).toBe(false);
  });

  it('should build allowed origins from environment variables', () => {
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
