'use client'
// import type { Metadata } from 'next'
// import { Inter } from 'next/font/google'
import { ConversationsProvider } from '@/context/conversations-context'
import { useParams } from 'next/navigation'
import React from 'react'
import DashboardContent from './dashboard-content'
// import './globals.css'

// const inter = Inter({ subsets: ['latin'] })

// export const metadata: Metadata = {
//   title: 'Dream Reader - AI Chat Interface',
//   description: 'A modern multi-LLM chat interface with authentication'
// }

export default function RootLayout ({ children }: {children: React.ReactNode}) {
  const params = useParams()
  const { locale } = params

  return (
    <ConversationsProvider>
      <DashboardContent locale={locale?.toString()}>
        {children}
      </DashboardContent>
    </ConversationsProvider>
  )
}
