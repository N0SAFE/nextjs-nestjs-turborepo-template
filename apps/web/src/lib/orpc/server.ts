import { createORPCClientWithCookies } from './client'

// Pre-import next/headers to cache the module
import { cookies } from 'next/headers'

// Create server-side client factory with cached next/headers import
export async function createServerORPCClient() {
  const startTime = performance.now();
  
  try {
    if (typeof window !== 'undefined') {
      // Client-side: return regular client without TanStack Query utils
      return createORPCClientWithCookies();
    }
    
    // Server-side: use pre-imported cookies function
    try {
      const cookiesStart = performance.now();
      const cookieStore = await cookies();
      const cookieString = cookieStore.toString();
      const cookiesTime = performance.now() - cookiesStart;
      
      const clientStart = performance.now();
      const serverClient = createORPCClientWithCookies(cookieString);
      const clientTime = performance.now() - clientStart;
      
      const totalTime = performance.now() - startTime;
      
      // Only log performance in development to avoid production noise
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 ORPC Server Client created in ${totalTime.toFixed(2)}ms (cookies: ${cookiesTime.toFixed(2)}ms, client: ${clientTime.toFixed(2)}ms)`);
      }
      
      return serverClient;
    } catch {
      // If we can't access cookies (build time, etc.), use unauthenticated client
      const fallbackStart = performance.now();
      const fallbackClient = createORPCClientWithCookies();
      const fallbackTime = performance.now() - fallbackStart;
      
      // Only log in development to avoid noise in production
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ Using unauthenticated ORPC client (${fallbackTime.toFixed(2)}ms) - likely build time or invalid request context`);
      }
      return fallbackClient;
    }
  } catch (error) {
    const errorTime = performance.now() - startTime;
    console.warn(`❌ Failed to create server ORPC client in ${errorTime.toFixed(2)}ms:`, error);
    const fallbackClient = createORPCClientWithCookies();
    return fallbackClient;
  }
}