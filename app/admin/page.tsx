'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '../../store/hooks'
import { config } from '../../lib/config'
import { LayoutDashboard, FileText, ChevronRight, Search, ArrowUpDown, Users } from 'lucide-react'
import Navbar from '../../components/Navbar'
import AdminOverview from '../../components/AdminOverview'
import AdminLogs from '../../components/AdminLogs'
import AdminLeadWallets from '../../components/AdminLeadWallets'

export default function AdminDashboard() {
  const router = useRouter()
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  const [activeSection, setActiveSection] = useState<'overview' | 'logs' | 'lead_wallets'>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login')
      return
    }

    if (!config.adminUsernames.includes(user.username)) {
      router.push('/')
      return
    }
  }, [user, isAuthenticated, router])

  if (!isAuthenticated || !user || !config.adminUsernames.includes(user.username)) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <div className="text-molten-gold">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-void-black">
      <Navbar />
      
      <div className="flex">
        {/* Sidebar */}
        <div className={`fixed top-20 left-0 h-[calc(100vh-5rem)] w-64 bg-void-black/90 border-r border-molten-gold/20 z-30 transition-transform duration-300 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
          <div className="p-6">
            <h2 className="text-xl font-orbitron font-bold text-molten-gold mb-6">Admin Dashboard</h2>
            <nav className="space-y-2">
              <button
                onClick={() => {
                  setActiveSection('overview')
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-300 ${
                  activeSection === 'overview'
                    ? 'bg-molten-gold/20 border border-molten-gold/50 text-molten-gold'
                    : 'bg-void-black/50 border border-molten-gold/10 text-white/60 hover:bg-molten-gold/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard size={18} />
                  <span className="font-orbitron font-semibold">Overview</span>
                </div>
                {activeSection === 'overview' && <ChevronRight size={16} />}
              </button>
              
              <button
                onClick={() => {
                  setActiveSection('logs')
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-300 ${
                  activeSection === 'logs'
                    ? 'bg-molten-gold/20 border border-molten-gold/50 text-molten-gold'
                    : 'bg-void-black/50 border border-molten-gold/10 text-white/60 hover:bg-molten-gold/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} />
                  <span className="font-orbitron font-semibold">Logs</span>
                </div>
                {activeSection === 'logs' && <ChevronRight size={16} />}
              </button>

              <button
                onClick={() => {
                  setActiveSection('lead_wallets')
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-300 ${
                  activeSection === 'lead_wallets'
                    ? 'bg-molten-gold/20 border border-molten-gold/50 text-molten-gold'
                    : 'bg-void-black/50 border border-molten-gold/10 text-white/60 hover:bg-molten-gold/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users size={18} />
                  <span className="font-orbitron font-semibold">Lead Wallets</span>
                </div>
                {activeSection === 'lead_wallets' && <ChevronRight size={16} />}
              </button>
            </nav>
          </div>
        </div>

        {/* Sidebar Overlay for Mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 md:ml-64 pt-20 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
            {/* Mobile Sidebar Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden fixed top-24 left-4 z-40 bg-molten-gold/20 border border-molten-gold/30 rounded-lg p-2 text-molten-gold hover:bg-molten-gold/30 transition-colors"
            >
              <LayoutDashboard size={24} />
            </button>

            {activeSection === 'overview' && <AdminOverview />}
            {activeSection === 'logs' && <AdminLogs />}
            {activeSection === 'lead_wallets' && <AdminLeadWallets />}
          </div>
        </main>
      </div>
    </div>
  )
}

