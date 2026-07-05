'use client'

import { motion } from 'framer-motion'
import {
  Activity,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Info,
  Power,
  RefreshCw,
  Save,
  Target,
  Trash2,
  XCircle
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { setCoin } from '../../../store/slices/authSlice'
import { DipLadder } from '../../../store/types/auth'
import { walletTrackerApi } from '../../../services/walletTrackerApi'

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

const formatWalletAddress = (address: any) => {
  if (!address || typeof address !== 'string') return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const getLotSortTime = (lot: DipLadder['lots'][number]) => {
  const updatedTime = lot.updated_at ? new Date(lot.updated_at).getTime() : NaN
  if (Number.isFinite(updatedTime)) return updatedTime
  const createdTime = lot.created_at ? new Date(lot.created_at).getTime() : NaN
  return Number.isFinite(createdTime) ? createdTime : 0
}

const sortLotsByRecentActivity = (lots: DipLadder['lots']) => {
  return [...lots].sort((a, b) => getLotSortTime(b) - getLotSortTime(a) || b.id - a.id)
}

export default function DipLadderPageContent() {
  const dispatch = useAppDispatch()
  const { user, profile, selectedCoin } = useAppSelector((state) => state.auth)
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
  const [walletTrackerError, setWalletTrackerError] = useState<string | null>(null)
  const [walletTrackerSuccess, setWalletTrackerSuccess] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [expandedMobileLogs, setExpandedMobileLogs] = useState<Record<number, boolean>>({})

  const fetchDipLadders = useCallback(async () => {
    try {
      setDipLaddersLoading(true)
      const ladders = await walletTrackerApi.getDipLadders(selectedCoin)
      setDipLadders(Array.isArray(ladders) ? ladders : [])
    } catch (err) {
      console.error('Failed to fetch Dip Ladders:', err)
    } finally {
      setDipLaddersLoading(false)
    }
  }, [selectedCoin])

  useEffect(() => {
    if (user) {
      fetchDipLadders()
    }
  }, [fetchDipLadders, user])

  useEffect(() => {
    if (!walletTrackerSuccess) return
    const timer = setTimeout(() => setWalletTrackerSuccess(null), 5000)
    return () => clearTimeout(timer)
  }, [walletTrackerSuccess])

  useEffect(() => {
    const formToken = dipLadderForm.token_address.trim().toLowerCase()
    const firstLadder = formToken
      ? dipLadders.find(ladder => ladder.token_address.toLowerCase() === formToken)
      : dipLadders[0]
    if (dipLadderSelectedId && dipLadders.some(ladder => ladder.id === dipLadderSelectedId)) return
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
    } else if (dipLadders.length === 0) {
      setDipLadderSelectedId(null)
    }
  }, [dipLadders, dipLadderSelectedId, dipLadderForm.token_address])

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 1200)
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

  const selectedLadder = dipLadders.find(ladder => ladder.id === dipLadderSelectedId) || null
  const activeLadders = dipLadders.filter(ladder => ladder.status === 'active')
  const openLotsCount = dipLadders.reduce((total, ladder) => total + (ladder.lots?.filter(lot => isOpenDipLadderLot(lot.status)).length || 0), 0)
  const soldLotsCount = dipLadders.reduce((total, ladder) => total + (ladder.lots?.filter(lot => isClosedDipLadderLot(lot.status)).length || 0), 0)
  const totalUnrealizedPnl = dipLadders.reduce((total, ladder) => total + (ladder.total_unrealized_pnl_usd || 0), 0)
  const totalRealizedPnl = dipLadders.reduce((total, ladder) => total + (ladder.total_realized_pnl_usd || 0), 0)
  const totalNetPnl = dipLadders.reduce((total, ladder) => total + (ladder.total_pnl_usd || 0), 0)
  const tokenValue = dipLadderForm.token_address.trim()
  const tokenLower = tokenValue.toLowerCase()
  const formCoin = tokenLower === DIP_LADDER_NATIVE_TOKENS.bnb.address.toLowerCase()
    ? 'bnb'
    : tokenLower === DIP_LADDER_NATIVE_TOKENS.sol.address.toLowerCase()
      ? 'sol'
      : selectedCoin
  const nativeToken = DIP_LADDER_NATIVE_TOKENS[formCoin]
  const isNativeSelection = tokenLower === nativeToken.address.toLowerCase()
  const nativeStableSymbol = formCoin === 'sol' ? 'USDT' : 'USDC'
  const nativeStableAmount = getStableTradeAmount(profile, formCoin)
  const nativeActivationBlocked = isNativeSelection && (nativeStableAmount === null || nativeStableAmount === undefined || Number(nativeStableAmount) <= 0)
  const ladderStatusLabel = (status: string) => {
    if (status === 'stopped_no_cash') return 'NO CASH'
    if (status === 'stopped_depth_limit') return 'DEPTH STOP'
    return status.toUpperCase()
  }
  const ladderStatusClass = (status: string) => {
    if (status === 'active') return 'text-blue-300 border-blue-400/40 bg-blue-500/10'
    if (status === 'disabled') return 'text-white/45 border-white/15 bg-white/5'
    if (status === 'stopped_depth_limit') return 'text-red-300 border-red-400/40 bg-red-500/10'
    return 'text-yellow-300 border-yellow-400/40 bg-yellow-500/10'
  }
  const tokenDisplayName = (address: string, ladder?: DipLadder | null) => {
    const match = Object.values(DIP_LADDER_NATIVE_TOKENS).find(token => token.address.toLowerCase() === address.toLowerCase())
    return ladder?.token_name || ladder?.token_symbol || (match ? match.name : formatWalletAddress(address))
  }
  const tokenShortSymbol = (address: string, ladder?: DipLadder | null) => {
    const match = Object.values(DIP_LADDER_NATIVE_TOKENS).find(token => token.address.toLowerCase() === address.toLowerCase())
    return ladder?.token_symbol || match?.label || null
  }
  const dipLadderChartLinks = (ladder: DipLadder) => {
    const gmgnNetwork = ladder.coin_type === 'sol' ? 'sol' : 'bsc'
    const dexNetwork = ladder.coin_type === 'sol' ? 'solana' : 'bsc'
    return {
      gmgn: `https://gmgn.ai/${gmgnNetwork}/token/${ladder.token_address}`,
      dexscreener: `https://dexscreener.com/${dexNetwork}/${ladder.token_address}${profile?.public_address ? `?maker=${profile.public_address}` : ''}`
    }
  }
  const renderDipLadderTokenLinks = (ladder: DipLadder) => {
    const links = dipLadderChartLinks(ladder)
    return (
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <a
          href={links.gmgn}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-blue-400/25 bg-blue-500/10 px-2 text-[10px] font-orbitron font-bold text-blue-300 hover:bg-blue-500/20 transition-colors"
          title="Open GMGN chart"
        >
          GMGN
          <ExternalLink size={10} />
        </a>
        <a
          href={links.dexscreener}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-molten-gold/25 bg-molten-gold/10 px-2 text-[10px] font-orbitron font-bold text-molten-gold hover:bg-molten-gold/20 transition-colors"
          title="Open DexScreener chart"
        >
          DEX
          <ExternalLink size={10} />
        </a>
      </div>
    )
  }
  const formatPnlUsd = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A'
    const amount = Number(value)
    const sign = amount > 0 ? '+' : amount < 0 ? '-' : ''
    return `${sign}$${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  const formatPnlPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return ''
    const amount = Number(value)
    return `${amount > 0 ? '+' : ''}${amount.toFixed(2)}%`
  }
  const pnlTone = (value: number | null | undefined) => {
    const amount = Number(value || 0)
    if (amount > 0) return 'text-green-400'
    if (amount < 0) return 'text-red-400'
    return 'text-white/55'
  }
  const formatOptionalCap = (value: number | null | undefined, suffix = '') => {
    if (value === null || value === undefined) return 'No cap'
    return `${value}${suffix}`
  }
  const renderPnlValue = (value: number | null | undefined, percentage?: number | null, size: 'sm' | 'md' = 'sm') => (
    <div className="min-w-0">
      <p className={`font-mono font-bold leading-snug break-all [overflow-wrap:anywhere] ${size === 'md' ? 'text-base' : 'text-sm'} ${pnlTone(value)}`}>
        {formatPnlUsd(value)}
      </p>
      {percentage !== null && percentage !== undefined && (
        <p className={`mt-0.5 text-[10px] font-orbitron ${pnlTone(value)}`}>{formatPnlPercent(percentage)}</p>
      )}
    </div>
  )

  return (
    <>
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

      <section className="max-w-7xl mx-auto overflow-visible w-full max-w-full space-y-8 md:space-y-10">
        <div className="relative overflow-hidden rounded-lg border border-molten-gold/20 bg-gradient-to-br from-void-black via-black to-molten-gold/10 p-5 md:p-8">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_15%_20%,rgba(245,158,11,0.22),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(59,130,246,0.16),transparent_28%)]" />
          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-5xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-molten-gold/15 border border-molten-gold/30 flex items-center justify-center">
                  <Target size={20} className="text-molten-gold" />
                </div>
                <span className="text-xs font-orbitron font-bold uppercase tracking-[0.28em] text-molten-gold/80">
                  Dip Ladder Strategy
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-orbitron font-bold text-white leading-tight max-w-5xl">
                Run a ladder directly on any token CA.
              </h1>
              <p className="mt-4 text-sm md:text-base text-white/60 font-space-grotesk max-w-3xl">
                Paste a token contract, save the ladder, and the reference price is captured from that moment. Native SOL and BNB are one click away.
              </p>
            </div>
            <motion.button
              onClick={async () => {
                await fetchDipLadders()
              }}
              disabled={dipLaddersLoading}
              className="w-full lg:w-auto px-4 py-3 rounded-lg bg-molten-gold text-void-black font-orbitron font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw size={18} className={dipLaddersLoading ? 'animate-spin' : ''} />
              Refresh
            </motion.button>
          </div>
        </div>

        {walletTrackerError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-red-400/40 bg-red-500/10 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <XCircle size={18} className="mt-0.5 flex-shrink-0 text-red-400" />
                <div className="min-w-0">
                  <p className="text-sm font-orbitron font-bold text-red-300">Dip Ladder action failed</p>
                  <p className="mt-1 break-words text-sm text-red-100/80 font-space-grotesk">{walletTrackerError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWalletTrackerError(null)}
                className="flex-shrink-0 rounded-md border border-red-400/20 bg-red-500/10 px-2 py-1 text-[10px] font-orbitron font-bold text-red-300 hover:bg-red-500/20 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}

        {walletTrackerSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-green-400/35 bg-green-500/10 p-4"
          >
            <div className="flex items-start gap-3">
              <CheckCircle size={18} className="mt-0.5 flex-shrink-0 text-green-400" />
              <p className="break-words text-sm font-orbitron font-bold text-green-300">{walletTrackerSuccess}</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-0 rounded-lg overflow-hidden border border-molten-gold/20 bg-void-black/40">
          {[
            { label: 'Active Ladders', value: activeLadders.length, tone: 'text-blue-300' },
            { label: 'Open Lots', value: openLotsCount, tone: 'text-molten-gold' },
            { label: 'UPNL', value: formatPnlUsd(totalUnrealizedPnl), tone: pnlTone(totalUnrealizedPnl) },
            { label: 'Realized PNL', value: formatPnlUsd(totalRealizedPnl), tone: pnlTone(totalRealizedPnl) },
            { label: 'Net PNL', value: formatPnlUsd(totalNetPnl), tone: pnlTone(totalNetPnl) }
          ].map((metric, index) => (
            <div key={metric.label} className={`p-5 md:p-6 ${index < 4 ? 'border-b xl:border-b-0 xl:border-r border-molten-gold/10' : ''}`}>
              <p className="text-xs font-orbitron uppercase tracking-[0.22em] text-white/35 mb-2">{metric.label}</p>
              <p className={`break-all [overflow-wrap:anywhere] text-2xl md:text-3xl font-orbitron font-bold ${metric.tone}`}>{metric.value}</p>
              {metric.label === 'Realized PNL' && (
                <p className="mt-1 text-[10px] text-white/30 font-space-grotesk">{soldLotsCount} closed lot{soldLotsCount === 1 ? '' : 's'}</p>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 grid-flow-dense gap-0 rounded-lg overflow-visible border border-molten-gold/20 bg-gradient-to-br from-gray-900/50 to-black/80">
          <div className="xl:col-span-7 border-b xl:border-b-0 xl:border-r border-molten-gold/10 p-4 md:p-5">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-orbitron font-bold text-molten-gold">Ladder Setup</h2>
                <p className="text-xs text-white/45 font-space-grotesk mt-1">
                  {selectedLadder ? `Editing ${tokenDisplayName(selectedLadder.token_address, selectedLadder)}` : `New ${selectedCoin.toUpperCase()} ladder`}
                </p>
              </div>
              <button
                onClick={() => {
                  if (!dipLadderForm.is_active && nativeActivationBlocked) {
                    setWalletTrackerError(`Set a ${nativeStableSymbol} trade amount before activating the native ${formCoin.toUpperCase()} Dip Ladder`)
                    return
                  }
                  setDipLadderForm(prev => ({ ...prev, is_active: !prev.is_active }))
                }}
                disabled={dipLadderSaving}
                className={`w-14 h-7 rounded-full p-1 transition-all duration-300 flex-shrink-0 disabled:opacity-40 ${dipLadderForm.is_active ? 'bg-molten-gold' : nativeActivationBlocked ? 'bg-red-950 border border-red-400/40' : 'bg-gray-700'}`}
                title={nativeActivationBlocked ? `Set a ${nativeStableSymbol} trade amount before enabling native ${formCoin.toUpperCase()}` : undefined}
              >
                <motion.div
                  className="w-5 h-5 bg-white rounded-full flex items-center justify-center"
                  animate={{ x: dipLadderForm.is_active ? 28 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <Power size={11} className={dipLadderForm.is_active ? 'text-void-black' : 'text-gray-700'} />
                </motion.div>
              </button>
            </div>

            <div className="space-y-5">
              <div className={`rounded-lg border p-4 ${dipLadderForm.is_active ? 'border-molten-gold/30 bg-molten-gold/10' : 'border-white/10 bg-black/20'}`}>
                <p className="text-xs font-orbitron uppercase tracking-[0.22em] text-white/35 mb-2">Saved State</p>
                <p className={`text-xl font-orbitron font-bold ${dipLadderForm.is_active ? 'text-molten-gold' : 'text-white/45'}`}>
                  {dipLadderForm.is_active ? 'Enabled on Save' : 'Disabled on Save'}
                </p>
                <p className="mt-2 text-xs text-white/45 font-space-grotesk">Switch changes stay local until you press Save.</p>
              </div>

              {nativeActivationBlocked && (
                <div className="rounded-lg border border-yellow-400/25 bg-yellow-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-yellow-300" />
                    <p className="text-xs text-yellow-100/80 font-space-grotesk leading-relaxed">
                      Native {formCoin.toUpperCase()} ladders buy with {nativeStableSymbol}. Set a {nativeStableSymbol} trade amount on the profile overview before enabling this ladder.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label className="block text-sm font-orbitron text-molten-gold font-semibold">Token CA</label>
                  {selectedLadder && (
                    <button
                      type="button"
                      onClick={handleNewDipLadder}
                      className="text-xs text-white/45 hover:text-molten-gold font-orbitron transition-colors"
                    >
                      New Token
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={dipLadderForm.token_address}
                  onChange={(e) => {
                    setDipLadderSelectedId(null)
                    setDipLadderForm(prev => ({ ...prev, token_address: e.target.value }))
                  }}
                  placeholder={`Paste ${selectedCoin.toUpperCase()} token contract address`}
                  className="w-full bg-void-black/60 border border-molten-gold/20 rounded-lg px-3 py-3 text-white font-mono text-sm focus:border-molten-gold focus:outline-none transition-colors duration-300 break-all [overflow-wrap:anywhere]"
                />
              </div>

              <div>
                <p className="text-sm font-orbitron text-molten-gold font-semibold mb-2">Quick Select</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(['sol', 'bnb'] as const).map(coin => {
                    const option = DIP_LADDER_NATIVE_TOKENS[coin]
                    const selected = selectedCoin === coin && dipLadderForm.token_address.toLowerCase() === option.address.toLowerCase()
                    return (
                      <button
                        key={coin}
                        type="button"
                        onClick={() => handleSelectNativeDipLadder(coin)}
                        className={`min-w-0 rounded-lg border p-3 text-left transition-all ${selected ? 'border-molten-gold/50 bg-molten-gold/10' : 'border-white/10 bg-black/20 hover:border-molten-gold/30 hover:bg-molten-gold/5'}`}
                      >
                        <span className="block text-sm font-orbitron font-bold text-white">{option.name}</span>
                        <span className="mt-1 block text-[11px] text-white/35 font-mono break-all [overflow-wrap:anywhere]">{option.address}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-orbitron text-molten-gold font-semibold mb-2">Drop Step %</label>
                  <input
                    type="number"
                    value={dipLadderForm.dip_ladder_drop_percentage}
                    onChange={(e) => setDipLadderForm(prev => ({
                      ...prev,
                      dip_ladder_drop_percentage: parseFloat(e.target.value) || 0
                    }))}
                    className="w-full bg-void-black/60 border border-molten-gold/20 rounded-lg px-3 py-3 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                    min="0.1"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-orbitron text-molten-gold font-semibold mb-2">Profit Target %</label>
                  <input
                    type="number"
                    value={dipLadderForm.dip_ladder_profit_percentage}
                    onChange={(e) => setDipLadderForm(prev => ({
                      ...prev,
                      dip_ladder_profit_percentage: parseFloat(e.target.value) || 0
                    }))}
                    className="w-full bg-void-black/60 border border-molten-gold/20 rounded-lg px-3 py-3 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                    min="0.1"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-orbitron text-molten-gold font-semibold mb-2">Max Cycle Buys</label>
                  <input
                    type="number"
                    value={dipLadderForm.max_buy_count}
                    onChange={(e) => setDipLadderForm(prev => ({
                      ...prev,
                      max_buy_count: e.target.value
                    }))}
                    placeholder="No cap"
                    className="w-full bg-void-black/60 border border-molten-gold/20 rounded-lg px-3 py-3 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                    min="1"
                    step="1"
                  />
                  <p className="mt-1 text-[11px] text-white/35 font-space-grotesk">Counts every buy in this cycle, including lots already sold.</p>
                </div>
                <div>
                  <label className="block text-sm font-orbitron text-molten-gold font-semibold mb-2">Max Drawdown %</label>
                  <input
                    type="number"
                    value={dipLadderForm.max_drawdown_percentage}
                    onChange={(e) => setDipLadderForm(prev => ({
                      ...prev,
                      max_drawdown_percentage: e.target.value
                    }))}
                    placeholder="No cap"
                    className="w-full bg-void-black/60 border border-molten-gold/20 rounded-lg px-3 py-3 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                    min="0.1"
                    max="100"
                    step="0.1"
                  />
                  <p className="mt-1 text-[11px] text-white/35 font-space-grotesk">Stops new buys when price falls this far from the saved reference.</p>
                </div>
              </div>

              <div className="rounded-lg border border-blue-400/20 bg-blue-500/10 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-orbitron font-bold text-blue-200">Move Buy Trigger After Sells</p>
                      <span className="group/reference relative inline-flex">
                        <Info size={13} className="text-blue-200/70 cursor-help" />
                        <span className="absolute bottom-full left-1/2 z-[9999] mb-2 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-blue-300/30 bg-void-black/95 p-3 text-[11px] text-white/80 opacity-0 shadow-2xl transition-opacity duration-200 pointer-events-none group-hover/reference:opacity-100 font-space-grotesk">
                          When a lot sells, the next buy trigger moves to the sell/current price minus your drop step. This helps the ladder re-enter after a deep recovery. The saved reference price does not move.
                        </span>
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-blue-100/70 font-space-grotesk">Useful after a deep dip recovers and your old buy trigger is too far below market.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDipLadderForm(prev => ({ ...prev, update_buy_trigger_on_sell: !prev.update_buy_trigger_on_sell }))}
                    className={`w-12 h-6 rounded-full p-1 transition-all duration-300 flex-shrink-0 ${dipLadderForm.update_buy_trigger_on_sell ? 'bg-blue-300' : 'bg-gray-700'}`}
                  >
                    <motion.div
                      className="w-4 h-4 bg-white rounded-full"
                      animate={{ x: dipLadderForm.update_buy_trigger_on_sell ? 24 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-molten-gold/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3 text-sm font-space-grotesk mb-2">
                  <span className="text-white/45">Reference captured on save</span>
                  <span className="min-w-0 break-all [overflow-wrap:anywhere] text-white font-mono">{selectedLadder ? formatUsdPrice(selectedLadder.anchor_price_usd) : 'After save'}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm font-space-grotesk mb-2">
                  <span className="text-white/45">Current tracked price</span>
                  <span className="min-w-0 break-all [overflow-wrap:anywhere] text-white font-mono">{selectedLadder ? formatUsdPrice(selectedLadder.last_price_usd) : 'After save'}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm font-space-grotesk mb-2">
                  <span className="text-white/45">Next buy triggers at</span>
                  <span className="min-w-0 break-all [overflow-wrap:anywhere] text-blue-300 font-mono font-bold">{selectedLadder ? formatUsdPrice(selectedLadder.next_buy_price_usd) : `-${dipLadderForm.dip_ladder_drop_percentage}% from saved reference`}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm font-space-grotesk">
                  <span className="text-white/45">Each lot sells at</span>
                  <span className="text-green-400 font-orbitron font-bold">+{dipLadderForm.dip_ladder_profit_percentage}%</span>
                </div>
              </div>

              <div className="rounded-lg border border-blue-400/20 bg-blue-500/10 p-4 text-xs text-blue-100/80 font-space-grotesk">
                The reference price is captured when you save an enabled ladder. It sets the first buy trigger and stays fixed for drawdown limits. After a buy fills, the next trigger is recalculated from that filled buy price. If sell updates are enabled, a successful sell moves only the next buy trigger.
              </div>

              <motion.button
                onClick={handleSaveDipLadderSettings}
                disabled={dipLadderSaving || !dipLadderForm.token_address.trim()}
                className="w-full px-4 py-3 rounded-lg bg-molten-gold text-void-black font-orbitron font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {dipLadderSaving ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                Save Dip Ladder
              </motion.button>
            </div>
          </div>

          <div className="xl:col-span-5 p-4 md:p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-orbitron font-bold text-molten-gold">Current Selection</h2>
              <span className={`text-[10px] font-orbitron font-bold px-2 py-1 rounded-full border ${isNativeSelection ? 'text-molten-gold border-molten-gold/40 bg-molten-gold/10' : 'text-white/45 border-white/15 bg-white/5'}`}>
                {isNativeSelection ? nativeToken.label : selectedCoin.toUpperCase()}
              </span>
            </div>
            <div className="space-y-3">
              {!selectedLadder ? (
                <div className="rounded-lg border border-dashed border-molten-gold/20 p-8 text-center">
                  <Activity size={30} className="mx-auto mb-3 text-molten-gold/40" />
                  <p className="text-sm text-white/50 font-space-grotesk">Save this token to capture its first reference price.</p>
                </div>
              ) : [selectedLadder].map(ladder => {
                const openLots = ladder.lots?.filter(lot => isOpenDipLadderLot(lot.status)) || []
                const tokenSymbol = tokenShortSymbol(ladder.token_address, ladder)
                return (
                  <div key={ladder.id} className="rounded-lg border border-molten-gold/15 bg-black/25 p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="min-w-0 text-sm text-white font-orbitron font-bold truncate">{tokenDisplayName(ladder.token_address, ladder)}</p>
                          {tokenSymbol && (
                            <span className="flex-shrink-0 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/45 font-orbitron">
                              {tokenSymbol}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-2">
                          <p className="min-w-0 text-xs text-white/35 font-mono break-all [overflow-wrap:anywhere]">{ladder.token_address}</p>
                          {renderDipLadderTokenLinks(ladder)}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <span className={`text-[10px] font-orbitron font-bold px-2 py-1 rounded-full border ${ladderStatusClass(ladder.status)}`}>
                          {ladderStatusLabel(ladder.status)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleToggleDipLadderToken(ladder, e)}
                          disabled={dipLadderSaving}
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors disabled:opacity-40 ${ladder.status === 'active' ? 'border-molten-gold/25 bg-molten-gold/10 text-molten-gold hover:bg-molten-gold/20' : 'border-blue-400/25 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20'}`}
                          title={ladder.status === 'active' ? 'Disable this Dip Ladder token' : 'Enable this Dip Ladder token'}
                        >
                          <Power size={13} />
                        </button>
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
                    <div className="grid grid-cols-2 gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] text-white/35 font-orbitron uppercase mb-1">Buy Trigger</p>
                        <p className="min-w-0 break-all [overflow-wrap:anywhere] text-sm text-blue-300 font-mono font-bold leading-snug">{formatUsdPrice(ladder.next_buy_price_usd)}</p>
                        <p className="mt-1 text-[10px] text-white/30 font-space-grotesk">Current at or below trigger</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-white/35 font-orbitron uppercase mb-1">Current Price</p>
                        <p className="min-w-0 break-all [overflow-wrap:anywhere] text-sm text-white font-mono font-bold leading-snug">{formatUsdPrice(ladder.last_price_usd)}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-0 overflow-hidden rounded-lg border border-white/10 bg-black/20">
                      <div className="min-w-0 border-r border-white/10 p-2">
                        <p className="mb-1 text-[10px] text-white/35 font-orbitron uppercase">UPNL</p>
                        {renderPnlValue(ladder.total_unrealized_pnl_usd, null)}
                      </div>
                      <div className="min-w-0 border-r border-white/10 p-2">
                        <p className="mb-1 text-[10px] text-white/35 font-orbitron uppercase">Realized</p>
                        {renderPnlValue(ladder.total_realized_pnl_usd, null)}
                      </div>
                      <div className="min-w-0 p-2">
                        <p className="mb-1 text-[10px] text-white/35 font-orbitron uppercase">Net</p>
                        {renderPnlValue(ladder.total_pnl_usd, ladder.total_pnl_percentage)}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-0 overflow-hidden rounded-lg border border-white/10 bg-black/20">
                      <div className="min-w-0 border-r border-white/10 p-2">
                        <p className="mb-1 text-[10px] text-white/35 font-orbitron uppercase">Cycle Buys</p>
                        <p className="break-all [overflow-wrap:anywhere] text-sm text-white font-mono font-bold">
                          {ladder.cycle_buy_count || 0} / {formatOptionalCap(ladder.max_buy_count)}
                        </p>
                      </div>
                      <div className="min-w-0 p-2">
                        <p className="mb-1 text-[10px] text-white/35 font-orbitron uppercase">Drawdown</p>
                        <p className="break-all [overflow-wrap:anywhere] text-sm text-white font-mono font-bold">
                          {(ladder.cycle_drawdown_percentage ?? 0).toFixed(2)}% / {formatOptionalCap(ladder.max_drawdown_percentage, '%')}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-white/40 font-space-grotesk">{openLots.length} open lot{openLots.length === 1 ? '' : 's'}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-molten-gold/20 bg-gradient-to-br from-gray-900/50 to-black/80 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-orbitron font-bold text-molten-gold">Current Dip Ladder Actions</h2>
              <p className="text-sm text-white/45 font-space-grotesk mt-1">Statuses, reference prices, buy triggers, sell targets, and open lots across {selectedCoin.toUpperCase()}.</p>
            </div>
            <span className="text-xs text-white/40 font-space-grotesk">{dipLaddersLoading ? 'Refreshing...' : `${dipLadders.length} total`}</span>
          </div>

          {dipLadders.length === 0 ? (
            <div className="rounded-lg border border-dashed border-molten-gold/20 p-10 text-center">
              <Target size={36} className="mx-auto mb-3 text-molten-gold/40" />
              <p className="text-white/60 font-orbitron text-sm">No Dip Ladder actions yet</p>
              <p className="text-white/35 font-space-grotesk text-xs mt-2">Paste a token CA, choose the ladder settings, then save.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {dipLadders.map((ladder, index) => {
                const openLots = ladder.lots?.filter(lot => isOpenDipLadderLot(lot.status)) || []
                const closedLots = ladder.lots?.filter(lot => isClosedDipLadderLot(lot.status)) || []
                const displayLots = [...sortLotsByRecentActivity(openLots), ...sortLotsByRecentActivity(closedLots)]
                const tokenSymbol = tokenShortSymbol(ladder.token_address, ladder)
                const logsExpanded = Boolean(expandedMobileLogs[ladder.id])

                return (
                  <motion.div
                    key={ladder.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => handleSelectDipLadder(ladder)}
                    className={`group relative z-10 rounded-lg border bg-void-black/45 p-4 md:p-5 overflow-visible hover:z-[90] transition-colors cursor-pointer ${dipLadderSelectedId === ladder.id ? 'border-molten-gold/50' : 'border-molten-gold/15 hover:border-molten-gold/35'}`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="min-w-0 text-lg font-orbitron font-bold text-white truncate">{tokenDisplayName(ladder.token_address, ladder)}</p>
                          {tokenSymbol && (
                            <span className="flex-shrink-0 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/45 font-orbitron">
                              {tokenSymbol}
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              copyToClipboard(ladder.token_address, `dip-page-${ladder.id}`)
                            }}
                            className="text-molten-gold/60 hover:text-molten-gold transition-colors"
                            title={copiedKey === `dip-page-${ladder.id}` ? 'Copied' : 'Copy token address'}
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                        <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-2">
                          <p className="min-w-0 text-xs text-white/40 font-mono break-all [overflow-wrap:anywhere]">{ladder.token_address}</p>
                          {renderDipLadderTokenLinks(ladder)}
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <span className={`text-[10px] font-orbitron font-bold px-2 py-1 rounded-full border ${ladderStatusClass(ladder.status)}`}>
                          {ladderStatusLabel(ladder.status)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleToggleDipLadderToken(ladder, e)}
                          disabled={dipLadderSaving}
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors disabled:opacity-40 ${ladder.status === 'active' ? 'border-molten-gold/25 bg-molten-gold/10 text-molten-gold hover:bg-molten-gold/20' : 'border-blue-400/25 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20'}`}
                          title={ladder.status === 'active' ? 'Disable this Dip Ladder token' : 'Enable this Dip Ladder token'}
                        >
                          <Power size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="mb-3 rounded-lg border border-molten-gold/15 bg-molten-gold/5 px-3 py-2 text-[11px] text-white/55 font-space-grotesk">
                      <span className="text-molten-gold/80 font-orbitron font-bold uppercase">Reference</span> is captured when the ladder is saved enabled. It stays fixed for drawdown limits. Buy triggers move after buys, and after sells when that option is enabled.
                    </div>

                    <div className="relative z-10 grid grid-cols-2 md:grid-cols-6 gap-0 rounded-lg overflow-visible border border-white/10 mb-4">
                      <div className="min-w-0 p-3 border-r border-b md:border-b-0 border-white/10">
                        <div className="flex items-center gap-1.5 mb-1">
                          <p className="text-[10px] text-white/35 font-orbitron uppercase">Cycle Ref</p>
                          <span className="group/reference relative z-[120] inline-flex">
                            <Info size={11} className="text-molten-gold/70 cursor-help" />
                            <span className="absolute bottom-full left-0 z-[9999] mb-2 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-molten-gold/30 bg-void-black/95 p-3 text-[10px] text-white/80 opacity-0 shadow-2xl transition-opacity duration-200 pointer-events-none group-hover/reference:opacity-100 md:left-1/2 md:-translate-x-1/2 font-space-grotesk normal-case">
                              Cycle starting price. It seeds the first buy trigger only. After each buy and/or sell, the next trigger is calculated from that price.
                            </span>
                          </span>
                        </div>
                        <p className="min-w-0 break-all [overflow-wrap:anywhere] text-xs text-white font-mono font-bold leading-snug">{formatUsdPrice(ladder.anchor_price_usd)}</p>
                      </div>
                      <div className="min-w-0 p-3 md:border-r border-b md:border-b-0 border-white/10">
                        <p className="text-[10px] text-white/35 font-orbitron uppercase mb-1">Buy Trigger</p>
                        <p className="min-w-0 break-all [overflow-wrap:anywhere] text-xs text-blue-300 font-mono font-bold leading-snug">{formatUsdPrice(ladder.next_buy_price_usd)}</p>
                        <p className="mt-1 text-[10px] text-white/35 font-space-grotesk">Current at or below trigger</p>
                      </div>
                      <div className="min-w-0 p-3 border-r border-b md:border-b-0 border-white/10">
                        <p className="text-[10px] text-white/35 font-orbitron uppercase mb-1">Current</p>
                        <p className="min-w-0 break-all [overflow-wrap:anywhere] text-xs text-white font-mono font-bold leading-snug">{formatUsdPrice(ladder.last_price_usd)}</p>
                      </div>
                      <div className="p-3 border-r border-white/10">
                        <p className="text-[10px] text-white/35 font-orbitron uppercase mb-1">Drop</p>
                        <p className="text-xs text-molten-gold font-orbitron font-bold">{ladder.drop_percentage}%</p>
                      </div>
                      <div className="p-3 border-r border-white/10">
                        <p className="text-[10px] text-white/35 font-orbitron uppercase mb-1">Target</p>
                        <p className="text-xs text-green-400 font-orbitron font-bold">{ladder.profit_percentage}%</p>
                      </div>
                      <div className="min-w-0 p-3">
                        <p className="text-[10px] text-white/35 font-orbitron uppercase mb-1">Cycle Buys</p>
                        <p className="min-w-0 break-all [overflow-wrap:anywhere] text-xs text-white font-mono font-bold leading-snug">{ladder.cycle_buy_count || 0} / {formatOptionalCap(ladder.max_buy_count)}</p>
                        <p className="mt-1 text-[10px] text-white/35 font-space-grotesk">{(ladder.cycle_drawdown_percentage ?? 0).toFixed(2)}% / {formatOptionalCap(ladder.max_drawdown_percentage, '%')} drawdown</p>
                      </div>
                    </div>

                    <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-0 overflow-hidden rounded-lg border border-white/10 bg-black/20">
                      <div className="min-w-0 border-b sm:border-b-0 sm:border-r border-white/10 p-3">
                        <p className="mb-1 text-[10px] text-white/35 font-orbitron uppercase">UPNL</p>
                        {renderPnlValue(ladder.total_unrealized_pnl_usd, null, 'md')}
                      </div>
                      <div className="min-w-0 border-b sm:border-b-0 sm:border-r border-white/10 p-3">
                        <p className="mb-1 text-[10px] text-white/35 font-orbitron uppercase">Realized</p>
                        {renderPnlValue(ladder.total_realized_pnl_usd, null, 'md')}
                      </div>
                      <div className="min-w-0 p-3">
                        <p className="mb-1 text-[10px] text-white/35 font-orbitron uppercase">Net PNL</p>
                        {renderPnlValue(ladder.total_pnl_usd, ladder.total_pnl_percentage, 'md')}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-orbitron text-molten-gold/80 uppercase tracking-[0.18em]">Lots</p>
                          <p className="text-[11px] text-white/40 font-space-grotesk">{openLots.length} open, {closedLots.length} closed</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setExpandedMobileLogs(prev => ({ ...prev, [ladder.id]: !prev[ladder.id] }))
                          }}
                          className="md:hidden inline-flex items-center gap-2 rounded-md border border-molten-gold/20 bg-molten-gold/10 px-3 py-2 text-[10px] font-orbitron font-bold text-molten-gold"
                        >
                          {logsExpanded ? 'Hide Swaps' : `Show Swaps (${displayLots.length})`}
                          {logsExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      </div>
                      <div className={`${logsExpanded ? 'block' : 'hidden'} md:block`}>
                        {displayLots.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-white/10 p-3 text-sm text-white/35 font-space-grotesk">
                            Waiting for the next configured drop.
                          </div>
                        ) : (
                          <div className="max-h-[22rem] md:max-h-none overflow-y-auto md:overflow-visible space-y-2 pr-1 md:pr-0 custom-scrollbar">
                            {displayLots.map(lot => {
                              const isClosedLot = isClosedDipLadderLot(lot.status)
                              const lotInCooldown = isDipLadderLotRetryCoolingDown(lot)
                              const showSellIssue = !isClosedLot && (lot.status === 'sell_blocked' || lotInCooldown || Boolean(lot.last_error))
                              const canRetryLotSell = ladder.status === 'active' || ladder.status === 'stopped_depth_limit'
                              const lotPnl = lot.pnl
                              const pnlValue = isClosedLot ? lotPnl?.final_pnl_usd ?? lotPnl?.realized_pnl_usd : lotPnl?.unrealized_pnl_usd
                              const pnlPercent = isClosedLot ? lotPnl?.final_pnl_percentage ?? lotPnl?.realized_pnl_percentage : lotPnl?.unrealized_pnl_percentage
                              return (
                                <div key={lot.id} className="rounded-lg bg-black/25 border border-white/10 p-3">
                                  <div className="mb-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="min-w-0 text-xs text-white font-orbitron font-bold truncate">{tokenDisplayName(ladder.token_address, ladder)}</p>
                                        {tokenSymbol && (
                                          <span className="flex-shrink-0 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/45 font-orbitron">
                                            {tokenSymbol}
                                          </span>
                                        )}
                                        <span className={`flex-shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-orbitron ${dipLadderLotStatusClass(lot, isClosedLot)}`}>
                                          {dipLadderLotStatusLabel(lot, isClosedLot)}
                                        </span>
                                        {showSellIssue && (
                                          <span className="group/lot-error relative z-[80] inline-flex flex-shrink-0">
                                            <AlertCircle size={13} className={lot.status === 'sell_blocked' ? 'text-red-300 cursor-help' : 'text-yellow-300 cursor-help'} />
                                            <span className="pointer-events-none absolute bottom-full left-1/2 z-[9999] mb-2 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-red-400/30 bg-void-black/95 p-3 text-[11px] text-white/80 opacity-0 shadow-2xl transition-opacity duration-200 group-hover/lot-error:opacity-100 font-space-grotesk normal-case">
                                              {lot.last_error || (lotInCooldown ? 'Sell retry is cooling down before the next automatic attempt.' : 'Sell needs attention.')}
                                            </span>
                                          </span>
                                        )}
                                        {lotPnl?.basis_source === 'estimated' && (
                                          <span className="flex-shrink-0 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40 font-orbitron">
                                            EST
                                          </span>
                                        )}
                                      </div>
                                      <p className="mt-1 min-w-0 break-all [overflow-wrap:anywhere] text-[11px] text-white/35 font-mono leading-snug">{ladder.token_address}</p>
                                    </div>
                                    {renderDipLadderTokenLinks(ladder)}
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                    <div className="min-w-0">
                                      <p className="text-[10px] text-white/35 font-orbitron uppercase mb-1">Entry</p>
                                      <p className="min-w-0 break-all [overflow-wrap:anywhere] text-sm text-white font-mono leading-snug">{formatUsdPrice(lot.entry_price_usd)}</p>
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[10px] text-white/35 font-orbitron uppercase mb-1">Sell Target</p>
                                      <p className="min-w-0 break-all [overflow-wrap:anywhere] text-sm text-green-400 font-mono leading-snug">{formatUsdPrice(lot.target_price_usd)}</p>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-white/35 font-orbitron uppercase mb-1">Remaining</p>
                                      <p className="text-sm text-molten-gold font-mono">{lot.remaining_amount_tokens.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[10px] text-white/35 font-orbitron uppercase mb-1">{isClosedLot ? 'Final PNL' : 'UPNL'}</p>
                                      {renderPnlValue(pnlValue, pnlPercent)}
                                    </div>
                                  </div>
                                  {showSellIssue && (
                                    <div className={`mt-3 rounded-lg border p-3 ${lot.status === 'sell_blocked' ? 'border-red-400/25 bg-red-500/10' : 'border-yellow-400/25 bg-yellow-500/10'}`}>
                                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                        <div className="min-w-0">
                                          <p className={`text-[11px] font-orbitron font-bold uppercase ${lot.status === 'sell_blocked' ? 'text-red-300' : 'text-yellow-300'}`}>
                                            {lot.status === 'sell_blocked' ? 'Sell blocked' : 'Sell retry cooling down'}
                                          </p>
                                          <p className="mt-1 text-[11px] text-white/50 font-space-grotesk">
                                            Failures: {lot.sell_failure_count || 0} / 3{lot.sell_retry_after ? ` | next auto retry ${formatDate(lot.sell_retry_after, true)}` : ''}
                                          </p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={(e) => handleRetryDipLadderLotSell(lot.id, e)}
                                          disabled={dipLadderRetryingLotId === lot.id || !canRetryLotSell}
                                          title={canRetryLotSell ? 'Retry this lot sell' : 'Enable this Dip Ladder before retrying sells'}
                                          className="inline-flex h-8 flex-shrink-0 items-center justify-center gap-2 rounded-md border border-molten-gold/25 bg-molten-gold/10 px-3 text-[10px] font-orbitron font-bold text-molten-gold transition-colors hover:bg-molten-gold/20 disabled:opacity-50"
                                        >
                                          <RefreshCw size={12} className={dipLadderRetryingLotId === lot.id ? 'animate-spin' : ''} />
                                          {canRetryLotSell ? 'Retry Sell' : 'Enable Ladder'}
                                        </button>
                                      </div>
                                      {lot.last_error && (
                                        <p className="mt-2 break-words text-[11px] text-white/65 font-space-grotesk [overflow-wrap:anywhere]">{lot.last_error}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
