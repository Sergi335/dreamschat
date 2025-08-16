import { ConversationsProvider } from '@/context/conversations-context'
import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dream Reader - AI Chat Interface',
  description: 'A modern multi-LLM chat interface with authentication'
}

export default function RootLayout ({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <ConversationsProvider>
          <body className={`${inter.className} bg-neutral-900 text-neutral-100 font-sans leading-relaxed selection:bg-neutral-700/60`}>{children}</body>
        </ConversationsProvider>
      </html>
    </ClerkProvider>
  )
}
