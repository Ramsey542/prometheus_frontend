'use client'

import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Wallet,
  LogOut,
  Copy,
  Eye,
  EyeOff,
  Shield,
  Activity,
  TrendingUp,
  Edit3,
  Settings,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
  RefreshCw,
  Share2,
  Download,
  X,
  ExternalLink,
  Upload,
  Info,
  Power,
  Save,
  Target,
  AlertCircle
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { logout, getProfile, setCoin } from '../../store/slices/authSlice'
import { useState, useEffect, Suspense, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, useSearchParams } from 'next/navigation'
import ProfileLayout from '../../components/ProfileLayout'
import { walletTrackerApi } from '../../services/walletTrackerApi'
import { TrackedWallet, TrackedWalletCreate, CopyTradingLog, CopyTradingStats, DipLadder } from '../../store/types/auth'
import { authApi } from '@/services/authApi'
import { config } from '../../lib/config'
import CreateWalletModal from '../../components/CreateWalletModal'
import DipLadderPageContent from './dip-ladder/DipLadderPageContent'

const DIP_LADDER_NATIVE_TOKENS = {
  sol: {
    label: 'SOL',
    name: 'Native SOL',
    address: 'So11111111111111111111111111111111111111112'
  },
  bnb: {
    label: 'BNB',
    name: 'Native BNB',
    address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c'
  }
} as const

const formatAmount = (amount: string | null, coin: 'sol' | 'bnb', isToken: boolean = false, tokenDecimals?: number | null): string => {
  if (!amount) return 'N/A'
  try {
    const numAmount = BigInt(amount)
    let decimals: number

    if (isToken && tokenDecimals !== null && tokenDecimals !== undefined) {
      decimals = tokenDecimals
    } else {
      decimals = coin === 'sol' ? 9 : 18
    }

    const divisor = BigInt(10 ** decimals)
    const wholePart = numAmount / divisor
    const fractionalPart = numAmount % divisor

    const wholeStr = wholePart.toString()
    let fractionalStr = fractionalPart.toString().padStart(decimals, '0')

    while (fractionalStr.endsWith('0') && fractionalStr.length > 0) {
      fractionalStr = fractionalStr.slice(0, -1)
    }

    if (fractionalStr === '') {
      return wholeStr
    }

    const maxDisplayDecimals = decimals === 18 ? 8 : decimals === 9 ? 6 : 4
    const trimmedFractional = fractionalStr.slice(0, maxDisplayDecimals)

    return `${wholeStr}.${trimmedFractional}`
  } catch {
    const num = parseFloat(amount)
    if (!isNaN(num)) {
      const decimals = isToken && tokenDecimals !== null && tokenDecimals !== undefined
        ? tokenDecimals
        : (coin === 'sol' ? 9 : 18)
      const maxDisplayDecimals = decimals === 18 ? 8 : decimals === 9 ? 6 : 4
      return num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: maxDisplayDecimals,
        useGrouping: false
      })
    }
    return amount
  }
}

const formatUsdPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined || !Number.isFinite(price)) return 'N/A'
  const absPrice = Math.abs(price)
  const fractionDigits = absPrice > 0 && absPrice < 0.0001 ? 12 : 8
  const formatted = price.toLocaleString('en-US', {
    minimumFractionDigits: absPrice > 0 && absPrice < 0.0001 ? 6 : 0,
    maximumFractionDigits: fractionDigits,
    useGrouping: false
  })
  return `$${formatted}`
}

const formatProfileBalance = (value: string | number | null | undefined, maxDecimals: number = 6): string => {
  const amount = Number(value ?? 0)
  if (!Number.isFinite(amount)) return '0'
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
    useGrouping: false
  })
}

const parseLogEventData = (eventData: string | null | undefined): any => {
  try {
    return eventData ? JSON.parse(eventData) : {}
  } catch {
    return {}
  }
}

const SPIKE_ENTRY_ACTIVE_STATUSES = new Set(['waiting_spike', 'waiting_pullback'])

const toFiniteNumber = (value: unknown): number | null => {
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : null
}

const formatSpikeEntryPrice = (price: unknown): string => {
  const value = toFiniteNumber(price)
  if (value === null) return 'N/A'
  const absPrice = Math.abs(value)
  return value.toLocaleString('en-US', {
    minimumFractionDigits: absPrice > 0 && absPrice < 0.0001 ? 6 : 0,
    maximumFractionDigits: absPrice > 0 && absPrice < 0.0001 ? 12 : 8,
    useGrouping: false
  })
}

const formatSpikeEntryPercentage = (value: unknown): string => {
  const num = toFiniteNumber(value)
  if (num === null) return 'N/A'
  return `${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2, useGrouping: false })}%`
}

const formatSpikeEntryBalance = (value: unknown): string => {
  const num = toFiniteNumber(value)
  if (num === null) return 'N/A'
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 6, useGrouping: false })
}

const formatSpikeEntryStatus = (status: string | null | undefined): string => {
  if (!status) return 'Unknown'
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

const formatSpikeEntryTimeout = (seconds: unknown): string => {
  const value = toFiniteNumber(seconds)
  if (value === null) return 'N/A'
  if (value === -1) return 'Indefinite'
  return formatDurationTooltip(value)
}

const isSpikeEntryLog = (log: CopyTradingLog, eventData: any = parseLogEventData(log.event_data)): boolean => {
  return Boolean(
    log.is_spike_entry ||
    log.event_type === 'spike_entry' ||
    log.spike_entry_monitor ||
    eventData?.strategy === 'spike_entry' ||
    eventData?.spike_entry === true ||
    eventData?.spike_entry_id
  )
}

const getSpikeEntryDetails = (log: CopyTradingLog, eventData: any = parseLogEventData(log.event_data)) => {
  const monitor = log.spike_entry_monitor
  return {
    id: monitor?.id ?? eventData?.spike_entry_id ?? null,
    status: monitor?.status ?? eventData?.status ?? log.status ?? null,
    token: monitor?.token_address ?? eventData?.target_token ?? log.target_token ?? null,
    mirrorEntryPrice: monitor?.mirror_entry_price ?? eventData?.mirror_entry_price ?? null,
    spikeTargetPrice: monitor?.spike_target_price ?? eventData?.spike_target_price ?? null,
    pullbackTargetPrice: monitor?.pullback_target_price ?? eventData?.pullback_target_price ?? null,
    pullbackPercentage: monitor?.pullback_percentage ?? eventData?.pullback_percentage ?? null,
    marginPercentage: monitor?.margin_percentage ?? eventData?.margin_percentage ?? null,
    timeoutSeconds: monitor?.timeout_seconds ?? eventData?.timeout_seconds ?? null,
    currentPrice: monitor?.current_price ?? eventData?.current_price ?? null,
    maxSeenPrice: monitor?.max_seen_price ?? eventData?.max_seen_price ?? null,
    requireUnsoldMirror: eventData?.spike_entry_require_unsold_mirror ?? eventData?.mirror_balance_check_enabled ?? false,
    mirrorBalanceTokens: eventData?.mirror_balance_tokens ?? null
  }
}

const getStableTradeAmount = (profile: any, coin: 'sol' | 'bnb') => {
  return coin === 'sol' ? profile?.usdt_trade_amount : profile?.usdc_trade_amount
}

const formatDate = (dateString: string, includeSeconds: boolean = false): string => {
  if (!dateString) return 'N/A'

  let utcString = dateString
  if (!utcString.endsWith('Z') && !utcString.includes('+')) {
    utcString = utcString.replace(' ', 'T') + 'Z'
  }

  try {
    return new Date(utcString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: true
    })
  } catch {
    return dateString
  }
}

