import { ConversationsProvider } from '@/context/conversations-context'
import { ClerkProvider } from '@clerk/nextjs'
import { NextIntlClientProvider } from 'next-intl'
import React from 'react'
import './globals.css'

export default async function LocaleLayout ({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Load messages directly based on the locale from URL params
  let messages
  try {
    messages = (await import(`../../messages/${locale}.json`)).default
  } catch (error) {
    // Fallback to Spanish if locale messages are not found
    messages = (await import('../../messages/es.json')).default
  }

  // Check if Clerk is properly configured
  const isClerkConfigured = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_')

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {isClerkConfigured
        ? (
          <ClerkProvider>
            <ConversationsProvider>
              {children}
            </ConversationsProvider>
          </ClerkProvider>
        )
        : (
          <ConversationsProvider>
            {children}
          </ConversationsProvider>
        )}
    </NextIntlClientProvider>
  )
}
