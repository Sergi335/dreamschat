import { ConversationsProvider } from '@/context/conversations-context'
import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale } from 'next-intl/server'
// import { Inter } from 'next/font/google'
import { notFound } from 'next/navigation'
import React from 'react'
import './globals.css'

// const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dream Reader - AI Chat Interface',
  description: 'A modern multi-LLM chat interface with authentication'
}

export default async function RootLayout ({
  children
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale()

  let messages
  try {
    messages = (await import(`../../messages/${locale}.json`)).default
  } catch (error) {
    notFound()
  }

  return (
    <ClerkProvider>

      <ConversationsProvider>

        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>

      </ConversationsProvider>

    </ClerkProvider>
  )
}
