import { ConversationsProvider } from '@/context/conversations-context'
import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
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

  let messages
  try {
    messages = (await import(`../messages/${locale}.json`)).default
  } catch (error) {
    // notFound()
  }
  return (
    <html>
      <body className={`${inter.className} dark bg-primary text-neutral-100 font-sans leading-relaxed selection:bg-neutral-700/60`}>
        <ClerkProvider>
          <ConversationsProvider>
            {/* Provide appropriate locale and messages props here */}
            <NextIntlClientProvider locale={locale} messages={messages}>
              {children}
            </NextIntlClientProvider>
          </ConversationsProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
