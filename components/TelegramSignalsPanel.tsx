'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, AlertTriangle, CheckCircle, Clock, Power, RadioTower, RefreshCw, Settings, ShieldCheck, Signal, XCircle } from 'lucide-react'
import { walletTrackerApi } from '../services/walletTrackerApi'
import { useRouter } from 'next/navigation'

interface TelegramDashboard {
  subscription: {
    is_active: boolean
    created_at: string | null
    updated_at: string | null
  }
  service: {
    configured: boolean
    running: boolean
    ready: boolean
    last_error: string | null
    started_at: string | null
    channel: string
    session_name: string
  }
  stats: {
    messages_received: number
    swaps_detected: number
    buy_attempts: number
    successful_buys: number
    failed_buys: number
    skipped_buys: number
    pending_buys: number
    last_message_at: string | null
    last_trade_at: string | null
  }
}

const formatDate = (value: string | null) => {
  if (!value) return 'Never'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

const statTone: Record<string, string> = {
  sky: 'border-sky-400/30 bg-sky-500/10 text-sky-200',
  emerald: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  amber: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
  red: 'border-red-400/30 bg-red-500/10 text-red-200',
  zinc: 'border-white/10 bg-white/5 text-white/80'
}

export default function TelegramSignalsPanel() {
  const router = useRouter()
  const [dashboard, setDashboard] = useState<TelegramDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async (quiet = false) => {
    try {
      if (quiet) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      const data = await walletTrackerApi.getTelegramChannelDashboard()
      setDashboard(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load Telegram signals')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const handleToggle = async () => {
    if (!dashboard) return
    try {
      setSaving(true)
      setError(null)
      const data = await walletTrackerApi.updateTelegramChannelSubscription(!dashboard.subscription.is_active)
      setDashboard(data)
    } catch (err: any) {
      setError(err.message || 'Failed to update Telegram tracking')
    } finally {
      setSaving(false)
    }
  }

  const stats = useMemo(() => {
    const current = dashboard?.stats
    return [
      { label: 'Messages', value: current?.messages_received ?? 0, icon: Signal, tone: 'sky' },
      { label: 'Detected Swaps', value: current?.swaps_detected ?? 0, icon: Activity, tone: 'emerald' },
      { label: 'Buy Attempts', value: current?.buy_attempts ?? 0, icon: RadioTower, tone: 'amber' },
      { label: 'Successful Buys', value: current?.successful_buys ?? 0, icon: CheckCircle, tone: 'emerald' },
      { label: 'Failed Buys', value: current?.failed_buys ?? 0, icon: XCircle, tone: 'red' },
      { label: 'Skipped', value: current?.skipped_buys ?? 0, icon: ShieldCheck, tone: 'zinc' }
    ]
  }, [dashboard])

  const isActive = Boolean(dashboard?.subscription.is_active)
  const isReady = Boolean(dashboard?.service.ready)
  const isConfigured = Boolean(dashboard?.service.configured)
  const hasDashboard = Boolean(dashboard)

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-40 rounded-lg border border-molten-gold/20 bg-molten-gold/5 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-28 rounded-lg border border-molten-gold/10 bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="relative overflow-hidden rounded-lg border border-molten-gold/25 bg-gradient-to-r from-void-black/95 via-black/90 to-sky-950/30 p-6 shadow-2xl shadow-molten-gold/10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-sky-500/10 border border-sky-400/30 flex items-center justify-center">
              <RadioTower size={24} className="text-sky-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-orbitron font-bold text-molten-gold">
                  Telegram Signals
                </h1>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-orbitron font-semibold tracking-wide border ${isActive ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/30' : 'bg-white/5 text-white/50 border-white/10'}`}>
                  {isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-orbitron font-semibold tracking-wide border ${isReady ? 'bg-sky-500/10 text-sky-300 border-sky-400/30' : 'bg-amber-500/10 text-amber-300 border-amber-400/30'}`}>
                  {isReady ? 'LISTENING' : 'IDLE'}
                </span>
              </div>
              <p className="text-sm text-white/60 font-space-grotesk break-all">
                {dashboard?.service.channel || 'No channel configured'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button
              onClick={() => router.push('/dashboard?module=telegram')}
              className="px-4 py-3 rounded-lg border border-sky-400/25 bg-sky-500/10 text-sky-200 font-orbitron font-bold text-xs tracking-wide flex items-center justify-center gap-2 hover:bg-sky-500/20 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Settings size={16} />
              Settings
            </motion.button>
            <motion.button
              onClick={() => loadDashboard(true)}
              disabled={refreshing || saving}
              className="px-4 py-3 rounded-lg border border-molten-gold/25 bg-molten-gold/10 text-molten-gold font-orbitron font-bold text-xs tracking-wide flex items-center justify-center gap-2 hover:bg-molten-gold/20 disabled:opacity-50 transition-colors"
              whileHover={{ scale: refreshing || saving ? 1 : 1.02 }}
              whileTap={{ scale: refreshing || saving ? 1 : 0.98 }}
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </motion.button>
            <motion.button
              onClick={handleToggle}
              disabled={saving || !isConfigured}
              className={`px-5 py-3 rounded-lg font-orbitron font-bold text-xs tracking-wide flex items-center justify-center gap-2 disabled:opacity-50 transition-colors ${isActive ? 'border border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/20' : 'border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'}`}
              whileHover={{ scale: saving ? 1 : 1.02 }}
              whileTap={{ scale: saving ? 1 : 0.98 }}
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Power size={16} />}
              {isActive ? 'Deactivate' : 'Activate'}
            </motion.button>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 flex items-start gap-2"
          >
            <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
            <span className="text-sm font-space-grotesk">{error}</span>
          </motion.div>
        )}

        {hasDashboard && !isConfigured && (
          <div className="mt-5 p-3 rounded-lg border border-amber-400/30 bg-amber-500/10 text-amber-200 flex items-start gap-2">
            <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
            <span className="text-sm font-space-grotesk">Telegram environment variables are not configured.</span>
          </div>
        )}

        {dashboard?.service.last_error && (
          <div className="mt-5 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 flex items-start gap-2">
            <XCircle size={18} className="mt-0.5 flex-shrink-0" />
            <span className="text-sm font-space-grotesk break-all">{dashboard.service.last_error}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={`rounded-lg border p-4 ${statTone[stat.tone]}`}
            >
              <div className="flex items-center justify-between mb-4">
                <Icon size={18} />
                <span className="text-[10px] font-orbitron tracking-wide uppercase opacity-70">{stat.label}</span>
              </div>
              <div className="text-3xl font-orbitron font-bold text-white">
                {stat.value.toLocaleString()}
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="rounded-lg border border-molten-gold/20 bg-gradient-to-r from-void-black/90 to-black/80 p-5">
          <div className="flex items-center gap-3 mb-5">
            <Activity size={20} className="text-molten-gold" />
            <h2 className="text-lg font-orbitron font-bold text-molten-gold">Signal Flow</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              ['Received', dashboard?.stats.messages_received ?? 0],
              ['Extracted', dashboard?.stats.swaps_detected ?? 0],
              ['Attempted', dashboard?.stats.buy_attempts ?? 0],
              ['Pending', dashboard?.stats.pending_buys ?? 0]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs font-orbitron tracking-wide text-white/45 uppercase mb-2">{label}</div>
                <div className="text-2xl font-orbitron font-bold text-white">{Number(value).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-molten-gold/20 bg-gradient-to-r from-void-black/90 to-black/80 p-5">
          <div className="flex items-center gap-3 mb-5">
            <Clock size={20} className="text-molten-gold" />
            <h2 className="text-lg font-orbitron font-bold text-molten-gold">Runtime</h2>
          </div>
          <div className="divide-y divide-molten-gold/10">
            {[
              ['Started', formatDate(dashboard?.service.started_at ?? null)],
              ['Last Message', formatDate(dashboard?.stats.last_message_at ?? null)],
              ['Last Trade', formatDate(dashboard?.stats.last_trade_at ?? null)],
              ['Session', dashboard?.service.session_name || 'Unset']
            ].map(([label, value]) => (
              <div key={label} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <span className="text-xs font-orbitron tracking-wide text-white/45 uppercase">{label}</span>
                <span className="text-sm font-space-grotesk text-white/80 text-right break-all">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
