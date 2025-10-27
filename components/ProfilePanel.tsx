'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Mail, 
  Wallet, 
  Settings, 
  LogOut, 
  Copy, 
  Eye, 
  EyeOff,
  Shield,
  Activity,
  TrendingUp
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { logout } from '../store/slices/authSlice'
import { useState } from 'react'

interface ProfilePanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProfilePanel({ isOpen, onClose }: ProfilePanelProps) {
  const dispatch = useAppDispatch()
  const { user, wallet } = useAppSelector((state) => state.auth)
  const [showPrivateKey, setShowPrivateKey] = useState(false)

  const handleLogout = async () => {
    await dispatch(logout())
    onClose()
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Profile Panel */}
          <motion.div
            initial={{ opacity: 0, x: -300, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -300, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-64 top-16 w-80 h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-800/95 to-gray-900/95 backdrop-blur-sm border-r border-molten-gold/20 z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="p-6 border-b border-molten-gold/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-orbitron font-bold text-molten-gold">
                  Profile
                </h2>
                <button
                  onClick={onClose}
                  className="text-white/60 hover:text-molten-gold transition-colors duration-300"
                >
                  ×
                </button>
              </div>
            </div>

            {/* User Info */}
            <div className="p-6 space-y-6">
              {/* Avatar & Basic Info */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-molten-gold to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User size={32} className="text-void-black" />
                </div>
                <h3 className="text-xl font-orbitron font-bold text-white mb-1">
                  {user?.username}
                </h3>
                <p className="text-molten-gold/80 font-space-grotesk">
                  Trading Master
                </p>
              </div>

              {/* User Details */}
              <div className="space-y-4">
                <div className="bg-void-black/50 border border-molten-gold/10 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Mail size={16} className="text-molten-gold" />
                    <span className="text-sm font-orbitron font-medium text-molten-gold/80 tracking-wider uppercase">
                      Email
                    </span>
                  </div>
                  <p className="text-white font-space-grotesk">{user?.email}</p>
                </div>

                {/* Wallet Info */}
                {wallet && (
                  <div className="bg-void-black/50 border border-molten-gold/10 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Wallet size={16} className="text-molten-gold" />
                      <span className="text-sm font-orbitron font-medium text-molten-gold/80 tracking-wider uppercase">
                        Wallet Address
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-space-grotesk flex-1">
                        {formatWalletAddress(wallet.solana_public_key)}
                      </p>
                      <button
                        onClick={() => copyToClipboard(wallet.solana_public_key)}
                        className="text-molten-gold/60 hover:text-molten-gold transition-colors duration-300"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                    
                    {/* Private Key (Hidden by default) */}
                    <div className="mt-3 pt-3 border-t border-molten-gold/10">
                      <div className="flex items-center gap-3 mb-2">
                        <Shield size={16} className="text-molten-gold" />
                        <span className="text-sm font-orbitron font-medium text-molten-gold/80 tracking-wider uppercase">
                          Private Key
                        </span>
                        <button
                          onClick={() => setShowPrivateKey(!showPrivateKey)}
                          className="text-molten-gold/60 hover:text-molten-gold transition-colors duration-300"
                        >
                          {showPrivateKey ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-space-grotesk flex-1">
                          {showPrivateKey 
                            ? formatWalletAddress(wallet.solana_private_key)
                            : '••••••••••••••••'
                          }
                        </p>
                        {showPrivateKey && (
                          <button
                            onClick={() => copyToClipboard(wallet.solana_private_key)}
                            className="text-molten-gold/60 hover:text-molten-gold transition-colors duration-300"
                          >
                            <Copy size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Balance */}
                {wallet && (
                  <div className="bg-void-black/50 border border-molten-gold/10 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <TrendingUp size={16} className="text-molten-gold" />
                      <span className="text-sm font-orbitron font-medium text-molten-gold/80 tracking-wider uppercase">
                        SOL Balance
                      </span>
                    </div>
                    <p className="text-2xl font-orbitron font-bold text-molten-gold">
                      {parseFloat(wallet.solana_balance).toFixed(4)} SOL
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-void-black/50 border border-molten-gold/10 rounded-lg p-4 text-center">
                  <Activity size={20} className="text-molten-gold mx-auto mb-2" />
                  <p className="text-xs font-orbitron font-medium text-molten-gold/80 tracking-wider uppercase mb-1">
                    Active Trades
                  </p>
                  <p className="text-lg font-orbitron font-bold text-white">12</p>
                </div>
                <div className="bg-void-black/50 border border-molten-gold/10 rounded-lg p-4 text-center">
                  <TrendingUp size={20} className="text-molten-gold mx-auto mb-2" />
                  <p className="text-xs font-orbitron font-medium text-molten-gold/80 tracking-wider uppercase mb-1">
                    Win Rate
                  </p>
                  <p className="text-lg font-orbitron font-bold text-green-400">73.2%</p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4 border-t border-molten-gold/20">
                <button className="w-full flex items-center gap-3 px-4 py-3 bg-molten-gold/10 border border-molten-gold/20 text-molten-gold rounded-lg hover:bg-molten-gold/20 transition-colors duration-300">
                  <Settings size={18} />
                  <span className="font-space-grotesk font-medium">Account Settings</span>
                </button>
                
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors duration-300"
                >
                  <LogOut size={18} />
                  <span className="font-space-grotesk font-medium">Logout</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
