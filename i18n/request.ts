import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ locale }) => {
  console.log('🌍 getRequestConfig called with locale:', locale)
  console.log('🌍 All routing locales:', routing.locales)
  
  // Validate that the incoming `locale` parameter is valid
  if (!locale || !routing.locales.includes(locale as any)) {
    console.log('🌍 Invalid or missing locale, using default:', routing.defaultLocale)
    locale = routing.defaultLocale
  }
  
  console.log('🌍 Final locale being used:', locale)

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  }
})
