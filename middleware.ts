import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/dashboard',
  '/(es|en)/dashboard(.*)',
  '/(es|en)/dashboard'
])

const intlMiddleware = createIntlMiddleware({
  locales: ['es', 'en'],
  defaultLocale: 'es'
})

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl
  console.log('🚀 ~ pathname:', pathname)

  // 1. Proteger rutas de API y dashboard
  if (isProtectedRoute(req)) {
    const session = await auth()
    if (!session.userId) {
      // Si es API, responde 401; si es dashboard, redirige
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
    // Si está autenticado, sigue con la petición
    return NextResponse.next()
  }

  // 2. Excluir archivos estáticos y públicos
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/public') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots') ||
    pathname.startsWith('/sitemap') ||
    pathname.startsWith('/manifest') ||
    (pathname.includes('.') && !pathname.endsWith('/'))
  ) {
    return NextResponse.next()
  }

  // 3. Internacionalización para el resto de rutas
  const intlResponse = intlMiddleware(req)
  if (intlResponse) {
    return intlResponse
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/dashboard(.*)',
    '/dashboard',
    '/(es|en)/dashboard(.*)',
    '/(es|en)/dashboard',
    '/((?!_next/static|_next/image|favicon|public|static|robots|sitemap|manifest|.*\\..*).*)',
    '/'
  ]
}
