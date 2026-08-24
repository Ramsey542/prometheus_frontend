'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Plus, Trash2, Copy, Shield, Info, Check, Wallet } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import { config } from '../../lib/config'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store/index'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createWallet, selectWallet, getProfile } from '../../store/slices/authSlice'
import { AppDispatch } from '../../store/index'
import CreateWalletModal from '../../components/CreateWalletModal'

interface TakeProfitLevel {
  profit_percentage: number
  sell_percentage: number
}

interface StopLossLevel {
  loss_percentage: number
  sell_percentage: number
}

interface WalletSettings {
  swap_strategy: string
  dip_ladder_drop_percentage: number
  dip_ladder_profit_percentage: number
  buy_the_dip: boolean
  buy_dip_percentage: number
  max_dip_percentage: number
  buy_dip_timeout: number
  dip_recovery: boolean
  dip_recovery_percentage: number
  dip_recovery_timeout: number
  one_btd_at_a_time: boolean
  slippage: number | ''
  time_filter_enabled: boolean
  time_filter_seconds: number | null
  max_buys_per_mirror_per_hour?: number
  max_buys_per_mirror_per_day?: number
  max_buys_per_token_per_day?: number
  take_profit_levels?: TakeProfitLevel[]
  stop_loss_levels?: StopLossLevel[]
  time_limit_sells_enabled: boolean
  time_limit_profit_pct: number | null
  time_limit_seconds: number | null
  trailing_take_profit_enabled: boolean
  trailing_take_profit_activation_pct: number | null
  trailing_take_profit_distance_pct: number | null
  trailing_take_profit_sell_pct: number | null
  trailing_stop_loss_enabled: boolean
  trailing_stop_loss_activation_pct: number | null
  trailing_stop_loss_distance_pct: number | null
  trailing_stop_loss_sell_pct: number | null
  trailing_stop_percentage?: number
  trailing_stop_sell_percentage?: number
  entry_on_first_swap: boolean
  buy_once_per_token: boolean
  mirror_sells_enabled: boolean
  swap_notification_sound: string
  tracking_type: any
  reverse_copy: boolean
  btd_on_partial_sell: any
  btd_on_full_sell: any
  swap_notifications_enabled: boolean
  rugcheck_filters_enabled: boolean
  min_market_cap_usd: number | null
  max_market_cap_usd: number | null
  min_liquidity_usd: number | null
  max_liquidity_usd: number | null
  require_locked_liquidity: boolean
  min_lp_locked_pct: number | null
  bundler_tracking_enabled: boolean
  max_bundle_supply_pct: number | null
  min_token_age_seconds: number | null
  max_token_age_seconds: number | null
  min_holders: number | null
  max_holders: number | null
  copy_only_new_positions: boolean
  spike_entry_enabled: boolean
  spike_entry_pullback_percentage: number
  spike_entry_margin_percentage: number
  spike_entry_timeout_seconds: number
  spike_entry_require_unsold_mirror: boolean
  jito_tip_enabled: boolean
  jito_tip_sol: string
}

const DEFAULT_JITO_TIP_LAMPORTS = 10000
const DEFAULT_JITO_TIP_SOL = '0.00001'
const LAMPORTS_PER_SOL = 1_000_000_000

const lamportsToSolInput = (lamports: number | null | undefined): string => {
  const sol = Number(lamports ?? 0) / LAMPORTS_PER_SOL
  if (!Number.isFinite(sol) || sol <= 0) return ''
  return sol.toFixed(9).replace(/0+$/, '').replace(/\.$/, '')
}

