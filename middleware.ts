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
  
  // First, handle internationalization
  const intlResponse = intlMiddleware(req)
  if (intlResponse && intlResponse.status === 307) {
    return intlResponse
  }
  
  // Check if Clerk is properly configured
  const isClerkConfigured = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_')
  
  if (!isClerkConfigured) {
    // If Clerk is not configured, skip authentication and just handle internationalization
    return NextResponse.next()
  }
  
  // Then handle Clerk authentication if configured
  const match = pathname.match(/^\/(es|en)\/dashboard/)
  const session = await auth()
  if (match && !session.userId) {
    // Redirige a /es/sign-in o /en/sign-in
    return NextResponse.redirect(new URL(`/${match[1]}/sign-in`, req.url))
  }

  // No proteger rutas de login/register
  if (
    isProtectedRoute(req) &&
    !req.nextUrl.pathname.match(/^\/(\w{2})(\/)?(sign-in|sign-up|sign-out)/) && // excluye /es/sign-in, /en/sign-in, etc .
    !req.nextUrl.pathname.match(/^\/(sign-in|sign-up|sign-out)/) // excluye /sign-in, /sign-up, etc.
  ) {
    await auth.protect()
  }

  // Deja pasar el resto
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/api/(.*)',
    '/((?!_next|static|favicon.ico).*)'
  ]
}
