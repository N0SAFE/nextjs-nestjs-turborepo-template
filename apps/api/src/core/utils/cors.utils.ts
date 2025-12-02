/**
 * CORS utility functions for handling origin validation and normalization
 */

/**
 * Normalize URL by removing trailing slash
 * @param url - The URL to normalize
 * @returns The normalized URL without trailing slash
 */
export const normalizeUrl = (url: string): string => url.replace(/\/$/, '');

/**
 * Build list of allowed origins from environment variables
 * @param env - Environment variables object
 * @returns Array of normalized allowed origins
 */
export const buildAllowedOrigins = (env: {
  NEXT_PUBLIC_APP_URL?: string;
  APP_URL?: string;
  TRUSTED_ORIGINS?: string;
}): string[] => {
  const allowedOrigins: string[] = [];

  // Add configured app URL (public facing URL)
  if (env.NEXT_PUBLIC_APP_URL) {
    allowedOrigins.push(normalizeUrl(env.NEXT_PUBLIC_APP_URL));
  }

  // Add internal app URL (Docker network URL) if different
  if (env.APP_URL && env.APP_URL !== env.NEXT_PUBLIC_APP_URL) {
    allowedOrigins.push(normalizeUrl(env.APP_URL));
  }

  // Add additional trusted origins
  if (env.TRUSTED_ORIGINS) {
    env.TRUSTED_ORIGINS.split(',').forEach(origin => {
      const trimmed = origin.trim();
      if (trimmed) {
        allowedOrigins.push(normalizeUrl(trimmed));
      }
    });
  }

  // Fallback to localhost:3000 if no origins configured
  if (allowedOrigins.length === 0) {
    allowedOrigins.push('http://localhost:3000');
  }

  return allowedOrigins;
};

/**
 * Check if origin matches localhost patterns
 * Used in development mode to be more permissive
 * @param origin - The origin to check
 * @returns True if origin is a localhost variant
 */
export const isLocalhostOrigin = (origin: string): boolean => {
  const localhostPattern = /^https?:\/\/localhost(:\d+)?$/;
  const ipPattern = /^https?:\/\/127\.0\.0\.1(:\d+)?$/;
  return localhostPattern.test(origin) || ipPattern.test(origin);
};
