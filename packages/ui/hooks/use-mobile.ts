"use client"

import { useMedia } from 'react-use'

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Use react-use's useMedia hook with the mobile breakpoint
  return useMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
}