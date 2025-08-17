import type { ReactNode } from 'react'
import './globals.css'
import { RootProvider } from 'fumadocs-ui/provider'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RootProvider>
          {children}
        </RootProvider>
      </body>
    </html>
  )
}
