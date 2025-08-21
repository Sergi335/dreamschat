import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createIntlMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'

const intlMiddleware = createIntlMiddleware({
  locales: ['es', 'en', 'pt'],
  defaultLocale: 'es'
})

const isProtectedRoute = createRouteMatcher([
  '/api/(.*)'
])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl
  
  // Apply intl middleware first
  const intlResponse = intlMiddleware(req)
  if (intlResponse) {
    return intlResponse
  }
  
  // Detecta si la ruta es /sign-in y hay un locale en la URL
  const match = pathname.match(/^\/(es|en|pt)\/dashboard/)
  const session = await auth()
  if (match && !session.userId) {
    // Redirige a /es/sign-in o /en/sign-in o /pt/sign-in
    return NextResponse.redirect(new URL(`/${match[1]}/sign-in`, req.url))
  }

  // No proteger rutas de login/register
  if (
    isProtectedRoute(req) &&
    !req.nextUrl.pathname.match(/^\/(\w{2})(\/)?(sign-in|sign-up|sign-out)/) && // excluye /es/sign-in, /en/sign-in, /pt/sign-in, etc.
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
