'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { usePathname, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { 
  Wallet, 
  Zap, 
  BarChart3, 
  List, 
  TrendingUp, 
  LineChart,
  Bookmark, 
  Compass, 
  Filter,
  Network,
  Settings,
  User,
  MessageCircle,
  ChevronDown,
  Coins,
  Banknote
} from 'lucide-react'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { setCoin, updateProfileForCoin } from '../store/slices/authSlice'
import Link from 'next/link'

interface NavigationItem {
  id: string
  label: string
  icon: React.ComponentType<any>
  isActive?: boolean
  badge?: string
}

interface NavigationSection {
  title: string
  items: NavigationItem[]
}

const navigationSections: NavigationSection[] = [
  {
    title: 'Trade',
    items: [
      { id: 'account-overview', label: 'Account Overview', icon: Wallet },
      { id: 'wallet-tracker', label: 'Wallet Tracker', icon: Zap },
      { id: 'tracker-logs', label: 'Tracker Logs', icon: MessageCircle },
      { id: 'controls', label: 'Controls', icon: BarChart3, isActive: true },
      { id: 'custom-buys', label: 'Custom Swaps', icon: Banknote, isActive: true },
    ]
  },

]

interface SidebarProps {
  onNavigate?: () => void
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const [activeItem, setActiveItem] = useState('account-overview')
  const dispatch = useAppDispatch()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isAuthenticated, user, selectedCoin } = useAppSelector((state) => state.auth)

  useEffect(() => {
    if (pathname === '/profile') {
      const section = searchParams.get('section')
      if (section === 'wallet-tracker') {
        setActiveItem('wallet-tracker')
      } else if (section === 'tracker-logs') {
        setActiveItem('tracker-logs')
      } else if (section === 'custom-buys') {
        setActiveItem('custom-buys')
      } else {
        setActiveItem('account-overview')
      }
    } else if (pathname === '/dashboard') {
      setActiveItem('controls')
    } else if (pathname === '/custom-buys') {
      setActiveItem('custom-buys')
    } else {
      setActiveItem('account-overview')
    }
  }, [pathname, searchParams])

  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId)
  }

  const handleCoinToggle = (coin: 'sol' | 'bnb') => {
    if (coin !== selectedCoin) {
      dispatch(setCoin(coin))
      dispatch(updateProfileForCoin(coin))
    }
  }

  return (
    <div className="w-full h-full bg-gradient-to-b from-void-black/95 to-black/90 backdrop-blur-md border-r border-molten-gold/30 overflow-y-auto">
      {/* Logo Section */}
      <div className="p-6 border-b border-molten-gold/30 bg-gradient-to-r from-molten-gold/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-molten-gold to-yellow-600 rounded-full flex items-center justify-center">
            <div className="w-6 h-6 bg-void-black rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-molten-gold rounded-full"></div>
            </div>
          </div>
          <h1 className="text-xl font-orbitron font-bold text-white tracking-wider">
            PROMETHEUS BOT
          </h1>
        </div>
      </div>

      {/* Current Section Indicator */}
      <div className="px-6 py-3 border-b border-molten-gold/20 bg-gradient-to-r from-molten-gold/3 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-molten-gold rounded-full animate-pulse"></div>
          <span className="text-xs font-orbitron font-semibold text-molten-gold tracking-widest uppercase">
            Overview
          </span>
        </div>
      </div>

      {/* Coin Toggle */}
      <div className="px-6 py-4 border-b border-molten-gold/20 bg-gradient-to-r from-molten-gold/3 to-transparent">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-orbitron font-semibold text-molten-gold/80 tracking-widest uppercase">
            Network
          </span>
          <Coins size={14} className="text-molten-gold/60" />
        </div>
        <div className="flex bg-gradient-to-r from-void-black/80 to-black/60 backdrop-blur-sm border border-molten-gold/20 rounded-lg p-1">
          <motion.button
            onClick={() => handleCoinToggle('sol')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-orbitron font-semibold transition-all duration-300 ${
              selectedCoin === 'sol'
                ? 'bg-gradient-to-r from-molten-gold to-yellow-500 text-void-black shadow-lg shadow-molten-gold/30'
                : 'text-white/60 hover:text-molten-gold hover:bg-gradient-to-r hover:from-molten-gold/10 hover:to-yellow-500/10'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Image src="/assets/sol.png" alt="SOL" width={16} height={16} className="w-4 h-4" />
            SOL
          </motion.button>
          <motion.button
            onClick={() => handleCoinToggle('bnb')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-orbitron font-semibold transition-all duration-300 ${
              selectedCoin === 'bnb'
                ? 'bg-gradient-to-r from-molten-gold to-yellow-500 text-void-black shadow-lg shadow-molten-gold/30'
                : 'text-white/60 hover:text-molten-gold hover:bg-gradient-to-r hover:from-molten-gold/10 hover:to-yellow-500/10'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Image src="/assets/bnb.png" alt="BNB" width={16} height={16} className="w-4 h-4" />
            BNB
          </motion.button>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-6">
        {navigationSections.map((section, sectionIndex) => (
          <div key={section.title} className="mb-8">
            <h3 className="px-6 text-xs font-orbitron font-semibold text-molten-gold/80 tracking-widest uppercase mb-3">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = activeItem === item.id
                
                const getRoute = (itemId: string) => {
                  switch (itemId) {
                    case 'account-overview':
                      return '/profile'
                    case 'wallet-tracker':
                      return '/profile?section=wallet-tracker'
                    case 'tracker-logs':
                      return '/profile?section=tracker-logs'
                    case 'controls':
                      return '/dashboard'
                    case 'custom-buys':
                      return '/custom-buys'
                    default:
                      return '#'
                  }
                }

                const route = getRoute(item.id)

                return (
                  <Link key={item.id} href={route} onClick={() => onNavigate?.()}>
                    <motion.div
                      onClick={() => {
                        handleItemClick(item.id)
                        onNavigate?.()
                      }}
                      className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-all duration-300 group relative cursor-pointer ${
                        isActive 
                          ? 'bg-gradient-to-r from-molten-gold/20 to-yellow-500/10 text-molten-gold border-r-2 border-molten-gold backdrop-blur-sm' 
                          : 'text-white/80 hover:text-molten-gold hover:bg-gradient-to-r hover:from-molten-gold/10 hover:to-yellow-500/5'
                      }`}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                    {isActive && (
                      <motion.div
                        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-molten-gold to-yellow-500 shadow-lg shadow-molten-gold/50"
                        layoutId="activeIndicator"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    <Icon 
                      size={18} 
                      className={`transition-colors duration-300 ${
                        isActive ? 'text-molten-gold' : 'text-white/60 group-hover:text-molten-gold'
                      }`} 
                    />
                    <span className="text-sm font-space-grotesk font-medium tracking-wide">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="ml-auto px-2 py-1 text-xs font-orbitron font-semibold bg-orange-500 text-black rounded-full">
                        {item.badge}
                      </span>
                    )}
                    </motion.div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Profile Section */}
      <div className="p-6 border-t border-molten-gold/20">
        {isAuthenticated && user ? (
          <Link href="/profile" onClick={() => onNavigate?.()}>
            <motion.div
              className="w-full flex items-center gap-3 p-3 bg-molten-gold/10 border border-molten-gold/20 rounded-lg hover:bg-molten-gold/20 transition-all duration-300 group cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-molten-gold to-yellow-600 rounded-full flex items-center justify-center">
                <User size={16} className="text-void-black" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-orbitron font-semibold text-molten-gold">
                  {user.username}
                </p>
                <p className="text-xs text-white/60 font-space-grotesk">
                  Trading Master
                </p>
              </div>
              <ChevronDown 
                size={16} 
                className="text-molten-gold/60 transition-transform duration-300 group-hover:rotate-180" 
              />
            </motion.div>
          </Link>
        ) : (
          <div className="flex gap-3 justify-center">
            <motion.button
              className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-400 transition-colors duration-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <User size={18} className="text-white" />
            </motion.button>
            <motion.button
              className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-500 transition-colors duration-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <MessageCircle size={18} className="text-white" />
            </motion.button>
          </div>
        )}
      </div>
    </div>
  )
}
