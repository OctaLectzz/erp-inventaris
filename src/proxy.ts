import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'

import type { NextRequest } from 'next/server'

const handleI18nRouting = createMiddleware(routing)

export default function proxy(request: NextRequest) {
  return handleI18nRouting(request)
}

export const config = {
  // Negative matcher: matches all paths except API routes, _next internals, static files, and favicons
  matcher: ['/', '/(id|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
}
