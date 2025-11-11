'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { walletTrackerApi } from '../services/walletTrackerApi'
import { AlertCircle, Trophy, TrendingUp, TrendingDown, Wallet, Users, Activity } from 'lucide-react'

type LeadWallet = {
  wallet_address: string
  followers: number
  win_rate: number
  total_pnl: number
  tracking_status: 'active' | 'inactive'
}

export default function AdminLeadWallets() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [leadWallets, setLeadWallets] = useState<LeadWallet[]>([])
  const [sortKey, setSortKey] = useState<keyof LeadWallet>('followers')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchLeadWallets()
  }, [])

  const fetchLeadWallets = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await walletTrackerApi.getAdminLeadWallets()
      console.log(data)
      setLeadWallets(data.lead_wallets || [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch lead wallets')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const result = q
      ? leadWallets.filter(w => w.wallet_address.toLowerCase().includes(q))
      : leadWallets.slice()
    result.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
    return result
  }, [leadWallets, search, sortKey, sortDir])

  const headerCell = (label: string, key: keyof LeadWallet) => (
    <button
      onClick={() => {
        if (sortKey === key) {
          setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))
        } else {
          setSortKey(key)
          setSortDir('desc')
        }
      }}
      className="flex items-center gap-2 text-left text-white/80 hover:text-white transition-colors"
    >
      <span className="font-orbitron text-xs md:text-sm">{label}</span>
      <span className="text-molten-gold/60 text-xs">{sortKey === key ? (sortDir === 'asc' ? '▲' : '▼') : ''}</span>
    </button>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-molten-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 font-space-grotesk">Loading lead wallets...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle size={20} />
          <span className="font-orbitron font-bold">{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-orbitron font-bold text-molten-gold">Lead Wallets</h1>
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search wallet..."
            className="bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-sm text-white/90 outline-none focus:border-molten-gold/40"
          />
          <button
            onClick={fetchLeadWallets}
            className="px-3 py-2 bg-molten-gold/20 border border-molten-gold/40 rounded-lg text-molten-gold hover:bg-molten-gold/30 transition-colors text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-molten-gold/20 rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-molten-gold/20">
          <div className="col-span-4 md:col-span-4">{headerCell('Wallet Address', 'wallet_address')}</div>
          <div className="col-span-2 md:col-span-2">{headerCell('Followers', 'followers')}</div>
          <div className="col-span-2 md:col-span-2">{headerCell('Win Rate', 'win_rate')}</div>
          <div className="col-span-2 md:col-span-2">{headerCell('Total PnL', 'total_pnl')}</div>
          <div className="col-span-2 md:col-span-2">{headerCell('Status', 'tracking_status')}</div>
        </div>

        <div className="divide-y divide-molten-gold/10">
          {filtered.map((w, idx) => {
            const pnlPositive = w.total_pnl >= 0
            const StatusIcon = w.tracking_status === 'active' ? Activity : Activity
            const statusColor =
              w.tracking_status === 'active'
                ? 'text-green-400 bg-green-500/10 border-green-500/20'
                : 'text-red-400 bg-red-500/10 border-red-500/20'

            return (
              <motion.div
                key={w.wallet_address + idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-12 gap-2 px-4 py-3"
              >
                <div className="col-span-4 md:col-span-4 flex items-center gap-2">
                  <Wallet size={16} className="text-molten-gold/70" />
                  <span className="text-white/90 font-mono text-xs md:text-sm break-all">{w.wallet_address}</span>
                </div>
                <div className="col-span-2 md:col-span-2 flex items-center gap-2">
                  <Users size={16} className="text-molten-gold/70" />
                  <span className="text-white/90 font-orbitron text-sm">{w.followers}</span>
                </div>
                <div className="col-span-2 md:col-span-2 flex items-center gap-2">
                  <Trophy size={16} className="text-yellow-400" />
                  <span className="text-white/90 font-orbitron text-sm">{(w.win_rate * 100).toFixed(1)}%</span>
                </div>
                <div className="col-span-2 md:col-span-2 flex items-center gap-2">
                  {pnlPositive ? (
                    <TrendingUp size={16} className="text-green-400" />
                  ) : (
                    <TrendingDown size={16} className="text-red-400" />
                  )}
                  <span className={`font-orbitron text-sm ${pnlPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {pnlPositive ? '+' : ''}{w.total_pnl.toFixed(2)}
                  </span>
                </div>
                <div className="col-span-2 md:col-span-2">
                  <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-md border text-xs font-orbitron ${statusColor}`}>
                    <StatusIcon size={14} />
                    {w.tracking_status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </motion.div>
            )
          })}

          {filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-white/50">No lead wallets found</div>
          )}
        </div>
      </div>
    </div>
  )
}

