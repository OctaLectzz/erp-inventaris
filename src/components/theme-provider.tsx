'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

// Filter out React 19 false-positive script warning during client navigation with next-themes
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalError = console.error
  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : (args[0] as Error)?.message || ''
    if (typeof msg === 'string' && msg.includes('Encountered a script tag')) {
      return
    }
    originalError.apply(console, args)
  }
}

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
