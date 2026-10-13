import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'

import { routing } from './i18n/routing'
import { updateSession } from './lib/supabase/middleware'

import type { NextRequest } from 'next/server'

const handleI18nRouting = createMiddleware(routing)

function extractLocale(pathname: string): string {
  if (pathname.startsWith('/en/') || pathname === '/en') {
    return 'en'
  }
  return 'id'
}

function isSafeRelativeUrl(url: string | null): boolean {
  if (!url) return false
  const trimmed = url.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return false
  }
  if (/[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return false
  }
  if (trimmed.includes('\\')) {
    return false
  }
  return true
}

export default async function proxy(request: NextRequest) {
  const i18nResponse = handleI18nRouting(request)
  const { response, user } = await updateSession(request, i18nResponse)

  const { pathname, searchParams } = request.nextUrl
  const locale = extractLocale(pathname)

  // Protected route check: /dashboard or /(id|en)/dashboard(/.*)?
  const isDashboardRoute =
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === `/${locale}/dashboard` ||
    pathname.startsWith(`/${locale}/dashboard/`)

  // Auth route check: /login or /(id|en)/login
  const isLoginRoute = pathname === '/login' || pathname === `/${locale}/login`

  // Scenario 1: Unauthenticated access to protected dashboard route
  if (isDashboardRoute && !user) {
    const redirectUrl = new URL(`/${locale}/login`, request.url)
    const currentPath = request.nextUrl.pathname + request.nextUrl.search
    if (isSafeRelativeUrl(currentPath)) {
      redirectUrl.searchParams.set('returnUrl', currentPath)
    }

    const redirectResponse = NextResponse.redirect(redirectUrl)
    // Synchronize session cookies to avoid dropping auth refresh tokens
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })
    return redirectResponse
  }

  // Scenario 2: Authenticated user attempting to visit login page
  if (isLoginRoute && user) {
    const rawReturnUrl = searchParams.get('returnUrl')
    const targetPath = isSafeRelativeUrl(rawReturnUrl) ? (rawReturnUrl as string) : `/${locale}/dashboard`

    const redirectUrl = new URL(targetPath, request.url)
    const redirectResponse = NextResponse.redirect(redirectUrl)
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })
    return redirectResponse
  }

  return response
}

export const config = {
  // Negative matcher: matches all paths except API routes, _next internals, static files, and favicons
  matcher: ['/', '/(id|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
}
