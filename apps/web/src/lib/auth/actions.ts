// app/actions/auth.ts
'use server'

import { authClient } from '@/lib/auth' // Your auth client import
import { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers'

export async function getServerSession(h: ReadonlyHeaders) {
  // Extract session from authClient using request headers
  const session = await authClient.getSession({
    fetchOptions: {
      headers: {
        cookie: h.get('cookie') || '',
      },
    },
  })
  
  return session
}