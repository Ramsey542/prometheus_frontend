'use client'

import { ReactNode } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

interface ProfileLayoutProps {
  children: ReactNode
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <div className="min-h-screen bg-void-black">
      {/* Original Navbar */}
      <Navbar />
      
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <main className="ml-64 pt-20 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
