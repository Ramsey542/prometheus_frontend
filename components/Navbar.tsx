'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Flame, Menu, X, User, LogOut } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { logout } from '../store/slices/authSlice'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [latency, setLatency] = useState(125)
  const dispatch = useAppDispatch()
  const pathname = usePathname()
  const { isAuthenticated, user, selectedCoin } = useAppSelector((state) => state.auth)
  const isAuthenticatedPage = isAuthenticated && (pathname === '/profile' || pathname === '/dashboard' || pathname === '/custom-buys')

  useEffect(() => {
    if (!isAuthenticatedPage) return

    const updateLatency = () => {
      const baseLatency = 100
      const variation = Math.random() * 60 + 20
      const occasionalSpike = Math.random() < 0.15 ? Math.random() * 100 : 0
      const newLatency = Math.round(baseLatency + variation + occasionalSpike)
      setLatency(newLatency)
    }

    updateLatency()
    const interval = setInterval(updateLatency, 2000 + Math.random() * 3000)
    return () => clearInterval(interval)
  }, [isAuthenticatedPage])

  const handleLogout = async () => {
    await dispatch(logout())
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 left-0 right-0 border-b border-molten-gold/20 bg-black/50 backdrop-blur-sm z-[60]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition duration-300">
          <Flame className="w-7 h-7 text-molten-gold animate-pulse" />
          <h1 className="text-2xl md:text-3xl font-orbitron font-black tracking-wider text-molten-gold">
            PROMETHEUS
          </h1>
        </Link>
        
        <nav className="hidden md:flex gap-8 items-center ml-auto">
          {!isAuthenticatedPage && (
            <>
              {['Telemetry', 'Wards', 'How it Works', 'Covenant', 'Guild'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-sm tracking-widest text-white hover:text-molten-gold transition duration-300"
                >
                  {item}
                </a>
              ))}
              <button className="px-4 py-2 border border-white text-white text-sm tracking-widest hover:bg-white/10 transition duration-300 rounded-lg">
                Temple
              </button>
            </>
          )}
          
          {isAuthenticated && user && (
            <div className="flex items-center gap-4">
              {isAuthenticatedPage && selectedCoin && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-molten-gold/10 border border-molten-gold/30 rounded-lg">
                  <Image
                    src={`/assets/${selectedCoin}.png`}
                    alt={selectedCoin.toUpperCase()}
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-orbitron font-semibold text-molten-gold">
                    {selectedCoin.toUpperCase()}
                  </span>
                </div>
              )}
              {isAuthenticatedPage && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg whitespace-nowrap">
                  <div className="relative">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75" />
                  </div>
                  <span className="text-xs font-orbitron font-semibold text-green-400">
                    All systems operational
                  </span>
                  <span className="text-xs text-green-400/80 font-space-grotesk">
                    {latency}ms
                  </span>
                </div>
              )}
              {isAuthenticatedPage && (
                <a
                  href="https://discord.gg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/20 transition duration-300"
                >
                  <Image
                    src="/assets/discord.png"
                    alt="Discord"
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
                  <span className="text-xs font-orbitron font-semibold text-indigo-400">
                    Discord
                  </span>
                </a>
              )}
              <div className="flex items-center gap-2 text-molten-gold">
                <User size={16} />
                <span className="text-sm font-orbitron tracking-wide">{user.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-red-400 text-red-400 text-sm tracking-widest hover:bg-red-400/10 transition duration-300 rounded-lg flex items-center gap-2"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}
          
          {!isAuthenticated && (
            <Link href="/signup" className="px-6 py-2 bg-molten-gold text-void-black font-bold text-sm tracking-widest hover:brightness-110 transition duration-300 rounded-lg">
              Enter the Forge
            </Link>
          )}
        </nav>
        
        {!isAuthenticatedPage && (
          <button 
            onClick={() => setMenuOpen(!menuOpen)} 
            className="md:hidden text-molten-gold"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}
      </div>
      
      {!isAuthenticatedPage && menuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t border-molten-gold/20 bg-black/80 backdrop-blur-sm"
        >
          <div className="px-6 py-4 space-y-4">
            {['Telemetry', 'Wards', 'How it Works', 'Covenant', 'Guild'].map((item) => (
              <a
                key={item}
                href="#"
                className="block text-sm tracking-widest text-white hover:text-molten-gold transition duration-300 py-2"
              >
                {item}
              </a>
            ))}
            <button className="w-full text-left px-0 py-2 border-b border-white/20 text-white text-sm tracking-widest hover:text-molten-gold transition duration-300">
              Temple
            </button>
            
            {isAuthenticated && user ? (
              <div className="pt-4 border-t border-molten-gold/20 space-y-3">
                <div className="flex items-center gap-2 text-molten-gold">
                  <User size={16} />
                  <span className="text-sm font-orbitron tracking-wide">{user.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-0 py-2 text-red-400 text-sm tracking-widest hover:text-red-300 transition duration-300 flex items-center gap-2"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            ) : (
              <Link 
                href="/signup" 
                className="block w-full text-center px-6 py-3 bg-molten-gold text-void-black font-bold text-sm tracking-widest hover:brightness-110 transition duration-300 rounded-lg mt-4"
                onClick={() => setMenuOpen(false)}
              >
                Enter the Forge
              </Link>
            )}
          </div>
        </motion.div>
      )}
    </header>
  )
}
