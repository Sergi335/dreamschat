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
  const { pathname, searchParams } = req.nextUrl
  console.log('🚀 ~ pathname:', pathname)

  // Verificar si es una petición de dashboard con prompt (modo guest)
  const hasPromptParam = searchParams.has('prompt')
  const isDashboardRoute = pathname.match(/^\/(es|en)\/dashboard/) || pathname === '/dashboard'

  // 1. Proteger rutas de API y dashboard (excepto dashboard con prompt)
  if (isProtectedRoute(req)) {
    const session = await auth()

    // Permitir acceso al dashboard sin autenticación si hay prompt (modo guest)
    if (!session.userId && isDashboardRoute && hasPromptParam) {
      // Continuar sin autenticación para modo guest
      console.log('🔓 Allowing guest access to dashboard with prompt')
    } else if (!session.userId) {
      // Si es API, responde 401; si es dashboard sin prompt, redirige
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
    // Si está autenticado o es modo guest con prompt, sigue con la petición
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
