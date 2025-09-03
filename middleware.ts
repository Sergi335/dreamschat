import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/api/(.*)'
])

const intlMiddleware = createIntlMiddleware({
  // A list of all locales that are supported
  locales: ['es', 'en'],

  // Used when no locale matches
  defaultLocale: 'es'
})

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl

  // Skip internationalization for API routes
  if (pathname.startsWith('/api/')) {
    // Check if Clerk is properly configured
    const isClerkConfigured = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_')

    if (isClerkConfigured && isProtectedRoute(req)) {
      await auth.protect()
    }

    return NextResponse.next()
  }

  // Handle internationalization for non-API routes
  const intlResponse = intlMiddleware(req)
  if (intlResponse && intlResponse.status === 307) {
    return intlResponse
  }

  // Check if Clerk is properly configured
  const isClerkConfigured = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_')

  if (!isClerkConfigured) {
    return NextResponse.next()
  }

  // Handle Clerk authentication for dashboard routes
  const match = pathname.match(/^\/(es|en)\/dashboard/)
  const session = await auth()
  if (match && !session.userId) {
    return NextResponse.redirect(new URL(`/${match[1]}/sign-in`, req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/api/(.*)',
    '/((?!_next|static|favicon.ico).*)'
  ]
}
