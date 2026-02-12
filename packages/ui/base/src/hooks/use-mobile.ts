"use client"

import { useMedia } from 'react-use'

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Provide defaultState for SSR to avoid hydration mismatch warnings.
  return useMedia(`(max-width: ${String(MOBILE_BREAKPOINT - 1)}px)`, false)
}