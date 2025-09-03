import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ locale }) => {
  // Provide a default locale if none is detected
  const resolvedLocale = locale || 'es'
  
  return {
    locale: resolvedLocale,
    messages: {}  // Empty messages since we handle them in the locale layout
  }
})