const formatDurationTooltip = (seconds: number) => {
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

const minutesToSecondsInput = (value: string): number | null => {
  const minutes = optionalFloatFromInput(value)
  return minutes === null ? null : Math.floor(minutes * 60)
}

const isOpenDipLadderLot = (status: string) => status === 'open' || status === 'selling' || status === 'sell_blocked'
const isClosedDipLadderLot = (status: string) => status === 'sold' || status === 'settled'
const isDipLadderLotRetryCoolingDown = (lot: DipLadder['lots'][number]) => {
  if (lot.status !== 'open' || !lot.sell_retry_after) return false
  const retryTime = new Date(lot.sell_retry_after).getTime()
  return Number.isFinite(retryTime) && retryTime > Date.now()
}
const dipLadderLotStatusLabel = (lot: DipLadder['lots'][number], isClosedLot: boolean) => {
  if (isClosedLot) return 'SOLD'
  if (lot.status === 'sell_blocked') return 'SELL BLOCKED'
  if (isDipLadderLotRetryCoolingDown(lot)) return 'COOLDOWN'
  return lot.status.toUpperCase()
}
const dipLadderLotStatusClass = (lot: DipLadder['lots'][number], isClosedLot: boolean) => {
  if (isClosedLot) return 'border-green-400/25 bg-green-500/10 text-green-300'
  if (lot.status === 'sell_blocked') return 'border-red-400/35 bg-red-500/10 text-red-300'
  if (isDipLadderLotRetryCoolingDown(lot)) return 'border-yellow-400/35 bg-yellow-500/10 text-yellow-300'
  return 'border-blue-400/25 bg-blue-500/10 text-blue-300'
}

function ProfilePageContent() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, wallet, profile, isLoading, error, selectedCoin } = useAppSelector((state) => state.auth)
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false)
  const [trackedWallets, setTrackedWallets] = useState<TrackedWallet[]>([])
  const [newWalletAddress, setNewWalletAddress] = useState('')
  const [walletTrackerLoading, setWalletTrackerLoading] = useState(false)
  const [walletTrackerError, setWalletTrackerError] = useState<string | null>(null)
  const [walletTrackerSuccess, setWalletTrackerSuccess] = useState<string | null>(null)

  const [walletsPage, setWalletsPage] = useState(1)
  const [walletsTotalPages, setWalletsTotalPages] = useState(1)
  const [walletsTotal, setWalletsTotal] = useState(0)

  const [trackerLogs, setTrackerLogs] = useState<CopyTradingLog[]>([])
  const [logsPage, setLogsPage] = useState(1)
  const [logsTotalPages, setLogsTotalPages] = useState(1)
  const [logsTotal, setLogsTotal] = useState(0)
  const [logsLoading, setLogsLoading] = useState(false)
  const [initialLogsLoading, setInitialLogsLoading] = useState(false)
  const [coinSwitching, setCoinSwitching] = useState(false)
  const [logTypeFilter, setLogTypeFilter] = useState<string>('all')
  const [logStatusFilter, setLogStatusFilter] = useState<string>('all')
  const [logSideFilter, setLogSideFilter] = useState<string>('all')
  const [logWalletFilter, setLogWalletFilter] = useState<string>('all')
  const [balanceRefreshing, setBalanceRefreshing] = useState(false)
  const [tradeAmountUpdating, setTradeAmountUpdating] = useState(false)
  const [tradeAmountValue, setTradeAmountValue] = useState<string>('')
  const [isEditingTradeAmount, setIsEditingTradeAmount] = useState(false)
  const [tradeAmountSuccess, setTradeAmountSuccess] = useState<string | null>(null)
  const [tradeAmountError, setTradeAmountError] = useState<string | null>(null)
  const [stableTradeAmountUpdating, setStableTradeAmountUpdating] = useState(false)
  const [stableTradeAmountValue, setStableTradeAmountValue] = useState<string>('')
  const [isEditingStableTradeAmount, setIsEditingStableTradeAmount] = useState(false)
  const [stableTradeAmountError, setStableTradeAmountError] = useState<string | null>(null)
  const [walletSettings, setWalletSettings] = useState<{ [key: string]: any }>({})
  const [showWalletSettings, setShowWalletSettings] = useState<number | string | null>(null)
  const [walletSettingsLoading, setWalletSettingsLoading] = useState(false)
  const [walletSettingsSuccess, setWalletSettingsSuccess] = useState<string | null>(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<{ [key: string]: boolean }>({})
  const [showAllTP, setShowAllTP] = useState<{ [key: string]: boolean }>({})
  const [showAllSL, setShowAllSL] = useState<{ [key: string]: boolean }>({})
  const [tpValidationErrors, setTpValidationErrors] = useState<{ [key: string]: string | null }>({})
  const [slValidationErrors, setSlValidationErrors] = useState<{ [key: string]: string | null }>({})
  const [tpSlIsActive, setTpSlIsActive] = useState<{ [key: string]: boolean }>({})
  const [stopTrackingModal, setStopTrackingModal] = useState<{ open: boolean, walletAddress: string | null, isActive: boolean, btdFullActive?: boolean, btdPartialActive?: boolean, dipLadderActive?: boolean, trackingType?: string, walletId?: number }>({ open: false, walletAddress: null, isActive: false })
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [editingCustomName, setEditingCustomName] = useState<number | string | null>(null)
  const [customNameValue, setCustomNameValue] = useState<string>('')
  const [customNameLoading, setCustomNameLoading] = useState<number | string | null>(null)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawDestination, setWithdrawDestination] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawSuccess, setWithdrawSuccess] = useState<any>(null)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)
  const [copyTradingStats, setCopyTradingStats] = useState<CopyTradingStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [pnlImageModal, setPnlImageModal] = useState<{ open: boolean; imageUrl: string | null; loading: boolean }>({ open: false, imageUrl: null, loading: false })
  const [showPrivateKeyWarning, setShowPrivateKeyWarning] = useState(false)
  const [isDebugMode, setIsDebugMode] = useState(false)
  const [debugModeLoading, setDebugModeLoading] = useState(false)
  const [isWalletListOpen, setIsWalletListOpen] = useState(false)
  const [walletPerfPage, setWalletPerfPage] = useState(0)
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false)
  const [bulkWallets, setBulkWallets] = useState<string[]>([])
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [availableSounds, setAvailableSounds] = useState<string[]>([])
  const [playingSound, setPlayingSound] = useState<string | null>(null)
  const [showTrackingOptions, setShowTrackingOptions] = useState<{ open: boolean; type: 'single' | 'bulk' }>({ open: false, type: 'single' })
  const [selectedTrackingType, setSelectedTrackingType] = useState<string>('both')
  const [defaultTrackingType, setDefaultTrackingType] = useState<string>('both')
  const [isUpdatingTrackingType, setIsUpdatingTrackingType] = useState(false)
  const [trackerActiveView, setTrackerActiveView] = useState<'wallets' | 'tokens'>('wallets')
  const [trackedPositions, setTrackedPositions] = useState<Record<string, any>>({})
  const [trackedPositionsLoading, setTrackedPositionsLoading] = useState(false)
  const [dipLadders, setDipLadders] = useState<DipLadder[]>([])
  const [dipLaddersLoading, setDipLaddersLoading] = useState(false)
  const [dipLadderSelectedId, setDipLadderSelectedId] = useState<number | null>(null)
  const [dipLadderForm, setDipLadderForm] = useState({
    token_address: '',
    dip_ladder_drop_percentage: 5,
    dip_ladder_profit_percentage: 5,
    max_buy_count: '',
    max_drawdown_percentage: '',
    update_buy_trigger_on_sell: false,
    is_active: false
  })
  const [dipLadderSaving, setDipLadderSaving] = useState(false)
  const [dipLadderDeleteModal, setDipLadderDeleteModal] = useState<{ open: boolean; ladder: DipLadder | null }>({ open: false, ladder: null })
  const [dipLadderDeleting, setDipLadderDeleting] = useState(false)
  const [dipLadderRetryingLotId, setDipLadderRetryingLotId] = useState<number | null>(null)

  const handleToggleDebugMode = async () => {
    if (!profile?.is_admin) return
    try {
      setDebugModeLoading(true)
      const result = await authApi.toggleDebugMode()
      setIsDebugMode(result.is_debug_mode)
      dispatch(getProfile(selectedCoin))
    } catch (err: any) {
      setWalletTrackerError(err.message || 'Failed to toggle debug mode')
    } finally {
      setDebugModeLoading(false)
    }
  }

  useEffect(() => {
    if (profile?.is_debug_mode !== undefined) {
      setIsDebugMode(profile.is_debug_mode)
    }
  }, [profile?.is_debug_mode])

  const currentSection = searchParams.get('section') || 'overview'


  const fetchDefaultSettings = useCallback(async () => {
    try {
      const response = await fetch(`${config.apiBaseUrl}/copy-trading/wallet-settings?coin_type=${selectedCoin}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setDefaultTrackingType(data.tracking_type || 'both')
      }
    } catch (err) {
      console.error('Failed to fetch default settings:', err)
    }
  }, [selectedCoin])

  useEffect(() => {
    if (user) {
      dispatch(getProfile(selectedCoin))
      fetchDefaultSettings()
    }
  }, [dispatch, user, selectedCoin, fetchDefaultSettings])

  const handleUpdateGlobalTrackingType = async (type: string) => {
    try {
      setIsUpdatingTrackingType(true)
      // First fetch current settings to avoid overwriting with defaults if possible
      const currentResp = await fetch(`${config.apiBaseUrl}/copy-trading/wallet-settings?coin_type=${selectedCoin}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      })
      let currentSettings = {}
      if (currentResp.ok) {
        currentSettings = await currentResp.json()
      }

      const payload = {
        ...currentSettings,
        tracking_type: type,
        coin_type: selectedCoin
      }

      const response = await fetch(`${config.apiBaseUrl}/copy-trading/wallet-settings?coin_type=${selectedCoin}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setDefaultTrackingType(type)
        setTrackedWallets(prev => prev.map(w =>
          w.is_default ? { ...w, tracking_type: type } : w
        ))
        setWalletTrackerSuccess('Default tracking type updated successfully!')
      } else {
        const errorData = await response.json()
        setWalletTrackerError(errorData.detail || 'Failed to update default tracking type')
      }
    } catch (err: any) {
      setWalletTrackerError(err.message || 'Failed to update default tracking type')
    } finally {
      setIsUpdatingTrackingType(false)
    }
  }

  useEffect(() => {
    if (user && profile && currentSection === 'overview') {
      const hasSeenWarning = localStorage.getItem('private_key_warning_seen')
      if (!hasSeenWarning) {
        setShowPrivateKeyWarning(true)
      }
    }
  }, [user, profile, currentSection])

  useEffect(() => {
    if (profile?.trade_amount !== undefined) {

      setTradeAmountValue(profile.trade_amount.toString())
    }
  }, [profile?.trade_amount])

  useEffect(() => {
    const stableAmount = getStableTradeAmount(profile, selectedCoin)
    setStableTradeAmountValue(stableAmount !== null && stableAmount !== undefined ? stableAmount.toString() : '')
  }, [profile?.usdt_trade_amount, profile?.usdc_trade_amount, selectedCoin])

  useEffect(() => {
    if (tradeAmountSuccess) {
      const timer = setTimeout(() => {
        setTradeAmountSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [tradeAmountSuccess])

  useEffect(() => {
    if (user && (currentSection === 'wallet-tracker' || currentSection === 'tracker-logs')) {
      setCoinSwitching(true)
      setTrackedWallets([])
      setTrackerLogs([])
      setDipLadders([])
      setCopyTradingStats(null)
      setWalletSettings({})
      setLogsPage(1)
      setLogsTotalPages(1)
      setLogsTotal(0)
      setWalletsPage(1)
      setWalletsTotalPages(1)
      setWalletsTotal(0)
      setLogTypeFilter('all')
      setLogStatusFilter('all')
      setLogSideFilter('all')
      setLogWalletFilter('all')

      const fetchData = async () => {
        await Promise.all([
          fetchTrackedWallets(),
          fetchCopyTradingStats(),
          fetchTrackedPositions(),
          fetchDipLadders(),
          currentSection === 'tracker-logs' ? fetchAllLogs() : Promise.resolve()
        ])
        setCoinSwitching(false)
      }

      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentSection, selectedCoin])

  useEffect(() => {
    if (copyTradingStats && trackedWallets && trackedWallets.length > 0) {
      fetchTrackedWallets()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copyTradingStats])

  useEffect(() => {
    if (user && currentSection === 'wallet-tracker' && trackedWallets && trackedWallets.length > 0) {
      trackedWallets.forEach(wallet => {
        if (!walletSettings[wallet.id || wallet.wallet_address]) {
          fetchWalletSettings(wallet.wallet_address, selectedCoin, wallet.id)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentSection, trackedWallets])

  useEffect(() => {
    if (currentSection !== 'dip-ladder') return
    if (dipLadderSelectedId && dipLadders.some(ladder => ladder.id === dipLadderSelectedId)) return
    const formToken = dipLadderForm.token_address.trim().toLowerCase()
    const firstLadder = formToken
      ? dipLadders.find(ladder => ladder.token_address.toLowerCase() === formToken)
      : dipLadders[0]
    if (firstLadder) {
      setDipLadderSelectedId(firstLadder.id)
      setDipLadderForm({
        token_address: firstLadder.token_address,
        dip_ladder_drop_percentage: firstLadder.drop_percentage,
        dip_ladder_profit_percentage: firstLadder.profit_percentage,
        max_buy_count: firstLadder.max_buy_count ? firstLadder.max_buy_count.toString() : '',
        max_drawdown_percentage: firstLadder.max_drawdown_percentage ? firstLadder.max_drawdown_percentage.toString() : '',
        update_buy_trigger_on_sell: Boolean(firstLadder.update_buy_trigger_on_sell),
        is_active: firstLadder.status === 'active'
      })
    } else {
      setDipLadderSelectedId(null)
    }
  }, [currentSection, dipLadders, dipLadderSelectedId, dipLadderForm.token_address])

  useEffect(() => {
    if (user && currentSection === 'tracker-logs' && trackerLogs && trackerLogs.length > 0) {
      trackerLogs.forEach(log => {
        console.log(`the tracker logs are ${log.token_logo_uri}`)
        const trackedWalletAddr = log.event_type === 'tracked_wallet_activity'
          ? log.wallet_address
          : (log.tracked_wallet_address || log.copied_wallet)

        if (trackedWalletAddr) {
          const wallet = trackedWallets.find(w => w.wallet_address === trackedWalletAddr);
          const key = wallet?.id || trackedWalletAddr;
          if (!walletSettings[key]) {
            fetchWalletSettings(trackedWalletAddr, selectedCoin, wallet?.id);
          }
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentSection, trackerLogs])

  useEffect(() => {
    if (user && currentSection === 'tracker-logs' && copyTradingStats?.wallet_stats) {
      copyTradingStats.wallet_stats.forEach(walletStat => {
        const wallet = trackedWallets.find(w => w.wallet_address === walletStat.wallet_address);
        const key = wallet?.id || walletStat.wallet_address;
        if (!walletSettings[key]) {
          fetchWalletSettings(walletStat.wallet_address, selectedCoin, wallet?.id)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentSection, copyTradingStats?.wallet_stats])

  useEffect(() => {
    if (user && currentSection === 'tracker-logs' && !coinSwitching) {
      fetchAllLogs(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logTypeFilter, logStatusFilter, logSideFilter, logWalletFilter])

  const fetchTrackedWallets = async (page: number = 1) => {
    try {
      setWalletTrackerLoading(true)
      setWalletTrackerError(null)
      const response = await walletTrackerApi.getTrackedWallets(page, 10, selectedCoin)

      let wallets = Array.isArray(response) ? response : (response.wallets || [])

      if (copyTradingStats && copyTradingStats.wallet_stats) {
        wallets = wallets.map(wallet => {
          const walletStats = copyTradingStats.wallet_stats.find(stat => stat.wallet_address === wallet.wallet_address)
          if (walletStats) {
            return {
              ...wallet,
              total_matches: walletStats.total_matches,
              successful_trades: walletStats.successful_trades,
              failed_trades: walletStats.failed_trades,
              total_volume_traded: walletStats.total_volume_traded,
              total_pnl: walletStats.total_pnl,
              success_rate: walletStats.success_rate
            }
          }
          return wallet
        })
      }

      if (Array.isArray(response)) {
        setTrackedWallets(wallets)
        setWalletsTotalPages(1)
        setWalletsPage(1)
        setWalletsTotal(wallets.length)
      } else {
        setTrackedWallets(wallets)
        setWalletsTotalPages(response.totalPages || 1)
        setWalletsPage(response.page || 1)
        setWalletsTotal(response.total || 0)
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch tracked wallets'
      setWalletTrackerError(errorMessage)

      if (errorMessage.includes('Session expired') || errorMessage.includes('401')) {
        router.push('/login')
      }
    } finally {
      setWalletTrackerLoading(false)
    }
  }

  const fetchCopyTradingStats = async () => {
    try {
      setStatsLoading(true)
      setStatsError(null)
      const stats = await walletTrackerApi.getCopyTradingStats(selectedCoin)
      setCopyTradingStats(stats)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch copy trading stats'
      setStatsError(errorMessage)

      if (errorMessage.includes('Session expired') || errorMessage.includes('401')) {
        router.push('/login')
      }
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchTrackedPositions = async () => {
    try {
      setTrackedPositionsLoading(true)
      const positions = await walletTrackerApi.getTrackedPositions(selectedCoin)
      setTrackedPositions(positions)
    } catch (err) {
      console.error('Failed to fetch tracked positions:', err)
    } finally {
      setTrackedPositionsLoading(false)
    }
  }

  const fetchDipLadders = async () => {
    try {
      setDipLaddersLoading(true)
      const ladders = await walletTrackerApi.getDipLadders(selectedCoin)
      setDipLadders(Array.isArray(ladders) ? ladders : [])
    } catch (err) {
      console.error('Failed to fetch Dip Ladders:', err)
    } finally {
      setDipLaddersLoading(false)
    }
  }

  const handleSelectDipLadder = (ladder: DipLadder) => {
    setDipLadderSelectedId(ladder.id)
    setDipLadderForm({
      token_address: ladder.token_address,
      dip_ladder_drop_percentage: ladder.drop_percentage,
      dip_ladder_profit_percentage: ladder.profit_percentage,
      max_buy_count: ladder.max_buy_count ? ladder.max_buy_count.toString() : '',
      max_drawdown_percentage: ladder.max_drawdown_percentage ? ladder.max_drawdown_percentage.toString() : '',
      update_buy_trigger_on_sell: Boolean(ladder.update_buy_trigger_on_sell),
      is_active: ladder.status === 'active'
    })
  }

  const handleNewDipLadder = () => {
    setDipLadderSelectedId(null)
    setDipLadderForm({
      token_address: '',
      dip_ladder_drop_percentage: 5,
      dip_ladder_profit_percentage: 5,
      max_buy_count: '',
      max_drawdown_percentage: '',
      update_buy_trigger_on_sell: false,
      is_active: false
    })
  }

  const handleSelectNativeDipLadder = (coin: 'sol' | 'bnb') => {
    const nativeToken = DIP_LADDER_NATIVE_TOKENS[coin]
    const stableAmount = getStableTradeAmount(profile, coin)
    const canActivateNative = stableAmount !== null && stableAmount !== undefined && Number(stableAmount) > 0
    if (coin !== selectedCoin) {
      dispatch(setCoin(coin))
    }
    const matchingLadder = dipLadders.find(ladder =>
      ladder.coin_type === coin && ladder.token_address.toLowerCase() === nativeToken.address.toLowerCase()
    )
    if (matchingLadder) {
      handleSelectDipLadder(matchingLadder)
      return
    }
    if (!canActivateNative) {
      const stableSymbol = coin === 'sol' ? 'USDT' : 'USDC'
      setWalletTrackerError(`Set a ${stableSymbol} trade amount before activating the native ${coin.toUpperCase()} Dip Ladder`)
    }
    setDipLadderSelectedId(null)
    setDipLadderForm(prev => ({
      ...prev,
      token_address: nativeToken.address,
      is_active: canActivateNative
    }))
  }

  const handleSaveDipLadderSettings = async () => {
    if (!dipLadderForm.token_address.trim()) {
      setWalletTrackerError('Token CA is required')
      return
    }
    try {
      setDipLadderSaving(true)
      setWalletTrackerError(null)
      const tokenLower = dipLadderForm.token_address.trim().toLowerCase()
      const saveCoin = tokenLower === DIP_LADDER_NATIVE_TOKENS.bnb.address.toLowerCase()
        ? 'bnb'
        : tokenLower === DIP_LADDER_NATIVE_TOKENS.sol.address.toLowerCase()
          ? 'sol'
          : selectedCoin
      const isNativeSave = tokenLower === DIP_LADDER_NATIVE_TOKENS[saveCoin].address.toLowerCase()
      const stableAmount = getStableTradeAmount(profile, saveCoin)
      if (dipLadderForm.is_active && isNativeSave && (stableAmount === null || stableAmount === undefined || Number(stableAmount) <= 0)) {
        const stableSymbol = saveCoin === 'sol' ? 'USDT' : 'USDC'
        setWalletTrackerError(`Set a ${stableSymbol} trade amount before activating the native ${saveCoin.toUpperCase()} Dip Ladder`)
        return
      }
      const saved = await walletTrackerApi.saveDipLadder(saveCoin, {
        token_address: dipLadderForm.token_address.trim(),
        dip_ladder_drop_percentage: Number(dipLadderForm.dip_ladder_drop_percentage) || 0,
        dip_ladder_profit_percentage: Number(dipLadderForm.dip_ladder_profit_percentage) || 0,
        max_buy_count: optionalIntFromInput(dipLadderForm.max_buy_count),
        max_drawdown_percentage: optionalFloatFromInput(dipLadderForm.max_drawdown_percentage),
        update_buy_trigger_on_sell: dipLadderForm.update_buy_trigger_on_sell,
        is_active: dipLadderForm.is_active
      })
      if (saveCoin !== selectedCoin) {
        dispatch(setCoin(saveCoin))
      }
      setDipLadderSelectedId(saved.id)
      setDipLadderForm({
        token_address: saved.token_address,
        dip_ladder_drop_percentage: saved.drop_percentage,
        dip_ladder_profit_percentage: saved.profit_percentage,
        max_buy_count: saved.max_buy_count ? saved.max_buy_count.toString() : '',
        max_drawdown_percentage: saved.max_drawdown_percentage ? saved.max_drawdown_percentage.toString() : '',
        update_buy_trigger_on_sell: Boolean(saved.update_buy_trigger_on_sell),
        is_active: saved.status === 'active'
      })
      if (saveCoin === selectedCoin) {
        await fetchDipLadders()
      } else {
        const ladders = await walletTrackerApi.getDipLadders(saveCoin)
        setDipLadders(Array.isArray(ladders) ? ladders : [])
      }
    } catch (err: any) {
      setWalletTrackerError(err.message || 'Failed to save Dip Ladder')
    } finally {
      setDipLadderSaving(false)
    }
  }

  const handleRequestDeleteDipLadder = (ladder: DipLadder, event?: { stopPropagation: () => void }) => {
    event?.stopPropagation()
    setDipLadderDeleteModal({ open: true, ladder })
    setWalletTrackerError(null)
  }

  const handleToggleDipLadderToken = async (ladder: DipLadder, event?: { stopPropagation: () => void }) => {
    event?.stopPropagation()
    const nextActive = ladder.status !== 'active'
    const coin = ladder.coin_type as 'sol' | 'bnb'
    const isNativeToken = ladder.token_address.toLowerCase() === DIP_LADDER_NATIVE_TOKENS[coin].address.toLowerCase()
    const stableAmount = getStableTradeAmount(profile, coin)
    if (nextActive && isNativeToken && (stableAmount === null || stableAmount === undefined || Number(stableAmount) <= 0)) {
      const stableSymbol = coin === 'sol' ? 'USDT' : 'USDC'
      setWalletTrackerError(`Set a ${stableSymbol} trade amount before activating the native ${coin.toUpperCase()} Dip Ladder`)
      return
    }
    try {
      setDipLadderSaving(true)
      setWalletTrackerError(null)
      setWalletTrackerSuccess(null)
      const saved = await walletTrackerApi.saveDipLadder(coin, {
        token_address: ladder.token_address,
        dip_ladder_drop_percentage: ladder.drop_percentage,
        dip_ladder_profit_percentage: ladder.profit_percentage,
        max_buy_count: ladder.max_buy_count ?? null,
        max_drawdown_percentage: ladder.max_drawdown_percentage ?? null,
        update_buy_trigger_on_sell: Boolean(ladder.update_buy_trigger_on_sell),
        is_active: nextActive
      })
      setWalletTrackerSuccess(nextActive ? 'Dip Ladder token enabled' : 'Dip Ladder token disabled')
      if (dipLadderSelectedId === ladder.id) {
        setDipLadderForm({
          token_address: saved.token_address,
          dip_ladder_drop_percentage: saved.drop_percentage,
          dip_ladder_profit_percentage: saved.profit_percentage,
          max_buy_count: saved.max_buy_count ? saved.max_buy_count.toString() : '',
          max_drawdown_percentage: saved.max_drawdown_percentage ? saved.max_drawdown_percentage.toString() : '',
          update_buy_trigger_on_sell: Boolean(saved.update_buy_trigger_on_sell),
          is_active: saved.status === 'active'
        })
      }
      await fetchDipLadders()
    } catch (err: any) {
      setWalletTrackerError(err.message || 'Failed to update Dip Ladder token')
    } finally {
      setDipLadderSaving(false)
    }
  }

  const handleDeleteDipLadder = async () => {
    const ladder = dipLadderDeleteModal.ladder
    if (!ladder) return
    try {
      setDipLadderDeleting(true)
      setWalletTrackerError(null)
      setWalletTrackerSuccess(null)
      const response = await walletTrackerApi.deleteDipLadder(ladder.id)
      setWalletTrackerSuccess(response.message || 'Dip Ladder entry deleted')
      setDipLadderDeleteModal({ open: false, ladder: null })
      if (dipLadderSelectedId === ladder.id) {
        setDipLadderSelectedId(null)
        setDipLadderForm({
          token_address: '',
          dip_ladder_drop_percentage: 5,
          dip_ladder_profit_percentage: 5,
          max_buy_count: '',
          max_drawdown_percentage: '',
          update_buy_trigger_on_sell: false,
          is_active: false
        })
      }
      await fetchDipLadders()
    } catch (err: any) {
      setWalletTrackerError(err.message || 'Failed to delete Dip Ladder entry')
    } finally {
      setDipLadderDeleting(false)
    }
  }

  const handleRetryDipLadderLotSell = async (lotId: number, event?: { stopPropagation: () => void }) => {
    event?.stopPropagation()
    try {
      setDipLadderRetryingLotId(lotId)
      setWalletTrackerError(null)
      setWalletTrackerSuccess(null)
      const response = await walletTrackerApi.retryDipLadderLotSell(lotId)
      setWalletTrackerSuccess(response.message || 'Dip Ladder lot sell retry queued')
      await fetchDipLadders()
    } catch (err: any) {
      setWalletTrackerError(err.message || 'Failed to queue Dip Ladder sell retry')
    } finally {
      setDipLadderRetryingLotId(null)
    }
  }

  const handleAddWallet = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWalletAddress.trim()) return
    setSelectedTrackingType('')
    if (selectedCoin === 'sol') {
      setShowTrackingOptions({ open: true, type: 'single' })
    } else {
      submitAddWallet()
    }
  }

  const submitAddWallet = async () => {
    try {
      setWalletTrackerLoading(true)
      setWalletTrackerError(null)
      setWalletTrackerSuccess(null)

      const walletData: TrackedWalletCreate = {
        wallet_address: newWalletAddress.trim(),
        is_active: true,
        tracking_type: selectedTrackingType
      }

      await walletTrackerApi.startTrackingWallet(walletData, selectedCoin)
      setWalletTrackerSuccess('Wallet added to tracking successfully!')
      setNewWalletAddress('')
      await fetchTrackedWallets()
      await fetchCopyTradingStats()
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to add wallet to tracking'
      setWalletTrackerError(errorMessage)

      if (errorMessage.includes('Session expired') || errorMessage.includes('401')) {
        router.push('/login')
      }
    } finally {
      setWalletTrackerLoading(false)
      setShowTrackingOptions({ open: false, type: 'single' })
    }
  }

  const handleConfirmTrackingType = async () => {
    if (showTrackingOptions.type === 'single') {
      await submitAddWallet()
    } else {
      await handleBulkSubmit()
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setWalletTrackerError('File size too large. Max 10MB allowed.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const lines = content.split(/\r?\n/)
      const addresses: string[] = []

      const solRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
      const bnbRegex = /^0x[a-fA-F0-9]{40}$/
      const activeRegex = selectedCoin === 'sol' ? solRegex : bnbRegex

      lines.forEach(line => {
        const addr = line.trim().split(',')[0].trim()
        if (addr && activeRegex.test(addr)) {
          addresses.push(addr)
        }
      })
      if (addresses.length === 0) {
        setWalletTrackerError('No valid wallet addresses detected in file.')
        return
      }

      setBulkWallets([...new Set(addresses)])
      setShowBulkUploadModal(true)
      setWalletTrackerError(null)
    }
    reader.onerror = () => setWalletTrackerError('Failed to read file.')
    reader.readAsText(file)

    // Reset input
    e.target.value = ''
  }

  const handleBulkSubmit = async () => {
    try {
      setBulkProcessing(true)
      setWalletTrackerError(null)

      const response = await walletTrackerApi.bulkStartTrackingWallets({
        wallets: bulkWallets,
        is_active: true,
        tracking_type: selectedTrackingType
      }, selectedCoin)

      if (response.success) {
        setWalletTrackerSuccess(response.message)
        setShowBulkUploadModal(false)
        setBulkWallets([])
        await fetchTrackedWallets()
        await fetchCopyTradingStats()
      } else {
        setWalletTrackerError(response.message || 'Bulk upload failed')
      }
    } catch (err: any) {
      setWalletTrackerError(err.message || 'Bulk upload failed')
    } finally {
      setBulkProcessing(false)
    }
  }
  const handleStopTrackingClick = async (walletId: number, walletAddress: string, trackingType?: string) => {
    try {
      const settings = await walletTrackerApi.getTrackedWalletSettings(walletAddress, selectedCoin)
      const isActive = settings.tp_sl_is_active !== undefined ? settings.tp_sl_is_active : false
      const btdFullActive = settings.btd_on_full_sell === true || settings.btd_on_full_sell?.enabled === true
      const btdPartialActive = settings.btd_on_partial_sell === true || settings.btd_on_partial_sell?.enabled === true
      const dipLadderActive = dipLadders.some(ladder => ladder.tracked_wallet_id === walletId && ladder.status === 'active')
      if (isActive || btdFullActive || btdPartialActive || dipLadderActive) {
        setStopTrackingModal({
          open: true,
          walletId,
          walletAddress,
          isActive,
          btdFullActive,
          btdPartialActive,
          dipLadderActive,
          trackingType
        } as any)
      } else {
        await handleStopTracking(walletId, false)
      }
    } catch (err: any) {
      console.error('Failed to check wallet settings:', err)
      await handleStopTracking(walletId, false)
    }
  }

  const handleStopTracking = async (walletId: any, disableTpSl: boolean = false) => {
    try {
      setWalletTrackerLoading(true)
      setWalletTrackerError(null)
      setWalletTrackerSuccess(null)
      await walletTrackerApi.stopTrackingWallet(walletId, disableTpSl)
      setWalletTrackerSuccess('Wallet tracking stopped successfully')
      setStopTrackingModal({ open: false, walletAddress: null, isActive: false } as any)
      await fetchTrackedWallets()
      await fetchCopyTradingStats()
      await fetchDipLadders()
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to stop wallet tracking'
      setWalletTrackerError(errorMessage)

      if (errorMessage.includes('Session expired') || errorMessage.includes('401')) {
        router.push('/login')
      }
    } finally {
      setWalletTrackerLoading(false)
    }
  }

  const handleResumeTracking = async (walletAddress: string, trackingType?: string) => {
    try {
      setWalletTrackerLoading(true)
      setWalletTrackerError(null)
      setWalletTrackerSuccess(null)

      const walletData: TrackedWalletCreate = {
        wallet_address: walletAddress,
        is_active: true,
        tracking_type: trackingType || 'both'
      }

      await walletTrackerApi.startTrackingWallet(walletData, selectedCoin)
      setWalletTrackerSuccess('Wallet tracking resumed successfully!')
      await fetchTrackedWallets()
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to resume wallet tracking'
      setWalletTrackerError(errorMessage)

      if (errorMessage.includes('Session expired') || errorMessage.includes('401')) {
        router.push('/login')
      }
    } finally {
      setWalletTrackerLoading(false)
    }
  }

  const handleDeleteTrackedWallet = async (walletId: number, trackingType?: string) => {
    try {
      setWalletTrackerLoading(true)
      setWalletTrackerError(null)
      setWalletTrackerSuccess(null)
      await walletTrackerApi.deleteTrackedWallet(walletId)
      setTrackedWallets((prev) => prev.filter((wallet) =>
        wallet.id !== walletId || wallet.tracking_type !== trackingType
      ))
      setWalletsTotal((prev) => Math.max(prev - 1, 0))
      await fetchTrackedWallets()
      await fetchCopyTradingStats()
      setWalletTrackerSuccess('Wallet removed successfully!')
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to remove wallet from tracking'
      setWalletTrackerError(errorMessage)
      if (errorMessage.includes('Session expired') || errorMessage.includes('401')) {
        router.push('/login')
      }
    } finally {
      setWalletTrackerLoading(false)
    }
  }

  const fetchAllLogs = async (page: number = 1) => {
    try {
      if (page === 1) {
        setInitialLogsLoading(true)
      } else {
        setLogsLoading(true)
      }
      setWalletTrackerError(null)

      const filters = {
        event_type: logTypeFilter,
        status: logStatusFilter,
        side: logSideFilter,
        wallet_address: logWalletFilter
      }

      const response = await walletTrackerApi.getAllLogs(page, 10, selectedCoin, filters)
      if (response && typeof response === 'object' && 'logs' in response) {
        setTrackerLogs(response.logs || [])
        setLogsTotalPages(response.total_pages || 1)
        setLogsPage(response.page || 1)
        setLogsTotal(response.total_count || 0)
      } else {
        const logs = Array.isArray(response) ? response : []
        setTrackerLogs(logs)
        setLogsTotalPages(1)
        setLogsPage(1)
        setLogsTotal(logs.length)
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch tracker logs'
      setWalletTrackerError(errorMessage)

      if (errorMessage.includes('Session expired') || errorMessage.includes('401')) {
        router.push('/login')
      }
    } finally {
      setLogsLoading(false)
      setInitialLogsLoading(false)
    }
  }

  const handleManualRefresh = async () => {
    try {
      setStatsLoading(true)
      await Promise.all([
        dispatch(getProfile(selectedCoin)).unwrap(),
        fetchCopyTradingStats(),
        fetchTrackedWallets(1),
        fetchAllLogs(1),
        fetchTrackedPositions(),
        fetchDipLadders()
      ])
    } catch (err) {
      console.error('Refresh failed:', err)
    } finally {
      setStatsLoading(false)
    }
  }

  const handleLogsPageChange = (newPage: number) => {
    setLogsPage(newPage)
    fetchAllLogs(newPage)
  }

  const handleWalletsPageChange = (newPage: number) => {
    setWalletsPage(newPage)
    fetchTrackedWallets(newPage)
  }

  const handleRefreshBalance = async () => {
    try {
      setBalanceRefreshing(true)
      await dispatch(getProfile(selectedCoin))
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to refresh balance'
      setWalletTrackerError(errorMessage)
    } finally {
      setBalanceRefreshing(false)
    }
  }

  const handleSelectWallet = async (walletId: number) => {
    try {
      const blockchain = selectedCoin === 'sol' ? 'solana' : 'bnb'
      await authApi.selectWallet(walletId.toString(), { blockchain })
      await dispatch(getProfile(selectedCoin))
      setIsWalletListOpen(false)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to switch wallet'
      setWalletTrackerError(errorMessage)
    }
  }

  const handleTradeAmountChange = (value: string) => {
    setTradeAmountValue(value)
    if (tradeAmountError) {
      setTradeAmountError(null)
    }
  }

  const handleStableTradeAmountChange = (value: string) => {
    setStableTradeAmountValue(value)
    if (stableTradeAmountError) {
      setStableTradeAmountError(null)
    }
  }

  const handleEditTradeAmount = () => {
    setIsEditingTradeAmount(true)
    setTradeAmountValue(profile?.trade_amount?.toString() || '0')
  }

  const handleCancelEditTradeAmount = () => {
    setIsEditingTradeAmount(false)
    setTradeAmountValue(profile?.trade_amount?.toString() || '0')
    setTradeAmountError(null)
  }

  const handleEditStableTradeAmount = () => {
    const stableAmount = getStableTradeAmount(profile, selectedCoin)
    setIsEditingStableTradeAmount(true)
    setStableTradeAmountValue(stableAmount !== null && stableAmount !== undefined ? stableAmount.toString() : '')
  }

  const handleCancelStableTradeAmount = () => {
    const stableAmount = getStableTradeAmount(profile, selectedCoin)
    setIsEditingStableTradeAmount(false)
    setStableTradeAmountValue(stableAmount !== null && stableAmount !== undefined ? stableAmount.toString() : '')
    setStableTradeAmountError(null)
  }

  const handleUpdateTradeAmount = async () => {
    const amount = parseFloat(tradeAmountValue)
    const trade_amount = selectedCoin === 'sol' ? config.sol_trade_amount : config.bnb_trade_amount
    if (isNaN(amount) || amount < Number(trade_amount)) {
      setTradeAmountError(`Trade amount must be at least ${trade_amount} ${selectedCoin.toUpperCase()}`)
      return
    }

    try {
      setTradeAmountUpdating(true)
      setTradeAmountError(null)
      setWalletTrackerError(null)
      setWalletTrackerSuccess(null)
      setTradeAmountSuccess(null)

      const response = await fetch(`${config.apiBaseUrl}/copy-trading/trade-amount/${selectedCoin}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trade_amount: amount }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setTradeAmountSuccess(data.message || 'Trade amount updated successfully!')

      await dispatch(getProfile(selectedCoin))
      setIsEditingTradeAmount(false)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update trade amount'
      setWalletTrackerError(errorMessage)

      if (errorMessage.includes('Session expired') || errorMessage.includes('401')) {
        router.push('/login')
      }
    } finally {
      setTradeAmountUpdating(false)
    }
  }

  const handleUpdateStableTradeAmount = async () => {
    const amount = parseFloat(stableTradeAmountValue)
    const stableSymbol = selectedCoin === 'sol' ? 'USDT' : 'USDC'
    if (isNaN(amount) || amount <= 0) {
      setStableTradeAmountError(`${stableSymbol} trade amount must be positive`)
      return
    }

    try {
      setStableTradeAmountUpdating(true)
      setStableTradeAmountError(null)
      setWalletTrackerError(null)
      setWalletTrackerSuccess(null)
      setTradeAmountSuccess(null)

      const response = await fetch(`${config.apiBaseUrl}/copy-trading/stable-trade-amount/${selectedCoin}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trade_amount: amount }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setTradeAmountSuccess(data.message || `${stableSymbol} trade amount updated successfully!`)

      await dispatch(getProfile(selectedCoin))
      setIsEditingStableTradeAmount(false)
    } catch (err: any) {
      const errorMessage = err.message || `Failed to update ${stableSymbol} trade amount`
      setWalletTrackerError(errorMessage)

      if (errorMessage.includes('Session expired') || errorMessage.includes('401')) {
        router.push('/login')
      }
    } finally {
      setStableTradeAmountUpdating(false)
    }
  }

  const fetchWalletSettings = async (walletAddress: string, coin: string = 'sol', walletId?: number) => {
    try {
      const settings = await walletTrackerApi.getTrackedWalletSettings(walletAddress, coin, walletId)
      const indexKey = walletId || walletAddress;
      setWalletSettings(prev => ({
        ...prev,
        [indexKey]: {
          ...settings,
          take_profit_levels: settings.take_profit_levels && settings.take_profit_levels.length > 0
            ? settings.take_profit_levels
            : [{ profit_percentage: 0, sell_percentage: 0 }],
          stop_loss_levels: settings.stop_loss_levels && settings.stop_loss_levels.length > 0
            ? settings.stop_loss_levels
            : [{ loss_percentage: 0, sell_percentage: 0 }],
          entry_on_first_swap: settings.entry_on_first_swap ?? false,
          buy_once_per_token: settings.buy_once_per_token ?? false,
          mirror_sells_enabled: settings.mirror_sells_enabled ?? true,
          swap_notification_sound: settings.swap_notification_sound ?? 'success.mp3',
          tracking_type: settings.tracking_type ?? 'both',
          reverse_copy: settings.reverse_copy ?? false,
          dip_ladder_drop_percentage: settings.dip_ladder_drop_percentage ?? 5,
          dip_ladder_profit_percentage: settings.dip_ladder_profit_percentage ?? 5,
          btd_on_partial_sell: settings.btd_on_partial_sell ?? false,
          btd_on_full_sell: settings.btd_on_full_sell ?? false,
          rugcheck_filters_enabled: settings.rugcheck_filters_enabled ?? false,
          min_market_cap_usd: settings.min_market_cap_usd ?? null,
          max_market_cap_usd: settings.max_market_cap_usd ?? null,
          min_liquidity_usd: settings.min_liquidity_usd ?? null,
          max_liquidity_usd: settings.max_liquidity_usd ?? null,
          min_token_age_seconds: settings.min_token_age_seconds ?? null,
          max_token_age_seconds: settings.max_token_age_seconds ?? null,
          min_holders: settings.min_holders ?? null,
          max_holders: settings.max_holders ?? null,
          copy_only_new_positions: settings.copy_only_new_positions ?? false,
          spike_entry_enabled: settings.spike_entry_enabled ?? false,
          spike_entry_pullback_percentage: settings.spike_entry_pullback_percentage ?? 5,
          spike_entry_margin_percentage: settings.spike_entry_margin_percentage ?? 0,
          spike_entry_timeout_seconds: settings.spike_entry_timeout_seconds ?? 300,
          spike_entry_require_unsold_mirror: settings.spike_entry_require_unsold_mirror ?? false
        }
      }))
      setTpSlIsActive(prev => ({
        ...prev,
        [indexKey]: settings.tp_sl_is_active !== undefined ? settings.tp_sl_is_active : true
      }))
    } catch (err) {
      console.error('Failed to fetch wallet settings:', err)
    }
  }

  const calculateTotalSellPercentage = (levels: any[]): number => {
    return levels.reduce((sum, level) => sum + (level.sell_percentage || 0), 0)
  }

  const addTakeProfitLevel = (walletId: string | number) => {
    const currentLevels = walletSettings[walletId]?.take_profit_levels || []
    setWalletSettings(prev => ({
      ...prev,
      [walletId]: {
        ...prev[walletId],
        take_profit_levels: [...currentLevels, { profit_percentage: 0, sell_percentage: 0 }]
      }
    }))
    setShowAllTP(prev => ({ ...prev, [walletId]: true }))
  }

  const removeTakeProfitLevel = (walletId: string | number, index: number) => {
    const currentLevels = walletSettings[walletId]?.take_profit_levels || []
    setWalletSettings(prev => ({
      ...prev,
      [walletId]: {
        ...prev[walletId],
        take_profit_levels: currentLevels.filter((_: any, i: number) => i !== index)
      }
    }))
  }

  const updateTakeProfitLevel = (walletId: string | number, index: number, field: 'profit_percentage' | 'sell_percentage', value: string) => {
    const currentLevels = walletSettings[walletId]?.take_profit_levels || []
    const updatedLevels = [...currentLevels]
    const numValue = value === '' ? 0 : parseFloat(value) || 0
    updatedLevels[index] = { ...updatedLevels[index], [field]: numValue }
    setWalletSettings(prev => ({
      ...prev,
      [walletId]: {
        ...prev[walletId],
        take_profit_levels: updatedLevels
      }
    }))

    const total = calculateTotalSellPercentage(updatedLevels)
    if (total > 100) {
      setTpValidationErrors(prev => ({ ...prev, [walletId]: 'Total sell percentage cannot exceed 100%' }))
    } else if (total < 100 && updatedLevels.some(l => l.profit_percentage > 0 || l.sell_percentage > 0)) {
      setTpValidationErrors(prev => ({ ...prev, [walletId]: 'Total sell percentage must equal 100%' }))
    } else {
      setTpValidationErrors(prev => ({ ...prev, [walletId]: null }))
    }
  }

  const addStopLossLevel = (walletId: string | number) => {
    const currentLevels = walletSettings[walletId]?.stop_loss_levels || []
    setWalletSettings(prev => ({
      ...prev,
      [walletId]: {
        ...prev[walletId],
        stop_loss_levels: [...currentLevels, { loss_percentage: 0, sell_percentage: 0 }]
      }
    }))
    setShowAllSL(prev => ({ ...prev, [walletId]: true }))
  }

  const removeStopLossLevel = (walletId: string | number, index: number) => {
    const currentLevels = walletSettings[walletId]?.stop_loss_levels || []
    setWalletSettings(prev => ({
      ...prev,
      [walletId]: {
        ...prev[walletId],
        stop_loss_levels: currentLevels.filter((_: any, i: number) => i !== index)
      }
    }))
  }

  const updateStopLossLevel = (walletId: string | number, index: number, field: 'loss_percentage' | 'sell_percentage', value: string) => {
    const currentLevels = walletSettings[walletId]?.stop_loss_levels || []
    const updatedLevels = [...currentLevels]
    const numValue = value === '' ? 0 : parseFloat(value) || 0
    updatedLevels[index] = { ...updatedLevels[index], [field]: numValue }
    setWalletSettings(prev => ({
      ...prev,
      [walletId]: {
        ...prev[walletId],
        stop_loss_levels: updatedLevels
      }
    }))

    const total = calculateTotalSellPercentage(updatedLevels)
    if (total > 100) {
      setSlValidationErrors(prev => ({ ...prev, [walletId]: 'Total sell percentage cannot exceed 100%' }))
    } else if (total < 100 && updatedLevels.some(l => l.loss_percentage > 0 || l.sell_percentage > 0)) {
      setSlValidationErrors(prev => ({ ...prev, [walletId]: 'Total sell percentage must equal 100%' }))
    } else {
      setSlValidationErrors(prev => ({ ...prev, [walletId]: null }))
    }
  }

  const handleWalletSettingsClick = async (walletId: number, walletAddress: string) => {
    const key = walletId || walletAddress;
    if (!walletSettings[key]) {
      await fetchWalletSettings(walletAddress, selectedCoin, walletId)
    }
    console.log('the full wallet settings', walletSettings[key])
    setShowWalletSettings(showWalletSettings === key ? null : key)
  }

  const handleUpdateWalletSettings = async (walletAddress: string, walletId: number | string, settingsOverride?: any) => {
    try {
      setWalletSettingsLoading(true)
      setWalletTrackerError(null)
      setWalletSettingsSuccess(null)

      const key = walletId || walletAddress;
      const settings = settingsOverride || walletSettings[key]
      const normalized = {
        ...settings,
        swap_strategy: settings.swap_strategy === 'none' ? 'fixed_buys' : (settings.swap_strategy || 'fixed_buys'),
        custom_name: settings.custom_name || '',
        slippage: settings.slippage === '' ? 0 : settings.slippage,
        max_buys_per_mirror_per_hour: settings.max_buys_per_mirror_per_hour,
        max_buys_per_mirror_per_day: settings.max_buys_per_mirror_per_day,
        max_buys_per_token_per_day: settings.max_buys_per_token_per_day,
        take_profit_levels: settings.take_profit_levels,
        stop_loss_levels: settings.stop_loss_levels,
        tp_sl_is_active: tpSlIsActive[key] !== undefined ? tpSlIsActive[key] : true,
        entry_on_first_swap: settings.entry_on_first_swap ?? false,
        buy_once_per_token: settings.buy_once_per_token ?? false,
        mirror_sells_enabled: settings.mirror_sells_enabled ?? true,
        sol_trade_amount: settings.sol_trade_amount,
        bnb_trade_amount: settings.bnb_trade_amount,
        tracking_type: settings.tracking_type ?? 'both',
        reverse_copy: settings.reverse_copy ?? false,
        dip_ladder_drop_percentage: settings.dip_ladder_drop_percentage ?? 5,
        dip_ladder_profit_percentage: settings.dip_ladder_profit_percentage ?? 5,
        btd_on_partial_sell: settings.btd_on_partial_sell ?? false,
        btd_on_full_sell: settings.btd_on_full_sell ?? false,
        rugcheck_filters_enabled: settings.rugcheck_filters_enabled ?? false,
        min_market_cap_usd: settings.min_market_cap_usd ?? null,
        max_market_cap_usd: settings.max_market_cap_usd ?? null,
        min_liquidity_usd: settings.min_liquidity_usd ?? null,
        max_liquidity_usd: settings.max_liquidity_usd ?? null,
        min_token_age_seconds: settings.min_token_age_seconds ?? null,
        max_token_age_seconds: settings.max_token_age_seconds ?? null,
        min_holders: settings.min_holders ?? null,
        max_holders: settings.max_holders ?? null,
        copy_only_new_positions: selectedCoin === 'sol' ? (settings.copy_only_new_positions ?? false) : false,
        spike_entry_enabled: selectedCoin === 'sol' ? (settings.spike_entry_enabled ?? false) : false,
        spike_entry_pullback_percentage: settings.spike_entry_pullback_percentage ?? 5,
        spike_entry_margin_percentage: settings.spike_entry_margin_percentage ?? 0,
        spike_entry_timeout_seconds: settings.spike_entry_timeout_seconds ?? 300,
        spike_entry_require_unsold_mirror: selectedCoin === 'sol' ? (settings.spike_entry_require_unsold_mirror ?? false) : false
      }
      await walletTrackerApi.updateTrackedWalletSettings(walletAddress, normalized, selectedCoin, settings.tracking_type, walletId)

      setTrackedWallets(prev => prev.map(w =>
        w.id === walletId
          ? { ...w, tracking_type: settings.tracking_type, custom_name: settings.custom_name, swap_strategy: normalized.swap_strategy, is_default: false }
          : w
      ))

      setWalletSettingsSuccess('Wallet settings updated successfully!')
      setTimeout(() => setWalletSettingsSuccess(null), 5000)
      setShowWalletSettings(null)
      return true
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update wallet settings'
      setWalletTrackerError(errorMessage)

      if (errorMessage.includes('Session expired') || errorMessage.includes('401')) {
        router.push('/login')
      }
      return false
    } finally {
      setWalletSettingsLoading(false)
    }
  }

  const handleStartEditCustomName = async (walletAddress: string, walletId: string | number) => {
    const key = walletId || walletAddress;
    if (!walletSettings[key]) {
      await fetchWalletSettings(walletAddress, selectedCoin, typeof walletId === 'number' ? walletId : undefined)
    }
    const currentName = walletSettings[key]?.custom_name || trackedWallets.find(w => (walletId ? w.id === walletId : w.wallet_address === walletAddress))?.custom_name || ''
    setCustomNameValue(currentName)
    setEditingCustomName(key)
  }

  const handleCancelEditCustomName = () => {
    setEditingCustomName(null)
    setCustomNameValue('')
  }

  const handleSaveCustomName = async (walletAddress: string, walletId: string | number) => {
    try {
      const key = walletId || walletAddress;
      setCustomNameLoading(key)
      setWalletTrackerError(null)

      const settings = walletSettings[key] || {}
      const normalized = {
        ...settings,
        swap_strategy: settings.swap_strategy === 'none' ? 'fixed_buys' : (settings.swap_strategy || 'fixed_buys'),
        custom_name: customNameValue.trim() || '',
        slippage: settings.slippage === '' ? 0 : settings.slippage,
        max_buys_per_mirror_per_hour: settings.max_buys_per_mirror_per_hour,
        max_buys_per_mirror_per_day: settings.max_buys_per_mirror_per_day,
        max_buys_per_token_per_day: settings.max_buys_per_token_per_day,
        take_profit_levels: settings.take_profit_levels,
        stop_loss_levels: settings.stop_loss_levels,
        tp_sl_is_active: tpSlIsActive[key] !== undefined ? tpSlIsActive[key] : true,
        entry_on_first_swap: settings.entry_on_first_swap ?? false,
        buy_once_per_token: settings.buy_once_per_token ?? false,
        mirror_sells_enabled: settings.mirror_sells_enabled ?? true,
        sol_trade_amount: settings.sol_trade_amount,
        bnb_trade_amount: settings.bnb_trade_amount,
        tracking_type: settings.tracking_type ?? 'both',
        reverse_copy: settings.reverse_copy ?? false,
        dip_ladder_drop_percentage: settings.dip_ladder_drop_percentage ?? 5,
        dip_ladder_profit_percentage: settings.dip_ladder_profit_percentage ?? 5,
        btd_on_partial_sell: settings.btd_on_partial_sell ?? false,
        btd_on_full_sell: settings.btd_on_full_sell ?? false,
        rugcheck_filters_enabled: settings.rugcheck_filters_enabled ?? false,
        min_market_cap_usd: settings.min_market_cap_usd ?? null,
        max_market_cap_usd: settings.max_market_cap_usd ?? null,
        min_liquidity_usd: settings.min_liquidity_usd ?? null,
        max_liquidity_usd: settings.max_liquidity_usd ?? null,
        min_token_age_seconds: settings.min_token_age_seconds ?? null,
        max_token_age_seconds: settings.max_token_age_seconds ?? null,
        min_holders: settings.min_holders ?? null,
        max_holders: settings.max_holders ?? null,
        copy_only_new_positions: selectedCoin === 'sol' ? (settings.copy_only_new_positions ?? false) : false,
        spike_entry_enabled: selectedCoin === 'sol' ? (settings.spike_entry_enabled ?? false) : false,
        spike_entry_pullback_percentage: settings.spike_entry_pullback_percentage ?? 5,
        spike_entry_margin_percentage: settings.spike_entry_margin_percentage ?? 0,
        spike_entry_timeout_seconds: settings.spike_entry_timeout_seconds ?? 300,
        spike_entry_require_unsold_mirror: selectedCoin === 'sol' ? (settings.spike_entry_require_unsold_mirror ?? false) : false
      }

      const foundId = trackedWallets.find(w => w.wallet_address === walletAddress)?.id
      await walletTrackerApi.updateTrackedWalletSettings(walletAddress, normalized, selectedCoin, settings.tracking_type, foundId)

      setTrackedWallets(prev => prev.map(w =>
        (foundId ? w.id === foundId : w.wallet_address === walletAddress)
          ? { ...w, tracking_type: settings.tracking_type, custom_name: settings.custom_name, is_default: false }
          : w
      ))

      // Update local state
      setWalletSettings(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          custom_name: settings.custom_name || ''
        }
      }))

      setEditingCustomName(null)
      setCustomNameValue('')
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update custom name'
      setWalletTrackerError(errorMessage)

      if (errorMessage.includes('Session expired') || errorMessage.includes('401')) {
        router.push('/login')
      }
    } finally {
      setCustomNameLoading(null)
    }
  }

  useEffect(() => {
    if (!user && !isLoading) {
      router.push('/login')
    }
    if (user) {
      fetchAvailableSounds()
    }
  }, [user, isLoading, router])

  const fetchAvailableSounds = async () => {
    try {
      const sounds = await walletTrackerApi.getNotificationSounds()
      setAvailableSounds(sounds)
    } catch (err) {
      console.error('Failed to fetch sounds:', err)
    }
  }

  const testHearSound = (soundFile: string) => {
    if (playingSound) return
    setPlayingSound(soundFile)
    const audio = new Audio(`/sounds/${soundFile}`)
    audio.play().finally(() => {
      setTimeout(() => setPlayingSound(null), 2000)
    })
  }

  useEffect(() => {
    if (error && (error.includes('401') || error.includes('unauthorized') || error.includes('No access token') || error.includes('Session expired'))) {
      router.push('/login')
    }
  }, [error, router])

  if (user && !profile && isLoading) {
    return (
      <ProfileLayout>
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-molten-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/60 font-space-grotesk">Loading profile...</p>
          </div>
        </div>
      </ProfileLayout>
    )
  }

  const handleLogout = async () => {
    await dispatch(logout())
    router.push('/')
  }

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1200)
  }

  const handleWithdraw = async () => {
    if (!withdrawDestination || !withdrawAmount) return
    try {
      setWithdrawing(true)
      setWithdrawSuccess(null)
      setWithdrawError(null)
      const response = await fetch(`${config.apiBaseUrl}/copy-trading/wallet/withdraw/${selectedCoin}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ destination: withdrawDestination, amount: parseFloat(withdrawAmount) })
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const message = errorData.detail || `HTTP error! status: ${response.status}`
        setWithdrawError(message)
        throw new Error(message)
      }
      const data = await response.json()
      setWithdrawSuccess(data)
      await dispatch(getProfile(selectedCoin))
    } catch (err: any) {
      setWithdrawError(err.message || 'Withdraw failed')
    } finally {
      setWithdrawing(false)
    }
  }

  const formatWalletAddress = (address: any) => {
    if (!address || typeof address !== 'string') return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const handleGeneratePnlImage = async (log: CopyTradingLog) => {
    if (!log.target_token || !log.token_name || !log.amount_in || !log.amount_out) {
      return
    }

    try {
      setPnlImageModal({ open: true, imageUrl: null, loading: true })
      const blob = await walletTrackerApi.generatePnlImage(
        log.target_token,
        log.token_symbol || log.token_name || 'Token',
        log.amount_in,
        log.amount_out,
        log.pnl ?? 0,
        log.transaction_signature ?? '',
        selectedCoin
      )
      const imageUrl = URL.createObjectURL(blob)
      setPnlImageModal({ open: true, imageUrl, loading: false })
    } catch (err: any) {
      console.error('Failed to generate PnL image:', err)
      setPnlImageModal({ open: false, imageUrl: null, loading: false })
    }
  }

  const handleDownloadPnlImage = () => {
    if (!pnlImageModal.imageUrl) return
    const link = document.createElement('a')
    link.href = pnlImageModal.imageUrl
    link.download = `pnl-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSharePnlImage = async () => {
    if (!pnlImageModal.imageUrl) return

    try {
      const response = await fetch(pnlImageModal.imageUrl)
      const blob = await response.blob()
      const file = new File([blob], 'pnl-image.png', { type: 'image/png' })

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'PnL Trade Result',
        })
      } else {
        await navigator.clipboard.writeText(pnlImageModal.imageUrl)
        alert('Image URL copied to clipboard')
      }
    } catch (err) {
      console.error('Failed to share:', err)
    }
  }

  const renderWalletTrackerSection = () => (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl md:text-3xl font-orbitron font-bold text-molten-gold">
          Wallet Tracker
        </h1>
      </div>

      {/* Add Wallet Section */}
      <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-molten-gold/20 rounded-lg p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-orbitron font-bold text-molten-gold mb-4 md:mb-6 flex items-center gap-3">
          <Plus size={20} />
          Add Wallet to Track
        </h3>

        <form onSubmit={handleAddWallet} className="space-y-4">
          <div>
            <label className="block text-sm font-orbitron text-molten-gold mb-2 tracking-wide uppercase">
              Add Single Wallet
            </label>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={newWalletAddress}
                onChange={(e) => setNewWalletAddress(e.target.value)}
                placeholder={`Enter ${selectedCoin.toUpperCase()} wallet address`}
                className="flex-1 bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 md:px-4 py-2 md:py-3 text-sm md:text-base text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                required
              />
              <motion.button
                type="submit"
                disabled={walletTrackerLoading || !newWalletAddress.trim()}
                className="px-4 md:px-6 py-2 md:py-3 bg-molten-gold text-void-black font-orbitron font-bold tracking-wider hover:brightness-110 transition duration-300 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {walletTrackerLoading ? (
                  <div className="w-5 h-5 border-2 border-void-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus size={18} />
                )}
                Add
              </motion.button>
            </div>
          </div>
          <div className="pt-4 border-t border-molten-gold/10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <label className="block text-sm font-orbitron text-molten-gold mb-1 tracking-wide uppercase">
                  Bulk Upload
                </label>
                <p className="text-xs text-white/40 font-space-grotesk">
                  Upload a CSV file with one wallet address per line. Max 10MB.
                </p>
              </div>
              <div className="relative">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="bulk-wallet-upload"
                />
                <label
                  htmlFor="bulk-wallet-upload"
                  className="px-4 md:px-6 py-2 md:py-3 bg-void-black/50 border border-molten-gold/30 text-molten-gold font-orbitron font-bold tracking-wider hover:bg-molten-gold/10 transition duration-300 rounded-lg flex items-center justify-center gap-2 cursor-pointer text-sm md:text-base"
                >
                  <Upload size={18} />
                  Upload CSV
                </label>
              </div>
            </div>
          </div>
          <div className="mt-2 p-3 bg-void-black/30 border border-white/5 rounded-lg">
            <h5 className="text-[10px] font-orbitron text-molten-gold/60 uppercase mb-1">CSV Format Helper</h5>
            <p className="text-[10px] text-white/40 font-space-grotesk">
              Put <strong>one wallet address on each row</strong>. No headers or extra columns are required.<br />
              {selectedCoin === 'sol' ? 'SolanaAddress1\nSolanaAddress2\n...' : '0xAddress1\n0xAddress2\n...'}
            </p>
          </div>
        </form>
      </div>

      {/* Messages */}
      {walletTrackerError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg"
        >
          <div className="flex items-center gap-2 text-red-400">
            <XCircle size={20} />
            <span className="font-orbitron font-bold">{walletTrackerError}</span>
          </div>
        </motion.div>
      )}

      {walletTrackerSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg"
        >
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle size={20} />
            <span className="font-orbitron font-bold">{walletTrackerSuccess}</span>
          </div>
        </motion.div>
      )}

      {/* Tracked Wallets Section */}
      <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-molten-gold/20 rounded-lg p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h3 className="text-lg md:text-xl font-orbitron font-bold text-molten-gold flex items-center gap-3">
            <Wallet size={20} />
            Tracked Wallets ({walletsTotal})
          </h3>
          {profile?.is_admin && (
            <div className="flex items-center gap-3 bg-void-black/50 px-4 py-2 rounded-lg border border-red-500/20">
              <div className="flex flex-col items-end">
                <span className="text-[10px] md:text-xs font-orbitron font-bold text-red-500 tracking-tighter uppercase">Debug Mode</span>
                <span className="text-[8px] text-white/40 font-space-grotesk">No trades executed</span>
              </div>
              <motion.button
                onClick={handleToggleDebugMode}
                disabled={debugModeLoading}
                className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${isDebugMode ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-gray-700'
                  }`}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="w-4 h-4 bg-white rounded-full shadow-lg"
                  animate={{ x: isDebugMode ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>
          )}
        </div>
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-400 font-space-grotesk">
            <span className="font-semibold">Platform Fee:</span> A 1% fee applies to all trades
          </p>
        </div>

        {(walletTrackerLoading || coinSwitching) && (!trackedWallets || trackedWallets.length === 0) ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-molten-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/60 font-space-grotesk">
              {coinSwitching ? `Loading ${selectedCoin.toUpperCase()} wallets...` : 'Loading tracked wallets...'}
            </p>
          </div>
        ) : !trackedWallets || trackedWallets.length === 0 ? (
          <div className="text-center py-8">
            <Wallet size={48} className="text-molten-gold/40 mx-auto mb-4" />
            <p className="text-white/60 font-space-grotesk">No wallets being tracked yet</p>
            <p className="text-white/40 font-space-grotesk text-sm mt-2">Add a wallet address above to start tracking</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trackedWallets.map((wallet) => (
              <motion.div
                key={wallet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-void-black/50 border border-molten-gold/10 rounded-lg p-4"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0">
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-2 md:gap-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${wallet.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="text-xs md:text-sm font-orbitron font-semibold text-molten-gold/80 tracking-wider uppercase">
                        {wallet.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {editingCustomName === wallet.id ? (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <input
                            type="text"
                            value={customNameValue}
                            onChange={(e) => setCustomNameValue(e.target.value)}
                            placeholder="Enter custom name"
                            className="flex-1 bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-1.5 text-white font-space-grotesk text-xs md:text-sm focus:border-molten-gold focus:outline-none transition-colors duration-300 min-w-0"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveCustomName(wallet.wallet_address, wallet.id)
                              } else if (e.key === 'Escape') {
                                handleCancelEditCustomName()
                              }
                            }}
                          />
                          <motion.button
                            onClick={() => handleSaveCustomName(wallet.wallet_address, wallet.id)}
                            disabled={customNameLoading === wallet.id}
                            className="px-2 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors duration-300 flex items-center justify-center disabled:opacity-50"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {customNameLoading === wallet.id ? (
                              <div className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <CheckCircle size={14} />
                            )}
                          </motion.button>
                          <motion.button
                            onClick={handleCancelEditCustomName}
                            disabled={customNameLoading === wallet.id}
                            className="px-2 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors duration-300 flex items-center justify-center disabled:opacity-50"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <XCircle size={14} />
                          </motion.button>
                        </div>
                      ) : (
                        <>
                          <motion.button
                            onClick={() => handleStartEditCustomName(wallet.wallet_address, wallet.id)}
                            className="text-molten-gold/60 hover:text-molten-gold transition-colors duration-300 flex-shrink-0"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Edit custom name"
                          >
                            <Edit3 size={14} />
                          </motion.button>
                          <button
                            onClick={() => copyToClipboard(wallet.wallet_address, `tracked-${wallet.id}`)}
                            className="text-molten-gold/60 hover:text-molten-gold transition-colors duration-300 flex-shrink-0"
                            title="Copy wallet address"
                          >
                            <Copy size={14} />
                          </button>
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col">
                                <p
                                  className="text-xs md:text-sm text-white font-space-grotesk font-semibold cursor-default truncate"
                                  title={wallet.wallet_address}
                                >
                                  {walletSettings[wallet.id]?.custom_name || wallet.custom_name || formatWalletAddress(wallet.wallet_address)}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {(walletSettings[wallet.id]?.custom_name || wallet.custom_name) && (
                                    <p className="text-[10px] text-white/40 font-mono italic truncate" title={wallet.wallet_address}>
                                      {formatWalletAddress(wallet.wallet_address)}
                                    </p>
                                  )}
                                  {selectedCoin === 'sol' && (
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-orbitron font-bold uppercase border ${(typeof wallet.tracking_type === 'object' ? wallet.tracking_type.type : wallet.tracking_type) === 'launches'
                                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                      : (typeof wallet.tracking_type === 'object' ? wallet.tracking_type.type : wallet.tracking_type) === 'swaps'
                                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                                        : 'bg-molten-gold/10 border-molten-gold/30 text-molten-gold'
                                      }`}>
                                      {(typeof wallet.tracking_type === 'object' ? wallet.tracking_type.type : wallet.tracking_type) === 'launches' ? 'Launches' : (typeof wallet.tracking_type === 'object' ? wallet.tracking_type.type : wallet.tracking_type) === 'swaps' ? 'Swaps' : 'Full Track'}
                                      {(typeof wallet.tracking_type === 'object' && wallet.tracking_type.only_launched_by) && ' (Only Self-Launched)'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-2">
                                <a
                                  href={`https://gmgn.ai/${selectedCoin === 'sol' ? 'sol' : 'bsc'}/address/${wallet.wallet_address}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-molten-gold/60 hover:text-molten-gold transition-colors font-orbitron flex items-center gap-0.5"
                                >
                                  GMGN <ExternalLink size={8} />
                                </a>
                                <a
                                  href={selectedCoin === 'sol'
                                    ? `https://solscan.io/account/${wallet.wallet_address}`
                                    : `https://bscscan.com/address/${wallet.wallet_address}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-molten-gold/60 hover:text-molten-gold transition-colors font-orbitron flex items-center gap-0.5"
                                >
                                  {selectedCoin === 'sol' ? 'SOLSCAN' : 'BSCSCAN'} <ExternalLink size={8} />
                                </a>
                              </div>
                            </div>
                          </div>
                          {copiedKey === `tracked-${wallet.id}` && (
                            <span className="text-xs text-molten-gold">Copied</span>
                          )}
                        </>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 text-xs md:text-sm">
                      <div>
                        <p className="text-molten-gold/60 font-orbitron text-xs tracking-wider uppercase">Matches</p>
                        <p className="text-white font-orbitron font-bold">{wallet.total_matches}</p>
                      </div>
                      <div>
                        <p className="text-molten-gold/60 font-orbitron text-xs tracking-wider uppercase">Successful</p>
                        <p className="text-green-400 font-orbitron font-bold">{wallet.successful_trades}</p>
                      </div>
                      <div>
                        <p className="text-molten-gold/60 font-orbitron text-xs tracking-wider uppercase">Failed</p>
                        <p className="text-red-400 font-orbitron font-bold">{wallet.failed_trades}</p>
                      </div>
                      <div>
                        <p className="text-molten-gold/60 font-orbitron text-xs tracking-wider uppercase">Volume</p>
                        <p className="text-white font-orbitron font-bold">{(wallet.total_volume_traded || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-molten-gold/60 font-orbitron text-xs tracking-wider uppercase">Profit/Loss</p>
                        <p className={`font-orbitron font-bold ${(wallet.total_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {(wallet.total_pnl || 0).toFixed(4)} SOL
                        </p>
                      </div>
                    </div>
                    <p className="text-white/40 font-space-grotesk text-xs mt-2">
                      Added: {formatDate(wallet.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <motion.button
                      onClick={() => handleWalletSettingsClick(wallet.id, wallet.wallet_address)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors duration-300 ${walletSettings[wallet.id] &&
                        walletSettings[wallet.id].is_default === false
                        ? 'bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20'
                        : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20'
                        }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <CheckCircle size={14} />
                      <span className="text-sm font-orbitron font-semibold">
                        {walletSettings[wallet.id] &&
                          walletSettings[wallet.id].is_default === false
                          ? 'Custom Controls'
                          : 'Default Controls'
                        }
                      </span>
                    </motion.button>

                    {wallet.is_active ? (
                      <motion.button
                        onClick={() => handleStopTrackingClick(wallet.id, wallet.wallet_address, wallet.tracking_type)}
                        disabled={walletTrackerLoading}
                        className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors duration-300 flex items-center gap-2 text-sm font-orbitron font-semibold disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <EyeOff size={14} />
                        Stop
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={() => handleResumeTracking(wallet.wallet_address, wallet.tracking_type)}
                        disabled={walletTrackerLoading}
                        className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors duration-300 flex items-center gap-2 text-sm font-orbitron font-semibold disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Eye size={14} />
                        Resume
                      </motion.button>
                    )}
                    <motion.button
                      onClick={() => handleDeleteTrackedWallet(wallet.id, wallet.tracking_type)}
                      disabled={walletTrackerLoading}
                      className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors duration-300 flex items-center justify-center disabled:opacity-50"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {walletsTotalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <motion.button
              onClick={() => handleWalletsPageChange(walletsPage - 1)}
              disabled={walletsPage <= 1}
              className="px-4 py-2 bg-molten-gold/10 border border-molten-gold/20 text-molten-gold rounded-lg hover:bg-molten-gold/20 transition-colors duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ChevronLeft size={16} />
              Previous
            </motion.button>

            <span className="text-white font-orbitron font-semibold">
              Page {walletsPage} of {walletsTotalPages}
            </span>

            <motion.button
              onClick={() => handleWalletsPageChange(walletsPage + 1)}
              disabled={walletsPage >= walletsTotalPages}
              className="px-4 py-2 bg-molten-gold/10 border border-molten-gold/20 text-molten-gold rounded-lg hover:bg-molten-gold/20 transition-colors duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Next
              <ChevronRight size={16} />
            </motion.button>
          </div>
        )}

        {showWalletSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-r from-void-black/95 to-black/90 backdrop-blur-md border border-molten-gold/30 rounded-lg p-4 md:p-6 w-full max-w-2xl max-h-[90vh] md:max-h-[80vh] overflow-y-auto shadow-2xl shadow-molten-gold/10"
            >
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h3 className="text-lg md:text-xl font-orbitron font-bold text-molten-gold break-words pr-2">
                  Wallet Settings - {(() => {
                    const wallet = trackedWallets.find(w => w.id === showWalletSettings || w.wallet_address === showWalletSettings);
                    return wallet ? formatWalletAddress(wallet.wallet_address) : formatWalletAddress(String(showWalletSettings));
                  })()}
                </h3>
                <button
                  onClick={() => setShowWalletSettings(null)}
                  className="text-molten-gold/60 hover:text-molten-gold transition-colors duration-300"
                >
                  <XCircle size={24} />
                </button>
              </div>

              {walletSettingsSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg mb-6"
                >
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle size={20} />
                    <span className="font-orbitron font-bold">{walletSettingsSuccess}</span>
                  </div>
                </motion.div>
              )}

              {walletSettings[showWalletSettings] && (
                <div className="space-y-4">
                  <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4">
                    <h4 className="text-lg font-orbitron font-semibold text-white mb-4">Trading Mode & Strategy</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-xs font-orbitron text-molten-gold mb-2 uppercase">Buy Strategy</label>
                        <select
                          value={walletSettings[showWalletSettings].swap_strategy === 'dip_ladder' ? 'fixed_buys' : (walletSettings[showWalletSettings].swap_strategy === 'none' ? 'fixed_buys' : (walletSettings[showWalletSettings].swap_strategy || 'fixed_buys'))}
                          onChange={(e) => setWalletSettings(prev => ({
                            ...prev,
                            [showWalletSettings]: {
                              ...prev[showWalletSettings],
                              swap_strategy: e.target.value
                            }
                          }))}
                          className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                        >
                          <option value="fixed_buys">Constant Size</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-orbitron font-semibold text-white mb-2">Buy the Dip</h4>
                        <p className="text-white/60 font-space-grotesk text-sm">Enable automatic dip buying strategy</p>
                      </div>
                      <motion.button
                        onClick={() => setWalletSettings(prev => ({
                          ...prev,
                          [showWalletSettings]: {
                            ...prev[showWalletSettings],
                            buy_the_dip: !prev[showWalletSettings].buy_the_dip
                          }
                        }))}
                        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${walletSettings[showWalletSettings].buy_the_dip ? 'bg-molten-gold' : 'bg-gray-600'
                          }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.div
                          className="w-4 h-4 bg-white rounded-full"
                          animate={{ x: walletSettings[showWalletSettings].buy_the_dip ? 18 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </motion.button>
                    </div>

                    {walletSettings[showWalletSettings].buy_the_dip && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 space-y-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <label className="block text-sm font-orbitron text-molten-gold font-semibold">Buy Dip %</label>
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
                              value={walletSettings[showWalletSettings].buy_dip_percentage || 10}
                              onChange={(e) => setWalletSettings(prev => ({
                                ...prev,
                                [showWalletSettings]: {
                                  ...prev[showWalletSettings],
                                  buy_dip_percentage: parseFloat(e.target.value) || 0
                                }
                              }))}
                              className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                              min="0"
                              max="100"
                              step="0.1"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <label className="block text-sm font-orbitron text-molten-gold font-semibold">Max Dip %</label>
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
                              value={walletSettings[showWalletSettings].max_dip_percentage || 50}
                              onChange={(e) => setWalletSettings(prev => ({
                                ...prev,
                                [showWalletSettings]: {
                                  ...prev[showWalletSettings],
                                  max_dip_percentage: parseFloat(e.target.value) || 0
                                }
                              }))}
                              className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                              min="0"
                              max="100"
                              step="0.1"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <label className="block text-sm font-orbitron text-molten-gold font-semibold">Buy Dip Timeout (seconds)</label>
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
                                  checked={walletSettings[showWalletSettings].buy_dip_timeout <= -1}
                                  onChange={(e) => setWalletSettings(prev => ({
                                    ...prev,
                                    [showWalletSettings]: {
                                      ...prev[showWalletSettings],
                                      buy_dip_timeout: e.target.checked ? -1 : 300
                                    }
                                  }))}
                                  className="w-4 h-4 rounded border-molten-gold/20 bg-void-black/50 text-molten-gold focus:ring-molten-gold focus:ring-offset-0"
                                />
                              </div>
                            </div>
                            <input
                              type="number"
                              value={walletSettings[showWalletSettings].buy_dip_timeout <= -1 ? '' : (walletSettings[showWalletSettings].buy_dip_timeout || 300)}
                              disabled={walletSettings[showWalletSettings].buy_dip_timeout <= -1}
                              onChange={(e) => setWalletSettings(prev => ({
                                ...prev,
                                [showWalletSettings]: {
                                  ...prev[showWalletSettings],
                                  buy_dip_timeout: parseInt(e.target.value) || 0
                                }
                              }))}
                              className={`w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300 ${walletSettings[showWalletSettings].buy_dip_timeout <= -1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                              placeholder={walletSettings[showWalletSettings].buy_dip_timeout <= -1 ? "Infinite" : "300"}
                              min="0"
                              step="1"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <label className="block text-sm font-orbitron text-molten-gold font-semibold">Dip Recovery</label>
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
                                onClick={() => setWalletSettings(prev => ({
                                  ...prev,
                                  [showWalletSettings]: {
                                    ...prev[showWalletSettings],
                                    dip_recovery: !prev[showWalletSettings].dip_recovery
                                  }
                                }))}
                                className={`w-10 h-5 rounded-full p-1 transition-all duration-300 ${walletSettings[showWalletSettings].dip_recovery ? 'bg-molten-gold' : 'bg-gray-600'
                                  }`}
                                whileTap={{ scale: 0.95 }}
                              >
                                <motion.div
                                  className="w-3 h-3 bg-white rounded-full"
                                  animate={{ x: walletSettings[showWalletSettings].dip_recovery ? 16 : 0 }}
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                              </motion.button>
                            </div>
                          </div>
                        </div>

                        {walletSettings[showWalletSettings].dip_recovery && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="grid grid-cols-2 gap-4"
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <label className="block text-sm font-orbitron text-molten-gold font-semibold">Dip Recovery %</label>
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
                                value={walletSettings[showWalletSettings].dip_recovery_percentage || 5}
                                onChange={(e) => setWalletSettings(prev => ({
                                  ...prev,
                                  [showWalletSettings]: {
                                    ...prev[showWalletSettings],
                                    dip_recovery_percentage: parseFloat(e.target.value) || 0
                                  }
                                }))}
                                className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                                min="0"
                                max="100"
                                step="0.1"
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <label className="block text-sm font-orbitron text-molten-gold font-semibold">Dip Recovery Timeout (seconds)</label>
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
                                    checked={walletSettings[showWalletSettings].dip_recovery_timeout <= -1}
                                    onChange={(e) => setWalletSettings(prev => ({
                                      ...prev,
                                      [showWalletSettings]: {
                                        ...prev[showWalletSettings],
                                        dip_recovery_timeout: e.target.checked ? -1 : 600
                                      }
                                    }))}
                                    className="w-4 h-4 rounded border-molten-gold/20 bg-void-black/50 text-molten-gold focus:ring-molten-gold focus:ring-offset-0"
                                  />
                                </div>
                              </div>
                              <input
                                type="number"
                                value={walletSettings[showWalletSettings].dip_recovery_timeout <= -1 ? '' : (walletSettings[showWalletSettings].dip_recovery_timeout || 600)}
                                disabled={walletSettings[showWalletSettings].dip_recovery_timeout <= -1}
                                onChange={(e) => setWalletSettings(prev => ({
                                  ...prev,
                                  [showWalletSettings]: {
                                    ...prev[showWalletSettings],
                                    dip_recovery_timeout: parseInt(e.target.value) || 0
                                  }
                                }))}
                                className={`w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300 ${walletSettings[showWalletSettings].dip_recovery_timeout <= -1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                placeholder={walletSettings[showWalletSettings].dip_recovery_timeout <= -1 ? "Infinite" : "600"}
                                min="0"
                                step="1"
                              />
                            </div>
                          </motion.div>
                        )}

                        <div className="flex items-center justify-between col-span-2 mt-4 pt-4 border-t border-molten-gold/10">
                          <div className="flex items-center gap-2">
                            <label className="block text-sm font-orbitron text-molten-gold font-semibold">One BTD Event at a Time</label>
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
                            onClick={() => setWalletSettings(prev => ({
                              ...prev,
                              [showWalletSettings]: {
                                ...prev[showWalletSettings],
                                one_btd_at_a_time: !prev[showWalletSettings].one_btd_at_a_time
                              }
                            }))}
                            className={`w-10 h-5 rounded-full p-1 transition-all duration-300 ${walletSettings[showWalletSettings].one_btd_at_a_time ? 'bg-molten-gold' : 'bg-gray-600'}`}
                            whileTap={{ scale: 0.95 }}
                          >
                            <motion.div
                              className="w-3 h-3 bg-white rounded-full"
                              animate={{ x: walletSettings[showWalletSettings].one_btd_at_a_time ? 20 : 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          </motion.button>
                        </div>

                        <div className="col-span-2 space-y-4 pt-4 border-t border-molten-gold/10">
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
                              onClick={() => setWalletSettings(prev => ({
                                ...prev,
                                [showWalletSettings]: {
                                  ...prev[showWalletSettings],
                                  btd_on_partial_sell: { ...(prev[showWalletSettings].btd_on_partial_sell || {}), enabled: !(prev[showWalletSettings].btd_on_partial_sell?.enabled) }
                                }
                              }))}
                              className={`w-10 h-5 rounded-full p-1 transition-all duration-300 flex-shrink-0 ${walletSettings[showWalletSettings].btd_on_partial_sell?.enabled ? 'bg-molten-gold' : 'bg-gray-600'}`}
                              whileTap={{ scale: 0.95 }}
                            >
                              <motion.div
                                className="w-3 h-3 bg-white rounded-full"
                                animate={{ x: walletSettings[showWalletSettings].btd_on_partial_sell?.enabled ? 20 : 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              />
                            </motion.button>
                          </div>

                          {walletSettings[showWalletSettings].btd_on_partial_sell?.enabled && (
                            <div className="mt-2 ml-4 mb-4">
                              <label className="block text-xs font-orbitron text-molten-gold mb-1">Target Token (Optional)</label>
                              <input
                                type="text"
                                value={walletSettings[showWalletSettings].btd_on_partial_sell?.target_token || ''}
                                onChange={(e) => setWalletSettings(prev => ({
                                  ...prev,
                                  [showWalletSettings]: {
                                    ...prev[showWalletSettings],
                                    btd_on_partial_sell: { ...prev[showWalletSettings].btd_on_partial_sell, target_token: e.target.value }
                                  }
                                }))}
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
                              onClick={() => setWalletSettings(prev => ({
                                ...prev,
                                [showWalletSettings]: {
                                  ...prev[showWalletSettings],
                                  btd_on_full_sell: { ...(prev[showWalletSettings].btd_on_full_sell || {}), enabled: !(prev[showWalletSettings].btd_on_full_sell?.enabled) }
                                }
                              }))}
                              className={`w-10 h-5 rounded-full p-1 transition-all duration-300 flex-shrink-0 ${walletSettings[showWalletSettings].btd_on_full_sell?.enabled ? 'bg-molten-gold' : 'bg-gray-600'}`}
                              whileTap={{ scale: 0.95 }}
                            >
                              <motion.div
                                className="w-3 h-3 bg-white rounded-full"
                                animate={{ x: walletSettings[showWalletSettings].btd_on_full_sell?.enabled ? 20 : 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              />
                            </motion.button>
                          </div>

                          {walletSettings[showWalletSettings].btd_on_full_sell?.enabled && (
                            <div className="mt-2 ml-4">
                              <label className="block text-xs font-orbitron text-molten-gold mb-1">Target Token (Optional)</label>
                              <input
                                type="text"
                                value={walletSettings[showWalletSettings].btd_on_full_sell?.target_token || ''}
                                onChange={(e) => setWalletSettings(prev => ({
                                  ...prev,
                                  [showWalletSettings]: {
                                    ...prev[showWalletSettings],
                                    btd_on_full_sell: { ...prev[showWalletSettings].btd_on_full_sell, target_token: e.target.value }
                                  }
                                }))}
                                className="w-full md:max-w-md bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk text-sm focus:border-molten-gold focus:outline-none transition-colors duration-300"
                                placeholder="Paste token address or leave empty for all"
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Custom Trade Amount */}
                  <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4">
                    <h4 className="text-lg font-orbitron font-semibold text-white mb-4">Trade Amount</h4>
                    <div className="flex flex-col gap-4">
                      {selectedCoin === 'sol' ? (
                        <div>
                          <label className="block text-sm font-orbitron text-molten-gold mb-2 tracking-wide uppercase">
                            SOL Amount to Buy
                          </label>
                          <input
                            type="number"
                            value={walletSettings[showWalletSettings].sol_trade_amount === 0 || walletSettings[showWalletSettings].sol_trade_amount ? walletSettings[showWalletSettings].sol_trade_amount : ''}
                            onChange={(e) => setWalletSettings(prev => ({
                              ...prev,
                              [showWalletSettings]: {
                                ...prev[showWalletSettings],
                                sol_trade_amount: e.target.value === '' ? null : parseFloat(e.target.value)
                              }
                            }))}
                            className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                            min="0"
                            step="0.001"
                            placeholder="Default SOL amount"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-orbitron text-molten-gold mb-2 tracking-wide uppercase">
                            BNB Amount to Buy
                          </label>
                          <input
                            type="number"
                            value={walletSettings[showWalletSettings].bnb_trade_amount === 0 || walletSettings[showWalletSettings].bnb_trade_amount ? walletSettings[showWalletSettings].bnb_trade_amount : ''}
                            onChange={(e) => setWalletSettings(prev => ({
                              ...prev,
                              [showWalletSettings]: {
                                ...prev[showWalletSettings],
                                bnb_trade_amount: e.target.value === '' ? null : parseFloat(e.target.value)
                              }
                            }))}
                            className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                            min="0"
                            step="0.001"
                            placeholder="Default BNB amount"
                          />
                        </div>
                      )}
                      <p className="text-[10px] text-white/40 mt-1 font-space-grotesk italic">
                        If set, this will override your global {selectedCoin.toUpperCase()} trade amount for this specific wallet.
                      </p>
                    </div>
                  </div>

                  {/* Slippage Settings */}
                  <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4">
                    <h4 className="text-lg font-orbitron font-semibold text-white mb-4">Slippage Settings</h4>

                    <div>
                      <label className="block text-sm font-orbitron text-molten-gold mb-2 tracking-wide">
                        SLIPPAGE (%)
                      </label>
                      <input
                        type="number"
                        value={walletSettings[showWalletSettings].slippage === 0 || walletSettings[showWalletSettings].slippage ? walletSettings[showWalletSettings].slippage : ''}
                        onChange={(e) => setWalletSettings(prev => ({
                          ...prev,
                          [showWalletSettings]: {
                            ...prev[showWalletSettings],
                            slippage: e.target.value === '' ? '' : parseFloat(e.target.value)
                          }
                        }))}
                        className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                  </div>

                  {/* TP/SL Control Switch */}
                  <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-orbitron font-semibold text-white mb-1">Take Profit / Stop Loss</h4>
                        <p className="text-white/60 font-space-grotesk text-xs">Enable or disable TP/SL tracking</p>
                      </div>
                      <motion.button
                        onClick={() => setTpSlIsActive(prev => ({
                          ...prev,
                          [showWalletSettings]: !(prev[showWalletSettings] ?? true)
                        }))}
                        className={`w-14 h-7 rounded-full p-1 transition-all duration-300 ${(tpSlIsActive[showWalletSettings] ?? true) ? 'bg-molten-gold' : 'bg-gray-600'
                          }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.div
                          className="w-5 h-5 bg-white rounded-full"
                          animate={{ x: (tpSlIsActive[showWalletSettings] ?? true) ? 20 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </motion.button>
                    </div>
                  </div>

                  {/* Auto Take Profit */}
                  <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <h4 className="text-lg font-orbitron font-semibold text-white">Auto Take Profit</h4>
                      <div className="group relative">
                        <div className="w-5 h-5 bg-molten-gold/20 rounded-full flex items-center justify-center cursor-help">
                          <span className="text-xs text-molten-gold">?</span>
                        </div>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 bg-void-black/95 border border-molten-gold/30 rounded-lg p-3 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                          Set multiple profit targets. When a token reaches the specified profit percentage, the system will automatically sell the configured percentage of your holdings. The total sell percentage across all levels must equal 100%. Example: TP1 at 100% profit sells 50%, TP2 at 150% profit sells remaining 50%.
                        </div>
                      </div>
                    </div>

                    <div className={`space-y-3 ${!(tpSlIsActive[showWalletSettings] ?? true) ? 'opacity-50 pointer-events-none' : ''}`}>
                      {(walletSettings[showWalletSettings]?.take_profit_levels || []).map((level: any, index: number) => {
                        const tpLevels = walletSettings[showWalletSettings]?.take_profit_levels || []
                        const shouldShow = index === 0 || showAllTP[showWalletSettings]
                        if (!shouldShow) return null

                        return (
                          <div key={index} className="flex items-center gap-3">
                            <span className="text-sm text-white/60 font-space-grotesk w-30">When price up &gt;</span>
                            <input
                              type="number"
                              value={level.profit_percentage === 0 ? '' : level.profit_percentage}
                              onChange={(e) => updateTakeProfitLevel(showWalletSettings, index, 'profit_percentage', e.target.value)}
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
                              onChange={(e) => updateTakeProfitLevel(showWalletSettings, index, 'sell_percentage', e.target.value)}
                              className="w-24 bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                              placeholder="0"
                              min="0"
                              max="100"
                              step="0.1"
                            />
                            <span className="text-white">%</span>
                            {tpLevels.length > 1 && (
                              <button
                                onClick={() => removeTakeProfitLevel(showWalletSettings, index)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        )
                      })}
                      {tpValidationErrors[showWalletSettings] && (
                        <p className="text-sm text-red-400 font-space-grotesk">{tpValidationErrors[showWalletSettings]}</p>
                      )}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => addTakeProfitLevel(showWalletSettings)}
                          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-space-grotesk"
                        >
                          <Plus size={16} />
                          <span>Add Level</span>
                        </button>
                        {(walletSettings[showWalletSettings]?.take_profit_levels || []).length > 1 && (
                          <button
                            onClick={() => setShowAllTP(prev => ({ ...prev, [showWalletSettings]: !prev[showWalletSettings] }))}
                            className="flex items-center gap-2 text-molten-gold hover:text-yellow-400 transition-colors text-sm font-space-grotesk"
                          >
                            <span>View All</span>
                            {showAllTP[showWalletSettings] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Auto Stop Loss */}
                  <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <h4 className="text-lg font-orbitron font-semibold text-white">Auto Stop Loss</h4>
                      <div className="group relative">
                        <div className="w-5 h-5 bg-molten-gold/20 rounded-full flex items-center justify-center cursor-help">
                          <span className="text-xs text-molten-gold">?</span>
                        </div>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 bg-void-black/95 border border-molten-gold/30 rounded-lg p-3 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                          Set multiple stop loss levels. When a token drops to the specified loss percentage, the system will automatically sell the configured percentage of your holdings. The total sell percentage across all levels must equal 100%. Example: SL at 15% loss sells 100% of holdings.
                        </div>
                      </div>
                    </div>

                    <div className={`space-y-3 ${!(tpSlIsActive[showWalletSettings] ?? true) ? 'opacity-50 pointer-events-none' : ''}`}>
                      {(walletSettings[showWalletSettings]?.stop_loss_levels || []).map((level: any, index: number) => {
                        const slLevels = walletSettings[showWalletSettings]?.stop_loss_levels || []
                        const shouldShow = index === 0 || showAllSL[showWalletSettings]
                        if (!shouldShow) return null

                        return (
                          <div key={index} className="flex items-center gap-3">
                            <span className="text-sm text-white/60 font-space-grotesk w-30">When price down &gt;</span>
                            <input
                              type="number"
                              value={level.loss_percentage === 0 ? '' : level.loss_percentage}
                              onChange={(e) => updateStopLossLevel(showWalletSettings, index, 'loss_percentage', e.target.value)}
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
                              onChange={(e) => updateStopLossLevel(showWalletSettings, index, 'sell_percentage', e.target.value)}
                              className="w-24 bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                              placeholder="0"
                              min="0"
                              max="100"
                              step="0.1"
                            />
                            <span className="text-white">%</span>
                            {slLevels.length > 1 && (
                              <button
                                onClick={() => removeStopLossLevel(showWalletSettings, index)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        )
                      })}
                      {slValidationErrors[showWalletSettings] && (
                        <p className="text-sm text-red-400 font-space-grotesk">{slValidationErrors[showWalletSettings]}</p>
                      )}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => addStopLossLevel(showWalletSettings)}
                          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-space-grotesk"
                        >
                          <Plus size={16} />
                          <span>Add Level</span>
                        </button>
                        {(walletSettings[showWalletSettings]?.stop_loss_levels || []).length > 1 && (
                          <button
                            onClick={() => setShowAllSL(prev => ({ ...prev, [showWalletSettings]: !prev[showWalletSettings] }))}
                            className="flex items-center gap-2 text-molten-gold hover:text-yellow-400 transition-colors text-sm font-space-grotesk"
                          >
                            <span>View All</span>
                            {showAllSL[showWalletSettings] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Trading Filters Section */}
                  <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4">
                    <h4 className="text-lg font-orbitron font-semibold text-white mb-4">Trading Filters</h4>
                    <div className="space-y-4">
                      <div className="flex items-start gap-2 rounded-lg border border-molten-gold/15 bg-molten-gold/[0.06] p-3">
                        <Info size={14} className="mt-0.5 flex-shrink-0 text-molten-gold/80" />
                        <p className="text-[10px] md:text-xs text-white/55 font-space-grotesk leading-relaxed">
                          When enabled, each mirror wallet can trigger one copied buy per token. If that wallet already bought the same token in your successful logs, the new buy is skipped; other tokens can still be copied.
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-sm font-orbitron font-semibold text-white mb-1">First Purchase Only</h5>
                          <p className="text-white/40 font-space-grotesk text-[10px] md:text-xs">Only copy the first purchase per token for each mirror wallet</p>
                        </div>
                        <motion.button
                          onClick={() => setWalletSettings(prev => ({
                            ...prev,
                            [showWalletSettings]: {
                              ...prev[showWalletSettings],
                              entry_on_first_swap: !prev[showWalletSettings].entry_on_first_swap
                            }
                          }))}
                          className={`w-10 h-5 rounded-full p-1 transition-all duration-300 flex-shrink-0 ${walletSettings[showWalletSettings].entry_on_first_swap ? 'bg-molten-gold' : 'bg-gray-600'}`}
                          whileTap={{ scale: 0.95 }}
                        >
                          <motion.div
                            className="w-3 h-3 bg-white rounded-full"
                            animate={{ x: walletSettings[showWalletSettings].entry_on_first_swap ? 20 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        </motion.button>
                      </div>

                      {/* Buy once per token */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-sm font-orbitron font-semibold text-white mb-1">Buy Once Per Token</h5>
                          <p className="text-white/40 font-space-grotesk text-[10px] md:text-xs">Never buy the same token twice</p>
                        </div>
                        <motion.button
                          onClick={() => setWalletSettings(prev => ({
                            ...prev,
                            [showWalletSettings]: {
                              ...prev[showWalletSettings],
                              buy_once_per_token: !prev[showWalletSettings].buy_once_per_token
                            }
                          }))}
                          className={`w-10 h-5 rounded-full p-1 transition-all duration-300 flex-shrink-0 ${walletSettings[showWalletSettings].buy_once_per_token ? 'bg-molten-gold' : 'bg-gray-600'}`}
                          whileTap={{ scale: 0.95 }}
                        >
                          <motion.div
                            className="w-3 h-3 bg-white rounded-full"
                            animate={{ x: walletSettings[showWalletSettings].buy_once_per_token ? 20 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        </motion.button>
                      </div>

                      <div className={`${selectedCoin !== 'sol' ? 'opacity-50 grayscale pointer-events-none' : ''} space-y-4 border-t border-molten-gold/10 pt-4`}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div>
                              <h5 className="text-sm font-orbitron font-semibold text-white mb-1">Only New Mirror Positions</h5>
                              <p className="text-white/40 font-space-grotesk text-[10px] md:text-xs">Only copy a SOL buy if the mirror wallet held zero of that token immediately before buying</p>
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
                            onClick={() => setWalletSettings(prev => ({
                              ...prev,
                              [showWalletSettings]: {
                                ...prev[showWalletSettings],
                                copy_only_new_positions: !prev[showWalletSettings].copy_only_new_positions
                              }
                            }))}
                            className={`w-10 h-5 rounded-full p-1 transition-all duration-300 flex-shrink-0 ${walletSettings[showWalletSettings].copy_only_new_positions ? 'bg-molten-gold' : 'bg-gray-600'}`}
                            whileTap={{ scale: 0.95 }}
                          >
                            <motion.div
                              className="w-3 h-3 bg-white rounded-full"
                              animate={{ x: walletSettings[showWalletSettings].copy_only_new_positions ? 20 : 0 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                          </motion.button>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div>
                                <h5 className="text-sm font-orbitron font-semibold text-white mb-1">Enter On Spike Pullback</h5>
                                <p className="text-white/40 font-space-grotesk text-[10px] md:text-xs">For fixed buys, wait for a spike above the mirror entry, then buy the pullback</p>
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
                              onClick={() => setWalletSettings(prev => ({
                                ...prev,
                                [showWalletSettings]: {
                                  ...prev[showWalletSettings],
                                  spike_entry_enabled: !prev[showWalletSettings].spike_entry_enabled
                                }
                              }))}
                              className={`w-10 h-5 rounded-full p-1 transition-all duration-300 flex-shrink-0 ${walletSettings[showWalletSettings].spike_entry_enabled ? 'bg-molten-gold' : 'bg-gray-600'}`}
                              whileTap={{ scale: 0.95 }}
                            >
                              <motion.div
                                className="w-3 h-3 bg-white rounded-full"
                                animate={{ x: walletSettings[showWalletSettings].spike_entry_enabled ? 20 : 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              />
                            </motion.button>
                          </div>

                          {walletSettings[showWalletSettings].spike_entry_enabled && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="space-y-3 rounded-lg border border-molten-gold/10 bg-black/20 p-3"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="flex items-center gap-2 text-[10px] md:text-xs font-orbitron text-molten-gold mb-2 tracking-wide">
                                    Pullback %
                                    <span className="group relative">
                                      <Info size={12} className="text-molten-gold cursor-help" />
                                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 bg-void-black/95 border border-molten-gold/30 rounded-lg p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">The buy level above mirror entry after a valid spike. Example: 5 means buy when price returns to entry +5%.</span>
                                    </span>
                                  </label>
                                  <input
                                    type="number"
                                    value={walletSettings[showWalletSettings].spike_entry_pullback_percentage}
                                    onChange={(e) => setWalletSettings(prev => ({
                                      ...prev,
                                      [showWalletSettings]: {
                                        ...prev[showWalletSettings],
                                        spike_entry_pullback_percentage: parseFloat(e.target.value) || 0
                                      }
                                    }))}
                                    className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                  />
                                </div>
                                <div>
                                  <label className="flex items-center gap-2 text-[10px] md:text-xs font-orbitron text-molten-gold mb-2 tracking-wide">
                                    Margin %
                                    <span className="group relative">
                                      <Info size={12} className="text-molten-gold cursor-help" />
                                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 bg-void-black/95 border border-molten-gold/30 rounded-lg p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">Extra spike confirmation above the pullback. Pullback 5 and margin 1 requires a 6% spike, then a pullback to 5%.</span>
                                    </span>
                                  </label>
                                  <input
                                    type="number"
                                    value={walletSettings[showWalletSettings].spike_entry_margin_percentage}
                                    onChange={(e) => setWalletSettings(prev => ({
                                      ...prev,
                                      [showWalletSettings]: {
                                        ...prev[showWalletSettings],
                                        spike_entry_margin_percentage: parseFloat(e.target.value) || 0
                                      }
                                    }))}
                                    className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                  />
                                </div>
                                <div>
                                  <label className="flex items-center gap-2 text-[10px] md:text-xs font-orbitron text-molten-gold mb-2 tracking-wide">
                                    Timeout Seconds
                                    <span className="group relative">
                                      <Info size={12} className="text-molten-gold cursor-help" />
                                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-56 bg-void-black/95 border border-molten-gold/30 rounded-lg p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">How long the bot waits for the spike and pullback before cancelling. Indefinite stores -1.</span>
                                    </span>
                                  </label>
                                  <input
                                    type="number"
                                    value={walletSettings[showWalletSettings].spike_entry_timeout_seconds === -1 ? '' : walletSettings[showWalletSettings].spike_entry_timeout_seconds}
                                    onChange={(e) => setWalletSettings(prev => ({
                                      ...prev,
                                      [showWalletSettings]: {
                                        ...prev[showWalletSettings],
                                        spike_entry_timeout_seconds: parseInt(e.target.value, 10) || 0
                                      }
                                    }))}
                                    disabled={walletSettings[showWalletSettings].spike_entry_timeout_seconds === -1}
                                    className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300 disabled:opacity-50"
                                    min="0"
                                    step="1"
                                    placeholder="Indefinite"
                                  />
                                  <label className="mt-2 flex items-center gap-2 text-[11px] text-white/50 font-space-grotesk">
                                    <input
                                      type="checkbox"
                                      checked={walletSettings[showWalletSettings].spike_entry_timeout_seconds === -1}
                                      onChange={(e) => setWalletSettings(prev => ({
                                        ...prev,
                                        [showWalletSettings]: {
                                          ...prev[showWalletSettings],
                                          spike_entry_timeout_seconds: e.target.checked ? -1 : 300
                                        }
                                      }))}
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
                                  onClick={() => setWalletSettings(prev => ({
                                    ...prev,
                                    [showWalletSettings]: {
                                      ...prev[showWalletSettings],
                                      spike_entry_require_unsold_mirror: !prev[showWalletSettings].spike_entry_require_unsold_mirror
                                    }
                                  }))}
                                  className={`w-10 h-5 rounded-full p-1 transition-all duration-300 flex-shrink-0 ${walletSettings[showWalletSettings].spike_entry_require_unsold_mirror ? 'bg-molten-gold' : 'bg-gray-600'}`}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <motion.div
                                    className="w-3 h-3 bg-white rounded-full"
                                    animate={{ x: walletSettings[showWalletSettings].spike_entry_require_unsold_mirror ? 20 : 0 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                  />
                                </motion.button>
                              </div>
                            </motion.div>
                          )}
                          {selectedCoin !== 'sol' && (
                            <p className="text-[10px] md:text-xs text-molten-gold/70 font-space-grotesk">Spike and new-position controls are SOL-only in v1.</p>
                          )}
                        </div>
                      </div>

                      {/* Mirror Sells Toggle */}
                      <div className={`flex items-center justify-between ${!(tpSlIsActive[showWalletSettings] ?? true) ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                        <div>
                          <h5 className="text-sm font-orbitron font-semibold text-white mb-1">Mirror Sells</h5>
                          <p className="text-white/40 font-space-grotesk text-[10px] md:text-xs">When TP/SL is active, disable this to ignore mirror wallet sells</p>
                        </div>
                        <motion.button
                          onClick={() => setWalletSettings(prev => ({
                            ...prev,
                            [showWalletSettings]: {
                              ...prev[showWalletSettings],
                              mirror_sells_enabled: !prev[showWalletSettings].mirror_sells_enabled
                            }
                          }))}
                          className={`w-10 h-5 rounded-full p-1 transition-all duration-300 flex-shrink-0 ${walletSettings[showWalletSettings].mirror_sells_enabled ? 'bg-molten-gold' : 'bg-gray-600'}`}
                          whileTap={{ scale: 0.95 }}
                        >
                          <motion.div
                            className="w-3 h-3 bg-white rounded-full"
                            animate={{ x: walletSettings[showWalletSettings].mirror_sells_enabled ? 20 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        </motion.button>
                      </div>

                      {/* Reverse Copy Trade Checkbox */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <h5 className="text-sm font-orbitron font-semibold text-white mb-1">Reverse Copy Trade</h5>
                            <p className="text-white/40 font-space-grotesk text-[10px] md:text-xs">Invert mirror wallet actions</p>
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
                          onClick={() => setWalletSettings(prev => ({
                            ...prev,
                            [showWalletSettings]: {
                              ...prev[showWalletSettings],
                              reverse_copy: !prev[showWalletSettings].reverse_copy
                            }
                          }))}
                          className={`w-10 h-5 rounded-full p-1 transition-all duration-300 flex-shrink-0 ${walletSettings[showWalletSettings].reverse_copy ? 'bg-molten-gold' : 'bg-gray-600'}`}
                          whileTap={{ scale: 0.95 }}
                        >
                          <motion.div
                            className="w-3 h-3 bg-white rounded-full"
                            animate={{ x: walletSettings[showWalletSettings].reverse_copy ? 20 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        </motion.button>
                      </div>

                      {walletSettings[showWalletSettings].reverse_copy && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 space-y-2 border-t border-molten-gold/10 pt-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-[10px] md:text-xs font-orbitron font-semibold text-white">Reverse Delay (seconds)</h5>
                              <p className="text-white/40 font-space-grotesk text-[8px] md:text-[10px]">Wait before executing reverse trade</p>
                            </div>
                            <input
                              type="number"
                              value={walletSettings[showWalletSettings].reverse_copy_delay ?? 0}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setWalletSettings(prev => ({
                                  ...prev,
                                  [showWalletSettings]: {
                                    ...prev[showWalletSettings],
                                    reverse_copy_delay: isNaN(val) ? 0 : val
                                  }
                                }));
                              }}
                              className="w-20 bg-void-black/50 border border-molten-gold/20 rounded px-2 py-1 text-white font-space-grotesk text-right text-xs focus:border-molten-gold focus:outline-none transition-colors duration-300"
                              min="0"
                              step="1"
                            />
                          </div>
                        </motion.div>
                      )}
                      <div className="border-t border-molten-gold/10 pt-4 space-y-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div>
                                <h5 className="text-sm font-orbitron font-semibold text-white mb-1">Token Filters</h5>
                                <p className="text-white/40 font-space-grotesk text-[10px] md:text-xs">Filter copied {selectedCoin.toUpperCase()} buys by market cap, liquidity, holders, and token age</p>
                              </div>
                              <div className="group relative">
                                <div className="w-5 h-5 bg-molten-gold/20 rounded-full flex items-center justify-center cursor-help">
                                  <Info size={12} className="text-molten-gold" />
                                </div>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-72 bg-void-black/95 border border-molten-gold/30 rounded-lg p-3 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                                  SOL uses RugCheck data. BNB uses GeckoTerminal token info, with holder last_updated used as the token age reference. Blank min or max values are ignored.
                                </div>
                              </div>
                            </div>
                            <motion.button
                              onClick={() => setWalletSettings(prev => ({
                                ...prev,
                                [showWalletSettings]: {
                                  ...prev[showWalletSettings],
                                  rugcheck_filters_enabled: !prev[showWalletSettings].rugcheck_filters_enabled
                                }
                              }))}
                              className={`w-10 h-5 rounded-full p-1 transition-all duration-300 flex-shrink-0 ${walletSettings[showWalletSettings].rugcheck_filters_enabled ? 'bg-molten-gold' : 'bg-gray-600'}`}
                              whileTap={{ scale: 0.95 }}
                            >
                              <motion.div
                                className="w-3 h-3 bg-white rounded-full"
                                animate={{ x: walletSettings[showWalletSettings].rugcheck_filters_enabled ? 20 : 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              />
                            </motion.button>
                          </div>

                          {walletSettings[showWalletSettings].rugcheck_filters_enabled && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="grid grid-cols-1 md:grid-cols-2 gap-3"
                            >
                              <div>
                                <label className="flex items-center gap-2 text-[10px] md:text-xs font-orbitron text-molten-gold mb-2 tracking-wide">
                                  Min Market Cap USD
                                  <span className="group relative">
                                    <Info size={12} className="text-molten-gold cursor-help" />
                                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-52 bg-void-black/95 border border-molten-gold/30 rounded-lg p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">Skip tokens below this minimum market cap.</span>
                                  </span>
                                </label>
                                <input
                                  type="number"
                                  value={walletSettings[showWalletSettings].min_market_cap_usd ?? ''}
                                  onChange={(e) => setWalletSettings(prev => ({
                                    ...prev,
                                    [showWalletSettings]: {
                                      ...prev[showWalletSettings],
                                      min_market_cap_usd: optionalFloatFromInput(e.target.value)
                                    }
                                  }))}
                                  className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk text-xs focus:border-molten-gold focus:outline-none transition-colors duration-300"
                                  min="0"
                                  step="1"
                                  placeholder="No minimum"
                                />
                              </div>
                              <div>
                                <label className="flex items-center gap-2 text-[10px] md:text-xs font-orbitron text-molten-gold mb-2 tracking-wide">
                                  Max Market Cap USD
                                  <span className="group relative">
                                    <Info size={12} className="text-molten-gold cursor-help" />
                                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-52 bg-void-black/95 border border-molten-gold/30 rounded-lg p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">Skip tokens above this market cap.</span>
                                  </span>
                                </label>
                                <input
                                  type="number"
                                  value={walletSettings[showWalletSettings].max_market_cap_usd ?? ''}
                                  onChange={(e) => setWalletSettings(prev => ({
                                    ...prev,
                                    [showWalletSettings]: {
                                      ...prev[showWalletSettings],
                                      max_market_cap_usd: optionalFloatFromInput(e.target.value)
                                    }
                                  }))}
                                  className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk text-xs focus:border-molten-gold focus:outline-none transition-colors duration-300"
                                  min="0"
                                  step="1"
                                  placeholder="No maximum"
                                />
                              </div>
                              <div>
                                <label className="flex items-center gap-2 text-[10px] md:text-xs font-orbitron text-molten-gold mb-2 tracking-wide">
                                  Min Liquidity USD
                                  <span className="group relative">
                                    <Info size={12} className="text-molten-gold cursor-help" />
                                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-52 bg-void-black/95 border border-molten-gold/30 rounded-lg p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">Skip tokens below this liquidity.</span>
                                  </span>
                                </label>
                                <input
                                  type="number"
                                  value={walletSettings[showWalletSettings].min_liquidity_usd ?? ''}
                                  onChange={(e) => setWalletSettings(prev => ({
                                    ...prev,
                                    [showWalletSettings]: {
                                      ...prev[showWalletSettings],
                                      min_liquidity_usd: optionalFloatFromInput(e.target.value)
                                    }
                                  }))}
                                  className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk text-xs focus:border-molten-gold focus:outline-none transition-colors duration-300"
                                  min="0"
                                  step="1"
                                  placeholder="No minimum"
                                />
                              </div>
                              <div>
                                <label className="flex items-center gap-2 text-[10px] md:text-xs font-orbitron text-molten-gold mb-2 tracking-wide">
                                  Max Liquidity USD
                                  <span className="group relative">
                                    <Info size={12} className="text-molten-gold cursor-help" />
                                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-52 bg-void-black/95 border border-molten-gold/30 rounded-lg p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">Skip tokens above this liquidity.</span>
                                  </span>
                                </label>
                                <input
                                  type="number"
                                  value={walletSettings[showWalletSettings].max_liquidity_usd ?? ''}
                                  onChange={(e) => setWalletSettings(prev => ({
                                    ...prev,
                                    [showWalletSettings]: {
                                      ...prev[showWalletSettings],
                                      max_liquidity_usd: optionalFloatFromInput(e.target.value)
                                    }
                                  }))}
                                  className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk text-xs focus:border-molten-gold focus:outline-none transition-colors duration-300"
                                  min="0"
                                  step="1"
                                  placeholder="No maximum"
                                />
                              </div>
                              <div>
                                <label className="flex items-center gap-2 text-[10px] md:text-xs font-orbitron text-molten-gold mb-2 tracking-wide">
                                  Min Holders
                                  <span className="group relative">
                                    <Info size={12} className="text-molten-gold cursor-help" />
                                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-52 bg-void-black/95 border border-molten-gold/30 rounded-lg p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">Skip tokens with fewer holders.</span>
                                  </span>
                                </label>
                                <input
                                  type="number"
                                  value={walletSettings[showWalletSettings].min_holders ?? ''}
                                  onChange={(e) => setWalletSettings(prev => ({
                                    ...prev,
                                    [showWalletSettings]: {
                                      ...prev[showWalletSettings],
                                      min_holders: optionalIntFromInput(e.target.value)
                                    }
                                  }))}
                                  className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk text-xs focus:border-molten-gold focus:outline-none transition-colors duration-300"
                                  min="0"
                                  step="1"
                                  placeholder="No minimum"
                                />
                              </div>
                              <div>
                                <label className="flex items-center gap-2 text-[10px] md:text-xs font-orbitron text-molten-gold mb-2 tracking-wide">
                                  Max Holders
                                  <span className="group relative">
                                    <Info size={12} className="text-molten-gold cursor-help" />
                                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-52 bg-void-black/95 border border-molten-gold/30 rounded-lg p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">Skip tokens with more holders.</span>
                                  </span>
                                </label>
                                <input
                                  type="number"
                                  value={walletSettings[showWalletSettings].max_holders ?? ''}
                                  onChange={(e) => setWalletSettings(prev => ({
                                    ...prev,
                                    [showWalletSettings]: {
                                      ...prev[showWalletSettings],
                                      max_holders: optionalIntFromInput(e.target.value)
                                    }
                                  }))}
                                  className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk text-xs focus:border-molten-gold focus:outline-none transition-colors duration-300"
                                  min="0"
                                  step="1"
                                  placeholder="No maximum"
                                />
                              </div>
                              <div>
                                <label className="flex items-center gap-2 text-[10px] md:text-xs font-orbitron text-molten-gold mb-2 tracking-wide">
                                  Min Token Age Minutes
                                  <span className="group relative">
                                    <Info size={12} className="text-molten-gold cursor-help" />
                                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-52 bg-void-black/95 border border-molten-gold/30 rounded-lg p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">Skip tokens younger than this age. BNB uses GeckoTerminal holders.last_updated.</span>
                                  </span>
                                </label>
                                <input
                                  type="number"
                                  value={secondsToMinutesInput(walletSettings[showWalletSettings].min_token_age_seconds)}
                                  onChange={(e) => setWalletSettings(prev => ({
                                    ...prev,
                                    [showWalletSettings]: {
                                      ...prev[showWalletSettings],
                                      min_token_age_seconds: minutesToSecondsInput(e.target.value)
                                    }
                                  }))}
                                  className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk text-xs focus:border-molten-gold focus:outline-none transition-colors duration-300"
                                  min="0"
                                  step="1"
                                  placeholder="No minimum"
                                />
                              </div>
                              <div>
                                <label className="flex items-center gap-2 text-[10px] md:text-xs font-orbitron text-molten-gold mb-2 tracking-wide">
                                  Max Token Age Minutes
                                  <span className="group relative">
                                    <Info size={12} className="text-molten-gold cursor-help" />
                                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-52 bg-void-black/95 border border-molten-gold/30 rounded-lg p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">Skip tokens older than this age. BNB uses GeckoTerminal holders.last_updated.</span>
                                  </span>
                                </label>
                                <input
                                  type="number"
                                  value={secondsToMinutesInput(walletSettings[showWalletSettings].max_token_age_seconds)}
                                  onChange={(e) => setWalletSettings(prev => ({
                                    ...prev,
                                    [showWalletSettings]: {
                                      ...prev[showWalletSettings],
                                      max_token_age_seconds: minutesToSecondsInput(e.target.value)
                                    }
                                  }))}
                                  className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk text-xs focus:border-molten-gold focus:outline-none transition-colors duration-300"
                                  min="0"
                                  step="1"
                                  placeholder="No maximum"
                                />
                              </div>
                            </motion.div>
                          )}
                          <p className="text-[10px] md:text-xs text-molten-gold/70 font-space-grotesk">Applying these filters adds a metadata check before each copied {selectedCoin.toUpperCase()} buy.</p>
                        </div>
                    </div>
                  </div>

                  {/* Advanced Filters - Collapsable */}
                  <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4">
                    <button
                      onClick={() => setShowAdvancedFilters(prev => ({ ...prev, [showWalletSettings]: !prev[showWalletSettings] }))}
                      className="flex items-center justify-between w-full"
                    >
                      <h4 className="text-lg font-orbitron font-semibold text-white">Advanced Filters</h4>
                      {showAdvancedFilters[showWalletSettings] ? <ChevronUp size={20} className="text-molten-gold" /> : <ChevronDown size={20} className="text-molten-gold" />}
                    </button>

                    {showAdvancedFilters[showWalletSettings] && (
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
                            value={walletSettings[showWalletSettings].max_buys_per_mirror_per_hour ?? ''}
                            onChange={(e) => setWalletSettings(prev => ({
                              ...prev,
                              [showWalletSettings]: {
                                ...prev[showWalletSettings],
                                max_buys_per_mirror_per_hour: e.target.value === '' ? undefined : (isNaN(parseInt(e.target.value)) ? undefined : parseInt(e.target.value))
                              }
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
                            value={walletSettings[showWalletSettings].max_buys_per_mirror_per_day ?? ''}
                            onChange={(e) => setWalletSettings(prev => ({
                              ...prev,
                              [showWalletSettings]: {
                                ...prev[showWalletSettings],
                                max_buys_per_mirror_per_day: e.target.value === '' ? undefined : (isNaN(parseInt(e.target.value)) ? undefined : parseInt(e.target.value))
                              }
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
                            value={walletSettings[showWalletSettings].max_buys_per_token_per_day ?? ''}
                            onChange={(e) => setWalletSettings(prev => ({
                              ...prev,
                              [showWalletSettings]: {
                                ...prev[showWalletSettings],
                                max_buys_per_token_per_day: e.target.value === '' ? undefined : (isNaN(parseInt(e.target.value)) ? undefined : parseInt(e.target.value))
                              }
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

                  {/* Tracking Type Settings */}
                  {selectedCoin === 'sol' && (
                    <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4">
                      <h4 className="text-lg font-orbitron font-semibold text-white mb-4">Tracking Activities</h4>
                      <p className="text-white/40 font-space-grotesk mb-4 text-xs italic">
                        Select which type of activities to track for this specific wallet.
                      </p>
                      <div className="space-y-2">
                        {[
                          { id: 'launches', label: 'Monitor Launches Only' },
                          { id: 'swaps', label: 'Monitor Swaps Only' },
                          { id: 'both', label: 'Monitor Both (Swaps + Launches)' }
                        ].map((option) => (
                          <button
                            key={option.id}
                            onClick={() => setWalletSettings(prev => ({
                              ...prev,
                              [showWalletSettings]: {
                                ...prev[showWalletSettings],
                                tracking_type: typeof prev[showWalletSettings].tracking_type === 'string'
                                  ? { type: option.id }
                                  : { ...prev[showWalletSettings].tracking_type, type: option.id }
                              }
                            }))}
                            className={`w-full px-4 py-2 rounded-lg border text-left transition-all duration-300 flex items-center justify-between ${(typeof walletSettings[showWalletSettings].tracking_type === 'string' ? walletSettings[showWalletSettings].tracking_type : walletSettings[showWalletSettings].tracking_type?.type) === option.id
                              ? 'bg-molten-gold/10 border-molten-gold text-molten-gold'
                              : 'bg-void-black/50 border-white/10 text-white/60 hover:border-molten-gold/30'
                              }`}
                          >
                            <span className="font-orbitron font-semibold text-xs tracking-wider">
                              {option.label}
                            </span>
                            {(typeof walletSettings[showWalletSettings].tracking_type === 'string' ? walletSettings[showWalletSettings].tracking_type : walletSettings[showWalletSettings].tracking_type?.type) === option.id && <CheckCircle size={14} />}
                          </button>
                        ))}
                      </div>

                      {(typeof walletSettings[showWalletSettings].tracking_type === 'string' ? walletSettings[showWalletSettings].tracking_type : walletSettings[showWalletSettings].tracking_type?.type) === 'launches' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg space-y-4 overflow-hidden"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Shield size={16} className="text-blue-400" />
                              <h4 className="text-xs font-orbitron font-bold text-blue-400 uppercase tracking-wider">Launch Filtering</h4>
                            </div>
                            <motion.button
                              onClick={() => setWalletSettings(prev => {
                                const currentSettings = prev[showWalletSettings];
                                const currentTracking = typeof currentSettings.tracking_type === 'string' ? { type: currentSettings.tracking_type } : currentSettings.tracking_type;
                                return {
                                  ...prev,
                                  [showWalletSettings]: {
                                    ...currentSettings,
                                    tracking_type: {
                                      ...currentTracking,
                                      only_launched_by_wallet: !currentTracking.only_launched_by_wallet
                                    }
                                  }
                                };
                              })}
                              className={`w-10 h-5 rounded-full p-1 transition-all duration-300 ${(typeof walletSettings[showWalletSettings].tracking_type === 'string' ? false : walletSettings[showWalletSettings].tracking_type?.only_launched_by_wallet) ? 'bg-blue-500' : 'bg-gray-700'}`}
                              whileTap={{ scale: 0.95 }}
                            >
                              <motion.div
                                className="w-3 h-3 bg-white rounded-full"
                                animate={{ x: (typeof walletSettings[showWalletSettings].tracking_type === 'string' ? false : walletSettings[showWalletSettings].tracking_type?.only_launched_by_wallet) ? 20 : 0 }}
                              />
                            </motion.button>
                          </div>

                          <p className="text-[12px] text-blue-400/60 font-space-grotesk leading-relaxed">
                            When enabled, the bot will only copy trades for tokens that were launched by the tracked wallet itself.
                          </p>

                          {(typeof walletSettings[showWalletSettings].tracking_type === 'string' ? false : walletSettings[showWalletSettings].tracking_type?.only_launched_by_wallet) && (
                            <div className="space-y-4 pt-2 border-t border-blue-500/10">
                              <div>
                                <label className="block text-[10px] font-orbitron text-blue-400 mb-2 uppercase tracking-widest">Initial Launch Period</label>
                                <select
                                  value={typeof walletSettings[showWalletSettings].tracking_type === 'string' ? 0 : (walletSettings[showWalletSettings].tracking_type?.launch_period_type === 'custom' ? 'custom' : walletSettings[showWalletSettings].tracking_type?.launch_period || 0)}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setWalletSettings(prev => ({
                                      ...prev,
                                      [showWalletSettings]: {
                                        ...prev[showWalletSettings],
                                        tracking_type: {
                                          ...(typeof prev[showWalletSettings].tracking_type === 'string' ? { type: prev[showWalletSettings].tracking_type } : prev[showWalletSettings].tracking_type),
                                          launch_period: val === 'custom' ? (typeof prev[showWalletSettings].tracking_type === 'string' ? 0 : prev[showWalletSettings].tracking_type?.launch_period || 0) : parseInt(val),
                                          launch_period_type: val === 'custom' ? 'custom' : 'preset'
                                        }
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

                              {(typeof walletSettings[showWalletSettings].tracking_type === 'string' ? false : walletSettings[showWalletSettings].tracking_type?.launch_period_type === 'custom') && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <label className="block text-[10px] font-orbitron text-blue-400 uppercase tracking-widest">Custom Seconds</label>
                                    <span className="text-[10px] text-blue-400/60 font-space-grotesk">{formatDurationTooltip(typeof walletSettings[showWalletSettings].tracking_type === 'string' ? 0 : walletSettings[showWalletSettings].tracking_type?.launch_period || 0)}</span>
                                  </div>
                                  <input
                                    type="number"
                                    value={typeof walletSettings[showWalletSettings].tracking_type === 'string' ? 0 : walletSettings[showWalletSettings].tracking_type?.launch_period || 0}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      setWalletSettings(prev => ({
                                        ...prev,
                                        [showWalletSettings]: {
                                          ...prev[showWalletSettings],
                                          tracking_type: {
                                            ...(typeof prev[showWalletSettings].tracking_type === 'string' ? { type: prev[showWalletSettings].tracking_type } : prev[showWalletSettings].tracking_type),
                                            launch_period: isNaN(val) ? 0 : val
                                          }
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
                                          setWalletSettings(prev => {
                                            const currentSettings = prev[showWalletSettings];
                                            const currentTracking = typeof currentSettings.tracking_type === 'string' ? { type: currentSettings.tracking_type } : currentSettings.tracking_type;
                                            return {
                                              ...prev,
                                              [showWalletSettings]: {
                                                ...currentSettings,
                                                tracking_type: {
                                                  ...currentTracking,
                                                  launch_period: btn.reset ? 0 : (currentTracking.launch_period || 0) + btn.val
                                                }
                                              }
                                            };
                                          });
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
                    </div>
                  )}

                  {/* Notification Settings Section */}
                  <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4">
                    <h4 className="text-lg font-orbitron font-semibold text-white mb-4">Notification Settings</h4>
                    <div className="space-y-6">
                      {/* Notifications Toggle */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-sm font-orbitron font-semibold text-white mb-1">Swap Notifications</h5>
                          <p className="text-white/40 font-space-grotesk text-[10px] md:text-xs">Receive sound alerts when a swap is executed</p>
                        </div>
                        <motion.button
                          onClick={() => setWalletSettings(prev => ({
                            ...prev,
                            [showWalletSettings]: {
                              ...prev[showWalletSettings],
                              swap_notifications_enabled: !prev[showWalletSettings].swap_notifications_enabled
                            }
                          }))}
                          className={`w-10 h-5 rounded-full p-1 transition-all duration-300 flex-shrink-0 ${walletSettings[showWalletSettings].swap_notifications_enabled ? 'bg-molten-gold' : 'bg-gray-600'}`}
                          whileTap={{ scale: 0.95 }}
                        >
                          <motion.div
                            className="w-3 h-3 bg-white rounded-full"
                            animate={{ x: walletSettings[showWalletSettings].swap_notifications_enabled ? 20 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        </motion.button>
                      </div>

                      {/* Sound Selection */}
                      {walletSettings[showWalletSettings].swap_notifications_enabled && (
                        <div className="space-y-3">
                          <label className="block text-xs font-orbitron text-molten-gold tracking-wide uppercase">
                            Notification Sound
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={walletSettings[showWalletSettings].swap_notification_sound}
                              onChange={(e) => setWalletSettings(prev => ({
                                ...prev,
                                [showWalletSettings]: {
                                  ...prev[showWalletSettings],
                                  swap_notification_sound: e.target.value
                                }
                              }))}
                              className="flex-1 bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk text-xs focus:border-molten-gold focus:outline-none transition-colors duration-300"
                            >
                              {availableSounds.map(sound => (
                                <option key={sound} value={sound}>{sound}</option>
                              ))}
                            </select>
                            <motion.button
                              onClick={() => testHearSound(walletSettings[showWalletSettings].swap_notification_sound)}
                              disabled={playingSound !== null}
                              className="px-3 py-1 bg-molten-gold/10 border border-molten-gold/30 text-molten-gold rounded-lg hover:bg-molten-gold/20 transition-colors duration-300 flex items-center justify-center gap-2 font-orbitron font-bold text-[10px] disabled:opacity-50"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {playingSound === walletSettings[showWalletSettings].swap_notification_sound ? 'Playing...' : 'Test Hear'}
                            </motion.button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <motion.button
                    onClick={() => {
                      const wallet = trackedWallets.find(w => (w.id || w.wallet_address) === showWalletSettings);
                      if (wallet && showWalletSettings) {
                        handleUpdateWalletSettings(wallet.wallet_address, wallet.id || wallet.wallet_address);
                      }
                    }}
                    disabled={walletSettingsLoading}
                    className="w-full py-3 bg-gradient-to-r from-molten-gold to-yellow-500 text-void-black font-orbitron font-bold rounded-lg hover:brightness-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {walletSettingsLoading ? (
                      <div className="w-5 h-5 border-2 border-void-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle size={20} />
                    )}
                    {walletSettingsLoading ? 'Saving...' : 'Save Settings'}
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {showBulkUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-r from-void-black/95 to-black/90 backdrop-blur-md border border-molten-gold/30 rounded-lg p-6 w-full max-w-lg shadow-2xl"
            >
              <h3 className="text-xl font-orbitron font-bold text-molten-gold mb-4">
                Confirm Bulk Tracking
              </h3>
              <div className="mb-6 space-y-3">
                <div className="bg-molten-gold/10 border border-molten-gold/20 rounded-lg p-4">
                  <div className="flex items-center justify-between font-orbitron">
                    <span className="text-white/60">Wallets Detected:</span>
                    <span className="text-molten-gold text-xl">{bulkWallets.length}</span>
                  </div>
                  <div className="mt-4 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                    <p className="text-xs font-mono text-white/40 break-all leading-relaxed">
                      {bulkWallets.join(', ')}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-white/60 font-space-grotesk italic">
                  * All valid wallets detected will be added with your default strategy settings.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowBulkUploadModal(false)}
                  className="flex-1 py-3 border border-white/10 text-white font-orbitron font-bold rounded-lg hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleBulkSubmit}
                  disabled={bulkProcessing}
                  className="flex-1 py-3 bg-molten-gold text-void-black font-orbitron font-bold rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {bulkProcessing ? (
                    <div className="w-5 h-5 border-2 border-void-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle size={18} />
                  )}
                  Start Tracking
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
  const renderTrackerLogs = () => {
    return (
      <section className="max-w-6xl mx-auto space-y-4 md:space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-3xl font-orbitron font-bold text-molten-gold">
            Tracker Logs
          </h1>
          <motion.button
            onClick={handleManualRefresh}
            disabled={statsLoading}
            className="p-2 bg-molten-gold/10 border border-molten-gold/20 text-molten-gold rounded-lg hover:bg-molten-gold/20 transition-all duration-300 disabled:opacity-50"
            title="Refresh all logs and stats"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw size={20} className={statsLoading ? 'animate-spin' : ''} />
          </motion.button>
        </div>


        {/* Wallet Stats Section */}
        {copyTradingStats && copyTradingStats.wallet_stats && copyTradingStats.wallet_stats.length > 0 && (
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-molten-gold/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-orbitron font-bold text-molten-gold flex items-center gap-3">
                <TrendingUp size={20} />
                Wallet Performance Overview
              </h3>
              <div className="flex bg-void-black/50 p-1 rounded-lg border border-molten-gold/20 mr-4">
                <button
                  onClick={() => setTrackerActiveView('wallets')}
                  className={`px-4 py-1 rounded-md text-xs font-orbitron font-bold transition-all duration-300 ${trackerActiveView === 'wallets'
                    ? 'bg-molten-gold text-void-black shadow-lg shadow-molten-gold/20'
                    : 'text-molten-gold/60 hover:text-molten-gold'
                    }`}
                >
                  Wallets
                </button>
                <button
                  onClick={() => setTrackerActiveView('tokens')}
                  className={`px-4 py-1 rounded-md text-xs font-orbitron font-bold transition-all duration-300 ${trackerActiveView === 'tokens'
                    ? 'bg-molten-gold text-void-black shadow-lg shadow-molten-gold/20'
                    : 'text-molten-gold/60 hover:text-molten-gold'
                    }`}
                >
                  Tokens
                </button>
              </div>
              {copyTradingStats.wallet_stats.length > 6 && trackerActiveView === 'wallets' && (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setWalletPerfPage(prev => Math.max(0, prev - 1))}
                    disabled={walletPerfPage === 0}
                    className="p-1 hover:text-molten-gold transition-colors disabled:opacity-30 flex items-center gap-1"
                  >
                    <ChevronLeft size={24} />
                    <span className="text-xs font-orbitron hidden sm:inline">Prev</span>
                  </button>
                  <span className="text-white/60 font-orbitron text-sm min-w-[60px] text-center">
                    {walletPerfPage + 1} / {Math.ceil(copyTradingStats.wallet_stats.length / 6)}
                  </span>
                  <button
                    onClick={() => setWalletPerfPage(prev => Math.min(Math.ceil(copyTradingStats.wallet_stats.length / 6) - 1, prev + 1))}
                    disabled={walletPerfPage >= Math.ceil(copyTradingStats.wallet_stats.length / 6) - 1}
                    className="p-1 hover:text-molten-gold transition-colors disabled:opacity-30 flex items-center gap-1"
                  >
                    <span className="text-xs font-orbitron hidden sm:inline">Next</span>
                    <ChevronRight size={24} />
                  </button>
                </div>
              )}
            </div>

            {trackerActiveView === 'wallets' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {copyTradingStats.wallet_stats
                  .slice(walletPerfPage * 6, (walletPerfPage + 1) * 6)
                  .map((wallet, index) => {
                    const settings = walletSettings[wallet.wallet_address];
                    const tpSlActive = settings?.tp_sl_is_active ?? (trackedWallets.find(w => w.wallet_address === wallet.wallet_address)?.is_default ? (defaultTrackingType === 'both' || defaultTrackingType === 'tp_sl') : false);

                    return (
                      <motion.div
                        key={wallet.wallet_address}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-void-black/30 border border-molten-gold/20 rounded-lg p-4 relative overflow-hidden group"
                      >
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
                          <div className="group/tooltip relative">
                            {tpSlActive ? (
                              <Activity size={16} className="text-green-400 animate-pulse" />
                            ) : (
                              <Activity size={16} className="text-white/20" />
                            )}
                            <div className="absolute top-full right-0 mt-2 p-2 bg-void-black border border-molten-gold/20 rounded shadow-xl text-[10px] text-white whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-50">
                              {tpSlActive ? 'TP/SL Monitoring Active' : 'TP/SL Monitoring Disabled'}
                              {tpSlActive && settings && (
                                <div className="mt-1 flex flex-col gap-0.5 border-t border-white/10 pt-1">
                                  {(Array.isArray(settings.take_profit_levels) ? settings.take_profit_levels : JSON.parse(settings.take_profit_levels || "[]")).map((l: any, i: number) => (
                                    <span key={i} className="text-green-400">TP {i + 1}: +{l.profit_percentage}% (Sell {l.sell_percentage}%)</span>
                                  ))}
                                  {(Array.isArray(settings.stop_loss_levels) ? settings.stop_loss_levels : JSON.parse(settings.stop_loss_levels || "[]")).map((l: any, i: number) => (
                                    <span key={i} className="text-red-400">SL {i + 1}: -{l.loss_percentage}% (Sell {l.sell_percentage}%)</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Wallet size={20} className="text-molten-gold flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-orbitron font-bold text-white text-sm truncate">
                                  {settings?.custom_name || formatWalletAddress(wallet.wallet_address)}
                                </p>
                                <div className="flex items-center gap-2">
                                  <a
                                    href={`https://gmgn.ai/${selectedCoin === 'sol' ? 'sol' : 'bsc'}/address/${wallet.wallet_address}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-molten-gold/60 hover:text-molten-gold transition-colors font-orbitron flex items-center gap-0.5"
                                  >
                                    GMGN <ExternalLink size={8} />
                                  </a>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {tpSlActive && (
                                  <span className="flex items-center gap-1 text-[10px] font-orbitron font-bold text-green-400 uppercase tracking-tighter">
                                    <Activity size={10} /> TP/SL ON
                                  </span>
                                )}
                                {!tpSlActive && (
                                  <span className="text-[10px] font-orbitron font-bold text-white/30 uppercase tracking-tighter">
                                    TP/SL OFF
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-[10px] font-orbitron font-bold flex-shrink-0 ${wallet.is_active
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : 'bg-red-500/20 text-red-400 border border-red-500/50'
                            }`}>
                            {wallet.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-[10px] font-orbitron text-molten-gold tracking-wide mb-1 opacity-60">MATCHES</div>
                            <div className="text-lg font-orbitron font-bold text-white">{wallet.total_matches}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] font-orbitron text-blue-400 tracking-wide mb-1 opacity-60">SUCCESS RATE</div>
                            <div className="text-lg font-orbitron font-bold text-white">{wallet.success_rate.toFixed(1)}%</div>
                          </div>
                          <div className="text-center col-span-2 border-t border-molten-gold/10 pt-2 flex flex-col items-center">
                            <div className="text-[10px] font-orbitron text-molten-gold tracking-wide mb-0.5 opacity-60">TOTAL PNL</div>
                            <div className={`text-lg font-orbitron font-bold ${(wallet.total_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {(wallet.total_pnl || 0).toFixed(4)} {selectedCoin === 'sol' ? 'SOL' : 'BNB'}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
              </div>
            ) : (
              <div className="space-y-4">
                {Object.keys(trackedPositions).length === 0 && dipLadders.length === 0 ? (
                  <div className="text-center py-10 bg-void-black/20 rounded-lg border border-dashed border-molten-gold/20">
                    <Activity size={32} className="text-molten-gold/40 mx-auto mb-3" />
                    <p className="text-white/60 font-orbitron text-sm">No active token positions tracked</p>
                    <p className="text-white/40 font-space-grotesk text-xs mt-1">TP/SL positions and Dip Ladders will appear here while active</p>
                  </div>
                ) : (
                  <>
                    {dipLadders.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-orbitron font-bold text-molten-gold uppercase tracking-wider">Dip Ladders</h4>
                          <span className="text-xs text-white/40 font-space-grotesk">{dipLaddersLoading ? 'Refreshing...' : `${dipLadders.filter(ladder => ladder.status === 'active').length} active`}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {dipLadders.map((ladder, index) => {
                            const openLots = ladder.lots?.filter(lot => isOpenDipLadderLot(lot.status)) || []
                            const soldLots = ladder.lots?.filter(lot => isClosedDipLadderLot(lot.status)) || []
                            const tokenInfo = trackerLogs.find(l => l.target_token?.toLowerCase() === ladder.token_address.toLowerCase())
                            const tokenName = tokenInfo?.token_name
                            const tokenSymbol = tokenInfo?.token_symbol
                            const tokenLogo = tokenInfo?.token_logo_uri

                            return (
                              <motion.div
                                key={ladder.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-void-black/40 border border-blue-400/30 rounded-lg p-4 group relative"
                              >
                                <div className="flex items-start justify-between gap-3 mb-4">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {tokenLogo ? (
                                      <img
                                        src={tokenLogo}
                                        alt={tokenSymbol || 'token'}
                                        className="w-10 h-10 rounded-full border border-blue-400/20 object-cover flex-shrink-0"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-blue-400/10 border border-blue-400/20 flex items-center justify-center text-blue-300 font-orbitron font-bold text-xs flex-shrink-0">
                                        {tokenSymbol?.slice(0, 2).toUpperCase() || ladder.token_address.slice(0, 2).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="text-base font-orbitron font-bold text-white truncate">
                                          {tokenName || tokenSymbol || formatWalletAddress(ladder.token_address)}
                                        </p>
                                        <button
                                          onClick={() => copyToClipboard(ladder.token_address, `dip-ladder-${ladder.id}`)}
                                          className="text-blue-300/70 hover:text-blue-300 transition-colors duration-300 flex-shrink-0"
                                          title="Copy token address"
                                        >
                                          <Copy size={12} />
                                        </button>
                                      </div>
                                      <p className="text-xs text-white/40 font-space-grotesk truncate">
                                        Source: Dip Ladder
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex flex-shrink-0 items-center gap-2">
                                    <span className={`text-[10px] font-orbitron font-bold px-2 py-1 rounded-full border ${ladder.status === 'active' ? 'bg-blue-500/20 text-blue-300 border-blue-400/40' : ladder.status === 'disabled' ? 'bg-white/5 text-white/45 border-white/15' : ladder.status === 'stopped_depth_limit' ? 'bg-red-500/20 text-red-300 border-red-400/40' : 'bg-yellow-500/20 text-yellow-300 border-yellow-400/40'}`}>
                                      {ladder.status === 'stopped_no_cash' ? 'NO CASH' : ladder.status === 'stopped_depth_limit' ? 'DEPTH STOP' : ladder.status.toUpperCase()}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => handleRequestDeleteDipLadder(ladder, e)}
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-400/25 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-colors"
                                      title="Delete Dip Ladder entry"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                  <div className="min-w-0 bg-black/20 rounded-lg p-3">
                                    <p className="text-[10px] text-white/40 font-orbitron uppercase mb-1">Buy Trigger</p>
                                    <p className="min-w-0 break-all [overflow-wrap:anywhere] text-sm text-blue-300 font-mono font-bold leading-snug">{formatUsdPrice(ladder.next_buy_price_usd)}</p>
                                    <p className="mt-1 text-[10px] text-white/30 font-space-grotesk">Current at or below trigger</p>
                                  </div>
                                  <div className="min-w-0 bg-black/20 rounded-lg p-3">
                                    <p className="text-[10px] text-white/40 font-orbitron uppercase mb-1">Current Price</p>
                                    <p className="min-w-0 break-all [overflow-wrap:anywhere] text-sm text-white font-mono font-bold leading-snug">{formatUsdPrice(ladder.last_price_usd)}</p>
                                  </div>
                                  <div className="bg-black/20 rounded-lg p-3">
                                    <p className="text-[10px] text-white/40 font-orbitron uppercase mb-1">Drop Step</p>
                                    <p className="text-sm text-white font-orbitron font-bold">{ladder.drop_percentage}%</p>
                                  </div>
                                  <div className="bg-black/20 rounded-lg p-3">
                                    <p className="text-[10px] text-white/40 font-orbitron uppercase mb-1">Profit</p>
                                    <p className="text-sm text-green-400 font-orbitron font-bold">{ladder.profit_percentage}%</p>
                                  </div>
                                </div>

                                <div className="border-t border-blue-400/10 pt-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[11px] font-orbitron text-blue-300/70 uppercase tracking-widest">Lots</p>
                                    <p className="text-[10px] text-white/40 font-space-grotesk">{openLots.length} open, {soldLots.length} sold</p>
                                  </div>
                                  {openLots.length > 0 ? openLots.map((lot) => {
                                    const lotInCooldown = isDipLadderLotRetryCoolingDown(lot)
                                    const showSellIssue = lot.status === 'sell_blocked' || lotInCooldown || Boolean(lot.last_error)
                                    const canRetryLotSell = ladder.status === 'active' || ladder.status === 'stopped_depth_limit'
                                    return (
                                    <div key={lot.id} className="min-w-0 bg-black/20 rounded-lg p-2 space-y-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-orbitron uppercase ${dipLadderLotStatusClass(lot, false)}`}>
                                          {dipLadderLotStatusLabel(lot, false)}
                                        </span>
                                        {showSellIssue && (
                                          <button
                                            type="button"
                                            onClick={(e) => handleRetryDipLadderLotSell(lot.id, e)}
                                            disabled={dipLadderRetryingLotId === lot.id || !canRetryLotSell}
                                            title={canRetryLotSell ? 'Retry this lot sell' : 'Enable this Dip Ladder before retrying sells'}
                                            className="inline-flex h-6 items-center gap-1 rounded-md border border-molten-gold/25 bg-molten-gold/10 px-2 text-[9px] font-orbitron font-bold text-molten-gold hover:bg-molten-gold/20 disabled:opacity-50"
                                          >
                                            <RefreshCw size={10} className={dipLadderRetryingLotId === lot.id ? 'animate-spin' : ''} />
                                            {canRetryLotSell ? 'Retry' : 'Enable'}
                                          </button>
                                        )}
                                      </div>
                                      <div className="flex justify-between items-start gap-2 text-xs">
                                        <span className="text-white/50 font-orbitron">Entry</span>
                                        <span className="min-w-0 break-all [overflow-wrap:anywhere] text-right text-white font-mono leading-snug">{formatUsdPrice(lot.entry_price_usd)}</span>
                                      </div>
                                      <div className="flex justify-between items-start gap-2 text-xs">
                                        <span className="text-green-400/70 font-orbitron">Target</span>
                                        <span className="min-w-0 break-all [overflow-wrap:anywhere] text-right text-green-400 font-mono leading-snug">{formatUsdPrice(lot.target_price_usd)}</span>
                                      </div>
                                      <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-white/40 font-space-grotesk">Remaining</span>
                                        <span className="text-white/60 font-mono">{lot.remaining_amount_tokens.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                                      </div>
                                      {showSellIssue && (
                                        <p className={`break-words text-[10px] font-space-grotesk [overflow-wrap:anywhere] ${lot.status === 'sell_blocked' ? 'text-red-300/85' : 'text-yellow-300/85'}`}>
                                          {lot.last_error || (lotInCooldown ? `Retry after ${formatDate(lot.sell_retry_after || '', true)}` : 'Sell needs attention')}
                                        </p>
                                      )}
                                    </div>
                                  )}) : (
                                    <p className="text-xs text-white/30 italic font-orbitron">Waiting for next drop</p>
                                  )}
                                  {ladder.last_error && (
                                    <p className="text-xs text-yellow-300/80 font-space-grotesk break-words">{ladder.last_error}</p>
                                  )}
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {Object.keys(trackedPositions).length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(trackedPositions).map(([address, pos]: [string, any], index) => {
                      const latestPrice = pos.current_price?.[pos.current_price.length - 1];
                      const changePercent = latestPrice ? ((latestPrice.price - pos.buy_price) / pos.buy_price) * 100 : 0;

                      const tokenInfo = trackerLogs.find(l => l.target_token?.toLowerCase() === address.toLowerCase());
                      const tokenName = tokenInfo?.token_name;
                      const tokenSymbol = tokenInfo?.token_symbol;
                      const tokenLogo = tokenInfo?.token_logo_uri;

                      return (
                        <motion.div
                          key={address}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-void-black/40 border border-molten-gold/30 rounded-lg p-4 group relative"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 min-w-0">
                              {tokenLogo ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={tokenLogo}
                                  alt={tokenSymbol || 'token'}
                                  className="w-10 h-10 rounded-full border border-molten-gold/20 object-cover flex-shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-molten-gold/10 border border-molten-gold/20 flex items-center justify-center text-molten-gold font-orbitron font-bold text-xs flex-shrink-0">
                                  {tokenSymbol?.slice(0, 2).toUpperCase() || address.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-base font-orbitron font-bold text-white truncate">
                                    {tokenName || tokenSymbol || formatWalletAddress(address)}
                                  </p>
                                  <button
                                    onClick={() => copyToClipboard(address, `token-pos-${address}`)}
                                    className="text-molten-gold/60 hover:text-molten-gold transition-colors duration-300 flex-shrink-0"
                                    title="Copy token address"
                                  >
                                    <Copy size={12} />
                                  </button>
                                  {copiedKey === `token-pos-${address}` && (
                                    <span className="text-[10px] text-molten-gold font-orbitron">Copied</span>
                                  )}
                                </div>
                                <p className="text-xs text-white/40 font-space-grotesk truncate">
                                  Copied: {walletSettings[pos.mirror_address]?.custom_name || trackedWallets.find(w => w.wallet_address === pos.mirror_address)?.custom_name || formatWalletAddress(pos.mirror_address || '')}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className={`text-sm font-orbitron font-bold px-3 py-1.5 rounded-full ${changePercent >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                              </div>
                              <div className="flex items-center gap-1.5 px-1">
                                <Activity size={10} className={pos.tp_sl_active ? 'text-green-400 animate-pulse' : 'text-white/20'} />
                                <span className={`text-[9px] font-orbitron font-bold tracking-tighter ${pos.tp_sl_active ? 'text-green-400/80' : 'text-white/20'}`}>
                                  {pos.tp_sl_active ? 'TP/SL ACTIVE' : 'TP/SL OFF'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 mb-4">
                            <div className="flex justify-between items-center text-sm font-orbitron">
                              <span className="text-white/40 uppercase">Buy Price</span>
                              <span className="text-white font-bold font-mono">{formatUsdPrice(pos.buy_price)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-orbitron group/price">
                              <span className="text-white/40 uppercase">Current Price</span>
                              <div className="relative">
                                <span className="text-molten-gold font-bold text-[14px]">{formatUsdPrice(latestPrice?.price)}</span>
                                {/* Price History Tooltip */}
                                <div className="absolute bottom-full right-0 mb-2 w-64 bg-black/95 border border-molten-gold/40 rounded-lg p-3 z-50 opacity-0 group-hover/price:opacity-100 transition-opacity pointer-events-none shadow-2xl backdrop-blur-md">
                                  <div className="flex items-center gap-2 mb-2 border-b border-molten-gold/20 pb-1.5">
                                    {tokenLogo && (
                                      /* eslint-disable-next-line @next/next/no-img-element */
                                      <img src={tokenLogo} alt="" className="w-5 h-5 rounded-full border border-molten-gold/20" />
                                    )}
                                    <p className="text-xs font-orbitron font-bold text-molten-gold uppercase tracking-wider">
                                      {tokenSymbol || 'Price Activity'}
                                    </p>
                                  </div>
                                  <div className="space-y-2">
                                    {(pos.current_price || []).slice().reverse().map((h: any, i: number) => (
                                      <div key={i} className="flex justify-between gap-3 text-[11px]">
                                        <span className="text-white/50 font-space-grotesk">{new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                        <span className="text-white font-mono font-bold">{formatUsdPrice(h.price)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-molten-gold/10 pt-3 space-y-2">
                            <p className="text-[11px] font-orbitron text-molten-gold/60 uppercase tracking-widest mb-1">TP/SL Targets</p>
                            {pos.targets?.map((target: any, idx: number) => {
                              const distanceToTarget = latestPrice ? ((target.target_price - latestPrice.price) / latestPrice.price) * 100 : 0;
                              return (
                                <div key={idx} className="flex flex-col gap-0.5">
                                  <div className="flex justify-between items-center text-sm">
                                    <span className={`font-orbitron font-bold ${target.type === 'tp' ? 'text-green-400' : 'text-red-400'}`}>
                                      {target.type.toUpperCase()} {target.percentage}%
                                    </span>
                                    <span className="text-white/60 font-mono">{formatUsdPrice(target.target_price)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-[10px] opacity-60">
                                    <span className="text-white/40 italic">Distance</span>
                                    <span className={distanceToTarget > 0 ? 'text-blue-400' : 'text-orange-400'}>
                                      {distanceToTarget > 0 ? '+' : ''}{distanceToTarget.toFixed(2)}%
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                            {(!pos.targets || pos.targets.length === 0) && (
                              <p className="text-xs text-white/30 italic font-orbitron">No levels active</p>
                            )}
                          </div>

                        </motion.div>
                      )
                    })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Account Logs Section */}
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-molten-gold/20 rounded-lg p-4 md:p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-orbitron font-bold text-molten-gold flex items-center gap-3">
              <FileText size={20} />
              Account Event Logs ({logsTotal})
            </h3>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto">

              {/* Status Filter */}
              <div className="flex-1 lg:flex-none">
                <select
                  value={logStatusFilter}
                  onChange={(e) => setLogStatusFilter(e.target.value)}
                  className="w-full lg:w-auto bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white text-xs font-orbitron focus:border-molten-gold outline-none transition-colors"
                >
                  <option value="all">All Status</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Side Filter */}
              <div className="flex-1 lg:flex-none">
                <select
                  value={logSideFilter}
                  onChange={(e) => setLogSideFilter(e.target.value)}
                  className="w-full lg:w-auto bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white text-xs font-orbitron focus:border-molten-gold outline-none transition-colors"
                >
                  <option value="all">All Sides</option>
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>

              {/* Wallet Filter */}
              <div className="flex-1 lg:flex-none min-w-[140px]">
                <select
                  value={logWalletFilter}
                  onChange={(e) => setLogWalletFilter(e.target.value)}
                  className="w-full lg:w-auto bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white text-xs font-orbitron focus:border-molten-gold outline-none transition-colors max-w-full lg:max-w-[180px]"
                >
                  <option value="all">All Wallets</option>
                  {copyTradingStats?.wallet_stats?.map(w => (
                    <option key={w.wallet_address} value={w.wallet_address}>
                      {walletSettings[w.wallet_address]?.custom_name || formatWalletAddress(w.wallet_address)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>


          {(initialLogsLoading || coinSwitching) ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-molten-gold border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <p className="text-white/60 font-space-grotesk text-lg">
                {coinSwitching ? `Loading ${selectedCoin.toUpperCase()} logs...` : 'Loading account logs...'}
              </p>
            </div>
          ) : !trackerLogs || trackerLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={64} className="text-molten-gold/40 mx-auto mb-6" />
              <p className="text-white/60 font-space-grotesk text-lg">No event logs found</p>
              <p className="text-white/40 font-space-grotesk text-sm mt-2">Events will appear here when tracked wallets perform transactions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {trackerLogs && trackerLogs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-void-black/50 border border-molten-gold/10 rounded-lg p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 mb-4">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                      {log.event_type !== 'user_purchase' && log.event_type !== 'user_sell' && (
                        <div className={`w-3 h-3 rounded-full ${log.status === 'success' ? 'bg-green-400' : log.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                      )}
                      <span className={`text-xs md:text-sm font-orbitron font-semibold tracking-wider uppercase ${log.event_type === 'tracked_wallet_activity' ? 'text-green-400' :
                        log.event_type === 'user_purchase' ? 'text-blue-400' :
                          log.event_type === 'user_sell' ? 'text-orange-400' :
                            log.event_type === 'spike_entry' ? 'text-fuchsia-300' :
                              log.event_type === 'admin_fee' ? 'text-purple-400' : 'text-gray-400'
                        }`}>
                        {log.event_type?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN EVENT'}
                      </span>
                      {(() => {
                        const trackedWalletAddr = log.event_type === 'tracked_wallet_activity'
                          ? log.wallet_address
                          : (log.tracked_wallet_address || log.copied_wallet)

                        if (!trackedWalletAddr || trackedWalletAddr === 'manual_buy' || trackedWalletAddr === 'none') return null;

                        return (
                          <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-molten-gold/10 border border-molten-gold/30 rounded-lg">
                            <span className="hidden sm:inline text-xs font-orbitron font-semibold text-molten-gold/80 tracking-wider uppercase">Copied Wallet:</span>
                            <span className="text-xs font-space-grotesk font-mono text-white">
                              {walletSettings[trackedWalletAddr]?.custom_name || log.wallet_name || formatWalletAddress(trackedWalletAddr)}
                            </span>
                            <button
                              onClick={() => copyToClipboard(trackedWalletAddr || '', `log-tracked-${log.id}`)}
                              className="text-molten-gold/60 hover:text-molten-gold transition-colors duration-300 flex-shrink-0"
                              title="Copy tracked wallet address"
                            >
                              <Copy size={12} />
                            </button>
                            {copiedKey === `log-tracked-${log.id}` && (
                              <span className="text-xs text-molten-gold">Copied</span>
                            )}
                          </div>
                        )
                      })()
                      }
                      {(log.event_type === 'user_sell' || log.event_type === 'user_purchase') && (() => {
                        let eData: any = {};
                        try {
                          eData = log.event_data ? JSON.parse(log.event_data) : {};
                        } catch (e) {
                          eData = {};
                        }

                        const isManual = eData.mirror_wallet_address === 'manual_buy';
                        const isTpSl = eData.tp_sl_sell === true || log.is_tp_sl_sell;
                        const isDipLadder = eData.strategy === 'dip_ladder' || eData.dip_ladder === true || eData.dip_ladder_buy === true || eData.dip_ladder_sell === true;
                        const isSpikeEntry = isSpikeEntryLog(log, eData);

                        if (isTpSl) {
                          const triggerType = eData.tp_sl_trigger_type || log.tp_sl_trigger_type;
                          const triggerValue = eData.tp_sl_trigger_value || log.tp_sl_trigger_value;
                          return (
                            <div className="group relative">
                              <span className={`px-2 py-1 text-[10px] md:text-xs font-orbitron font-semibold tracking-wide rounded-full ${triggerType === 'take_profit' ? 'text-green-200 border border-green-400/40 bg-green-500/10 shadow-[0_0_12px_rgba(74,222,128,0.5)]' : 'text-red-200 border border-red-400/40 bg-red-500/10 shadow-[0_0_12px_rgba(239,68,68,0.5)]'}`}>
                                Tp/Sl Trade {typeof triggerValue === 'number' && `(${triggerType === 'take_profit' ? '+' : '-'}${triggerValue}%)`}
                              </span>
                              <div className="absolute bottom-full left-0 mb-2 w-72 bg-void-black/95 border border-molten-gold/30 rounded-lg p-3 text-[11px] text-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20 font-space-grotesk space-y-2">
                                <p className={`font-orbitron font-semibold ${triggerType === 'take_profit' ? 'text-green-400' : 'text-red-400'}`}>
                                  {triggerType === 'take_profit' ? 'Take Profit Triggered' : 'Stop Loss Triggered'}
                                </p>
                                {(typeof log.tp_sl_buy_price === 'number' || typeof eData.tp_sl_buy_price === 'number') && (
                                  <div className="flex justify-between border-b border-white/10 pb-1">
                                    <span className="text-white/60">Buy Price:</span>
                                    <span className="text-molten-gold">{formatUsdPrice(eData.tp_sl_buy_price || log.tp_sl_buy_price)}</span>
                                  </div>
                                )}
                                {(typeof log.tp_sl_trigger_price === 'number' || typeof eData.tp_sl_trigger_price === 'number') && (
                                  <div className="flex justify-between border-b border-white/10 pb-1">
                                    <span className="text-white/60">Trigger Price:</span>
                                    <span className={triggerType === 'take_profit' ? 'text-green-400' : 'text-red-400'}>{formatUsdPrice(eData.tp_sl_trigger_price || log.tp_sl_trigger_price)}</span>
                                  </div>
                                )}
                                {typeof triggerValue === 'number' && (
                                  <div className="flex justify-between">
                                    <span className="text-white/60">Target:</span>
                                    <span className={triggerType === 'take_profit' ? 'text-green-400' : 'text-red-400'}>{triggerType === 'take_profit' ? '+' : '-'}{triggerValue}%</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }

                        if (isManual) {
                          return (
                            <span className="px-2 py-1 text-[10px] md:text-xs font-orbitron font-semibold tracking-wide text-cyan-200 border border-cyan-400/40 rounded-full bg-cyan-500/10 shadow-[0_0_12px_rgba(6,182,212,0.45)]">
                              Manual Trade
                            </span>
                          );
                        }

                        if (isDipLadder) {
                          return (
                            <span className="px-2 py-1 text-[10px] md:text-xs font-orbitron font-semibold tracking-wide text-molten-gold border border-molten-gold/40 rounded-full bg-molten-gold/10 shadow-[0_0_12px_rgba(245,158,11,0.45)]">
                              Dip Ladder
                            </span>
                          );
                        }

                        if (eData.mirror_wallet_address && !isSpikeEntry) {
                          return (
                            <span className="px-2 py-1 text-[10px] md:text-xs font-orbitron font-semibold tracking-wide text-yellow-200 border border-yellow-400/40 rounded-full bg-yellow-500/10 shadow-[0_0_12px_rgba(234,179,8,0.45)]">
                              Copy Trade
                            </span>
                          );
                        }

                        return null;
                      })()}
                      {(() => {
                        const eData = parseLogEventData(log.event_data);
                        if (!isSpikeEntryLog(log, eData)) return null;
                        const label = log.event_type === 'user_purchase' ? 'Spike Buy' : log.event_type === 'user_sell' ? 'Spike Sell' : 'Spike Entry';
                        return (
                          <span className="px-2 py-1 text-[10px] md:text-xs font-orbitron font-semibold tracking-wide text-fuchsia-200 border border-fuchsia-400/40 rounded-full bg-fuchsia-500/10 shadow-[0_0_12px_rgba(217,70,239,0.45)]">
                            {label}
                          </span>
                        );
                      })()}
                      {log.tp_sl_is_active && (log.event_type === 'user_purchase' || log.event_type === 'user_sell') && (
                        <div className="group relative">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50" />
                            <span className="text-xs font-orbitron font-semibold text-green-400 glow-green">(TP/SL)</span>
                          </div>
                          <div className="absolute bottom-full left-0 mb-2 w-80 bg-void-black/95 border border-molten-gold/30 rounded-lg p-4 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 shadow-2xl">
                            <div className="space-y-3">
                              <p className="text-molten-gold font-orbitron font-semibold mb-2">TP/SL is active for this trade</p>
                              {log.current_price !== null && log.current_price !== undefined && (
                                <div>
                                  <p className="text-molten-gold font-orbitron font-semibold mb-1">Current Price</p>
                                  <p className="text-white font-space-grotesk">{formatUsdPrice(log.current_price)}</p>
                                </div>
                              )}
                              {log.take_profit_levels && log.take_profit_levels.length > 0 && (
                                <div>
                                  <p className="text-molten-gold font-orbitron font-semibold mb-1">Take Profit Levels</p>
                                  <div className="space-y-1">
                                    {log.take_profit_levels.map((tp, idx) => (
                                      <p key={idx} className="text-white font-space-grotesk">
                                        {tp.profit_percentage}% profit → sell {tp.sell_percentage}%
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {log.stop_loss_levels && log.stop_loss_levels.length > 0 && (
                                <div>
                                  <p className="text-molten-gold font-orbitron font-semibold mb-1">Stop Loss Levels</p>
                                  <div className="space-y-1">
                                    {log.stop_loss_levels.map((sl, idx) => (
                                      <p key={idx} className="text-white font-space-grotesk">
                                        {sl.loss_percentage}% loss → sell {sl.sell_percentage}%
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      {(() => {
                        const eData = parseLogEventData(log.event_data);
                        if (!isSpikeEntryLog(log, eData)) return null;
                        const details = getSpikeEntryDetails(log, eData);
                        const spikeEntryActive = Boolean(log.spike_entry_is_active && SPIKE_ENTRY_ACTIVE_STATUSES.has(String(details.status)));
                        const baseSymbol = selectedCoin.toUpperCase();
                        return (
                          <div className="group/spike relative">
                            <div className="flex items-center gap-2">
                              {spikeEntryActive ? (
                                <div className="relative flex h-3 w-3">
                                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-400 opacity-60" />
                                  <span className="relative inline-flex h-3 w-3 rounded-full bg-fuchsia-300 shadow-[0_0_14px_rgba(217,70,239,0.75)]" />
                                </div>
                              ) : (
                                <div className="h-3 w-3 rounded-full border border-fuchsia-300/40 bg-white/20 shadow-[0_0_10px_rgba(217,70,239,0.25)]" />
                              )}
                              <span className={`text-xs font-orbitron font-semibold ${spikeEntryActive ? 'text-fuchsia-300' : 'text-white/45'}`}>
                                {spikeEntryActive ? 'SPIKE ACTIVE' : 'SPIKE INACTIVE'}
                              </span>
                            </div>
                            <div className={`absolute bottom-full left-0 mb-2 w-80 bg-void-black/95 border rounded-lg p-4 text-xs text-white opacity-0 group-hover/spike:opacity-100 transition-opacity duration-300 pointer-events-none z-10 shadow-2xl ${spikeEntryActive ? 'border-fuchsia-400/30 shadow-fuchsia-950/40' : 'border-white/15 shadow-black/40'}`}>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
                                  <p className={`font-orbitron font-semibold ${spikeEntryActive ? 'text-fuchsia-300' : 'text-white/60'}`}>{spikeEntryActive ? 'Spike entry active' : 'Spike entry inactive'}</p>
                                  {details.id && (
                                    <span className="text-[10px] font-orbitron text-white/50">Lot #{details.id}</span>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <p className="text-white/50 font-orbitron text-[10px] uppercase tracking-wider mb-1">Status</p>
                                    <p className="text-fuchsia-200 font-space-grotesk">{formatSpikeEntryStatus(details.status)}</p>
                                  </div>
                                  <div>
                                    <p className="text-white/50 font-orbitron text-[10px] uppercase tracking-wider mb-1">Timeout</p>
                                    <p className="text-white font-space-grotesk">{formatSpikeEntryTimeout(details.timeoutSeconds)}</p>
                                  </div>
                                  <div>
                                    <p className="text-white/50 font-orbitron text-[10px] uppercase tracking-wider mb-1">Mirror Entry</p>
                                    <p className="text-molten-gold font-space-grotesk">{formatSpikeEntryPrice(details.mirrorEntryPrice)} {baseSymbol}</p>
                                  </div>
                                  <div>
                                    <p className="text-white/50 font-orbitron text-[10px] uppercase tracking-wider mb-1">Spike Target</p>
                                    <p className="text-fuchsia-200 font-space-grotesk">{formatSpikeEntryPrice(details.spikeTargetPrice)} {baseSymbol}</p>
                                  </div>
                                  <div>
                                    <p className="text-white/50 font-orbitron text-[10px] uppercase tracking-wider mb-1">Pullback Entry</p>
                                    <p className="text-blue-200 font-space-grotesk">{formatSpikeEntryPrice(details.pullbackTargetPrice)} {baseSymbol}</p>
                                  </div>
                                  <div>
                                    <p className="text-white/50 font-orbitron text-[10px] uppercase tracking-wider mb-1">Current</p>
                                    <p className="text-white font-space-grotesk">{formatSpikeEntryPrice(details.currentPrice)} {baseSymbol}</p>
                                  </div>
                                  <div>
                                    <p className="text-white/50 font-orbitron text-[10px] uppercase tracking-wider mb-1">Pullback</p>
                                    <p className="text-white font-space-grotesk">{formatSpikeEntryPercentage(details.pullbackPercentage)}</p>
                                  </div>
                                  <div>
                                    <p className="text-white/50 font-orbitron text-[10px] uppercase tracking-wider mb-1">Margin</p>
                                    <p className="text-white font-space-grotesk">{formatSpikeEntryPercentage(details.marginPercentage)}</p>
                                  </div>
                                </div>
                                <div className="border-t border-white/10 pt-2">
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-white/50 font-orbitron text-[10px] uppercase tracking-wider">Max Seen</span>
                                    <span className="text-white font-space-grotesk">{formatSpikeEntryPrice(details.maxSeenPrice)} {baseSymbol}</span>
                                  </div>
                                  {details.requireUnsoldMirror && (
                                    <div className="mt-2 flex items-center justify-between gap-3">
                                      <span className="text-white/50 font-orbitron text-[10px] uppercase tracking-wider">Mirror Balance</span>
                                      <span className="text-white font-space-grotesk">{formatSpikeEntryBalance(details.mirrorBalanceTokens)}</span>
                                    </div>
                                  )}
                                  {details.token && (
                                    <div className="mt-2 flex items-center justify-between gap-3">
                                      <span className="text-white/50 font-orbitron text-[10px] uppercase tracking-wider">Token</span>
                                      <span className="text-white/80 font-space-grotesk font-mono truncate">{details.token}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                      {log.is_active && (log.event_type === 'user_purchase' || log.event_type === 'user_sell') && (
                        <div className="group relative">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50" />
                            <span className="text-xs font-orbitron font-semibold text-green-400">ACTIVE</span>
                          </div>
                          <div className="absolute bottom-full left-0 mb-2 w-80 bg-void-black/95 border border-molten-gold/30 rounded-lg p-4 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 shadow-2xl">
                            <div className="space-y-2">
                              {log.current_price !== null && log.current_price !== undefined && (
                                <div>
                                  <p className="text-molten-gold font-orbitron font-semibold mb-1">Current Price</p>
                                  <p className="text-white font-space-grotesk">{formatUsdPrice(log.current_price)}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-white/40 font-space-grotesk flex-shrink-0">
                      {formatDate(log.created_at, true)}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {log.status === 'failed' && log.error_message && (log.event_type === 'user_purchase' || log.event_type === 'user_sell') && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-red-400 font-orbitron text-xs tracking-wider uppercase mb-1">Error</p>
                            <p className="text-red-300 font-space-grotesk text-sm">{log.error_message}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Transaction Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-molten-gold/60 font-orbitron text-xs tracking-wider uppercase mb-1">Status</p>
                        <div className="flex items-center gap-2">
                          <p className={`font-orbitron font-bold ${log.status === 'success' ? 'text-green-400' : log.status === 'failed' ? 'text-red-400' : 'text-yellow-400'}`}>
                            {log.status?.toUpperCase() || 'UNKNOWN'}
                          </p>
                          {log.status === 'failed' && log.error_message && (
                            <span className="group/status relative inline-flex">
                              <Info size={14} className="text-red-300 cursor-help" />
                              <span className="absolute bottom-full left-1/2 z-[100] mb-2 w-72 -translate-x-1/2 rounded-lg border border-red-400/30 bg-void-black/95 p-3 text-[11px] font-space-grotesk normal-case text-red-100 opacity-0 shadow-2xl transition-opacity duration-300 pointer-events-none group-hover/status:opacity-100">
                                {log.error_message}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                      {log.side && (
                        <div>
                          <p className="text-molten-gold/60 font-orbitron text-xs tracking-wider uppercase mb-1">Side</p>
                          <p className={`font-orbitron font-bold ${log.side === 'BUY' ? 'text-green-400' : log.side === 'SELL' ? 'text-red-400' : 'text-white'}`}>
                            {log.side}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-molten-gold/60 font-orbitron text-xs tracking-wider uppercase mb-1">DEX</p>
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/dex-icons/${log.dex_name?.toLowerCase().includes('raydium') ? 'raydium' :
                              log.dex_name?.toLowerCase().includes('meteora') ? 'meteora' :
                                log.dex_name?.toLowerCase().includes('jupiter') ? 'jupiter' :
                                  log.dex_name?.toLowerCase().includes('uniswap') ? 'uniswap_v2' :
                                    log.dex_name?.toLowerCase().includes('metamask') ? 'metamask_router' :
                                      log.dex_name?.toLowerCase().includes('four.meme') ? 'four.meme' :
                                        log.dex_name?.toLowerCase().includes('okx') ? 'okx_dex' :
                                          selectedCoin === 'bnb' ? 'uniswap_v2' : 'pumpfun'
                              }.png`}
                            alt={log.dex_name || (selectedCoin === 'bnb' ? 'Uniswap V2' : 'Pumpfun')}
                            className="w-10 h-10 rounded-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = selectedCoin === 'bnb' ? '/dex-icons/uniswap_v2.png' : '/dex-icons/pumpfun.png';
                              (e.target as HTMLImageElement).onerror = null;
                            }}
                          />
                          <p className="text-white font-orbitron font-bold">
                            {log.dex_name || (selectedCoin === 'bnb' ? 'Uniswap V2' : 'Pumpfun')}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-molten-gold/60 font-orbitron text-xs tracking-wider uppercase mb-1">Target Token</p>
                        <div className="flex items-center gap-2">
                          {log.token_logo_uri ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={log.token_logo_uri}
                                alt={log.token_symbol || 'token'}
                                className="w-6 h-6 rounded-full flex-shrink-0 object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-molten-gold/20 border border-molten-gold/30 flex-shrink-0" />
                          )}
                          <p className="text-white font-space-grotesk font-mono text-sm truncate flex-1">
                            {log.target_token || 'N/A'}
                          </p>
                          {log.target_token && (
                            <button
                              onClick={() => copyToClipboard(log.target_token || '', `log-target-${log.id}`)}
                              className="text-molten-gold/60 hover:text-molten-gold transition-colors duration-300"
                            >
                              <Copy size={14} />
                            </button>
                          )}
                          {log.target_token && copiedKey === `log-target-${log.id}` && (
                            <span className="text-xs text-molten-gold">Copied</span>
                          )}
                          {log.target_token && (
                            <a
                              href={`https://dexscreener.com/${selectedCoin === 'sol' ? 'solana' : 'bsc'}/${log.target_token}${profile?.public_address ? `?maker=${profile.public_address}` : ''}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-molten-gold/60 hover:text-molten-gold transition-colors duration-300"
                              title="View on DexScreener"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                        {/* PnL Display for successful user_sell */}
                        {log.event_type === 'user_sell' && log.status === 'success' && log.pnl !== null && log.pnl !== undefined && (
                          <div className="mt-3 pt-3 border-t border-molten-gold/10">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-molten-gold/60 font-orbitron text-xs tracking-wider uppercase mb-1">PnL</p>
                                <p className={`font-orbitron font-bold text-sm ${log.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {log.pnl >= 0 ? '+' : ''}{log.pnl.toFixed(6)} {selectedCoin.toUpperCase()}
                                </p>
                              </div>
                              <motion.button
                                onClick={() => handleGeneratePnlImage(log)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-molten-gold/10 border border-molten-gold/30 text-molten-gold rounded-lg hover:bg-molten-gold/20 transition-colors duration-300"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Share2 size={14} />
                                <span className="text-xs font-orbitron font-semibold">Share</span>
                              </motion.button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {log.token_name && (
                      <div>
                        <p className="text-molten-gold/60 font-orbitron text-xs tracking-wider uppercase mb-1">Token Name</p>
                        <p className="text-white font-space-grotesk font-semibold text-sm">
                          {log.token_name}
                        </p>
                      </div>
                    )}

                    {/* Transaction Signature */}
                    {log.transaction_signature && (
                      <div>
                        <p className="text-molten-gold/60 font-orbitron text-xs tracking-wider uppercase mb-1">Transaction Signature</p>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-space-grotesk font-mono text-sm truncate flex-1">
                            {log.transaction_signature}
                          </p>
                          <button
                            onClick={() => copyToClipboard(log.transaction_signature || '', `log-sig-${log.id}`)}
                            className="text-molten-gold/60 hover:text-molten-gold transition-colors duration-300"
                          >
                            <Copy size={14} />
                          </button>
                          {copiedKey === `log-sig-${log.id}` && (
                            <span className="text-xs text-molten-gold">Copied</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Amounts */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {log.amount_in && (() => {
                        if (log.event_type === 'tracked_wallet_activity') {
                          const isBuy = log.side === 'BUY'
                          let targetToken: string | null | undefined
                          let baseToken: string | null | undefined
                          if (isBuy) {
                            targetToken = log.target_token
                            baseToken = log.base_token
                          } else {
                            targetToken = log.base_token
                            baseToken = log.target_token
                          }

                          if (isBuy) {
                            const isToken = true
                            const tokenName = log.token_name || selectedCoin.toUpperCase()
                            return (
                              <div>
                                <p className="text-molten-gold/60 font-orbitron text-xs tracking-wider uppercase mb-1">Received</p>
                                <p className="text-white font-space-grotesk font-mono text-sm">
                                  {formatAmount(log.amount_in, selectedCoin, isToken, log.token_decimals)}
                                  {` ${tokenName}`}
                                </p>
                              </div>
                            )
                          } else {
                            const isToken = false
                            const currencyName = log.base_token_name || selectedCoin.toUpperCase()
                            return (
                              <div>
                                <p className="text-molten-gold/60 font-orbitron text-xs tracking-wider uppercase mb-1">Received</p>
                                <p className="text-white font-space-grotesk font-mono text-sm">
                                  {formatAmount(log.amount_in, selectedCoin, isToken, null)}
                                  {` ${currencyName}`}
                                </p>
                              </div>
                            )
                          }
                        }

                        const isBuyOperation = log.event_type === 'user_purchase'
                        const isToken = !isBuyOperation
                        const eData = parseLogEventData(log.event_data)
                        const sentSymbol = isBuyOperation ? (eData.input_token_symbol || selectedCoin.toUpperCase()) : (log.token_name || selectedCoin.toUpperCase())
                        return (
                          <div>
                            <p className="text-molten-gold/60 font-orbitron text-xs tracking-wider uppercase mb-1">Sent</p>
                            <p className="text-white font-space-grotesk font-mono text-sm">
                              {formatAmount(log.amount_in, selectedCoin, isToken, isToken ? log.token_decimals : null)}
                              {` ${sentSymbol}`}
                            </p>
                          </div>
                        )
                      })()}

                      {log.amount_out && (() => {
                        if (log.event_type === 'tracked_wallet_activity') {
                          const isBuy = log.side === 'BUY'
                          let targetToken: string | null | undefined
                          let baseToken: string | null | undefined

                          if (isBuy) {
                            targetToken = log.target_token
                            baseToken = log.base_token
                          } else {
                            targetToken = log.base_token
                            baseToken = log.target_token
                          }

                          if (isBuy) {
                            const isToken = false
                            const currencyName = log.base_token_name || selectedCoin.toUpperCase()
                            return (
                              <div>
                                <p className="text-molten-gold/60 font-orbitron text-xs tracking-wider uppercase mb-1">Sent</p>
                                <p className="text-white font-space-grotesk font-mono text-sm">
                                  {formatAmount(log.amount_out, selectedCoin, isToken, null)}
                                  {` ${currencyName}`}
                                </p>
                              </div>
                            )
                          } else {
                            const isToken = true
                            const tokenName = log.token_name || selectedCoin.toUpperCase()
                            return (
                              <div>
                                <p className="text-molten-gold/60 font-orbitron text-xs tracking-wider uppercase mb-1">Sent</p>
                                <p className="text-white font-space-grotesk font-mono text-sm">
                                  {formatAmount(log.amount_out, selectedCoin, isToken, log.token_decimals)}
                                  {` ${tokenName}`}
                                </p>
                              </div>
                            )
                          }
                        }

                        const isBuyOperation = log.event_type === 'user_purchase'
                        const isToken = isBuyOperation
                        return (
                          <div>
                            <p className="text-molten-gold/60 font-orbitron text-xs tracking-wider uppercase mb-1">Received</p>
                            <p className="text-white font-space-grotesk font-mono text-sm">
                              {formatAmount(log.amount_out, selectedCoin, isToken, isToken ? log.token_decimals : null)}
                              {isToken && log.token_name ? ` ${log.token_name}` : ` ${selectedCoin.toUpperCase()}`}
                            </p>
                          </div>
                        )
                      })()}

                      {log.fee_amount && (
                        <div>
                          <p className="text-molten-gold/60 font-orbitron text-xs tracking-wider uppercase mb-1">Fee Amount</p>
                          <p className="text-white font-space-grotesk font-mono text-sm">
                            {formatAmount(log.fee_amount, selectedCoin, false)} {parseLogEventData(log.event_data).input_token_symbol || selectedCoin.toUpperCase()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Event Data - Only show for non-user purchase/sell events */}
                    {log.event_data && log.event_type !== 'user_purchase' && log.event_type !== 'user_sell' && !isSpikeEntryLog(log) && (
                      <div>
                        <p className="text-molten-gold/60 font-orbitron text-xs tracking-wider uppercase mb-1">Event Data</p>
                        <div className="bg-void-black/30 border border-molten-gold/10 rounded-lg p-3">
                          <p className="text-white/80 font-space-grotesk text-sm font-mono break-all">
                            {log.event_data}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {log.error_message && log.event_type !== 'user_purchase' && log.event_type !== 'user_sell' && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-400 font-orbitron text-xs tracking-wider uppercase mb-1">Error Message</p>
                      <p className="text-red-300 font-space-grotesk text-sm">{log.error_message}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {logsTotalPages > 1 && (
            <div className="mt-8 space-y-4">

              {/* Traditional Pagination */}
              <div className="flex items-center justify-center gap-4">
                <motion.button
                  onClick={() => handleLogsPageChange(logsPage - 1)}
                  disabled={logsPage <= 1 || logsLoading}
                  className="px-4 py-2 bg-molten-gold/10 border border-molten-gold/20 text-molten-gold rounded-lg hover:bg-molten-gold/20 transition-colors duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ChevronLeft size={16} />
                  Previous
                </motion.button>

                <div className="flex items-center gap-2">
                  <span className="text-white font-orbitron font-semibold">
                    Page {logsPage} of {logsTotalPages}
                  </span>
                  <span className="text-molten-gold/60 font-orbitron text-sm">
                    ({logsTotal} total logs)
                  </span>
                </div>

                <motion.button
                  onClick={() => handleLogsPageChange(logsPage + 1)}
                  disabled={logsPage >= logsTotalPages || logsLoading}
                  className="px-4 py-2 bg-molten-gold/10 border border-molten-gold/20 text-molten-gold rounded-lg hover:bg-molten-gold/20 transition-colors duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Next
                  <ChevronRight size={16} />
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </section>
    )
  }

  const renderProfileOverview = () => {
    return (
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <h1 className="text-xl md:text-3xl font-orbitron font-bold text-molten-gold">
            Profile Overview
          </h1>
        </div>

        {/* Trade Amount Success Message */}
        {tradeAmountSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg"
          >
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle size={20} />
              <span className="font-orbitron font-bold">{tradeAmountSuccess}</span>
            </div>
          </motion.div>
        )}

        {/* Profile Overview */}
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-molten-gold/20 rounded-lg p-4 md:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-molten-gold to-yellow-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={32} className="md:w-10 md:h-10 text-void-black" />
            </div>
            <div className="flex-1 text-center md:text-left w-full">
              <h2 className="text-xl md:text-2xl font-orbitron font-bold text-white mb-2">
                {profile?.username || user?.username}
              </h2>
              <p className="text-molten-gold/80 font-space-grotesk text-sm md:text-lg mb-4">
                Trading Master
              </p>
              <div className="flex justify-center md:justify-start gap-3 md:gap-4 flex-wrap">
                <div className="text-center">
                  <p className="text-xl md:text-2xl font-orbitron font-bold text-molten-gold">
                    {isLoading ? '...' : profile?.total_trades || 0}
                  </p>
                  <p className="text-xs font-orbitron font-medium text-molten-gold/80 tracking-wider uppercase">
                    Total Trades
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xl md:text-2xl font-orbitron font-bold text-red-400">
                    {isLoading ? '...' : (() => {
                      const fromProfile = profile?.failed_trades
                      if (typeof fromProfile === 'number') return fromProfile
                      const fromStats = copyTradingStats?.failed_trades
                      if (typeof fromStats === 'number') return fromStats
                      const total = typeof profile?.total_trades === 'number' ? profile.total_trades : undefined
                      const winRate = typeof profile?.win_rate === 'number' ? profile.win_rate : undefined
                      if (typeof total === 'number' && typeof winRate === 'number') {
                        const wins = Math.round((winRate / 100) * total)
                        const failed = Math.max(0, total - wins)
                        return failed
                      }
                      return 0
                    })()}
                  </p>
                  <p className="text-xs font-orbitron font-medium text-molten-gold/80 tracking-wider uppercase">
                    Failed Trades
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xl md:text-2xl font-orbitron font-bold text-white">
                    {isLoading ? '...' : profile?.active_trades || 0}
                  </p>
                  <p className="text-xs font-orbitron font-medium text-molten-gold/80 tracking-wider uppercase">
                    Active Trades
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
          {/* Personal Information */}
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-molten-gold/20 rounded-lg p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-orbitron font-bold text-molten-gold mb-4 md:mb-6 flex items-center gap-3">
              <User size={18} className="md:w-5 md:h-5" />
              Personal Information
            </h3>

            <div className="space-y-4">
              <div className="bg-void-black/50 border border-molten-gold/10 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Mail size={16} className="text-molten-gold" />
                  <span className="text-sm font-orbitron font-medium text-molten-gold/80 tracking-wider uppercase">
                    Email Address
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-white font-space-grotesk flex-1">{profile?.email || user?.email}</p>
                  <button
                    onClick={() => copyToClipboard(profile?.email || user?.email || '', 'email')}
                    className="text-molten-gold/60 hover:text-molten-gold transition-colors duration-300"
                  >
                    <Copy size={14} />
                  </button>
                  {copiedKey === 'email' && (
                    <span className="text-xs text-molten-gold">Copied</span>
                  )}
                </div>
              </div>

              <div className="bg-void-black/50 border border-molten-gold/10 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <User size={16} className="text-molten-gold" />
                  <span className="text-sm font-orbitron font-medium text-molten-gold/80 tracking-wider uppercase">
                    Username
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-white font-space-grotesk flex-1">{profile?.username || user?.username}</p>
                  <button
                    onClick={() => copyToClipboard(profile?.username || user?.username || '', 'username')}
                    className="text-molten-gold/60 hover:text-molten-gold transition-colors duration-300"
                  >
                    <Copy size={14} />
                  </button>
                  {copiedKey === 'username' && (
                    <span className="text-xs text-molten-gold">Copied</span>
                  )}
                </div>
              </div>

              <div className="bg-void-black/50 border border-molten-gold/10 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp size={16} className="text-molten-gold" />
                  <span className="text-sm font-orbitron font-medium text-molten-gold/80 tracking-wider uppercase">
                    Trade Amount ({selectedCoin.toUpperCase()})
                  </span>
                </div>
                {isEditingTradeAmount ? (
                  <div className="space-y-3">
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      value={tradeAmountValue}
                      onChange={(e) => handleTradeAmountChange(e.target.value)}
                      className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                      placeholder={`Minimum ${selectedCoin === 'sol' ? config.sol_trade_amount : config.bnb_trade_amount} ${selectedCoin.toUpperCase()}`}
                    />
                    {tradeAmountError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2 text-red-400">
                          <XCircle size={16} />
                          <span className="text-sm font-orbitron font-bold">{tradeAmountError}</span>
                        </div>
                      </motion.div>
                    )}
                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={handleUpdateTradeAmount}
                        disabled={tradeAmountUpdating}
                        className="flex-1 px-3 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {tradeAmountUpdating ? (
                          <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircle size={14} />
                        )}
                        Save
                      </motion.button>
                      <motion.button
                        onClick={handleCancelEditTradeAmount}
                        disabled={tradeAmountUpdating}
                        className="flex-1 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <XCircle size={14} />
                        Cancel
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <p className="text-white font-space-grotesk flex-1">
                      {profile?.trade_amount ? `${profile.trade_amount} ${selectedCoin.toUpperCase()}` : `0 ${selectedCoin.toUpperCase()}`}
                    </p>
                    <motion.button
                      onClick={handleEditTradeAmount}
                      className="px-3 py-2 bg-molten-gold/10 border border-molten-gold/20 text-molten-gold rounded-lg hover:bg-molten-gold/20 transition-colors duration-300 flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Edit3 size={14} />
                      Update
                    </motion.button>
                  </div>
                )}
              </div>

              <div className="bg-void-black/50 border border-molten-gold/10 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Wallet size={16} className="text-molten-gold" />
                  <span className="text-sm font-orbitron font-medium text-molten-gold/80 tracking-wider uppercase">
                    {selectedCoin === 'sol' ? 'USDT' : 'USDC'} Trade Amount
                  </span>
                </div>
                <p className="mb-3 text-xs text-white/45 font-space-grotesk leading-relaxed">
                  Used only when Dip Ladder buys native {selectedCoin.toUpperCase()}. Custom token ladders still use your {selectedCoin.toUpperCase()} trade amount.
                </p>
                {isEditingStableTradeAmount ? (
                  <div className="space-y-3">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={stableTradeAmountValue}
                      onChange={(e) => handleStableTradeAmountChange(e.target.value)}
                      className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                      placeholder={`${selectedCoin === 'sol' ? 'USDT' : 'USDC'} amount for native ${selectedCoin.toUpperCase()}`}
                    />
                    {stableTradeAmountError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2 text-red-400">
                          <XCircle size={16} />
                          <span className="text-sm font-orbitron font-bold">{stableTradeAmountError}</span>
                        </div>
                      </motion.div>
                    )}
                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={handleUpdateStableTradeAmount}
                        disabled={stableTradeAmountUpdating}
                        className="flex-1 px-3 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {stableTradeAmountUpdating ? (
                          <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircle size={14} />
                        )}
                        Save
                      </motion.button>
                      <motion.button
                        onClick={handleCancelStableTradeAmount}
                        disabled={stableTradeAmountUpdating}
                        className="flex-1 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <XCircle size={14} />
                        Cancel
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <p className="text-white font-space-grotesk flex-1">
                      {getStableTradeAmount(profile, selectedCoin) !== null && getStableTradeAmount(profile, selectedCoin) !== undefined
                        ? `${getStableTradeAmount(profile, selectedCoin)} ${selectedCoin === 'sol' ? 'USDT' : 'USDC'}`
                        : 'Not set'}
                    </p>
                    <motion.button
                      onClick={handleEditStableTradeAmount}
                      className="px-3 py-2 bg-molten-gold/10 border border-molten-gold/20 text-molten-gold rounded-lg hover:bg-molten-gold/20 transition-colors duration-300 flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Edit3 size={14} />
                      Update
                    </motion.button>
                  </div>
                )}
              </div>

              {selectedCoin === 'sol' && (
                <div className="bg-void-black/50 border border-molten-gold/10 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Activity size={16} className="text-molten-gold" />
                    <span className="text-sm font-orbitron font-medium text-molten-gold/80 tracking-wider uppercase">
                      Default Tracking Type
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'launches', label: 'Launches' },
                      { id: 'swaps', label: 'Swaps' },
                      { id: 'both', label: 'Both' }
                    ].map((type) => (
                      <button
                        key={type.id}
                        disabled={isUpdatingTrackingType}
                        onClick={() => handleUpdateGlobalTrackingType(type.id)}
                        className={`px-2 py-2 rounded-lg border font-orbitron font-bold text-[10px] transition-all duration-300 ${defaultTrackingType === type.id
                          ? 'bg-molten-gold text-void-black border-molten-gold shadow-[0_0_10px_rgba(255,184,0,0.2)]'
                          : 'bg-void-black/40 text-white/40 border-white/5 hover:border-molten-gold/30 hover:text-white/60'
                          } ${isUpdatingTrackingType ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-white/20 font-space-grotesk mt-2">
                    Affects newly tracked wallets.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Wallet Information */}
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-molten-gold/20 rounded-lg p-4 md:p-6">
            <div className="flex items-start justify-between mb-4 md:mb-6">
              <h3 className="text-lg md:text-xl font-orbitron font-bold text-molten-gold flex items-center gap-3">
                <Wallet size={18} className="md:w-5 md:h-5" />
                Wallet Information
              </h3>
            </div>
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-xs text-yellow-400 font-space-grotesk">
                <span className="font-semibold">Platform Fee:</span> A 1% fee applies to all trades
              </p>
            </div>

            {(profile || wallet) ? (
              <div className="space-y-4">
                <div className="bg-void-black/50 border border-molten-gold/10 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Wallet size={16} className="text-molten-gold" />
                    <span className="text-sm font-orbitron font-medium text-molten-gold/80 tracking-wider uppercase">
                      Active Wallet
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        onClick={() => setIsWalletListOpen(!isWalletListOpen)}
                        className="text-molten-gold/60 hover:text-molten-gold transition-colors duration-300"
                        title="Switch Wallet"
                      >
                        <ChevronDown size={16} className={`transform transition-transform ${isWalletListOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <button
                        onClick={() => setIsAddWalletOpen(true)}
                        className="text-molten-gold/60 hover:text-molten-gold transition-colors duration-300"
                        title="Add New Wallet"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  {isWalletListOpen && profile?.wallets && profile.wallets.length > 0 && (
                    <div className="mb-4 space-y-2 max-h-48 overflow-y-auto pr-1">
                      {profile.wallets.map((w: any) => {
                        const isActive = selectedCoin === 'sol' ? w.is_active_sol : w.is_active_bnb;
                        return (
                          <div
                            key={w.id}
                            onClick={() => handleSelectWallet(w.id)}
                            className={`p-3 rounded border cursor-pointer transition-all duration-300 flex items-center justify-between ${isActive
                              ? 'bg-molten-gold/20 border-molten-gold/50'
                              : 'bg-void-black/30 border-white/5 hover:border-molten-gold/30'
                              }`}
                          >
                            <div className="flex flex-col">
                              <span className="text-xs text-molten-gold/60 font-orbitron uppercase">
                                {w.name || 'Unnamed Wallet'}
                              </span>
                              <span className="text-sm text-white/80 font-space-grotesk">
                                {formatWalletAddress(selectedCoin === 'sol' ? w.solana_public_key : w.bnb_public_key)}
                              </span>
                            </div>
                            {isActive && <CheckCircle size={14} className="text-molten-gold" />}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <p className="text-white font-space-grotesk flex-1">
                      {formatWalletAddress(profile?.public_address || '')}
                    </p>
                    <button
                      onClick={() => copyToClipboard(profile?.public_address || '', 'public')}
                      className="text-molten-gold/60 hover:text-molten-gold transition-colors duration-300"
                    >
                      <Copy size={14} />
                    </button>
                    {copiedKey === 'public' && (
                      <span className="text-xs text-molten-gold">Copied</span>
                    )}
                  </div>
                </div>

                <div className="bg-void-black/50 border border-molten-gold/10 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
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
                        ? formatWalletAddress(profile?.private_key || '')
                        : '••••••••••••••••'
                      }
                    </p>
                    {showPrivateKey && (
                      <button
                        onClick={() => copyToClipboard(profile?.private_key || '', 'private')}
                        className="text-molten-gold/60 hover:text-molten-gold transition-colors duration-300"
                      >
                        <Copy size={14} />
                      </button>
                    )}
                    {showPrivateKey && copiedKey === 'private' && (
                      <span className="text-xs text-molten-gold">Copied</span>
                    )}
                  </div>
                </div>

                <div className="bg-void-black/50 border border-molten-gold/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <TrendingUp size={16} className="text-molten-gold" />
                      <span className="text-sm font-orbitron font-medium text-molten-gold/80 tracking-wider uppercase">
                        Wallet Balances
                      </span>
                    </div>
                    <motion.button
                      onClick={handleRefreshBalance}
                      disabled={balanceRefreshing}
                      className="text-molten-gold/60 hover:text-molten-gold transition-colors duration-300 disabled:opacity-50"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <RefreshCw size={16} className={balanceRefreshing ? 'animate-spin' : ''} />
                    </motion.button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs font-orbitron uppercase tracking-wider text-white/45">
                        {selectedCoin === 'sol' ? 'Native SOL' : 'Native BNB'}
                      </span>
                      <p className="min-w-0 text-right text-lg md:text-xl font-orbitron font-bold text-molten-gold break-all [overflow-wrap:anywhere]">
                        {isLoading || balanceRefreshing ? '...' : `${formatProfileBalance(profile?.sol_balance, 4)} ${selectedCoin.toUpperCase()}`}
                      </p>
                    </div>
                    <div className="flex items-start justify-between gap-3 border-t border-molten-gold/10 pt-3">
                      <span className="text-xs font-orbitron uppercase tracking-wider text-white/45">
                        {profile?.stable_symbol || (selectedCoin === 'sol' ? 'USDT' : 'USDC')} Balance
                      </span>
                      <p className="min-w-0 text-right text-lg md:text-xl font-orbitron font-bold text-white break-all [overflow-wrap:anywhere]">
                        {isLoading || balanceRefreshing ? '...' : `${formatProfileBalance(profile?.stable_balance, 6)} ${profile?.stable_symbol || (selectedCoin === 'sol' ? 'USDT' : 'USDC')}`}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <motion.button
                      onClick={() => setShowWithdraw(true)}
                      className="px-3 py-2 bg-molten-gold/10 border border-molten-gold/20 text-molten-gold rounded-lg hover:bg-molten-gold/20 transition-colors duration-300 text-sm font-orbitron"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Withdraw
                    </motion.button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Wallet size={48} className="text-molten-gold/40 mx-auto mb-4" />
                <p className="text-white/60 font-space-grotesk">
                  No wallet connected
                </p>
              </div>
            )}
          </div>
        </div>

        {/* PnL Section */}
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-molten-gold/20 rounded-lg p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-orbitron font-bold text-molten-gold mb-4 md:mb-6 flex items-center gap-3">
            <TrendingUp size={18} className="md:w-5 md:h-5" />
            Profit & Loss
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-void-black/50 border border-molten-gold/10 rounded-lg p-3 md:p-4 text-center">
              <p className="text-xs font-orbitron text-molten-gold/80 tracking-wider uppercase mb-1">Total PnL</p>
              <p className={`text-xl md:text-2xl font-orbitron font-bold ${((profile as any)?.pnl_total || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {isLoading ? '...' : ((profile as any)?.pnl_total ?? 0)}
              </p>
            </div>
            <div className="bg-void-black/50 border border-molten-gold/10 rounded-lg p-3 md:p-4 text-center">
              <p className="text-xs font-orbitron text-molten-gold/80 tracking-wider uppercase mb-1">PnL (24h)</p>
              <p className={`text-xl md:text-2xl font-orbitron font-bold ${((profile as any)?.pnl_24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {isLoading ? '...' : ((profile as any)?.pnl_24h ?? 0)}
              </p>
            </div>
            <div className="bg-void-black/50 border border-molten-gold/10 rounded-lg p-3 md:p-4 text-center">
              <p className="text-xs font-orbitron text-molten-gold/80 tracking-wider uppercase mb-1">PnL (7d)</p>
              <p className={`text-xl md:text-2xl font-orbitron font-bold ${((profile as any)?.pnl_7d || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {isLoading ? '...' : ((profile as any)?.pnl_7d ?? 0)}
              </p>
            </div>
          </div>
        </div>


        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-end">
          <motion.button
            onClick={handleLogout}
            className="px-4 md:px-6 py-2 md:py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors duration-300 flex items-center justify-center gap-2 text-sm md:text-base"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut size={18} />
            <span className="font-space-grotesk font-medium">Logout</span>
          </motion.button>
        </div>
      </div>
    )
  }

  return (
    <ProfileLayout>
      {/* per-button copied indicator used; global removed */}

      {showWithdraw && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gradient-to-r from-void-black/95 to-black/90 border border-molten-gold/30 rounded-lg p-4 md:p-6 w-full max-w-md mx-4 md:mx-0"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base md:text-lg font-orbitron font-bold text-molten-gold">Withdraw {selectedCoin.toUpperCase()}</h3>
              <button onClick={() => setShowWithdraw(false)} className="text-molten-gold/60 hover:text-molten-gold text-lg md:text-xl">✕</button>
            </div>
            <div className="space-y-4">
              {withdrawError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg"
                >
                  <p className="text-red-400 font-orbitron text-sm">{withdrawError}</p>
                </motion.div>
              )}
              {withdrawSuccess && withdrawSuccess.success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg"
                >
                  <p className="text-green-400 font-orbitron text-sm">Withdrawal successful.</p>
                  <div className="mt-2 text-sm text-white/80 font-space-grotesk">
                    <div>Signature: <span className="font-mono break-all">{withdrawSuccess.transaction_signature}</span></div>
                    <div>Amount: {withdrawSuccess.amount} {selectedCoin.toUpperCase()}</div>
                    <a href={withdrawSuccess.explorer_url} target="_blank" rel="noopener noreferrer" className="text-molten-gold underline">View on Explorer</a>
                  </div>
                </motion.div>
              )}
              <div>
                <label className="block text-sm font-orbitron text-molten-gold mb-2 tracking-wide">Destination Wallet</label>
                <input
                  type="text"
                  value={withdrawDestination}
                  onChange={(e) => setWithdrawDestination(e.target.value)}
                  className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                  placeholder={`Enter ${selectedCoin.toUpperCase()} address`}
                  disabled={withdrawing}
                />
              </div>
              <div>
                <label className="block text-sm font-orbitron text-molten-gold mb-2 tracking-wide">Amount</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                  placeholder="0.00"
                  min="0"
                  step="0.0001"
                  disabled={withdrawing}
                />
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <motion.button
                  onClick={handleWithdraw}
                  disabled={withdrawing || !withdrawDestination || !withdrawAmount}
                  className="flex-1 px-4 py-2 bg-molten-gold text-void-black font-orbitron font-bold rounded-lg hover:brightness-110 transition-colors duration-300 disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {withdrawing ? 'Processing withdrawal...' : 'Withdraw'}
                </motion.button>
                <motion.button
                  onClick={() => {
                    setShowWithdraw(false)
                    setWithdrawDestination('')
                    setWithdrawAmount('')
                    setWithdrawSuccess(null)
                  }}
                  disabled={withdrawing}
                  className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {dipLadderDeleteModal.open && dipLadderDeleteModal.ladder && typeof document !== 'undefined' && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2147483646] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="relative z-[2147483647] w-full max-w-md rounded-lg border border-red-400/30 bg-gradient-to-br from-void-black/95 to-black/95 p-5 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-red-400/30 bg-red-500/10 text-red-300">
                <Trash2 size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-orbitron font-bold text-red-300">Delete Dip Ladder Entry</h3>
                <p className="mt-2 text-sm text-white/60 font-space-grotesk leading-relaxed">
                  This removes the token from Dip Ladder entirely. The bot will stop tracking its price, stop buying new drops, and remove all saved lots for this entry. It does not sell tokens in your wallet.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-white/10 bg-black/25 p-4 space-y-3">
              <div className="min-w-0">
                <p className="text-[10px] text-white/35 font-orbitron uppercase mb-1">Token</p>
                <p className="text-sm text-white font-orbitron font-bold truncate">
                  {dipLadderDeleteModal.ladder.token_name || dipLadderDeleteModal.ladder.token_symbol || formatWalletAddress(dipLadderDeleteModal.ladder.token_address)}
                </p>
                <p className="mt-1 break-all [overflow-wrap:anywhere] text-[11px] text-white/35 font-mono">
                  {dipLadderDeleteModal.ladder.token_address}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-white/35 font-orbitron uppercase mb-1">Status</p>
                  <p className="break-all [overflow-wrap:anywhere] text-sm text-white font-orbitron font-bold">
                    {dipLadderDeleteModal.ladder.status === 'stopped_no_cash' ? 'NO CASH' : dipLadderDeleteModal.ladder.status === 'stopped_depth_limit' ? 'DEPTH STOP' : dipLadderDeleteModal.ladder.status.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-white/35 font-orbitron uppercase mb-1">Saved Lots</p>
                  <p className="break-all [overflow-wrap:anywhere] text-sm text-molten-gold font-mono">
                    {dipLadderDeleteModal.ladder.lots?.length || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setDipLadderDeleteModal({ open: false, ladder: null })}
                disabled={dipLadderDeleting}
                className="flex-1 rounded-lg border border-white/10 px-4 py-3 text-sm font-orbitron font-bold text-white/70 hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <motion.button
                type="button"
                onClick={handleDeleteDipLadder}
                disabled={dipLadderDeleting}
                className="flex-1 rounded-lg border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm font-orbitron font-bold text-red-300 hover:bg-red-500/25 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {dipLadderDeleting ? (
                  <div className="h-4 w-4 rounded-full border-2 border-red-300 border-t-transparent animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
                Delete Entry
              </motion.button>
            </div>
          </motion.div>
        </motion.div>,
        document.body
      )}

      {currentSection === 'wallet-tracker' ? renderWalletTrackerSection() :
        currentSection === 'dip-ladder' ? <DipLadderPageContent /> :
        currentSection === 'tracker-logs' ? renderTrackerLogs() :
          renderProfileOverview()}

      {showPrivateKeyWarning && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-void-black/95 to-black/90 backdrop-blur-md border border-molten-gold/30 rounded-lg p-6 max-w-lg w-full shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-orbitron font-bold text-molten-gold flex items-center gap-3">
                <Shield size={24} />
                Important Security Warning
              </h2>
              <motion.button
                onClick={() => {
                  localStorage.setItem('private_key_warning_seen', 'true')
                  setShowPrivateKeyWarning(false)
                }}
                className="text-white/60 hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={24} />
              </motion.button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 font-orbitron font-semibold text-sm mb-2">
                  ⚠️ CRITICAL: Save Your Private Key Immediately
                </p>
                <p className="text-white/80 font-space-grotesk text-sm leading-relaxed">
                  Your private key is displayed in your profile. This key gives <strong>full control</strong> over your wallet and funds.
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-400 font-orbitron font-semibold text-sm mb-2">
                  🔒 Security Best Practices:
                </p>
                <ul className="text-white/80 font-space-grotesk text-sm space-y-2 list-disc list-inside leading-relaxed">
                  <li>Save your private key in a secure location (password manager, encrypted file, or physical safe)</li>
                  <li><strong>Never share</strong> your private key with anyone.</li>
                  <li>Do not store it in plain text on your computer or in cloud storage</li>
                  <li>If you lose your private key, you will permanently lose access to your wallet and funds</li>
                </ul>
              </div>

              <div className="bg-molten-gold/10 border border-molten-gold/30 rounded-lg p-4">
                <p className="text-molten-gold font-orbitron font-semibold text-sm mb-2">
                  ✅ What to Do:
                </p>
                <p className="text-white/80 font-space-grotesk text-sm leading-relaxed">
                  Go to your <strong>Wallet Information</strong> section below, click the eye icon to reveal your private key, and save it securely before continuing.
                </p>
              </div>
            </div>

            <motion.button
              onClick={() => {
                localStorage.setItem('private_key_warning_seen', 'true')
                setShowPrivateKeyWarning(false)
              }}
              className="w-full px-6 py-3 bg-molten-gold text-void-black font-orbitron font-bold rounded-lg hover:brightness-110 transition-colors duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              I Understand
            </motion.button>
          </motion.div>
        </div>
      )}

      {pnlImageModal.open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-void-black/95 to-black/90 backdrop-blur-md border border-molten-gold/30 rounded-lg p-6 max-w-2xl w-full shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-orbitron font-bold text-molten-gold">
                PnL Trade Result
              </h2>
              <motion.button
                onClick={() => {
                  if (pnlImageModal.imageUrl) {
                    URL.revokeObjectURL(pnlImageModal.imageUrl)
                  }
                  setPnlImageModal({ open: false, imageUrl: null, loading: false })
                }}
                className="text-white/60 hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={24} />
              </motion.button>
            </div>

            {pnlImageModal.loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw size={32} className="animate-spin text-molten-gold" />
                <span className="ml-3 text-white font-space-grotesk">Generating image...</span>
              </div>
            ) : pnlImageModal.imageUrl ? (
              <div className="space-y-4">
                <div className="bg-void-black/50 rounded-lg p-4 flex items-center justify-center overflow-auto max-h-[60vh]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pnlImageModal.imageUrl}
                    alt="PnL Trade Result"
                    className="max-w-[500px] max-h-[500px] w-auto h-auto rounded-lg object-contain"
                  />
                </div>
                <div className="flex gap-3">
                  <motion.button
                    onClick={handleDownloadPnlImage}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-molten-gold/10 border border-molten-gold/30 text-molten-gold rounded-lg hover:bg-molten-gold/20 transition-colors duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Download size={18} />
                    <span className="font-orbitron font-semibold">Download</span>
                  </motion.button>
                  <motion.button
                    onClick={handleSharePnlImage}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-lg hover:bg-indigo-500/20 transition-colors duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Share2 size={18} />
                    <span className="font-orbitron font-semibold">Share</span>
                  </motion.button>
                </div>
              </div>
            ) : null}
          </motion.div>
        </div>
      )}

      {/* Stop Tracking Modal */}
      {stopTrackingModal.open && stopTrackingModal.walletAddress && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-void-black border border-molten-gold/30 rounded-lg p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-orbitron font-bold text-molten-gold">
                Stop Tracking Wallet
              </h3>
              <button
                onClick={() => setStopTrackingModal({ open: false, walletAddress: null, isActive: false, trackingType: undefined })}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-white font-space-grotesk mb-4">
                This wallet has active Take Profit / Stop Loss, Buy the Dip, or Dip Ladder settings. How would you like to proceed?
              </p>
              {(stopTrackingModal.isActive || stopTrackingModal.btdFullActive || stopTrackingModal.btdPartialActive || stopTrackingModal.dipLadderActive) && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                  <p className="text-yellow-400 font-orbitron font-semibold text-sm mb-2">
                    Active Settings:
                  </p>
                  {stopTrackingModal.isActive && (
                    <p className="text-white/80 font-space-grotesk text-sm mb-1">
                      • Take Profit / Stop Loss is active
                    </p>
                  )}
                  {(stopTrackingModal.btdFullActive || stopTrackingModal.btdPartialActive) && (
                    <p className="text-white/80 font-space-grotesk text-sm">
                      • Buy the Dip (on sell) is active. By stopping tracking, this will be turned off as well unless tracking starts again.
                    </p>
                  )}
                  {stopTrackingModal.dipLadderActive && (
                    <p className="text-white/80 font-space-grotesk text-sm">
                      Dip Ladder has active monitoring for this wallet.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <motion.button
                onClick={() => {
                  if (stopTrackingModal.walletAddress) {
                    handleStopTracking(stopTrackingModal.walletId, true)
                  }
                }}
                disabled={walletTrackerLoading}
                className="w-full px-4 py-3 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors duration-300 flex items-center justify-center gap-2 font-orbitron font-semibold disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <XCircle size={18} />
                {stopTrackingModal.isActive ? 'Disable TP/SL & Stop Tracking' : 'Stop Tracking'}
              </motion.button>

              {stopTrackingModal.isActive && (
                <motion.button
                  onClick={() => {
                    if (stopTrackingModal.walletAddress) {
                      handleStopTracking(stopTrackingModal.walletId, false)
                    }
                  }}
                  disabled={walletTrackerLoading}
                  className="w-full px-4 py-3 bg-molten-gold/20 border border-molten-gold/50 text-molten-gold rounded-lg hover:bg-molten-gold/30 transition-colors duration-300 flex items-center justify-center gap-2 font-orbitron font-semibold disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <EyeOff size={18} />
                  Only Stop Copy Trading (Keep TP/SL Active)
                </motion.button>
              )}

              <motion.button
                onClick={() => setStopTrackingModal({ open: false, walletAddress: null, isActive: false })}
                disabled={walletTrackerLoading}
                className="w-full px-4 py-3 bg-gray-600/20 border border-gray-600/50 text-gray-400 rounded-lg hover:bg-gray-600/30 transition-colors duration-300 font-orbitron font-semibold disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
      {selectedCoin === 'sol' && showTrackingOptions.open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-r from-void-black/95 to-black/90 backdrop-blur-md border border-molten-gold/30 rounded-lg p-6 w-full max-w-md shadow-2xl"
          >
            <h3 className="text-xl font-orbitron font-bold text-molten-gold mb-4">
              Select Tracking Options
            </h3>
            <p className="text-white/60 font-space-grotesk mb-6 text-sm">
              Choose what types of activities you want to track for this wallet. This helps you focus on specific trading events.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { id: 'swaps', label: 'Swaps' },
                { id: 'launches', label: 'Launches' },
                { id: 'both', label: 'Both' }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedTrackingType(type.id)}
                  className={`py-3 rounded-lg border font-orbitron font-bold text-xs transition-all duration-300 ${selectedTrackingType === type.id
                    ? 'bg-molten-gold text-void-black border-molten-gold shadow-[0_0_10px_rgba(255,184,0,0.2)]'
                    : 'bg-void-black/40 text-white/40 border-white/5 hover:border-molten-gold/30 hover:text-white/60'
                    }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowTrackingOptions({ open: false, type: 'single' })}
                className="flex-1 py-3 border border-white/10 text-white font-orbitron font-bold rounded-lg hover:bg-white/5 transition-all text-sm"
              >
                Cancel
              </button>
              <motion.button
                onClick={handleConfirmTrackingType}
                disabled={walletTrackerLoading || bulkProcessing || !selectedTrackingType}
                className={`flex-1 py-3 font-orbitron font-bold rounded-lg transition-all flex items-center justify-center gap-2 text-sm ${!selectedTrackingType || walletTrackerLoading || bulkProcessing
                  ? 'bg-molten-gold/50 text-void-black/50 cursor-not-allowed'
                  : 'bg-molten-gold text-void-black hover:brightness-110'
                  }`}
                whileHover={!selectedTrackingType || walletTrackerLoading || bulkProcessing ? {} : { scale: 1.02 }}
                whileTap={!selectedTrackingType || walletTrackerLoading || bulkProcessing ? {} : { scale: 0.98 }}
              >
                {(walletTrackerLoading || bulkProcessing) ? (
                  <div className="w-5 h-5 border-2 border-void-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus size={18} />
                )}
                Confirm & Add
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {showBulkUploadModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-r from-void-black/95 to-black/90 backdrop-blur-md border border-molten-gold/30 rounded-lg p-6 w-full max-w-lg shadow-2xl"
          >
            <h3 className="text-xl font-orbitron font-bold text-molten-gold mb-4">
              Confirm Bulk Tracking
            </h3>
            <div className="mb-6 space-y-3">
              <div className="bg-molten-gold/10 border border-molten-gold/20 rounded-lg p-4">
                <div className="flex items-center justify-between font-orbitron">
                  <span className="text-white/60">Wallets Detected:</span>
                  <span className="text-molten-gold text-xl">{bulkWallets.length}</span>
                </div>
                <div className="mt-4 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                  <p className="text-xs font-mono text-white/40 break-all leading-relaxed">
                    {bulkWallets.join(', ')}
                  </p>
                </div>
              </div>
              <p className="text-sm text-white/60 font-space-grotesk italic">
                * All valid wallets detected will be added with your default strategy settings.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowBulkUploadModal(false)}
                className="flex-1 py-3 border border-white/10 text-white font-orbitron font-bold rounded-lg hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <motion.button
                onClick={handleBulkSubmit}
                disabled={bulkProcessing}
                className="flex-1 py-3 bg-molten-gold text-void-black font-orbitron font-bold rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {bulkProcessing ? (
                  <div className="w-5 h-5 border-2 border-void-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle size={18} />
                )}
                Start Tracking
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
      <CreateWalletModal
        isOpen={isAddWalletOpen}
        onClose={() => setIsAddWalletOpen(false)}
      />
    </ProfileLayout>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <div className="text-molten-gold">Loading...</div>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  )
}