const ToggleSwitch = ({ enabled, onClick, disabled = false }: { enabled: boolean; onClick: () => void; disabled?: boolean }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    aria-pressed={enabled}
    className={`relative inline-flex w-12 h-6 rounded-full p-1 transition-all duration-300 flex-shrink-0 disabled:cursor-not-allowed disabled:opacity-50 ${enabled ? 'bg-molten-gold' : 'bg-gray-600'}`}
  >
    <span
      className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300 ease-out ${enabled ? 'translate-x-6' : 'translate-x-0'}`}
    />
  </button>
)

const optionalFloatFromInput = (value: string): number | null => {
  if (value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const optionalIntFromInput = (value: string): number | null => {
  if (value === '') return null
  const parsed = parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

const secondsToMinutesInput = (seconds: number | null | undefined): string | number => {
  if (seconds === null || seconds === undefined) return ''
  return Math.floor(seconds / 60)
}

const secondsToPreciseMinutesInput = (seconds: number | null | undefined): string | number => {
  if (seconds === null || seconds === undefined) return ''
  const minutes = seconds / 60
  return Number.isInteger(minutes) ? minutes : Number(minutes.toFixed(2))
}

const minutesToSecondsInput = (value: string): number | null => {
  const minutes = optionalFloatFromInput(value)
  return minutes === null ? null : Math.floor(minutes * 60)
}

export default function DashboardPage() {
  const [settings, setSettings] = useState<WalletSettings>({
    swap_strategy: 'fixed_buys',
    dip_ladder_drop_percentage: 5,
    dip_ladder_profit_percentage: 5,
    buy_the_dip: false,
    buy_dip_percentage: 10,
    max_dip_percentage: 50,
    buy_dip_timeout: 300,
    dip_recovery: false,
    dip_recovery_percentage: 5,
    dip_recovery_timeout: 600,
    one_btd_at_a_time: false,
    slippage: 1,
    time_filter_enabled: false,
    time_filter_seconds: null,
    max_buys_per_mirror_per_hour: 1,
    max_buys_per_mirror_per_day: 1,
    max_buys_per_token_per_day: 1,
    time_limit_sells_enabled: false,
    time_limit_profit_pct: null,
    time_limit_seconds: null,
    trailing_take_profit_enabled: false,
    trailing_take_profit_activation_pct: null,
    trailing_take_profit_distance_pct: null,
    trailing_take_profit_sell_pct: null,
    trailing_stop_loss_enabled: false,
    trailing_stop_loss_activation_pct: null,
    trailing_stop_loss_distance_pct: null,
    trailing_stop_loss_sell_pct: null,
    entry_on_first_swap: false,
    buy_once_per_token: false,
    mirror_sells_enabled: true,
    swap_notifications_enabled: true,
    swap_notification_sound: 'success.mp3',
    tracking_type: { type: 'both' },
    reverse_copy: false,
    btd_on_partial_sell: { enabled: false, target_token: '' },
    btd_on_full_sell: { enabled: false, target_token: '' },
    rugcheck_filters_enabled: false,
    min_market_cap_usd: null,
    max_market_cap_usd: null,
    min_liquidity_usd: null,
    max_liquidity_usd: null,
    require_locked_liquidity: false,
    min_lp_locked_pct: null,
    bundler_tracking_enabled: false,
    max_bundle_supply_pct: null,
    min_token_age_seconds: null,
    max_token_age_seconds: null,
    min_holders: null,
    max_holders: null,
    copy_only_new_positions: false,
    spike_entry_enabled: false,
    spike_entry_pullback_percentage: 5,
    spike_entry_margin_percentage: 0,
    spike_entry_timeout_seconds: 300,
    spike_entry_require_unsold_mirror: false,
    jito_tip_enabled: false,
    jito_tip_sol: DEFAULT_JITO_TIP_SOL
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [tpValidationError, setTpValidationError] = useState<string | null>(null)
  const [slValidationError, setSlValidationError] = useState<string | null>(null)
  const [showAllTP, setShowAllTP] = useState(false)
  const [showAllSL, setShowAllSL] = useState(false)
  const [tpSlIsActive, setTpSlIsActive] = useState(true)
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false)
  const [isWalletListOpen, setIsWalletListOpen] = useState(false)
  const [availableSounds, setAvailableSounds] = useState<string[]>([])
  const [playingSound, setPlayingSound] = useState<string | null>(null)



  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const calculateTotalSellPercentage = (levels: TakeProfitLevel[] | StopLossLevel[]): number => {
    return levels.reduce((sum, level) => sum + (level.sell_percentage || 0), 0)
  }

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return 'All Time'
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60

    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (s > 0) parts.push(`${s}s`)
    return parts.join(' ') || '0s'
  }

  const addTakeProfitLevel = () => {
    const currentLevels = settings.take_profit_levels || []
    setSettings(prev => ({
      ...prev,
      take_profit_levels: [...currentLevels, { profit_percentage: 0, sell_percentage: 0 }]
    }))
    setShowAllTP(true)
  }

  const removeTakeProfitLevel = (index: number) => {
    const currentLevels = settings.take_profit_levels || []
    setSettings(prev => ({
      ...prev,
      take_profit_levels: currentLevels.filter((_, i) => i !== index)
    }))
  }

  const updateTakeProfitLevel = (index: number, field: 'profit_percentage' | 'sell_percentage', value: string) => {
    const currentLevels = settings.take_profit_levels || []
    const updatedLevels = [...currentLevels]
    const numValue = value === '' ? 0 : parseFloat(value) || 0
    updatedLevels[index] = { ...updatedLevels[index], [field]: numValue }
    setSettings(prev => ({ ...prev, take_profit_levels: updatedLevels }))

    const total = calculateTotalSellPercentage(updatedLevels)
    if (total > 100) {
      setTpValidationError('Total sell percentage cannot exceed 100%')
    } else if (total < 100 && updatedLevels.some(l => l.profit_percentage > 0 || l.sell_percentage > 0)) {
      setTpValidationError('Total sell percentage must equal 100%')
    } else {
      setTpValidationError(null)
    }
  }

  const addStopLossLevel = () => {
    const currentLevels = settings.stop_loss_levels || []
    setSettings(prev => ({
      ...prev,
      stop_loss_levels: [...currentLevels, { loss_percentage: 0, sell_percentage: 0 }]
    }))
    setShowAllSL(true)
  }

  const removeStopLossLevel = (index: number) => {
    const currentLevels = settings.stop_loss_levels || []
    setSettings(prev => ({
      ...prev,
      stop_loss_levels: currentLevels.filter((_, i) => i !== index)
    }))
  }

  const updateStopLossLevel = (index: number, field: 'loss_percentage' | 'sell_percentage', value: string) => {
    const currentLevels = settings.stop_loss_levels || []
    const updatedLevels = [...currentLevels]
    const numValue = value === '' ? 0 : parseFloat(value) || 0
    updatedLevels[index] = { ...updatedLevels[index], [field]: numValue }
    setSettings(prev => ({ ...prev, stop_loss_levels: updatedLevels }))

    const total = calculateTotalSellPercentage(updatedLevels)
    if (total > 100) {
      setSlValidationError('Total sell percentage cannot exceed 100%')
    } else if (total < 100 && updatedLevels.some(l => l.loss_percentage > 0 || l.sell_percentage > 0)) {
      setSlValidationError('Total sell percentage must equal 100%')
    } else {
      setSlValidationError(null)
    }
  }

  const { profile, selectedCoin, wallet } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()

  const fetchAvailableSounds = useCallback(async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/copy-trading/sounds`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setAvailableSounds(data)
      }
    } catch (err) {
      console.error('Failed to fetch sounds:', err)
    }
  }, [])

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/copy-trading/wallet-settings?coin_type=${selectedCoin}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setSettings({
          ...data,
          swap_strategy: data.swap_strategy === 'none' ? 'fixed_buys' : (data.swap_strategy || 'fixed_buys'),
          dip_ladder_drop_percentage: data.dip_ladder_drop_percentage ?? 5,
          dip_ladder_profit_percentage: data.dip_ladder_profit_percentage ?? 5,
          take_profit_levels: data.take_profit_levels && data.take_profit_levels.length > 0
            ? data.take_profit_levels
            : [{ profit_percentage: 0, sell_percentage: 0 }],
          stop_loss_levels: data.stop_loss_levels && data.stop_loss_levels.length > 0
            ? data.stop_loss_levels
            : [{ loss_percentage: 0, sell_percentage: 0 }],
          time_limit_sells_enabled: data.time_limit_sells_enabled ?? false,
          time_limit_profit_pct: data.time_limit_profit_pct ?? null,
          time_limit_seconds: data.time_limit_seconds ?? null,
          time_filter_enabled: data.time_filter_enabled ?? false,
          time_filter_seconds: data.time_filter_seconds ?? null,
          trailing_take_profit_enabled: data.trailing_take_profit_enabled ?? false,
          trailing_take_profit_activation_pct: data.trailing_take_profit_activation_pct ?? null,
          trailing_take_profit_distance_pct: data.trailing_take_profit_distance_pct ?? null,
          trailing_take_profit_sell_pct: data.trailing_take_profit_sell_pct ?? null,
          trailing_stop_loss_enabled: data.trailing_stop_loss_enabled ?? false,
          trailing_stop_loss_activation_pct: data.trailing_stop_loss_activation_pct ?? null,
          trailing_stop_loss_distance_pct: data.trailing_stop_loss_distance_pct ?? null,
          trailing_stop_loss_sell_pct: data.trailing_stop_loss_sell_pct ?? null,
          tracking_type: typeof data.tracking_type === 'object' ? data.tracking_type : { type: data.tracking_type || 'both' },
          rugcheck_filters_enabled: data.rugcheck_filters_enabled ?? false,
          min_market_cap_usd: data.min_market_cap_usd ?? null,
          max_market_cap_usd: data.max_market_cap_usd ?? null,
          min_liquidity_usd: data.min_liquidity_usd ?? null,
          max_liquidity_usd: data.max_liquidity_usd ?? null,
          require_locked_liquidity: selectedCoin === 'sol' ? data.require_locked_liquidity ?? false : false,
          min_lp_locked_pct: selectedCoin === 'sol' ? data.min_lp_locked_pct ?? null : null,
          bundler_tracking_enabled: selectedCoin === 'sol' ? data.bundler_tracking_enabled ?? false : false,
          max_bundle_supply_pct: selectedCoin === 'sol' ? data.max_bundle_supply_pct ?? null : null,
          min_token_age_seconds: data.min_token_age_seconds ?? null,
          max_token_age_seconds: data.max_token_age_seconds ?? null,
          min_holders: data.min_holders ?? null,
          max_holders: data.max_holders ?? null,
          copy_only_new_positions: data.copy_only_new_positions ?? false,
          spike_entry_enabled: data.spike_entry_enabled ?? false,
          spike_entry_pullback_percentage: data.spike_entry_pullback_percentage ?? 5,
          spike_entry_margin_percentage: data.spike_entry_margin_percentage ?? 0,
          spike_entry_timeout_seconds: data.spike_entry_timeout_seconds ?? 300,
          spike_entry_require_unsold_mirror: data.spike_entry_require_unsold_mirror ?? false,
          jito_tip_enabled: selectedCoin === 'sol' ? data.jito_tip_enabled ?? false : false,
          jito_tip_sol: data.jito_tip_sol !== undefined && data.jito_tip_sol !== null
            ? String(data.jito_tip_sol)
            : lamportsToSolInput(data.jito_tip_lamports ?? DEFAULT_JITO_TIP_LAMPORTS)
        })
        setTpSlIsActive(data.tp_sl_is_active !== undefined ? data.tp_sl_is_active : true)
      } else if (response.status === 401) {
        router.push('/login')
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err)
    } finally {
      setInitialLoading(false)
    }
  }, [router, selectedCoin])

  useEffect(() => {
    if (profile) {
      fetchSettings()
      fetchAvailableSounds()
    }
  }, [profile, fetchSettings, fetchAvailableSounds])

  const testHearSound = (soundFile: string) => {
    if (playingSound) return
    setPlayingSound(soundFile)
    const audio = new Audio(`/sounds/${soundFile}`)
    audio.play().finally(() => {
      setTimeout(() => setPlayingSound(null), 2000)
    })
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      if (settings.time_filter_enabled && (!settings.time_filter_seconds || settings.time_filter_seconds <= 0)) {
        setError('Time filter seconds is required when time filter is enabled')
        return
      }

      const payload = {
        ...settings,
        swap_strategy: settings.swap_strategy === 'none' ? 'fixed_buys' : settings.swap_strategy,
        dip_ladder_drop_percentage: settings.dip_ladder_drop_percentage ?? 5,
        dip_ladder_profit_percentage: settings.dip_ladder_profit_percentage ?? 5,
        slippage: settings.slippage === '' ? 0 : settings.slippage,
        time_filter_enabled: settings.time_filter_enabled,
        time_filter_seconds: settings.time_filter_enabled ? settings.time_filter_seconds : null,
        max_buys_per_mirror_per_hour: settings.max_buys_per_mirror_per_hour ?? undefined,
        max_buys_per_mirror_per_day: settings.max_buys_per_mirror_per_day ?? undefined,
        max_buys_per_token_per_day: settings.max_buys_per_token_per_day ?? undefined,
        take_profit_levels: settings.take_profit_levels,
        stop_loss_levels: settings.stop_loss_levels,
        tp_sl_is_active: tpSlIsActive,
        time_limit_sells_enabled: settings.time_limit_sells_enabled,
        time_limit_profit_pct: settings.time_limit_profit_pct ?? null,
        time_limit_seconds: settings.time_limit_seconds ?? null,
        trailing_take_profit_enabled: settings.trailing_take_profit_enabled,
        trailing_take_profit_activation_pct: settings.trailing_take_profit_activation_pct ?? null,
        trailing_take_profit_distance_pct: settings.trailing_take_profit_distance_pct ?? null,
        trailing_take_profit_sell_pct: settings.trailing_take_profit_sell_pct ?? null,
        trailing_stop_loss_enabled: settings.trailing_stop_loss_enabled,
        trailing_stop_loss_activation_pct: settings.trailing_stop_loss_activation_pct ?? null,
        trailing_stop_loss_distance_pct: settings.trailing_stop_loss_distance_pct ?? null,
        trailing_stop_loss_sell_pct: settings.trailing_stop_loss_sell_pct ?? null,
        entry_on_first_swap: settings.entry_on_first_swap,
        buy_once_per_token: settings.buy_once_per_token,
        mirror_sells_enabled: settings.mirror_sells_enabled,
        swap_notifications_enabled: settings.swap_notifications_enabled,
        swap_notification_sound: settings.swap_notification_sound,
        tracking_type: settings.tracking_type,
        rugcheck_filters_enabled: settings.rugcheck_filters_enabled,
        min_market_cap_usd: settings.min_market_cap_usd ?? null,
        max_market_cap_usd: settings.max_market_cap_usd ?? null,
        min_liquidity_usd: settings.min_liquidity_usd ?? null,
        max_liquidity_usd: settings.max_liquidity_usd ?? null,
        require_locked_liquidity: selectedCoin === 'sol' ? settings.require_locked_liquidity : false,
        min_lp_locked_pct: selectedCoin === 'sol' ? settings.min_lp_locked_pct ?? null : null,
        bundler_tracking_enabled: selectedCoin === 'sol' ? settings.bundler_tracking_enabled : false,
        max_bundle_supply_pct: selectedCoin === 'sol' ? settings.max_bundle_supply_pct ?? null : null,
        min_token_age_seconds: settings.min_token_age_seconds ?? null,
        max_token_age_seconds: settings.max_token_age_seconds ?? null,
        min_holders: settings.min_holders ?? null,
        max_holders: settings.max_holders ?? null,
        copy_only_new_positions: selectedCoin === 'sol' ? settings.copy_only_new_positions : false,
        spike_entry_enabled: selectedCoin === 'sol' ? settings.spike_entry_enabled : false,
        spike_entry_pullback_percentage: settings.spike_entry_pullback_percentage ?? 5,
        spike_entry_margin_percentage: settings.spike_entry_margin_percentage ?? 0,
        spike_entry_timeout_seconds: settings.spike_entry_timeout_seconds ?? 300,
        spike_entry_require_unsold_mirror: selectedCoin === 'sol' ? settings.spike_entry_require_unsold_mirror : false,
        jito_tip_enabled: selectedCoin === 'sol' ? settings.jito_tip_enabled : false,
        jito_tip_sol: selectedCoin === 'sol' ? Number(settings.jito_tip_sol || 0) : 0,
        coin_type: selectedCoin
      }
      console.log('the selected coin is', selectedCoin)
      const response = await fetch(`${config.apiBaseUrl}/copy-trading/wallet-settings?coin_type=${selectedCoin}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess(data.message)
        setTimeout(() => setSuccess(null), 5000)
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Failed to update settings')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update settings')
    } finally {
      setLoading(false)
    }
  }





  const handleSelectWallet = async (id: string | number) => {
    try {
      const blockchain = selectedCoin === 'sol' ? 'solana' : 'bnb'
      await dispatch(selectWallet({ walletId: id.toString(), blockchain })).unwrap()
      // Re-fetch settings for the new active wallet
      fetchSettings()
    } catch (err) {
      console.error('Failed to select wallet:', err)
    }
  }

  if (initialLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-molten-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/60 font-space-grotesk">Loading settings...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl ml-4 md:ml-8 -mt-2 md:-mt-4 space-y-4 md:space-y-6">
        <h1 className="text-xl md:text-3xl font-orbitron font-bold text-molten-gold mb-4 md:mb-6">
          Wallet Settings
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Active Wallet Card */}
          <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-6 relative group min-h-[180px] flex flex-col justify-between z-20">
            <div className="relative z-10 w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-orbitron font-semibold text-white">Active Wallet</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsWalletListOpen(!isWalletListOpen);
                  }}
                  className="px-3 py-1 text-xs font-orbitron font-bold bg-molten-gold/10 text-molten-gold border border-molten-gold/30 rounded-full hover:bg-molten-gold/20 transition-all"
                >
                  {isWalletListOpen ? 'Close List' : 'Switch'}
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-orbitron text-molten-gold/60 uppercase tracking-widest">Address</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm md:text-base font-space-grotesk text-white font-medium truncate">
                      {selectedCoin === 'sol' ? wallet?.solana_public_key : wallet?.bnb_public_key || 'Not connected'}
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedCoin === 'sol' ? wallet?.solana_public_key || '' : wallet?.bnb_public_key || '')}
                      className="text-white/20 hover:text-molten-gold transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-orbitron text-molten-gold/60 uppercase tracking-widest">Balance</span>
                  <span className="text-xl md:text-2xl font-space-grotesk text-molten-gold font-bold">
                    {selectedCoin === 'sol' ? `${wallet?.solana_balance || '0'} SOL` : `${wallet?.bnb_balance || '0'} BNB`}
                  </span>
                </div>
              </div>

              {isWalletListOpen && profile?.wallets && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-[calc(100%+0.5rem)] left-0 right-0 bg-void-black/95 backdrop-blur-xl border border-molten-gold/20 rounded-lg p-2 shadow-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar"
                >
                  {profile.wallets.map((w) => {
                    const blockchain = selectedCoin === 'sol' ? 'solana' : 'bnb';
                    const isActive = blockchain === 'solana' ? w.is_active_sol : w.is_active_bnb;
                    return (
                      <div
                        key={w.id}
                        onClick={() => {
                          handleSelectWallet(w.id);
                          setIsWalletListOpen(false);
                        }}
                        className={`p-3 rounded-lg border cursor-pointer transition-all duration-300 flex items-center justify-between mb-1 last:mb-0 ${isActive
                          ? 'bg-molten-gold/20 border-molten-gold/50'
                          : 'bg-white/5 border-transparent hover:border-molten-gold/30 hover:bg-white/10'
                          }`}
                      >
                        <div className="flex flex-col overflow-hidden">
                          <span className={`text-xs font-orbitron uppercase truncate mb-0.5 ${isActive ? 'text-molten-gold' : 'text-white'}`}>
                            {w.name || 'Unnamed Wallet'}
                          </span>
                          <span className="text-[10px] text-white/50 font-mono truncate">
                            {selectedCoin === 'sol' ? w.solana_public_key : w.bnb_public_key}
                          </span>
                        </div>
                        {isActive && <Check size={14} className="text-molten-gold shrink-0 ml-2" />}
                      </div>
                    )
                  })}
                </motion.div>
              )}
            </div>
          </div>

          {/* Add Wallet Card */}
          <div
            onClick={() => setIsAddWalletOpen(true)}
            className="bg-molten-gold/5 border border-dashed border-molten-gold/40 rounded-lg p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-molten-gold/10 hover:border-molten-gold transition-all duration-300 group min-h-[180px] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-molten-gold/0 to-molten-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="w-16 h-16 rounded-full bg-molten-gold/10 border border-molten-gold/20 flex items-center justify-center group-hover:scale-110 group-hover:border-molten-gold/50 transition-all duration-300 relative z-10">
              <Plus size={32} className="text-molten-gold/80 group-hover:text-molten-gold" />
            </div>
            <div className="text-center relative z-10">
              <h3 className="text-lg font-orbitron font-bold text-white group-hover:text-molten-gold transition-colors">Add New Wallet</h3>
              <p className="text-sm text-white/40 font-space-grotesk mt-1">Create more SOL or BNB wallets</p>
            </div>
          </div>
        </div>

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg mb-6"
          >
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle size={20} />
              <span className="font-orbitron font-bold">{success}</span>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg mb-6"
          >
            <div className="flex items-center gap-2 text-red-400">
              <XCircle size={20} />
              <span className="font-orbitron font-bold">{error}</span>
            </div>
          </motion.div>
        )}

        <div className="space-y-4 md:space-y-6">
          <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0">
              <div>
                <h3 className="text-base md:text-lg font-orbitron font-semibold text-white mb-1 md:mb-2">Buy the Dip</h3>
                <p className="text-white/60 font-space-grotesk text-xs md:text-sm">Enable automatic dip buying strategy</p>
              </div>
              <ToggleSwitch
                enabled={Boolean(settings.buy_the_dip)}
                onClick={() => setSettings(prev => ({ ...prev, buy_the_dip: !prev.buy_the_dip }))}
              />
            </div>

            {settings.buy_the_dip && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-xs md:text-sm font-orbitron text-molten-gold font-semibold">Buy Dip %</label>
                      <div className="group relative">
                        <div className="w-4 h-4 bg-molten-gold/20 rounded-full flex items-center justify-center cursor-help">
                          <span className="text-xs text-molten-gold">?</span>
                        </div>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-void-black/95 border border-molten-gold/30 rounded-lg p-3 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                          The percentage drop from the market cap at the time the signal is received that must occur before the bot initiates a buy.
                        </div>
                      </div>
                    </div>
                    <input
                      type="number"
                      value={settings.buy_dip_percentage}
                      onChange={(e) => setSettings(prev => ({ ...prev, buy_dip_percentage: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                      placeholder="10"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-xs md:text-sm font-orbitron text-molten-gold font-semibold">Max Dip %</label>
                      <div className="group relative">
                        <div className="w-4 h-4 bg-molten-gold/20 rounded-full flex items-center justify-center cursor-help">
                          <span className="text-xs text-molten-gold">?</span>
                        </div>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-void-black/95 border border-molten-gold/30 rounded-lg p-3 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                          This only applies if you are using dip recovery. In the instance the set max dip % is met before the recovery happens then the buy order will be cancelled.
                        </div>
                      </div>
                    </div>
                    <input
                      type="number"
                      value={settings.max_dip_percentage}
                      onChange={(e) => setSettings(prev => ({ ...prev, max_dip_percentage: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                      placeholder="50"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <label className="block text-xs md:text-sm font-orbitron text-molten-gold font-semibold">Buy Dip Timeout (seconds)</label>
                        <div className="group relative">
                          <div className="w-4 h-4 bg-molten-gold/20 rounded-full flex items-center justify-center cursor-help">
                            <span className="text-xs text-molten-gold">?</span>
                          </div>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-void-black/95 border border-molten-gold/30 rounded-lg p-3 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                            Sets a time limit (in seconds) for the dip to occur. Helps avoid buying tokens that are continuously dumping.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/60 font-space-grotesk">Indefinite</span>
                        <input
                          type="checkbox"
                          checked={settings.buy_dip_timeout <= -1}
                          onChange={(e) => setSettings(prev => ({ ...prev, buy_dip_timeout: e.target.checked ? -1 : 300 }))}
                          className="w-4 h-4 rounded border-molten-gold/20 bg-void-black/50 text-molten-gold focus:ring-molten-gold focus:ring-offset-0"
                        />
                      </div>
                    </div>
                    <input
                      type="number"
                      value={settings.buy_dip_timeout <= -1 ? '' : settings.buy_dip_timeout}
                      disabled={settings.buy_dip_timeout <= -1}
                      onChange={(e) => setSettings(prev => ({ ...prev, buy_dip_timeout: parseInt(e.target.value) || 0 }))}
                      className={`w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300 ${settings.buy_dip_timeout <= -1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder={settings.buy_dip_timeout <= -1 ? "Infinite" : "300"}
                      min="0"
                      step="1"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <label className="block text-xs md:text-sm font-orbitron text-molten-gold font-semibold">Dip Recovery</label>
                        <div className="group relative">
                          <div className="w-4 h-4 bg-molten-gold/20 rounded-full flex items-center justify-center cursor-help">
                            <span className="text-xs text-molten-gold">?</span>
                          </div>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 bg-void-black/95 border border-molten-gold/30 rounded-lg p-3 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                            After the dip is triggered, this is the percentage rebound required before confirming the buy. This is not taken from the lowest point on the chart but instead a recovery from the % you set in buy dip above. E.G. If market cap was $100k and you set 10% dip and 5% recovery. It would start waiting for recovery once it hit $90k and would not buy until it got to $94.5k. Even if it went down to 40k before the recovery, it would only buy once $94.5k is reached.
                          </div>
                        </div>
                      </div>
                      <motion.button
                        onClick={() => setSettings(prev => ({ ...prev, dip_recovery: !prev.dip_recovery }))}
                        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${settings.dip_recovery ? 'bg-molten-gold' : 'bg-gray-600'
                          }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.div
                          className="w-4 h-4 bg-white rounded-full"
                          animate={{ x: settings.dip_recovery ? 18 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </motion.button>
                    </div>
                  </div>

                  {settings.dip_recovery && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="block text-xs md:text-sm font-orbitron text-molten-gold font-semibold">Dip Recovery %</label>
                          <div className="group relative">
                            <div className="w-4 h-4 bg-molten-gold/20 rounded-full flex items-center justify-center cursor-help">
                              <span className="text-xs text-molten-gold">?</span>
                            </div>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-void-black/95 border border-molten-gold/30 rounded-lg p-3 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                              The percentage rebound required before confirming the buy after the dip is triggered.
                            </div>
                          </div>
                        </div>
                        <input
                          type="number"
                          value={settings.dip_recovery_percentage}
                          onChange={(e) => setSettings(prev => ({ ...prev, dip_recovery_percentage: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                          placeholder="5"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <label className="block text-xs md:text-sm font-orbitron text-molten-gold font-semibold">Dip Recovery Timeout (seconds)</label>
                            <div className="group relative">
                              <div className="w-4 h-4 bg-molten-gold/20 rounded-full flex items-center justify-center cursor-help">
                                <span className="text-xs text-molten-gold">?</span>
                              </div>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-void-black/95 border border-molten-gold/30 rounded-lg p-3 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                                Maximum time allowed (in seconds) for the recovery to happen. If the price doesn&apos;t rebound within this window, the bot will skip the trade.
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-white/60 font-space-grotesk">Indefinite</span>
                            <input
                              type="checkbox"
                              checked={settings.dip_recovery_timeout <= -1}
                              onChange={(e) => setSettings(prev => ({ ...prev, dip_recovery_timeout: e.target.checked ? -1 : 600 }))}
                              className="w-4 h-4 rounded border-molten-gold/20 bg-void-black/50 text-molten-gold focus:ring-molten-gold focus:ring-offset-0"
                            />
                          </div>
                        </div>
                        <input
                          type="number"
                          value={settings.dip_recovery_timeout <= -1 ? '' : settings.dip_recovery_timeout}
                          disabled={settings.dip_recovery_timeout <= -1}
                          onChange={(e) => setSettings(prev => ({ ...prev, dip_recovery_timeout: parseInt(e.target.value) || 0 }))}
                          className={`w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300 ${settings.dip_recovery_timeout <= -1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                          placeholder={settings.dip_recovery_timeout <= -1 ? "Infinite" : "600"}
                          min="0"
                          step="1"
                        />
                      </div>
                    </motion.div>
                  )}

                  <div className="flex items-center justify-between col-span-1 md:col-span-2 mt-4 pt-4 border-t border-molten-gold/10">
                    <div className="flex items-center gap-2">
                      <label className="block text-xs md:text-sm font-orbitron text-molten-gold font-semibold">One BTD Event at a Time</label>
                      <div className="group relative">
                        <div className="w-4 h-4 bg-molten-gold/20 rounded-full flex items-center justify-center cursor-help">
                          <span className="text-xs text-molten-gold">?</span>
                        </div>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-void-black/95 border border-molten-gold/30 rounded-lg p-3 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                          If enabled, only one BTD event will be tracked for this token within its timeout period. Subsequent swaps for the same token will be ignored if the previous BTD event&apos;s timeout hasn&apos;t expired yet.
                        </div>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => setSettings(prev => ({ ...prev, one_btd_at_a_time: !prev.one_btd_at_a_time }))}
                      className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${settings.one_btd_at_a_time ? 'bg-molten-gold' : 'bg-gray-600'}`}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                    >
                      <motion.div
                        className="w-4 h-4 bg-white rounded-full"
                        animate={{ x: settings.one_btd_at_a_time ? 24 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </motion.button>
                  </div>

                  <div className="col-span-1 md:col-span-2 space-y-4 pt-4 border-t border-molten-gold/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="block text-xs md:text-sm font-orbitron text-molten-gold font-semibold">Trigger BTD on Partial Sell</label>
                        <div className="group relative">
                          <div className="w-4 h-4 bg-molten-gold/20 rounded-full flex items-center justify-center cursor-help">
                            <Info size={12} className="text-molten-gold" />
                          </div>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-void-black/95 border border-molten-gold/30 rounded-lg p-3 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                            Start BTD monitoring when the mirror wallet performs a partial sell of the token.
                          </div>
                        </div>
                      </div>
                      <motion.button
                        onClick={() => setSettings(prev => ({ ...prev, btd_on_partial_sell: { ...(prev.btd_on_partial_sell || {}), enabled: !(prev.btd_on_partial_sell?.enabled) } }))}
                        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${settings.btd_on_partial_sell?.enabled ? 'bg-molten-gold' : 'bg-gray-600'}`}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                      >
                        <motion.div
                          className="w-4 h-4 bg-white rounded-full"
                          animate={{ x: settings.btd_on_partial_sell?.enabled ? 24 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </motion.button>
                    </div>

                    {settings.btd_on_partial_sell?.enabled && (
                      <div className="mt-2 ml-4">
                        <label className="block text-xs font-orbitron text-molten-gold mb-1">Target Token (Optional)</label>
                        <input
                          type="text"
                          value={settings.btd_on_partial_sell?.target_token || ''}
                          onChange={(e) => setSettings(prev => ({ ...prev, btd_on_partial_sell: { ...prev.btd_on_partial_sell, target_token: e.target.value } }))}
                          className="w-full md:max-w-md bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk text-sm focus:border-molten-gold focus:outline-none transition-colors duration-300"
                          placeholder="Paste token address or leave empty for all"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <label className="block text-xs md:text-sm font-orbitron text-molten-gold font-semibold">Trigger BTD on Full Sell</label>
                        <div className="group relative">
                          <div className="w-4 h-4 bg-molten-gold/20 rounded-full flex items-center justify-center cursor-help">
                            <Info size={12} className="text-molten-gold" />
                          </div>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-void-black/95 border border-molten-gold/30 rounded-lg p-3 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                            Start BTD monitoring ONLY when the mirror wallet performs a full sell (100%) of the token.
                          </div>
                        </div>
                      </div>
                      <motion.button
                        onClick={() => setSettings(prev => ({ ...prev, btd_on_full_sell: { ...(prev.btd_on_full_sell || {}), enabled: !(prev.btd_on_full_sell?.enabled) } }))}
                        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${settings.btd_on_full_sell?.enabled ? 'bg-molten-gold' : 'bg-gray-600'}`}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                      >
                        <motion.div
                          className="w-4 h-4 bg-white rounded-full"
                          animate={{ x: settings.btd_on_full_sell?.enabled ? 24 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </motion.button>
                    </div>
                    {settings.btd_on_full_sell?.enabled && (
                      <div className="mt-2 ml-4">
                        <label className="block text-xs font-orbitron text-molten-gold mb-1">Target Token (Optional)</label>
                        <input
                          type="text"
                          value={settings.btd_on_full_sell?.target_token || ''}
                          onChange={(e) => setSettings(prev => ({ ...prev, btd_on_full_sell: { ...prev.btd_on_full_sell, target_token: e.target.value } }))}
                          className="w-full md:max-w-md bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk text-sm focus:border-molten-gold focus:outline-none transition-colors duration-300"
                          placeholder="Paste token address or leave empty for all"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>


          {/* Slippage Settings */}
          <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4 md:p-6">
            <h3 className="text-base md:text-lg font-orbitron font-semibold text-white mb-3 md:mb-4">Slippage Settings</h3>
            <div>
              <label className="block text-sm font-orbitron text-molten-gold font-semibold mb-2">Slippage (%)</label>
              <input
                type="number"
                value={settings.slippage}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === '') {
                    setSettings(prev => ({ ...prev, slippage: '' }))
                  } else {
                    setSettings(prev => ({ ...prev, slippage: parseFloat(v) }))
                  }
                }}
                className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                placeholder="1"
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>

          <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base md:text-lg font-orbitron font-semibold text-white">Time Filter</h3>
                  <span className="group relative inline-flex">
                    <Info size={14} className="text-molten-gold/75 cursor-help" />
                    <span className="absolute bottom-full left-1/2 z-30 mb-2 w-72 -translate-x-1/2 rounded-lg border border-molten-gold/25 bg-void-black/95 p-3 text-xs leading-relaxed text-white/75 opacity-0 shadow-xl shadow-black/30 transition-opacity duration-200 pointer-events-none group-hover:opacity-100">
                      Used for copy trades and Telegram buys. When enabled, Prometheus waits this many seconds after the target wallet or signal before buying.
                    </span>
                  </span>
                </div>
                <p className="text-white/45 font-space-grotesk text-xs md:text-sm">Delay copied buys by a required number of seconds.</p>
              </div>
              <ToggleSwitch
                enabled={Boolean(settings.time_filter_enabled)}
                onClick={() => setSettings(prev => ({
                  ...prev,
                  time_filter_enabled: !prev.time_filter_enabled,
                  time_filter_seconds: prev.time_filter_enabled ? null : prev.time_filter_seconds
                }))}
              />
            </div>
            {settings.time_filter_enabled && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4"
              >
                <label className="block text-sm font-orbitron text-molten-gold font-semibold mb-2">Delay Seconds</label>
                <input
                  type="number"
                  required
                  value={settings.time_filter_seconds ?? ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, time_filter_seconds: optionalIntFromInput(e.target.value) }))}
                  className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                  placeholder="4"
                  min="1"
                  step="1"
                />
              </motion.div>
            )}
          </div>

          {selectedCoin === 'sol' && (
            <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4 md:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base md:text-lg font-orbitron font-semibold text-white">Jito Bundle Tip</h3>
                    <span className="group relative inline-flex">
                      <Info size={14} className="text-molten-gold/75 cursor-help" />
                      <span className="absolute bottom-full left-1/2 z-30 mb-2 w-72 -translate-x-1/2 rounded-lg border border-molten-gold/25 bg-void-black/95 p-3 text-xs leading-relaxed text-white/75 opacity-0 shadow-xl shadow-black/30 transition-opacity duration-200 pointer-events-none group-hover:opacity-100">
                        Jito tips add a small SOL payment that can help validators prioritize bundled Solana transactions during busy periods. Enable it when faster inclusion matters.
                      </span>
                    </span>
                  </div>
                  <p className="text-white/45 font-space-grotesk text-xs md:text-sm">Add a SOL tip to copied buys and sells.</p>
                </div>
                <ToggleSwitch
                  enabled={Boolean(settings.jito_tip_enabled)}
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    jito_tip_enabled: !prev.jito_tip_enabled,
                    jito_tip_sol: !prev.jito_tip_enabled && Number(prev.jito_tip_sol || 0) <= 0 ? DEFAULT_JITO_TIP_SOL : prev.jito_tip_sol
                  }))}
                />
              </div>
              {settings.jito_tip_enabled && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <label className="block text-sm font-orbitron text-molten-gold font-semibold mb-2">Tip (SOL)</label>
                  <input
                    type="number"
                    value={settings.jito_tip_sol}
                    onChange={(e) => setSettings(prev => ({ ...prev, jito_tip_sol: e.target.value }))}
                    className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                    min="0"
                    step="0.000001"
                    placeholder={DEFAULT_JITO_TIP_SOL}
                  />
                </motion.div>
              )}
            </div>
          )}

          {/* TP/SL Control Switch */}
          <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base md:text-lg font-orbitron font-semibold text-white mb-1">Take Profit / Stop Loss</h3>
                <p className="text-white/60 font-space-grotesk text-xs md:text-sm">Enable or disable TP/SL tracking</p>
              </div>
              <ToggleSwitch
                enabled={Boolean(tpSlIsActive)}
                onClick={() => setTpSlIsActive(!tpSlIsActive)}
              />
            </div>

            {tpSlIsActive && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 space-y-4 border-t border-molten-gold/10 pt-5"
              >
                <div>
                  <p className="text-[11px] font-orbitron uppercase tracking-[0.18em] text-molten-gold/70">TP/SL Exit Rules</p>
                  <p className="mt-1 text-xs md:text-sm text-white/45 font-space-grotesk">Fixed targets, trailing exits, and time-based failsafes are managed by the same TP/SL monitor.</p>
                </div>

          {/* Auto Take Profit */}
          <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-base md:text-lg font-orbitron font-semibold text-white">Auto Take Profit</h3>
              <div className="group relative">
                <div className="w-5 h-5 bg-molten-gold/20 rounded-full flex items-center justify-center cursor-help">
                  <span className="text-xs text-molten-gold">?</span>
                </div>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 bg-void-black/95 border border-molten-gold/30 rounded-lg p-3 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                  Set multiple profit targets. When a token reaches the specified profit percentage, the system will automatically sell the configured percentage of your holdings. The total sell percentage across all levels must equal 100%. Example: TP1 at 100% profit sells 50%, TP2 at 150% profit sells remaining 50%.
                </div>
              </div>
            </div>

            <div className={`space-y-3 ${!tpSlIsActive ? 'opacity-50 pointer-events-none' : ''}`}>
              {(settings.take_profit_levels || []).map((level, index) => {
                const tpLevels = settings.take_profit_levels || []
                const shouldShow = index === 0 || showAllTP
                if (!shouldShow) return null

                return (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-sm text-white/60 font-space-grotesk w-30">When price up &gt;</span>
                    <input
                      type="number"
                      value={level.profit_percentage === 0 ? '' : level.profit_percentage}
                      onChange={(e) => updateTakeProfitLevel(index, 'profit_percentage', e.target.value)}
                      className="w-24 bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                      placeholder="0"
                      min="0"
                      step="0.1"
                    />
                    <span className="text-white">%</span>
                    <span className="text-white/60 font-space-grotesk">sell</span>
                    <input
                      type="number"
                      value={level.sell_percentage === 0 ? '' : level.sell_percentage}
                      onChange={(e) => updateTakeProfitLevel(index, 'sell_percentage', e.target.value)}
                      className="w-24 bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="text-white">%</span>
                    {tpLevels.length > 1 && (
                      <button
                        onClick={() => removeTakeProfitLevel(index)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )
              })}
              {tpValidationError && (
                <p className="text-sm text-red-400 font-space-grotesk">{tpValidationError}</p>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={addTakeProfitLevel}
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-space-grotesk"
                >
                  <Plus size={16} />
                  <span>Add Level</span>
                </button>
                {(settings.take_profit_levels || []).length > 1 && (
                  <button
                    onClick={() => setShowAllTP(!showAllTP)}
                    className="flex items-center gap-2 text-molten-gold hover:text-yellow-400 transition-colors text-sm font-space-grotesk"
                  >
                    <span>View All</span>
                    {showAllTP ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Auto Stop Loss */}
          <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-base md:text-lg font-orbitron font-semibold text-white">Auto Stop Loss</h3>
              <div className="group relative">
                <div className="w-5 h-5 bg-molten-gold/20 rounded-full flex items-center justify-center cursor-help">
                  <span className="text-xs text-molten-gold">?</span>
                </div>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 bg-void-black/95 border border-molten-gold/30 rounded-lg p-3 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                  Set multiple stop loss levels. When a token drops to the specified loss percentage, the system will automatically sell the configured percentage of your holdings. The total sell percentage across all levels must equal 100%. Example: SL at 15% loss sells 100% of holdings.
                </div>
              </div>
            </div>

            <div className={`space-y-3 ${!tpSlIsActive ? 'opacity-50 pointer-events-none' : ''}`}>
              {(settings.stop_loss_levels || []).map((level, index) => {
                const slLevels = settings.stop_loss_levels || []
                const shouldShow = index === 0 || showAllSL
                if (!shouldShow) return null

                return (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-sm text-white/60 font-space-grotesk w-30">When price down &gt;</span>
                    <input
                      type="number"
                      value={level.loss_percentage === 0 ? '' : level.loss_percentage}
                      onChange={(e) => updateStopLossLevel(index, 'loss_percentage', e.target.value)}
                      className="w-24 bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                      placeholder="0"
                      min="0"
                      step="0.1"
                    />
                    <span className="text-white">%</span>
                    <span className="text-white/60 font-space-grotesk">sell</span>
                    <input
                      type="number"
                      value={level.sell_percentage === 0 ? '' : level.sell_percentage}
                      onChange={(e) => updateStopLossLevel(index, 'sell_percentage', e.target.value)}
                      className="w-24 bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                      placeholder="0"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="text-white">%</span>
                    {slLevels.length > 1 && (
                      <button
                        onClick={() => removeStopLossLevel(index)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )
              })}
              {slValidationError && (
                <p className="text-sm text-red-400 font-space-grotesk">{slValidationError}</p>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={addStopLossLevel}
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-space-grotesk"
                >
                  <Plus size={16} />
                  <span>Add Level</span>
                </button>
                {(settings.stop_loss_levels || []).length > 1 && (
                  <button
                    onClick={() => setShowAllSL(!showAllSL)}
                    className="flex items-center gap-2 text-molten-gold hover:text-yellow-400 transition-colors text-sm font-space-grotesk"
                  >
                    <span>View All</span>
                    {showAllSL ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base md:text-lg font-orbitron font-semibold text-white">Trailing Take Profit</h3>
                  <span className="group relative inline-flex">
                    <Info size={14} className="text-molten-gold/75 cursor-help" />
                    <span className="absolute bottom-full left-1/2 z-30 mb-2 w-80 -translate-x-1/2 rounded-lg border border-molten-gold/30 bg-void-black/95 p-3 text-xs leading-relaxed text-white/75 opacity-0 shadow-xl shadow-black/30 transition-opacity duration-200 pointer-events-none group-hover:opacity-100">
                      Activates only after the token reaches your profit threshold. From that point, Prometheus tracks the highest token price and sells the configured percentage of the original position if price falls by the trailing distance.
                    </span>
                  </span>
                </div>
                <p className="text-white/45 font-space-grotesk text-xs md:text-sm">Let winners run while protecting the move after activation.</p>
              </div>
              <ToggleSwitch
                enabled={Boolean(settings.trailing_take_profit_enabled)}
                disabled={!tpSlIsActive}
                onClick={() => setSettings(prev => ({ ...prev, trailing_take_profit_enabled: !prev.trailing_take_profit_enabled }))}
              />
            </div>

            {settings.trailing_take_profit_enabled && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 ${!tpSlIsActive ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div>
                  <label className="block text-sm font-orbitron text-molten-gold font-semibold mb-2">Activation Profit %</label>
                  <input
                    type="number"
                    value={settings.trailing_take_profit_activation_pct ?? ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, trailing_take_profit_activation_pct: optionalFloatFromInput(e.target.value) }))}
                    className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                    min="0"
                    step="0.1"
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-orbitron text-molten-gold font-semibold mb-2">Trailing Distance %</label>
                  <input
                    type="number"
                    value={settings.trailing_take_profit_distance_pct ?? ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, trailing_take_profit_distance_pct: optionalFloatFromInput(e.target.value) }))}
                    className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-orbitron text-molten-gold font-semibold mb-2">Sell Amount %</label>
                  <input
                    type="number"
                    value={settings.trailing_take_profit_sell_pct ?? ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, trailing_take_profit_sell_pct: optionalFloatFromInput(e.target.value) }))}
                    className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="100"
                  />
                </div>
              </motion.div>
            )}
          </div>

          <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base md:text-lg font-orbitron font-semibold text-white">Trailing Stop Loss</h3>
                  <span className="group relative inline-flex">
                    <Info size={14} className="text-molten-gold/75 cursor-help" />
                    <span className="absolute bottom-full left-1/2 z-30 mb-2 w-80 -translate-x-1/2 rounded-lg border border-molten-gold/30 bg-void-black/95 p-3 text-xs leading-relaxed text-white/75 opacity-0 shadow-xl shadow-black/30 transition-opacity duration-200 pointer-events-none group-hover:opacity-100">
                      Activates only after the token reaches your loss threshold. From that point, Prometheus tracks the highest token price after activation and sells the configured percentage of the original position if price falls by the trailing distance.
                    </span>
                  </span>
                </div>
                <p className="text-white/45 font-space-grotesk text-xs md:text-sm">Add a dynamic downside exit while keeping fixed SL available.</p>
              </div>
              <ToggleSwitch
                enabled={Boolean(settings.trailing_stop_loss_enabled)}
                disabled={!tpSlIsActive}
                onClick={() => setSettings(prev => ({ ...prev, trailing_stop_loss_enabled: !prev.trailing_stop_loss_enabled }))}
              />
            </div>

            {settings.trailing_stop_loss_enabled && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 ${!tpSlIsActive ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div>
                  <label className="block text-sm font-orbitron text-molten-gold font-semibold mb-2">Activation Loss %</label>
                  <input
                    type="number"
                    value={settings.trailing_stop_loss_activation_pct ?? ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, trailing_stop_loss_activation_pct: optionalFloatFromInput(e.target.value) }))}
                    className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                    min="0"
                    step="0.1"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-orbitron text-molten-gold font-semibold mb-2">Trailing Distance %</label>
                  <input
                    type="number"
                    value={settings.trailing_stop_loss_distance_pct ?? ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, trailing_stop_loss_distance_pct: optionalFloatFromInput(e.target.value) }))}
                    className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-orbitron text-molten-gold font-semibold mb-2">Sell Amount %</label>
                  <input
                    type="number"
                    value={settings.trailing_stop_loss_sell_pct ?? ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, trailing_stop_loss_sell_pct: optionalFloatFromInput(e.target.value) }))}
                    className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="100"
                  />
                </div>
              </motion.div>
            )}
          </div>

          <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base md:text-lg font-orbitron font-semibold text-white">Time Limit Sells</h3>
                  <span className="group relative inline-flex">
                    <Info size={14} className="text-molten-gold/75 cursor-help" />
                    <span className="absolute bottom-full left-1/2 z-30 mb-2 w-80 -translate-x-1/2 rounded-lg border border-molten-gold/30 bg-void-black/95 p-3 text-xs leading-relaxed text-white/75 opacity-0 shadow-xl shadow-black/30 transition-opacity duration-200 pointer-events-none group-hover:opacity-100">
                      Sell the remaining position if the token has not reached your profit target before the timer expires. The timer starts when Prometheus enters the trade; reaching the target in time cancels this fallback for that position.
                    </span>
                  </span>
                </div>
                <p className="text-white/45 font-space-grotesk text-xs md:text-sm">Close slow trades that fail to reach the target fast enough.</p>
              </div>
              <ToggleSwitch
                enabled={Boolean(settings.time_limit_sells_enabled)}
                disabled={!tpSlIsActive}
                onClick={() => setSettings(prev => ({ ...prev, time_limit_sells_enabled: !prev.time_limit_sells_enabled }))}
              />
            </div>

            {settings.time_limit_sells_enabled && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 ${!tpSlIsActive ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div>
                  <label className="block text-sm font-orbitron text-molten-gold font-semibold mb-2">Target Profit %</label>
                  <input
                    type="number"
                    value={settings.time_limit_profit_pct ?? ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, time_limit_profit_pct: optionalFloatFromInput(e.target.value) }))}
                    className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                    min="0"
                    step="0.1"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-orbitron text-molten-gold font-semibold mb-2">Time Limit Minutes</label>
                  <input
                    type="number"
                    value={secondsToPreciseMinutesInput(settings.time_limit_seconds)}
                    onChange={(e) => setSettings(prev => ({ ...prev, time_limit_seconds: minutesToSecondsInput(e.target.value) }))}
                    className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                    min="0"
                    step="0.1"
                    placeholder="2"
                  />
                </div>
              </motion.div>
            )}
          </div>

              </motion.div>
            )}
          </div>

          {/* Advanced Filters - Collapsable */}
          <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4 md:p-6">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center justify-between w-full"
            >
              <h3 className="text-base md:text-lg font-orbitron font-semibold text-white">Advanced Filters</h3>
              {showAdvancedFilters ? <ChevronUp size={20} className="text-molten-gold" /> : <ChevronDown size={20} className="text-molten-gold" />}
            </button>

            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-4"
              >
                <div>
                  <label className="block text-sm font-orbitron text-molten-gold mb-2 tracking-wide">
                    Max buys per mirror per hour
                  </label>
                  <input
                    type="number"
                    value={settings.max_buys_per_mirror_per_hour ?? ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      max_buys_per_mirror_per_hour: e.target.value === '' ? undefined : parseInt(e.target.value) || undefined
                    }))}
                    className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                    min="1"
                    step="1"
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-orbitron text-molten-gold mb-2 tracking-wide">
                    Max buys per mirror per day
                  </label>
                  <input
                    type="number"
                    value={settings.max_buys_per_mirror_per_day ?? ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      max_buys_per_mirror_per_day: e.target.value === '' ? undefined : parseInt(e.target.value) || undefined
                    }))}
                    className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                    min="1"
                    step="1"
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-orbitron text-molten-gold mb-2 tracking-wide">
                    Max buys per token per day
                  </label>
                  <input
                    type="number"
                    value={settings.max_buys_per_token_per_day ?? ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      max_buys_per_token_per_day: e.target.value === '' ? undefined : parseInt(e.target.value) || undefined
                    }))}
                    className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                    min="1"
                    step="1"
                    placeholder="1"
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Trading Filters Section */}
          <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4 md:p-6">
            <h3 className="text-base md:text-lg font-orbitron font-semibold text-white mb-4">Trading Filters</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm md:text-base font-orbitron font-semibold text-white">First Purchase Only</h4>
                    <span className="group relative">
                      <Info size={12} className="text-molten-gold cursor-help" />
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 bg-void-black/95 border border-molten-gold/30 rounded-lg p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">When enabled, each mirror wallet can trigger one copied buy per token. If that wallet already bought the same token in your successful logs, the new buy is skipped; other tokens can still be copied.</span>
                    </span>
                  </div>
                  <p className="text-white/40 font-space-grotesk text-xs md:text-sm">Only copy the first purchase per token for each mirror wallet</p>
                </div>
                <motion.button
                  onClick={() => setSettings(prev => ({ ...prev, entry_on_first_swap: !prev.entry_on_first_swap }))}
                  className={`w-12 h-6 rounded-full p-1 transition-all duration-300 flex-shrink-0 ${settings.entry_on_first_swap ? 'bg-molten-gold' : 'bg-gray-600'}`}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="w-4 h-4 bg-white rounded-full"
                    animate={{ x: settings.entry_on_first_swap ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </motion.button>
              </div>

              {/* Buy once per token */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm md:text-base font-orbitron font-semibold text-white mb-1">Buy Once Per Token</h4>
                  <p className="text-white/40 font-space-grotesk text-xs md:text-sm">Never buy the same token twice</p>
                </div>
                <motion.button
                  onClick={() => setSettings(prev => ({ ...prev, buy_once_per_token: !prev.buy_once_per_token }))}
                  className={`w-12 h-6 rounded-full p-1 transition-all duration-300 flex-shrink-0 ${settings.buy_once_per_token ? 'bg-molten-gold' : 'bg-gray-600'}`}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="w-4 h-4 bg-white rounded-full"
                    animate={{ x: settings.buy_once_per_token ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </motion.button>
              </div>

              <div className={`${selectedCoin !== 'sol' ? 'opacity-50 grayscale pointer-events-none' : ''} space-y-5 border-t border-molten-gold/10 pt-5`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="text-sm md:text-base font-orbitron font-semibold text-white mb-1">Only New Mirror Positions</h4>
                      <p className="text-white/40 font-space-grotesk text-xs md:text-sm">Only copy a SOL buy if the mirror wallet held zero of that token immediately before buying</p>
                    </div>
                    <div className="group relative">
                      <div className="w-5 h-5 bg-molten-gold/20 rounded-full flex items-center justify-center cursor-help">
                        <Info size={12} className="text-molten-gold" />
                      </div>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 bg-void-black/95 border border-molten-gold/30 rounded-lg p-3 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                        SOL only. Uses the decoded gRPC pre-token balance from the mirror wallet, so no extra latency is added.
                      </div>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => setSettings(prev => ({ ...prev, copy_only_new_positions: !prev.copy_only_new_positions }))}
                    className={`w-12 h-6 rounded-full p-1 transition-all duration-300 flex-shrink-0 ${settings.copy_only_new_positions ? 'bg-molten-gold' : 'bg-gray-600'}`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      className="w-4 h-4 bg-white rounded-full"
                      animate={{ x: settings.copy_only_new_positions ? 24 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="text-sm md:text-base font-orbitron font-semibold text-white mb-1">Enter On Spike Pullback</h4>
                        <p className="text-white/40 font-space-grotesk text-xs md:text-sm">For fixed buys, wait for a spike above the mirror entry, then buy the pullback</p>
                      </div>
                      <div className="group relative">
                        <div className="w-5 h-5 bg-molten-gold/20 rounded-full flex items-center justify-center cursor-help">
                          <Info size={12} className="text-molten-gold" />
                        </div>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 bg-void-black/95 border border-molten-gold/30 rounded-lg p-3 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                          SOL fixed buys only. The bot records the mirror entry price from the decoded gRPC swap. With 5% pullback and 1% margin, price must first reach 6% above entry, then return to 5% above entry before buying.
                        </div>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => setSettings(prev => ({ ...prev, spike_entry_enabled: !prev.spike_entry_enabled }))}
                      className={`w-12 h-6 rounded-full p-1 transition-all duration-300 flex-shrink-0 ${settings.spike_entry_enabled ? 'bg-molten-gold' : 'bg-gray-600'}`}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div
                        className="w-4 h-4 bg-white rounded-full"
                        animate={{ x: settings.spike_entry_enabled ? 24 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </motion.button>
                  </div>

                  {settings.spike_entry_enabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3 rounded-lg border border-molten-gold/10 bg-black/20 p-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="flex items-center gap-2 text-xs font-orbitron text-molten-gold mb-2 tracking-wide">
                            Pullback %
                            <span className="group relative">
                              <Info size={12} className="text-molten-gold cursor-help" />
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 bg-void-black/95 border border-molten-gold/30 rounded-lg p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">The buy level above mirror entry after a valid spike. Example: 5 means buy when price returns to entry +5%.</span>
                            </span>
                          </label>
                          <input
                            type="number"
                            value={settings.spike_entry_pullback_percentage}
                            onChange={(e) => setSettings(prev => ({ ...prev, spike_entry_pullback_percentage: parseFloat(e.target.value) || 0 }))}
                            className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-xs font-orbitron text-molten-gold mb-2 tracking-wide">
                            Margin %
                            <span className="group relative">
                              <Info size={12} className="text-molten-gold cursor-help" />
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 bg-void-black/95 border border-molten-gold/30 rounded-lg p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">Extra spike confirmation above the pullback. Pullback 5 and margin 1 requires a 6% spike, then a pullback to 5%.</span>
                            </span>
                          </label>
                          <input
                            type="number"
                            value={settings.spike_entry_margin_percentage}
                            onChange={(e) => setSettings(prev => ({ ...prev, spike_entry_margin_percentage: parseFloat(e.target.value) || 0 }))}
                            className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-2 text-xs font-orbitron text-molten-gold mb-2 tracking-wide">
                            Timeout Seconds
                            <span className="group relative">
                              <Info size={12} className="text-molten-gold cursor-help" />
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 bg-void-black/95 border border-molten-gold/30 rounded-lg p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">How long the bot waits for the spike and pullback before cancelling. Indefinite stores -1.</span>
                            </span>
                          </label>
                          <input
                            type="number"
                            value={settings.spike_entry_timeout_seconds === -1 ? '' : settings.spike_entry_timeout_seconds}
                            onChange={(e) => setSettings(prev => ({ ...prev, spike_entry_timeout_seconds: parseInt(e.target.value, 10) || 0 }))}
                            disabled={settings.spike_entry_timeout_seconds === -1}
                            className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300 disabled:opacity-50"
                            min="0"
                            step="1"
                            placeholder="Indefinite"
                          />
                          <label className="mt-2 flex items-center gap-2 text-[11px] text-white/50 font-space-grotesk">
                            <input
                              type="checkbox"
                              checked={settings.spike_entry_timeout_seconds === -1}
                              onChange={(e) => setSettings(prev => ({ ...prev, spike_entry_timeout_seconds: e.target.checked ? -1 : 300 }))}
                              className="h-4 w-4 accent-molten-gold"
                            />
                            Indefinite timeout
                          </label>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3">
                        <div>
                          <h5 className="text-xs font-orbitron font-semibold text-white mb-1">Only If Mirror Still Holds</h5>
                          <p className="text-white/40 font-space-grotesk text-[11px]">Before buying the pullback, check the mirror wallet still has this token.</p>
                        </div>
                        <motion.button
                          type="button"
                          onClick={() => setSettings(prev => ({ ...prev, spike_entry_require_unsold_mirror: !prev.spike_entry_require_unsold_mirror }))}
                          className={`w-10 h-5 rounded-full p-1 transition-all duration-300 flex-shrink-0 ${settings.spike_entry_require_unsold_mirror ? 'bg-molten-gold' : 'bg-gray-600'}`}
                          whileTap={{ scale: 0.95 }}
                        >
                          <motion.div
                            className="w-3 h-3 bg-white rounded-full"
                            animate={{ x: settings.spike_entry_require_unsold_mirror ? 20 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                  {selectedCoin !== 'sol' && (
                    <p className="text-xs text-molten-gold/70 font-space-grotesk">Spike and new-position controls are SOL-only in v1.</p>
                  )}
                </div>
              </div>

              {/* Mirror Sells Toggle */}
              <div className={`flex items-center justify-between ${!tpSlIsActive ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                <div>
                  <h4 className="text-sm md:text-base font-orbitron font-semibold text-white mb-1">Mirror Sells</h4>
                  <p className="text-white/40 font-space-grotesk text-xs md:text-sm">When TP/SL is active, disable this to ignore mirror wallet sells</p>
                </div>
                <motion.button
                  onClick={() => setSettings(prev => ({ ...prev, mirror_sells_enabled: !prev.mirror_sells_enabled }))}
                  className={`w-12 h-6 rounded-full p-1 transition-all duration-300 flex-shrink-0 ${settings.mirror_sells_enabled ? 'bg-molten-gold' : 'bg-gray-600'}`}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="w-4 h-4 bg-white rounded-full"
                    animate={{ x: settings.mirror_sells_enabled ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </motion.button>
              </div>

              {/* Reverse Copy Trade Checkbox */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h4 className="text-sm md:text-base font-orbitron font-semibold text-white mb-1">Reverse Copy Trade</h4>
                    <p className="text-white/40 font-space-grotesk text-xs md:text-sm">Invert mirror wallet actions</p>
                  </div>
                  <div className="group relative">
                    <div className="w-5 h-5 bg-molten-gold/20 rounded-full flex items-center justify-center cursor-help">
                      <Info size={12} className="text-molten-gold" />
                    </div>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 bg-void-black/95 border border-molten-gold/30 rounded-lg p-3 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                      When enabled, the bot will perform the opposite action of the mirror wallet: when the mirror wallet sells, Prometheus buys.
                    </div>
                  </div>
                </div>
                <motion.button
                  onClick={() => setSettings(prev => ({ ...prev, reverse_copy: !prev.reverse_copy }))}
                  className={`w-12 h-6 rounded-full p-1 transition-all duration-300 flex-shrink-0 ${settings.reverse_copy ? 'bg-molten-gold' : 'bg-gray-600'}`}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="w-4 h-4 bg-white rounded-full"
                    animate={{ x: settings.reverse_copy ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </motion.button>
              </div>
              <div className="border-t border-molten-gold/10 pt-5 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="text-sm md:text-base font-orbitron font-semibold text-white mb-1">Token Filters</h4>
                        <p className="text-white/40 font-space-grotesk text-xs md:text-sm">Filter copied {selectedCoin.toUpperCase()} buys by market cap, liquidity, holder count, and token age</p>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => setSettings(prev => ({ ...prev, rugcheck_filters_enabled: !prev.rugcheck_filters_enabled }))}
                      className={`w-12 h-6 rounded-full p-1 transition-all duration-300 flex-shrink-0 ${settings.rugcheck_filters_enabled ? 'bg-molten-gold' : 'bg-gray-600'}`}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div
                        className="w-4 h-4 bg-white rounded-full"
                        animate={{ x: settings.rugcheck_filters_enabled ? 24 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    </motion.button>
                  </div>

                  {settings.rugcheck_filters_enabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <div>
                        <label className="flex items-center gap-2 text-xs font-orbitron text-molten-gold mb-2 tracking-wide">
                          Min Market Cap USD
                          <span className="group relative">
                            <Info size={12} className="text-molten-gold cursor-help" />
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 bg-void-black/95 border border-molten-gold/30 rounded-lg p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">Skip tokens below this market cap.</span>
                          </span>
                        </label>
                        <input
                          type="number"
                          value={settings.min_market_cap_usd ?? ''}
                          onChange={(e) => setSettings(prev => ({ ...prev, min_market_cap_usd: optionalFloatFromInput(e.target.value) }))}
                          className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                          min="0"
                          step="1"
                          placeholder="No minimum"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-xs font-orbitron text-molten-gold mb-2 tracking-wide">
                          Max Market Cap USD
                          <span className="group relative">
                            <Info size={12} className="text-molten-gold cursor-help" />
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 bg-void-black/95 border border-molten-gold/30 rounded-lg p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">Skip tokens above this market cap.</span>
                          </span>
                        </label>
                        <input
                          type="number"
                          value={settings.max_market_cap_usd ?? ''}
                          onChange={(e) => setSettings(prev => ({ ...prev, max_market_cap_usd: optionalFloatFromInput(e.target.value) }))}
                          className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                          min="0"
                          step="1"
                          placeholder="No maximum"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-xs font-orbitron text-molten-gold mb-2 tracking-wide">
                          Min Liquidity USD
                          <span className="group relative">
                            <Info size={12} className="text-molten-gold cursor-help" />
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 bg-void-black/95 border border-molten-gold/30 rounded-lg p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">Skip tokens below this liquidity.</span>
                          </span>
                        </label>
                        <input
                          type="number"
                          value={settings.min_liquidity_usd ?? ''}
                          onChange={(e) => setSettings(prev => ({ ...prev, min_liquidity_usd: optionalFloatFromInput(e.target.value) }))}
                          className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                          min="0"
                          step="1"
                          placeholder="No minimum"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-xs font-orbitron text-molten-gold mb-2 tracking-wide">
                          Max Liquidity USD
                          <span className="group relative">
                            <Info size={12} className="text-molten-gold cursor-help" />
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 bg-void-black/95 border border-molten-gold/30 rounded-lg p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">Skip tokens above this liquidity.</span>
                          </span>
                        </label>
                        <input
                          type="number"
                          value={settings.max_liquidity_usd ?? ''}
                          onChange={(e) => setSettings(prev => ({ ...prev, max_liquidity_usd: optionalFloatFromInput(e.target.value) }))}
                          className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                          min="0"
                          step="1"
                          placeholder="No maximum"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-xs font-orbitron text-molten-gold mb-2 tracking-wide">
                          Min Holders
                          <span className="group relative">
                            <Info size={12} className="text-molten-gold cursor-help" />
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 bg-void-black/95 border border-molten-gold/30 rounded-lg p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">Skip tokens with fewer holders.</span>
                          </span>
                        </label>
                        <input
                          type="number"
                          value={settings.min_holders ?? ''}
                          onChange={(e) => setSettings(prev => ({ ...prev, min_holders: optionalIntFromInput(e.target.value) }))}
                          className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                          min="0"
                          step="1"
                          placeholder="No minimum"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-xs font-orbitron text-molten-gold mb-2 tracking-wide">
                          Max Holders
                          <span className="group relative">
                            <Info size={12} className="text-molten-gold cursor-help" />
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 bg-void-black/95 border border-molten-gold/30 rounded-lg p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">Skip tokens with more holders.</span>
                          </span>
                        </label>
                        <input
                          type="number"
                          value={settings.max_holders ?? ''}
                          onChange={(e) => setSettings(prev => ({ ...prev, max_holders: optionalIntFromInput(e.target.value) }))}
                          className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                          min="0"
                          step="1"
                          placeholder="No maximum"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-xs font-orbitron text-molten-gold mb-2 tracking-wide">
                          Min Token Age Minutes
                          <span className="group relative">
                            <Info size={12} className="text-molten-gold cursor-help" />
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 bg-void-black/95 border border-molten-gold/30 rounded-lg p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">Skip tokens younger than this age using the available token metadata timestamp.</span>
                          </span>
                        </label>
                        <input
                          type="number"
                          value={secondsToMinutesInput(settings.min_token_age_seconds)}
                          onChange={(e) => setSettings(prev => ({ ...prev, min_token_age_seconds: minutesToSecondsInput(e.target.value) }))}
                          className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                          min="0"
                          step="1"
                          placeholder="No minimum"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 text-xs font-orbitron text-molten-gold mb-2 tracking-wide">
                          Max Token Age Minutes
                          <span className="group relative">
                            <Info size={12} className="text-molten-gold cursor-help" />
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 bg-void-black/95 border border-molten-gold/30 rounded-lg p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">Skip tokens older than this age using the available token metadata timestamp.</span>
                          </span>
                        </label>
                        <input
                          type="number"
                          value={secondsToMinutesInput(settings.max_token_age_seconds)}
                          onChange={(e) => setSettings(prev => ({ ...prev, max_token_age_seconds: minutesToSecondsInput(e.target.value) }))}
                          className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                          min="0"
                          step="1"
                          placeholder="No maximum"
                        />
                      </div>
                      {selectedCoin === 'sol' && (
                        <>
                          <div className="md:col-span-2 rounded-lg border border-molten-gold/20 bg-molten-gold/5 p-3 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h5 className="text-xs font-orbitron text-molten-gold tracking-wide mb-1">Locked Liquidity</h5>
                                <p className="text-xs text-white/50 font-space-grotesk">Skip SOL tokens that do not show locked LP liquidity.</p>
                              </div>
                              <motion.button
                                onClick={() => setSettings(prev => ({ ...prev, require_locked_liquidity: !prev.require_locked_liquidity }))}
                                className={`w-12 h-6 rounded-full p-1 transition-all duration-300 flex-shrink-0 ${settings.require_locked_liquidity ? 'bg-molten-gold' : 'bg-gray-600'}`}
                                whileTap={{ scale: 0.95 }}
                              >
                                <motion.div
                                  className="w-4 h-4 bg-white rounded-full"
                                  animate={{ x: settings.require_locked_liquidity ? 24 : 0 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                              </motion.button>
                            </div>
                            {settings.require_locked_liquidity && (
                              <div>
                                <label className="flex items-center gap-2 text-xs font-orbitron text-molten-gold mb-2 tracking-wide">
                                  Min Locked LP %
                                  <span className="group relative">
                                    <Info size={12} className="text-molten-gold cursor-help" />
                                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-void-black/95 border border-molten-gold/30 rounded-lg p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">Optional. Leave blank to require any locked LP, or set a minimum weighted locked percentage.</span>
                                  </span>
                                </label>
                                <input
                                  type="number"
                                  value={settings.min_lp_locked_pct ?? ''}
                                  onChange={(e) => setSettings(prev => ({ ...prev, min_lp_locked_pct: optionalFloatFromInput(e.target.value) }))}
                                  className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  placeholder="Any locked LP"
                                />
                              </div>
                            )}
                            <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-void-black/35 px-3 py-2">
                              <Info size={14} className="text-molten-gold mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-white/55 font-space-grotesk leading-relaxed">Prometheus calculates locked LP as a USD-weighted percentage across lockable markets. Markets with no LP supply model are ignored, so tiny secondary pools do not turn a locked primary pool into an automatic fail.</p>
                            </div>
                          </div>
                          <div className="md:col-span-2 rounded-lg border border-molten-gold/20 bg-molten-gold/5 p-3 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h5 className="text-xs font-orbitron text-molten-gold tracking-wide mb-1">Bundler Tracking</h5>
                                <p className="text-xs text-white/50 font-space-grotesk">Skip SOL tokens where connected wallet clusters control more supply than you allow.</p>
                              </div>
                              <motion.button
                                onClick={() => setSettings(prev => ({ ...prev, bundler_tracking_enabled: !prev.bundler_tracking_enabled }))}
                                className={`w-12 h-6 rounded-full p-1 transition-all duration-300 flex-shrink-0 ${settings.bundler_tracking_enabled ? 'bg-molten-gold' : 'bg-gray-600'}`}
                                whileTap={{ scale: 0.95 }}
                              >
                                <motion.div
                                  className="w-4 h-4 bg-white rounded-full"
                                  animate={{ x: settings.bundler_tracking_enabled ? 24 : 0 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                              </motion.button>
                            </div>
                            {settings.bundler_tracking_enabled && (
                              <div>
                                <label className="flex items-center gap-2 text-xs font-orbitron text-molten-gold mb-2 tracking-wide">
                                  Max Cluster Supply %
                                  <span className="group relative">
                                    <Info size={12} className="text-molten-gold cursor-help" />
                                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-void-black/95 border border-molten-gold/30 rounded-lg p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">Optional. Leave blank to skip any detected connected cluster, or set the largest cluster percentage you still allow.</span>
                                  </span>
                                </label>
                                <input
                                  type="number"
                                  value={settings.max_bundle_supply_pct ?? ''}
                                  onChange={(e) => setSettings(prev => ({ ...prev, max_bundle_supply_pct: optionalFloatFromInput(e.target.value) }))}
                                  className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  placeholder="Any detected cluster"
                                />
                              </div>
                            )}
                            <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-void-black/35 px-3 py-2">
                              <Info size={14} className="text-molten-gold mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-white/55 font-space-grotesk leading-relaxed">Connected accounts are grouped into coordinated clusters. Token amount for each cluster is divided by total supply, and the filter compares your threshold to the largest cluster. Total clustered supply is kept for context in logs.</p>
                            </div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                  <p className="text-xs text-molten-gold/70 font-space-grotesk">Applying these filters adds a metadata check before each copied {selectedCoin.toUpperCase()} buy.</p>
                </div>
            </div>
          </div>

          {/* Tracking Activities - Solana Only */}
          {selectedCoin === 'sol' && (
            <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4 md:p-6">
              <h3 className="text-base md:text-lg font-orbitron font-semibold text-white mb-4">Tracking Activities</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'launches', label: 'Launches' },
                  { id: 'swaps', label: 'Swaps' },
                  { id: 'both', label: 'Both' }
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      tracking_type: typeof prev.tracking_type === 'string'
                        ? { type: type.id }
                        : { ...prev.tracking_type, type: type.id }
                    }))}
                    className={`px-4 py-3 rounded-lg border font-orbitron font-bold text-xs transition-all duration-300 ${(typeof settings.tracking_type === 'string' ? settings.tracking_type : settings.tracking_type?.type) === type.id
                      ? 'bg-molten-gold text-void-black border-molten-gold shadow-[0_0_15px_rgba(255,184,0,0.3)]'
                      : 'bg-void-black/40 text-white/60 border-white/10 hover:border-molten-gold/50'
                      }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {(typeof settings.tracking_type === 'string' ? settings.tracking_type : settings.tracking_type?.type) === 'launches' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield size={16} className="text-blue-400" />
                      <h4 className="text-xs font-orbitron font-bold text-blue-400 uppercase tracking-wider">Launch Filters</h4>
                    </div>
                    <motion.button
                      onClick={() => setSettings(prev => ({
                        ...prev,
                        tracking_type: {
                          ...(typeof prev.tracking_type === 'string' ? { type: prev.tracking_type } : prev.tracking_type),
                          only_launched_by_wallet: !(typeof prev.tracking_type === 'string' ? false : prev.tracking_type?.only_launched_by_wallet)
                        }
                      }))}
                      className={`w-10 h-5 rounded-full p-1 transition-all duration-300 ${(typeof settings.tracking_type === 'string' ? false : settings.tracking_type?.only_launched_by_wallet)
                        ? 'bg-blue-500' : 'bg-gray-700'
                        }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      <motion.div
                        className="w-3 h-3 bg-white rounded-full"
                        animate={{ x: (typeof settings.tracking_type === 'string' ? false : settings.tracking_type?.only_launched_by_wallet) ? 20 : 0 }}
                      />
                    </motion.button>
                  </div>

                  <p className="text-[12px] text-blue-400/60 font-space-grotesk leading-relaxed">
                    When enabled, the bot will only copy trades for tokens that were launched by the tracked wallet itself.
                  </p>

                  {(typeof settings.tracking_type === 'string' ? false : settings.tracking_type?.only_launched_by_wallet) && (
                    <div className="space-y-3 pt-2 border-t border-blue-500/10">
                      <div>
                        <label className="block text-[10px] font-orbitron text-blue-400 mb-2 uppercase tracking-widest">Initial Launch Period</label>
                        <select
                          value={typeof settings.tracking_type === 'string' ? 0 : (settings.tracking_type?.launch_period_type === 'custom' ? 'custom' : settings.tracking_type?.launch_period || 0)}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSettings(prev => ({
                              ...prev,
                              tracking_type: {
                                ...(typeof prev.tracking_type === 'string' ? { type: prev.tracking_type } : prev.tracking_type),
                                launch_period: val === 'custom' ? (typeof prev.tracking_type === 'string' ? 0 : prev.tracking_type?.launch_period || 0) : parseInt(val),
                                launch_period_type: val === 'custom' ? 'custom' : 'preset'
                              }
                            }));
                          }}
                          className="w-full bg-void-black/50 border border-blue-500/20 rounded-lg px-3 py-2 text-white font-space-grotesk text-xs focus:border-blue-400 focus:outline-none"
                        >
                          <option value={0}>All Time</option>
                          <option value={86400}>Last 24 Hours</option>
                          <option value={604800}>Last Week</option>
                          <option value={2592000}>Last Month</option>
                          <option value="custom">Custom Seconds</option>
                        </select>
                      </div>

                      {(typeof settings.tracking_type === 'string' ? false : settings.tracking_type?.launch_period_type === 'custom') && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-[10px] font-orbitron text-blue-400 uppercase tracking-widest">Custom Seconds</label>
                            <span className="text-[10px] text-blue-400/60 font-space-grotesk">{formatDuration(typeof settings.tracking_type === 'string' ? 0 : settings.tracking_type?.launch_period || 0)}</span>
                          </div>
                          <input
                            type="number"
                            value={typeof settings.tracking_type === 'string' ? 0 : settings.tracking_type?.launch_period || 0}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setSettings(prev => ({
                                ...prev,
                                tracking_type: {
                                  ...(typeof prev.tracking_type === 'string' ? { type: prev.tracking_type } : prev.tracking_type),
                                  launch_period: isNaN(val) ? 0 : val
                                }
                              }));
                            }}
                            className="w-full bg-void-black/50 border border-blue-500/20 rounded-lg px-3 py-2 text-white font-space-grotesk text-xs focus:border-blue-400 focus:outline-none"
                          />
                          <div className="flex flex-wrap gap-2">
                            {[
                              { label: '+1m', val: 60 },
                              { label: '+1h', val: 3600 },
                              { label: '+1d', val: 86400 },
                              { label: 'Reset', val: 0, reset: true }
                            ].map((btn) => (
                              <button
                                key={btn.label}
                                onClick={() => {
                                  setSettings(prev => ({
                                    ...prev,
                                    tracking_type: {
                                      ...(typeof prev.tracking_type === 'string' ? { type: prev.tracking_type } : prev.tracking_type),
                                      launch_period: btn.reset ? 0 : ((typeof prev.tracking_type === 'string' ? 0 : prev.tracking_type?.launch_period) || 0) + btn.val
                                    }
                                  }));
                                }}
                                className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-[10px] text-blue-400 hover:bg-blue-500/20 transition-colors font-orbitron"
                              >
                                {btn.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              <p className="text-[10px] md:text-xs text-white/40 font-space-grotesk mt-3">
                Select which activities to track for newly added wallets.
              </p>
            </div>
          )}

          {/* Notification Settings */}
          <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4 md:p-6">
            <h3 className="text-base md:text-lg font-orbitron font-semibold text-white mb-4">Notification Settings</h3>
            <div className="space-y-6">
              {/* Notifications Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm md:text-base font-orbitron font-semibold text-white mb-1">Swap Notifications</h4>
                  <p className="text-white/40 font-space-grotesk text-xs md:text-sm">Receive sound alerts when a swap is executed</p>
                </div>
                <motion.button
                  onClick={() => setSettings(prev => ({ ...prev, swap_notifications_enabled: !prev.swap_notifications_enabled }))}
                  className={`w-12 h-6 rounded-full p-1 transition-all duration-300 flex-shrink-0 ${settings.swap_notifications_enabled ? 'bg-molten-gold' : 'bg-gray-600'}`}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="w-4 h-4 bg-white rounded-full"
                    animate={{ x: settings.swap_notifications_enabled ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </motion.button>
              </div>

              {/* Notification Sound Selection */}
              {settings.swap_notifications_enabled && (
                <div className="space-y-4">
                  <label className="block text-sm font-orbitron text-molten-gold mb-2 tracking-wide uppercase">
                    Notification Sound
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={settings.swap_notification_sound}
                      onChange={(e) => setSettings(prev => ({ ...prev, swap_notification_sound: e.target.value }))}
                      className="flex-1 bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300 min-w-0"
                    >
                      {availableSounds.map(sound => (
                        <option key={sound} value={sound}>{sound}</option>
                      ))}
                    </select>
                    <motion.button
                      onClick={() => testHearSound(settings.swap_notification_sound)}
                      disabled={playingSound !== null}
                      className="px-4 py-2 bg-molten-gold/10 border border-molten-gold/30 text-molten-gold rounded-lg hover:bg-molten-gold/20 transition-colors duration-300 flex items-center justify-center gap-2 font-orbitron font-semibold text-xs disabled:opacity-50"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {playingSound === settings.swap_notification_sound ? 'Playing...' : 'Test Hear'}
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <motion.button
          onClick={handleSave}
          disabled={loading}
          className={`w-full py-4 rounded-lg font-orbitron font-bold tracking-widest transition-all duration-300 ${loading ? 'bg-molten-gold/50 cursor-not-allowed' : 'bg-molten-gold text-void-black hover:brightness-110 shadow-lg shadow-molten-gold/20'
            }`}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {loading ? 'SYNCING SETTINGS...' : 'SAVE SETTINGS'}
        </motion.button>

        {/* Add Wallet Modal */}
        {/* Add Wallet Modal */}
        <CreateWalletModal
          isOpen={isAddWalletOpen}
          onClose={() => setIsAddWalletOpen(false)}
        />
      </div>
    </DashboardLayout>
  )
}
