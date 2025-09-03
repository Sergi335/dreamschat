import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/api/(.*)'
])

const intlMiddleware = createIntlMiddleware({
  locales: ['es', 'en'],
  defaultLocale: 'es'
})

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl

  // IMPORTANTE: Excluir COMPLETAMENTE las rutas de API del middleware de internacionalización
  if (pathname.startsWith('/api/')) {
    // Solo manejar autenticación de Clerk para rutas protegidas
    if (isProtectedRoute(req)) {
      await auth.protect()
    }
    return NextResponse.next()
  }

  // Para rutas que NO son API, aplicar internacionalización
  const intlResponse = intlMiddleware(req)
  if (intlResponse) {
    return intlResponse
  }

  // Manejar autenticación para rutas del dashboard
  const match = pathname.match(/^\/(es|en)\/dashboard/)
  if (match) {
    const session = await auth()
    if (!session.userId) {
      return NextResponse.redirect(new URL(`/${match[1]}/sign-in`, req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Incluir rutas de API para autenticación
    '/api/(.*)',
    // Excluir archivos estáticos pero incluir todas las demás rutas para internacionalización
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Incluir la ruta raíz
    '/'
  ]
}
