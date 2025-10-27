'use client'

import { ReactNode, Suspense } from 'react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-void-black">
      {/* Sidebar */}
      <Suspense fallback={<div className="w-64 h-screen bg-void-black/50" />}>
        <Sidebar />
      </Suspense>
      <Navbar />
      
      {/* Main Content */}
      <main className="ml-64 pt-36 min-h-screen">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
