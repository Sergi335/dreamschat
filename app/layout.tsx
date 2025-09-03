import { ConversationsProvider } from '@/context/conversations-context'
// import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { Inter } from 'next/font/google'
// import { notFound } from 'next/navigation'
import React from 'react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dream Reader - AI Chat Interface',
  description: 'A modern multi-LLM chat interface with authentication'
}

export default async function RootLayout ({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  // Providing all messages to the client side is the easiest way to get started
  const messages = await getMessages()

  return (
    <html>
      <body className={`${inter.className} dark bg-primary text-neutral-100 font-sans leading-relaxed selection:bg-neutral-700/60`}>
        {/* <ClerkProvider> */}
          {/* <ConversationsProvider> */}
            <NextIntlClientProvider locale={locale} messages={messages}>
              {children}
            </NextIntlClientProvider>
          {/* </ConversationsProvider> */}
        {/* </ClerkProvider> */}
      </body>
    </html>
  )
}
