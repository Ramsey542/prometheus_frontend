'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/DashboardLayout'
import { RefreshCw, ExternalLink, XCircle, CheckCircle, Settings, Trash2, Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { useAppSelector } from '../../store/hooks'
import { walletTrackerApi } from '../../services/walletTrackerApi'

interface TokenBalance {
  token_address: string
  token_name?: string
  token_symbol?: string
  balance: string
  balance_usd?: number
  price?: number
  decimals?: number
  logo_uri?: string
}

interface TrackedPositionInfo {
  tp_sl_active: boolean
  buy_price: number
  remaining_amount: number
  targets: Array<{
    type: string
    percentage: number
    sell_percentage: number
    target_price: number
  }>
  decimals_adjusted: boolean
  mirror_address: string | null
}

export default function CustomBuysPage() {
  const { selectedCoin } = useAppSelector((s) => s.auth)
  const [tokens, setTokens] = useState<TokenBalance[]>([])
  const [filteredTokens, setFilteredTokens] = useState<TokenBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hideLowBalances, setHideLowBalances] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalBalance, setTotalBalance] = useState(0)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())
  const [sellModal, setSellModal] = useState<{ token: TokenBalance | null; open: boolean }>({ token: null, open: false })
  const [sellAmount, setSellAmount] = useState('')
  const [slippage, setSlippage] = useState('')
  const [selling, setSelling] = useState(false)
  const [sellSuccess, setSellSuccess] = useState<string | null>(null)
  const [sellError, setSellError] = useState<string | null>(null)
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [trackedPositions, setTrackedPositions] = useState<Record<string, TrackedPositionInfo>>({})
  const [tpSlModal, setTpSlModal] = useState<{ open: boolean; token: TokenBalance | null; mirrorAddress: string | null }>({ open: false, token: null, mirrorAddress: null })
  const [tpSlSettings, setTpSlSettings] = useState<any>(null)
  const [savingTpSl, setSavingTpSl] = useState(false)
  const [tpSlSuccess, setTpSlSuccess] = useState<string | null>(null)
  const [tpSlError, setTpSlError] = useState<string | null>(null)
  const [tpValidationErrors, setTpValidationErrors] = useState<string | null>(null)
  const [slValidationErrors, setSlValidationErrors] = useState<string | null>(null)
  const [tpSlIsActive, setTpSlIsActive] = useState(false)
  const [availableSounds, setAvailableSounds] = useState<string[]>([])
  const [playingSound, setPlayingSound] = useState<string | null>(null)

  const tokensPerPage = 20

  const fetchTokenBalances = async () => {
    try {
      setRefreshing(true)
      setError(null)
      setLoading(true)
      const offset = (currentPage - 1) * tokensPerPage

      const [tokenResponse, positionsResponse] = await Promise.all([
        walletTrackerApi.getTokenBalances(selectedCoin, offset, tokensPerPage),
        walletTrackerApi.getTrackedPositions(selectedCoin)
      ])

      let tokenList: TokenBalance[] = []

      if (tokenResponse.token_balances && Array.isArray(tokenResponse.token_balances)) {
        tokenList = tokenResponse.token_balances
      } else if (Array.isArray(tokenResponse)) {
        tokenList = tokenResponse
      } else if (tokenResponse.tokens && Array.isArray(tokenResponse.tokens)) {
        tokenList = tokenResponse.tokens
      } else if (tokenResponse.data && Array.isArray(tokenResponse.data)) {
        tokenList = tokenResponse.data
      }

      setTokens(tokenList)
      setTrackedPositions(positionsResponse || {})
      if (typeof tokenResponse?.total_count === 'number') {
        setTotalCount(tokenResponse.total_count)
      } else {
        setTotalCount(tokenList.length)
      }
    } catch (err: any) {
      console.error('Error fetching token balances:', err)
      setError(err.message || 'Failed to fetch token balances')
      setTokens([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchTokenBalances()
    fetchAvailableSounds()
  }, [selectedCoin, currentPage])

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
    let filtered = tokens

    if (hideLowBalances) {
      filtered = tokens.filter(token => {
        if (token.balance_usd) {
          return token.balance_usd >= 0.1
        }
        const balance = parseFloat(token.balance || '0')
        const price = token.price || 0
        return (balance * price) >= 0.1
      })
    }

    const sorted = filtered.sort((a, b) => {
      const balanceA = parseFloat(a.balance || '0')
      const balanceB = parseFloat(b.balance || '0')
      return balanceB - balanceA
    })

    const total = sorted.reduce((sum, token) => {
      if (token.balance_usd) {
        return sum + token.balance_usd
      }
      const balance = parseFloat(token.balance || '0')
      const price = token.price || 0
      return sum + (balance * price)
    }, 0)
    setTotalBalance(total)

    setFilteredTokens(sorted)
  }, [tokens, hideLowBalances, currentPage])

  const handleSell = async () => {
    if (!sellModal.token || !sellAmount || !slippage) {
      setSellError('All fields are required')
      return
    }
    const slippageNum = parseFloat(slippage)
    if (isNaN(slippageNum) || slippageNum < 1 || slippageNum > 100) {
      setSellError('Slippage must be between 1 and 100 percent')
      return
    }
    try {
      setSelling(true)
      setSellError(null)
      setSellSuccess(null)
      setTransactionSignature(null)
      const res = await walletTrackerApi.customSell(
        selectedCoin,
        sellModal.token.token_address,
        parseFloat(sellAmount),
        slippageNum
      )
      setSellSuccess(res?.message || 'Sell order submitted')
      if (res?.transaction_signature) {
        setTransactionSignature(res.transaction_signature)
      }
    } catch (err: any) {
      setSellError(err.message || 'Sell failed')
    } finally {
      setSelling(false)
    }
  }

  const getExplorerUrl = (signature: string) => {
    if (selectedCoin === 'sol') {
      return `https://solscan.io/tx/${signature}`
    } else {
      return `https://bscscan.com/tx/${signature}`
    }
  }

  const handlePercentageSelect = (percentage: number) => {
    if (!sellModal.token) return
    const balance = parseFloat(sellModal.token.balance || '0')
    const amount = (balance * percentage / 100).toFixed(6)
    setSellAmount(amount)
  }

  const fetchTpSlSettings = async (mirrorAddress: string) => {
    try {
      setLoading(true)
      const settings = await walletTrackerApi.getTrackedWalletSettings(mirrorAddress, selectedCoin)
      setTpSlSettings({
        ...settings,
        take_profit_levels: settings.take_profit_levels && settings.take_profit_levels.length > 0
          ? settings.take_profit_levels
          : [{ profit_percentage: 0, sell_percentage: 0 }],
        stop_loss_levels: settings.stop_loss_levels && settings.stop_loss_levels.length > 0
          ? settings.stop_loss_levels
          : [{ loss_percentage: 0, sell_percentage: 0 }],
        swap_notifications_enabled: settings.swap_notifications_enabled ?? true,
        swap_notification_sound: settings.swap_notification_sound ?? 'success.mp3'
      })
      setTpSlIsActive(settings.tp_sl_is_active !== undefined ? settings.tp_sl_is_active : true)
    } catch (err: any) {
      console.error('Failed to fetch TP/SL settings:', err)
      setTpSlError(err.message || 'Failed to fetch settings')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTpSl = async () => {
    if (!tpSlModal.mirrorAddress || !tpSlSettings) return

    if (tpValidationErrors || slValidationErrors) {
      setTpSlError('Please fix validation errors before saving')
      return
    }

    try {
      setSavingTpSl(true)
      setTpSlError(null)
      setTpSlSuccess(null)

      const normalized = {
        ...tpSlSettings,
        take_profit_levels: tpSlSettings.take_profit_levels.filter((l: any) => l.profit_percentage > 0 && l.sell_percentage > 0),
        stop_loss_levels: tpSlSettings.stop_loss_levels.filter((l: any) => l.loss_percentage > 0 && l.sell_percentage > 0),
        tp_sl_is_active: tpSlIsActive,
        swap_notifications_enabled: tpSlSettings.swap_notifications_enabled,
        swap_notification_sound: tpSlSettings.swap_notification_sound
      }

      await walletTrackerApi.updateTrackedWalletSettings(tpSlModal.mirrorAddress, normalized, selectedCoin)
      setTpSlSuccess('TP/SL settings updated successfully')
      setTimeout(() => {
        setTpSlModal({ open: false, token: null, mirrorAddress: null })
        setTpSlSuccess(null)
        fetchTokenBalances()
      }, 2000)
    } catch (err: any) {
      setTpSlError(err.message || 'Failed to update settings')
    } finally {
      setSavingTpSl(false)
    }
  }

  const calculateTotalSellPercentage = (levels: any[]): number => {
    return levels.reduce((sum, level) => sum + (level.sell_percentage || 0), 0)
  }

  const handleEditTpSl = (token: TokenBalance) => {
    const position = trackedPositions[token.token_address.toLowerCase()]
    if (position && position.mirror_address) {
      setTpSlModal({ open: true, token, mirrorAddress: position.mirror_address })
      fetchTpSlSettings(position.mirror_address)
    }
  }

  const addTakeProfitLevel = () => {
    setTpSlSettings((prev: any) => ({
      ...prev,
      take_profit_levels: [...prev.take_profit_levels, { profit_percentage: 0, sell_percentage: 0 }]
    }))
  }

  const removeTakeProfitLevel = (index: number) => {
    setTpSlSettings((prev: any) => ({
      ...prev,
      take_profit_levels: prev.take_profit_levels.filter((_: any, i: number) => i !== index)
    }))
  }

  const updateTakeProfitLevel = (index: number, field: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value) || 0
    const updated = [...tpSlSettings.take_profit_levels]
    updated[index] = { ...updated[index], [field]: numValue }

    setTpSlSettings((prev: any) => ({ ...prev, take_profit_levels: updated }))

    const total = calculateTotalSellPercentage(updated)
    if (total > 100) {
      setTpValidationErrors('Total sell percentage cannot exceed 100%')
    } else if (total > 0 && total < 100) {
      setTpValidationErrors('Total sell percentage must be 100% if targets exist')
    } else {
      setTpValidationErrors(null)
    }
  }

  const addStopLossLevel = () => {
    setTpSlSettings((prev: any) => ({
      ...prev,
      stop_loss_levels: [...prev.stop_loss_levels, { loss_percentage: 0, sell_percentage: 0 }]
    }))
  }

  const removeStopLossLevel = (index: number) => {
    setTpSlSettings((prev: any) => ({
      ...prev,
      stop_loss_levels: prev.stop_loss_levels.filter((_: any, i: number) => i !== index)
    }))
  }

  const updateStopLossLevel = (index: number, field: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value) || 0
    const updated = [...tpSlSettings.stop_loss_levels]
    updated[index] = { ...updated[index], [field]: numValue }

    setTpSlSettings((prev: any) => ({ ...prev, stop_loss_levels: updated }))

    const total = calculateTotalSellPercentage(updated)
    if (total > 100) {
      setSlValidationErrors('Total sell percentage cannot exceed 100%')
    } else if (total > 0 && total < 100) {
      setSlValidationErrors('Total sell percentage must be 100% if targets exist')
    } else {
      setSlValidationErrors(null)
    }
  }

  const getDexScreenerUrl = (tokenAddress: string) => {
    if (selectedCoin === 'sol') {
      return `https://dexscreener.com/solana/${tokenAddress}`
    } else {
      return `https://dexscreener.com/bsc/${tokenAddress}`
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / tokensPerPage))

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        <div className="bg-gradient-to-r from-void-black/95 to-black/90 backdrop-blur-md border border-molten-gold/30 rounded-lg p-4 md:p-6 shadow-2xl shadow-molten-gold/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div>
              <h1 className="text-xl md:text-3xl font-orbitron font-bold text-molten-gold mb-2">
                Held Tokens
              </h1>
              <p className="text-sm text-white/60 font-space-grotesk">
                Total Balance: <span className="text-molten-gold font-bold">${totalBalance.toFixed(4)} USD</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideLowBalances}
                  onChange={(e) => {
                    setHideLowBalances(e.target.checked)
                    setCurrentPage(1)
                  }}
                  className="w-4 h-4 rounded border-molten-gold/30 bg-void-black/50 text-molten-gold focus:ring-molten-gold"
                />
                <span className="text-sm text-white/80 font-space-grotesk">Hide &lt; $0.1 USD</span>
              </label>
              <motion.button
                onClick={fetchTokenBalances}
                disabled={refreshing || loading}
                className="flex items-center gap-2 px-4 py-2 bg-molten-gold/10 border border-molten-gold/30 text-molten-gold rounded-lg hover:bg-molten-gold/20 transition-colors duration-300 disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                Refresh
              </motion.button>
            </div>
          </div>

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

          {loading ? (
            <div className="text-center py-12">
              <RefreshCw size={32} className="animate-spin text-molten-gold mx-auto mb-4" />
              <p className="text-white/60 font-space-grotesk">Loading tokens...</p>
            </div>
          ) : filteredTokens.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60 font-space-grotesk">No tokens found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-molten-gold/20">
                      <th className="text-left py-3 px-4 text-sm font-orbitron font-semibold text-molten-gold uppercase">Token</th>
                      <th className="text-left py-3 px-4 text-sm font-orbitron font-semibold text-molten-gold uppercase">Contract Address</th>
                      <th className="text-right py-3 px-4 text-sm font-orbitron font-semibold text-molten-gold uppercase">Balance</th>
                      <th className="text-right py-3 px-4 text-sm font-orbitron font-semibold text-molten-gold uppercase">Price</th>
                      <th className="text-right py-3 px-4 text-sm font-orbitron font-semibold text-molten-gold uppercase">Balance USD</th>
                      <th className="text-center py-3 px-4 text-sm font-orbitron font-semibold text-molten-gold uppercase">TP/SL</th>
                      <th className="text-center py-3 px-4 text-sm font-orbitron font-semibold text-molten-gold uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTokens.map((token, index) => (
                      <motion.tr
                        key={token.token_address}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-molten-gold/10 hover:bg-molten-gold/5 transition-colors duration-200"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            {token.logo_uri && !failedImages.has(token.logo_uri) ? (
                              <img
                                src={token.logo_uri}
                                alt={token.token_symbol || 'Token'}
                                className="w-8 h-8 rounded-full object-cover"
                                onError={() => {
                                  setFailedImages(prev => new Set(prev).add(token.logo_uri!))
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-molten-gold/20 flex items-center justify-center">
                                <span className="text-xs font-orbitron font-bold text-molten-gold">
                                  {token.token_symbol?.charAt(0) || '?'}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-orbitron font-semibold text-white">
                                {token.token_name || token.token_symbol || 'Unknown Token'}
                              </p>
                              {token.token_symbol && (
                                <p className="text-xs text-white/60 font-space-grotesk">{token.token_symbol}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 max-w-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <code className="text-xs text-white/80 font-mono bg-void-black/50 px-2 py-1 rounded break-all">
                              {token.token_address.slice(0, 6)}...{token.token_address.slice(-4)}
                            </code>
                            <button
                              onClick={() => navigator.clipboard.writeText(token.token_address)}
                              className="text-molten-gold/60 hover:text-molten-gold transition-colors flex-shrink-0"
                              title="Copy address"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <p className="text-sm font-orbitron font-semibold text-white">
                            {parseFloat(token.balance || '0').toFixed(4)}
                          </p>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {token.price ? (
                            <p className="text-sm font-space-grotesk text-white/80">
                              ${token.price.toFixed(6)}
                            </p>
                          ) : (
                            <p className="text-sm font-space-grotesk text-white/40">-</p>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {(() => {
                            const usdValue = Number.isFinite(Number(token.balance_usd))
                              ? Number(token.balance_usd)
                              : parseFloat(token.balance || '0') * ((typeof token.price === 'number' ? token.price : parseFloat(String(token.price || 0))) || 0)
                            return Number.isFinite(usdValue) && usdValue > 0
                              ? (
                                <p className="text-sm font-orbitron font-semibold text-white">
                                  ${usdValue.toFixed(4)}
                                </p>
                              ) : (
                                <p className="text-sm font-space-grotesk text-white/40">-</p>
                              )
                          })()}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {(() => {
                            const positionInfo = trackedPositions[token.token_address.toLowerCase()]
                            if (!positionInfo) {
                              return <span className="text-xs text-white/40 font-space-grotesk">-</span>
                            }
                            const tpTargets = positionInfo.targets.filter(t => t.type === 'tp')
                            const slTargets = positionInfo.targets.filter(t => t.type === 'sl')
                            return (
                              <div className="relative group inline-block">
                                <span className={`text-xs font-orbitron font-semibold px-2 py-1 rounded cursor-help ${positionInfo.tp_sl_active ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-gray-500/20 text-gray-400 border border-gray-500/40'}`}>
                                  {positionInfo.tp_sl_active ? 'Active' : 'Inactive'}
                                </span>
                                <div className="absolute z-50 hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-void-black/95 border border-molten-gold/40 rounded-lg shadow-xl">
                                  <div className="text-xs font-space-grotesk space-y-2">
                                    <div className="flex justify-between border-b border-molten-gold/20 pb-2">
                                      <span className="text-white/60">Buy Price:</span>
                                      <span className="text-molten-gold font-semibold">${positionInfo.buy_price < 0.0001 ? positionInfo.buy_price.toExponential(4) : positionInfo.buy_price.toFixed(8)}</span>
                                    </div>
                                    {tpTargets.length > 0 && (
                                      <div className="space-y-1">
                                        <span className="text-green-400 font-semibold">Take Profit:</span>
                                        {tpTargets.map((tp, i) => (
                                          <div key={i} className="flex justify-between text-white/80 pl-2">
                                            <span>+{tp.percentage}% → sell {tp.sell_percentage}%</span>
                                            <span className="text-green-300">${tp.target_price < 0.0001 ? tp.target_price.toExponential(4) : tp.target_price.toFixed(8)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {slTargets.length > 0 && (
                                      <div className="space-y-1">
                                        <span className="text-red-400 font-semibold">Stop Loss:</span>
                                        {slTargets.map((sl, i) => (
                                          <div key={i} className="flex justify-between text-white/80 pl-2">
                                            <span>-{sl.percentage}% → sell {sl.sell_percentage}%</span>
                                            <span className="text-red-300">${sl.target_price < 0.0001 ? sl.target_price.toExponential(4) : sl.target_price.toFixed(8)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {tpTargets.length === 0 && slTargets.length === 0 && (
                                      <span className="text-white/40">No targets configured</span>
                                    )}
                                  </div>
                                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-8 border-transparent border-t-molten-gold/40"></div>
                                </div>
                              </div>
                            )
                          })()}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <motion.button
                              onClick={() => setSellModal({ token, open: true })}
                              className="px-3 py-1.5 bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-orbitron font-semibold rounded hover:bg-red-500/30 transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Sell
                            </motion.button>
                            <motion.button
                              onClick={() => handleEditTpSl(token)}
                              disabled={!trackedPositions[token.token_address.toLowerCase()]?.mirror_address}
                              className="px-3 py-1.5 bg-molten-gold/10 border border-molten-gold/30 text-molten-gold text-xs font-orbitron font-semibold rounded hover:bg-molten-gold/20 transition-colors flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              title={!trackedPositions[token.token_address.toLowerCase()]?.mirror_address ? "No mirrored position found" : "Edit TP/SL"}
                            >
                              <Settings size={12} />
                              Edit TP/SL
                            </motion.button>
                            <motion.a
                              href={getDexScreenerUrl(token.token_address)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-orbitron font-semibold rounded hover:bg-indigo-500/30 transition-colors flex items-center gap-1"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <ExternalLink size={12} />
                              DexScreener
                            </motion.a>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <motion.button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-molten-gold/10 border border-molten-gold/30 text-molten-gold rounded-lg hover:bg-molten-gold/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Previous
                  </motion.button>
                  <span className="text-sm text-white/60 font-space-grotesk px-4">
                    Page {currentPage} of {totalPages}
                  </span>
                  <motion.button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-molten-gold/10 border border-molten-gold/30 text-molten-gold rounded-lg hover:bg-molten-gold/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Next
                  </motion.button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {sellModal.open && sellModal.token && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-void-black/95 to-black/90 backdrop-blur-md border border-molten-gold/30 rounded-lg p-6 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-xl font-orbitron font-bold text-molten-gold mb-4">
              Sell {sellModal.token.token_symbol || 'Token'}
            </h2>

            {sellError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg mb-4"
              >
                <div className="flex items-center gap-2 text-red-400">
                  <XCircle size={16} />
                  <span className="text-sm font-orbitron font-bold">{sellError}</span>
                </div>
              </motion.div>
            )}

            {sellSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg mb-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle size={16} />
                    <span className="text-sm font-orbitron font-bold">{sellSuccess}</span>
                  </div>
                  {transactionSignature && (
                    <a
                      href={getExplorerUrl(transactionSignature)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-green-300 hover:text-green-200 transition-colors text-sm font-space-grotesk underline"
                    >
                      <ExternalLink size={14} />
                      View transaction on {selectedCoin === 'sol' ? 'Solscan' : 'BscScan'}
                    </a>
                  )}
                </div>
              </motion.div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-orbitron font-semibold text-white mb-2">
                  Sell Amount
                </label>
                <input
                  type="number"
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                  className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none"
                  placeholder="0.00"
                  min="0"
                  step="0.0001"
                  disabled={selling}
                />
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-white/60 font-space-grotesk">Quick fill:</span>
                  <div className="flex gap-2">
                    {[25, 50, 100].map((percentage) => (
                      <motion.button
                        key={percentage}
                        type="button"
                        onClick={() => handlePercentageSelect(percentage)}
                        disabled={selling || !sellModal.token}
                        className="px-3 py-1 text-xs font-orbitron font-semibold bg-molten-gold/10 border border-molten-gold/30 text-molten-gold rounded hover:bg-molten-gold/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {percentage}%
                      </motion.button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-white/60 mt-1">
                  Balance: {parseFloat(sellModal.token.balance || '0').toFixed(4)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-orbitron font-semibold text-white mb-2">
                  Slippage (%)
                </label>
                <input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none"
                  placeholder="1.0"
                  min="1"
                  max="100"
                  step="0.1"
                  disabled={selling}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <motion.button
                  onClick={() => {
                    setSellModal({ token: null, open: false })
                    setSellAmount('')
                    setSlippage('')
                    setSellError(null)
                    setSellSuccess(null)
                    setTransactionSignature(null)
                  }}
                  disabled={selling}
                  className="flex-1 px-4 py-2 bg-void-black/50 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleSell}
                  disabled={selling || !sellAmount || !slippage}
                  className="flex-1 px-4 py-2 bg-red-500/20 border border-red-500/40 text-red-300 font-orbitron font-bold rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {selling ? 'Processing...' : 'Sell'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {tpSlModal.open && tpSlModal.token && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-void-black/95 to-black/90 backdrop-blur-md border border-molten-gold/30 rounded-lg p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-orbitron font-bold text-molten-gold">
                TP/SL Settings: {tpSlModal.token.token_symbol || 'Token'}
              </h2>
              <button
                onClick={() => setTpSlModal({ open: false, token: null, mirrorAddress: null })}
                className="text-white/60 hover:text-white transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            {tpSlError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg mb-4"
              >
                <div className="flex items-center gap-2 text-red-400">
                  <XCircle size={16} />
                  <span className="text-sm font-orbitron font-bold">{tpSlError}</span>
                </div>
              </motion.div>
            )}

            {tpSlSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg mb-4"
              >
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle size={16} />
                  <span className="text-sm font-orbitron font-bold">{tpSlSuccess}</span>
                </div>
              </motion.div>
            )}

            {!tpSlSettings ? (
              <div className="text-center py-12">
                <RefreshCw size={32} className="animate-spin text-molten-gold mx-auto mb-4" />
                <p className="text-white/60 font-space-grotesk">Fetching settings...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Notification Settings */}
                <div className="bg-molten-gold/5 border border-molten-gold/20 rounded-lg p-4">
                  <h3 className="text-lg font-orbitron font-semibold text-white mb-4">Notification Settings</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-orbitron font-semibold text-white mb-1">Swap Notifications</h4>
                        <p className="text-white/40 font-space-grotesk text-xs">Receive sound alert when this position is partially or fully closed by TP/SL</p>
                      </div>
                      <motion.button
                        onClick={() => setTpSlSettings((prev: any) => ({ ...prev, swap_notifications_enabled: !prev.swap_notifications_enabled }))}
                        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 flex-shrink-0 ${tpSlSettings.swap_notifications_enabled ? 'bg-molten-gold' : 'bg-gray-600'}`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.div
                          className="w-4 h-4 bg-white rounded-full"
                          animate={{ x: tpSlSettings.swap_notifications_enabled ? 24 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </motion.button>
                    </div>

                    {tpSlSettings.swap_notifications_enabled && (
                      <div className="space-y-3">
                        <label className="block text-xs font-orbitron text-molten-gold tracking-wide uppercase">
                          Notification Sound
                        </label>
                        <div className="flex gap-3">
                          <select
                            value={tpSlSettings.swap_notification_sound}
                            onChange={(e) => setTpSlSettings((prev: any) => ({ ...prev, swap_notification_sound: e.target.value }))}
                            className="flex-1 bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk text-sm focus:border-molten-gold focus:outline-none transition-colors duration-300"
                          >
                            {availableSounds.map(sound => (
                              <option key={sound} value={sound}>{sound}</option>
                            ))}
                          </select>
                          <motion.button
                            onClick={() => testHearSound(tpSlSettings.swap_notification_sound)}
                            disabled={playingSound !== null}
                            className="px-4 py-2 bg-molten-gold/10 border border-molten-gold/30 text-molten-gold rounded-lg hover:bg-molten-gold/20 transition-colors duration-300 flex items-center justify-center gap-2 font-orbitron font-bold text-xs disabled:opacity-50"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {playingSound === tpSlSettings.swap_notification_sound ? 'Playing...' : 'Test Hear'}
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-molten-gold/5 border border-molten-gold/20 rounded-lg">
                  <div>
                    <h3 className="text-sm font-orbitron font-bold text-molten-gold">TP/SL Status</h3>
                    <p className="text-xs text-white/60 font-space-grotesk">Global toggle for this position's SL/TP monitoring</p>
                  </div>
                  <button
                    onClick={() => setTpSlIsActive(!tpSlIsActive)}
                    className={`px-4 py-2 rounded-lg font-orbitron font-bold text-xs transition-all duration-300 ${tpSlIsActive ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}
                  >
                    {tpSlIsActive ? 'ACTIVE' : 'INACTIVE'}
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4 border-b border-molten-gold/20 pb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={18} className="text-green-400" />
                        <h3 className="text-sm font-orbitron font-bold text-green-400">Take Profit</h3>
                      </div>
                      <button
                        onClick={addTakeProfitLevel}
                        className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {tpSlSettings.take_profit_levels.map((level: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-void-black/50 border border-molten-gold/10 rounded-lg group">
                          <div className="flex-1 space-y-1">
                            <label className="text-[10px] text-white/40 font-orbitron uppercase">Profit %</label>
                            <input
                              type="number"
                              value={level.profit_percentage || ''}
                              onChange={(e) => updateTakeProfitLevel(idx, 'profit_percentage', e.target.value)}
                              className="w-full bg-transparent border-none text-white font-space-grotesk text-sm focus:ring-0 p-0"
                              placeholder="0.00"
                            />
                          </div>
                          <div className="w-px h-8 bg-molten-gold/20" />
                          <div className="flex-1 space-y-1">
                            <label className="text-[10px] text-white/40 font-orbitron uppercase">Sell %</label>
                            <input
                              type="number"
                              value={level.sell_percentage || ''}
                              onChange={(e) => updateTakeProfitLevel(idx, 'sell_percentage', e.target.value)}
                              className="w-full bg-transparent border-none text-white font-space-grotesk text-sm focus:ring-0 p-0"
                              placeholder="0.00"
                            />
                          </div>
                          <button
                            onClick={() => removeTakeProfitLevel(idx)}
                            className="text-red-400/50 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {tpValidationErrors && (
                      <p className="text-[10px] text-red-400 font-space-grotesk">{tpValidationErrors}</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4 border-b border-molten-gold/20 pb-2">
                      <div className="flex items-center gap-2">
                        <TrendingDown size={18} className="text-red-400" />
                        <h3 className="text-sm font-orbitron font-bold text-red-400">Stop Loss</h3>
                      </div>
                      <button
                        onClick={addStopLossLevel}
                        className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {tpSlSettings.stop_loss_levels.map((level: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-void-black/50 border border-molten-gold/10 rounded-lg group">
                          <div className="flex-1 space-y-1">
                            <label className="text-[10px] text-white/40 font-orbitron uppercase">Loss %</label>
                            <input
                              type="number"
                              value={level.loss_percentage || ''}
                              onChange={(e) => updateStopLossLevel(idx, 'loss_percentage', e.target.value)}
                              className="w-full bg-transparent border-none text-white font-space-grotesk text-sm focus:ring-0 p-0"
                              placeholder="0.00"
                            />
                          </div>
                          <div className="w-px h-8 bg-molten-gold/20" />
                          <div className="flex-1 space-y-1">
                            <label className="text-[10px] text-white/40 font-orbitron uppercase">Sell %</label>
                            <input
                              type="number"
                              value={level.sell_percentage || ''}
                              onChange={(e) => updateStopLossLevel(idx, 'sell_percentage', e.target.value)}
                              className="w-full bg-transparent border-none text-white font-space-grotesk text-sm focus:ring-0 p-0"
                              placeholder="0.00"
                            />
                          </div>
                          <button
                            onClick={() => removeStopLossLevel(idx)}
                            className="text-red-400/50 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {slValidationErrors && (
                      <p className="text-[10px] text-red-400 font-space-grotesk">{slValidationErrors}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <motion.button
                    onClick={() => setTpSlModal({ open: false, token: null, mirrorAddress: null })}
                    disabled={savingTpSl}
                    className="flex-1 px-4 py-3 bg-void-black/50 border border-white/20 text-white font-orbitron font-bold rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={handleUpdateTpSl}
                    disabled={savingTpSl || !!tpValidationErrors || !!slValidationErrors}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-molten-gold to-yellow-600 text-void-black font-orbitron font-bold rounded-lg hover:from-yellow-600 hover:to-molten-gold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {savingTpSl ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Settings'
                    )}
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  )
}
