import { ConversationsProvider } from '@/context/conversations-context'
import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { Inter } from 'next/font/google'
import { notFound } from 'next/navigation'
import React from 'react'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dream Reader - AI Chat Interface',
  description: 'A modern multi-LLM chat interface with authentication'
}

export default async function RootLayout ({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  let messages
  try {
    messages = (await import(`../messages/${locale}.json`)).default
  } catch (error) {
    notFound()
  }

  return (
    <ClerkProvider>
      <html lang={locale} className="dark">
        <ConversationsProvider>
          <body className={`${inter.className} bg-neutral-900 text-neutral-100 font-sans leading-relaxed selection:bg-neutral-700/60`}>
            <NextIntlClientProvider locale={locale} messages={messages}>
              {children}
            </NextIntlClientProvider>
          </body>
        </ConversationsProvider>
      </html>
    </ClerkProvider>
  )
}
