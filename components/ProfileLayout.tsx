'use client'

import { ReactNode, useState } from 'react'
import { Menu, X } from 'lucide-react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

interface ProfileLayoutProps {
  children: ReactNode
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-void-black">
      {/* Original Navbar */}
      <Navbar />
      
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-20 left-4 z-50 md:hidden bg-molten-gold/20 border border-molten-gold/30 rounded-lg p-2 text-molten-gold hover:bg-molten-gold/30 transition-colors"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div className={`fixed top-20 left-0 h-[calc(100vh-5rem)] w-64 z-40 transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Main Content */}
      <main className="md:ml-64 pt-20 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
