// import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
// import { notFound } from 'next/navigation'
import React from 'react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dream Reader - AI Chat Interface',
  description: 'A modern multi-LLM chat interface with authentication'
}

export default async function RootLayout ({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body className={`${inter.className} dark bg-primary text-neutral-100 font-sans leading-relaxed selection:bg-neutral-700/60`}>
        {children}
      </body>
    </html>
  )
}
