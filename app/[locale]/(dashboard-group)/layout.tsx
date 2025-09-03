'use client'
import DashboardWrapper from '@/components/dashboard-wrapper'
import React from 'react'

export default function RootLayout ({ children }: {children: React.ReactNode}) {
  return (
    <DashboardWrapper>
      {children}
    </DashboardWrapper>
  )
}
