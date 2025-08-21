import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  const validLocales = ['es', 'en', 'pt']
  const validatedLocale = validLocales.includes(locale) ? locale : 'es'
  
  return {
    locale: validatedLocale,
    messages: (await import(`../messages/${validatedLocale}.json`)).default
  }
})
