'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Menu, X, User, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { logout } from '../store/slices/authSlice'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const dispatch = useAppDispatch()
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)

  const handleLogout = async () => {
    await dispatch(logout())
    setMenuOpen(false)
  }

  return (
    <header className="absolute top-0 left-0 right-0 border-b border-molten-gold/20 bg-black/50 backdrop-blur-sm z-[60]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition duration-300">
          <Flame className="w-7 h-7 text-molten-gold animate-pulse" />
          <h1 className="text-2xl md:text-3xl font-orbitron font-black tracking-wider text-molten-gold">
            PROMETHEUS
          </h1>
        </Link>
        
        <nav className="hidden md:flex gap-8 items-center">
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
          
          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              <Link 
                href="/profile" 
                className="flex items-center gap-2 text-molten-gold hover:text-neural-emerald transition-colors duration-300 cursor-pointer"
              >
                <User size={16} />
                <span className="text-sm font-orbitron tracking-wide">{user.username}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-red-400 text-red-400 text-sm tracking-widest hover:bg-red-400/10 transition duration-300 rounded-lg flex items-center gap-2"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          ) : (
            <Link href="/signup" className="px-6 py-2 bg-molten-gold text-void-black font-bold text-sm tracking-widest hover:brightness-110 transition duration-300 rounded-lg">
              Enter the Forge
            </Link>
          )}
        </nav>
        
        <button 
          onClick={() => setMenuOpen(!menuOpen)} 
          className="md:hidden text-molten-gold"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile Menu */}
      {menuOpen && (
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
                <Link 
                  href="/profile" 
                  className="flex items-center gap-2 text-molten-gold hover:text-neural-emerald transition-colors duration-300 cursor-pointer"
                  onClick={() => setMenuOpen(false)}
                >
                  <User size={16} />
                  <span className="text-sm font-orbitron tracking-wide">{user.username}</span>
                </Link>
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
