import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'
import { updateSession } from './lib/supabase/middleware'

import type { NextRequest } from 'next/server'

const handleI18nRouting = createMiddleware(routing)

export default async function proxy(request: NextRequest) {
  const i18nResponse = handleI18nRouting(request)
  const { response } = await updateSession(request, i18nResponse)
  return response
}

export const config = {
  // Negative matcher: matches all paths except API routes, _next internals, static files, and favicons
  matcher: ['/', '/(id|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
}
