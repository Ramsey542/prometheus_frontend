'use client'

import { ReactNode, Suspense, useState } from 'react'
import { Menu, X } from 'lucide-react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-void-black">
      {/* Sidebar */}
      <Suspense fallback={<div className="w-64 h-screen bg-void-black/50" />}>
        <div className={`fixed top-20 left-0 h-[calc(100vh-5rem)] w-64 z-40 transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <Sidebar onNavigate={() => setSidebarOpen(false)} />
        </div>
      </Suspense>
      
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-20 left-4 z-50 md:hidden bg-molten-gold/20 border border-molten-gold/30 rounded-lg p-2 text-molten-gold hover:bg-molten-gold/30 transition-colors"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <Navbar />
      
      {/* Main Content */}
      <main className="md:ml-64 pt-36 min-h-screen">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
