/**
 * Utility functions for managing the dev auth token cookie flag
 * This allows the devtools to enable/disable dev token authentication
 */

const DEV_AUTH_COOKIE_NAME = 'dev-auth-enabled';

/**
 * Get the dev auth token flag from cookies
 * @returns boolean indicating if dev auth token mode is enabled
 */
export function getDevAuthEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  
  const cookies = document.cookie.split(';');
  const devAuthCookie = cookies.find(cookie => 
    cookie.trim().startsWith(`${DEV_AUTH_COOKIE_NAME}=`)
  );
  
  return devAuthCookie?.split('=')[1]?.trim() === 'true';
}

/**
 * Set the dev auth token flag in cookies
 * @param enabled - whether to enable dev auth token mode
 */
export function setDevAuthEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  
  // Set cookie with 1 day expiration (dev mode only)
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 1);
  
  document.cookie = `${DEV_AUTH_COOKIE_NAME}=${enabled}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Get the DEV_AUTH_KEY from environment variables
 * This should only work in development mode
 * @returns the dev auth key or null if not available
 */
export function getDevAuthKey(): string | null {
  // Note: In Next.js, only NEXT_PUBLIC_ env vars are available on client side
  // We'll need to pass this through a secure API endpoint or server-side rendering
  // For now, return null and handle this on the server side
  return null;
}

/**
 * Clear the dev auth cookie (disable dev auth mode)
 */
export function clearDevAuth(): void {
  if (typeof window === 'undefined') return;
  
  document.cookie = `${DEV_AUTH_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}