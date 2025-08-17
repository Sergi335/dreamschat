import { Inter } from 'next/font/google'
import React from 'react'

const inter = Inter({ subsets: ['latin'] })
export default function RootLayout ({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body className={`${inter.className} dark bg-neutral-900 text-neutral-100 font-sans leading-relaxed selection:bg-neutral-700/60`}>
        {children}
      </body>
    </html>
  )
}
