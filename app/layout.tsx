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
          <body className={inter.className}>{children}</body>
        </ConversationsProvider>
      </html>
    </ClerkProvider>
  )
}
