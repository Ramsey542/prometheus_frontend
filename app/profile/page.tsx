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
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  RefreshCw
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { logout, getProfile } from '../../store/slices/authSlice'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProfileLayout from '../../components/ProfileLayout'
import { walletTrackerApi } from '../../services/walletTrackerApi'
import { TrackedWallet, TrackedWalletCreate, CopyTradingLog, CopyTradingStats } from '../../store/types/auth'
import { config } from '../../lib/config'

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
    return amount
  }
}

function ProfilePageContent() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, wallet, profile, isLoading, error, selectedCoin } = useAppSelector((state) => state.auth)
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  
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
  const [balanceRefreshing, setBalanceRefreshing] = useState(false)
  const [tradeAmountUpdating, setTradeAmountUpdating] = useState(false)
  const [tradeAmountValue, setTradeAmountValue] = useState<string>('')
  const [isEditingTradeAmount, setIsEditingTradeAmount] = useState(false)
  const [tradeAmountSuccess, setTradeAmountSuccess] = useState<string | null>(null)
  const [tradeAmountError, setTradeAmountError] = useState<string | null>(null)
  const [walletSettings, setWalletSettings] = useState<{[key: string]: any}>({})
  const [showWalletSettings, setShowWalletSettings] = useState<string | null>(null)
  const [walletSettingsLoading, setWalletSettingsLoading] = useState(false)
  const [walletSettingsSuccess, setWalletSettingsSuccess] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawDestination, setWithdrawDestination] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawSuccess, setWithdrawSuccess] = useState<any>(null)
  const [withdrawError, setWithdrawError] = useState<string | null>(null)
  const [copyTradingStats, setCopyTradingStats] = useState<CopyTradingStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState<string | null>(null)
  
  const currentSection = searchParams.get('section') || 'overview'
  useEffect(() => {
    if (user) {
      dispatch(getProfile(selectedCoin))
    }
  }, [dispatch, user, selectedCoin])

  useEffect(() => {
    if (profile?.trade_amount !== undefined) {

      setTradeAmountValue(profile.trade_amount.toString())
    }
  }, [profile?.trade_amount])

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
      setCopyTradingStats(null)
      setWalletSettings({})
      setLogsPage(1)
      setLogsTotalPages(1)
      setLogsTotal(0)
      setWalletsPage(1)
      setWalletsTotalPages(1)
      setWalletsTotal(0)
      
      const fetchData = async () => {
        await Promise.all([
          fetchTrackedWallets(),
          fetchCopyTradingStats(),
          currentSection === 'tracker-logs' ? fetchAllLogs() : Promise.resolve()
        ])
        setCoinSwitching(false)
      }
      
      fetchData()
    }
  }, [user, currentSection, selectedCoin])

  useEffect(() => {
    if (copyTradingStats && trackedWallets && trackedWallets.length > 0) {
      fetchTrackedWallets()
    }
  }, [copyTradingStats])

  useEffect(() => {
    if (user && currentSection === 'wallet-tracker' && trackedWallets && trackedWallets.length > 0) {
      trackedWallets.forEach(wallet => {
        if (!walletSettings[wallet.wallet_address]) {
          fetchWalletSettings(wallet.wallet_address)
        }
      })
    }
  }, [user, currentSection, trackedWallets])

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

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWalletAddress.trim()) return

    try {
      setWalletTrackerLoading(true)
      setWalletTrackerError(null)
      setWalletTrackerSuccess(null)

      const walletData: TrackedWalletCreate = {
        wallet_address: newWalletAddress.trim(),
        is_active: true
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
    }
  }

  const handleStopTracking = async (walletAddress: string) => {
    try {
      setWalletTrackerLoading(true)
      setWalletTrackerError(null)
      setWalletTrackerSuccess(null)

      await walletTrackerApi.stopTrackingWallet(walletAddress, selectedCoin)
      setWalletTrackerSuccess('Wallet tracking stopped successfully!')
      await fetchTrackedWallets()
      await fetchCopyTradingStats()
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

  const handleResumeTracking = async (walletAddress: string) => {
    try {
      setWalletTrackerLoading(true)
      setWalletTrackerError(null)
      setWalletTrackerSuccess(null)

      const walletData: TrackedWalletCreate = {
        wallet_address: walletAddress,
        is_active: true
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

  const fetchAllLogs = async (page: number = 1) => {
    try {
      if (page === 1) {
        setInitialLogsLoading(true)
      } else {
        setLogsLoading(true)
      }
      setWalletTrackerError(null)
      
      const response = await walletTrackerApi.getAllLogs(page, 10, selectedCoin)
      console.log('response', response)
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

  const handleTradeAmountChange = (value: string) => {
    setTradeAmountValue(value)
    if (tradeAmountError) {
      setTradeAmountError(null)
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

  const handleUpdateTradeAmount = async () => {
    const amount = parseFloat(tradeAmountValue)
    if (isNaN(amount) || amount < Number(config.trade_amount)) {
      setTradeAmountError(`Trade amount must be at least ${config.trade_amount} ${selectedCoin.toUpperCase()}`)
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

  const fetchWalletSettings = async (walletAddress: string) => {
    try {
      const settings = await walletTrackerApi.getTrackedWalletSettings(walletAddress, selectedCoin)
      setWalletSettings(prev => ({ ...prev, [walletAddress]: settings }))
    } catch (err) {
      console.error('Failed to fetch wallet settings:', err)
    }
  }

  const handleWalletSettingsClick = async (walletAddress: string) => {
    if (!walletSettings[walletAddress]) {
      await fetchWalletSettings(walletAddress)
    }
    setShowWalletSettings(showWalletSettings === walletAddress ? null : walletAddress)
  }

  const handleUpdateWalletSettings = async (walletAddress: string) => {
    try {
      setWalletSettingsLoading(true)
      setWalletTrackerError(null)
      setWalletSettingsSuccess(null)

      const settings = walletSettings[walletAddress]
      const normalized = {
        ...settings,
        slippage: settings.slippage === '' ? 0 : settings.slippage,
        max_buys_per_mirror_per_hour: settings.max_buys_per_mirror_per_hour,
        max_buys_per_mirror_per_day: settings.max_buys_per_mirror_per_day,
        max_buys_per_token_per_day: settings.max_buys_per_token_per_day,
      }
      await walletTrackerApi.updateTrackedWalletSettings(walletAddress, normalized, selectedCoin)
      
      setWalletSettingsSuccess('Wallet settings updated successfully!')
      setTimeout(() => setWalletSettingsSuccess(null), 5000)
      setShowWalletSettings(null)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update wallet settings'
      setWalletTrackerError(errorMessage)
      
      if (errorMessage.includes('Session expired') || errorMessage.includes('401')) {
        router.push('/login')
      }
    } finally {
      setWalletSettingsLoading(false)
    }
  }

  useEffect(() => {
    if (!user && !isLoading) {
      router.push('/login')
    }
  }, [user, isLoading, router])

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
      console.log('data', data)
      setWithdrawSuccess(data)
      await dispatch(getProfile(selectedCoin))
    } catch (err: any) {
      setWithdrawError(err.message || 'Withdraw failed')
    } finally {
      setWithdrawing(false)
    }
  }

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
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
            <label className="block text-sm font-orbitron text-molten-gold mb-2 tracking-wide">
              WALLET ADDRESS
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
        <div className="flex items-start justify-between mb-4 md:mb-6">
          <h3 className="text-lg md:text-xl font-orbitron font-bold text-molten-gold flex items-center gap-3">
            <Wallet size={20} />
            Tracked Wallets ({walletsTotal})
          </h3>
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
                      <p className="text-xs md:text-sm text-white font-space-grotesk font-mono break-all">
                        {formatWalletAddress(wallet.wallet_address)}
                      </p>
                      <button
                        onClick={() => copyToClipboard(wallet.wallet_address, `tracked-${wallet.id}`)}
                        className="text-molten-gold/60 hover:text-molten-gold transition-colors duration-300"
                      >
                        <Copy size={14} />
                      </button>
                      {copiedKey === `tracked-${wallet.id}` && (
                        <span className="text-xs text-molten-gold">Copied</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 text-xs md:text-sm">
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
                    </div>
                    <p className="text-white/40 font-space-grotesk text-xs mt-2">
                      Added: {new Date(wallet.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <motion.button
                      onClick={() => handleWalletSettingsClick(wallet.wallet_address)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors duration-300 ${
                        walletSettings[wallet.wallet_address] && 
                        walletSettings[wallet.wallet_address].is_default === false
                          ? 'bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20'
                          : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <CheckCircle size={14} />
                      <span className="text-sm font-orbitron font-semibold">
                        {walletSettings[wallet.wallet_address] && 
                         walletSettings[wallet.wallet_address].is_default === false
                          ? 'Custom Controls'
                          : 'Default Controls'
                        }
                      </span>
                    </motion.button>
                    
                    {wallet.is_active ? (
                      <motion.button
                        onClick={() => handleStopTracking(wallet.wallet_address)}
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
                        onClick={() => handleResumeTracking(wallet.wallet_address)}
                        disabled={walletTrackerLoading}
                        className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors duration-300 flex items-center gap-2 text-sm font-orbitron font-semibold disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Eye size={14} />
                        Resume
                      </motion.button>
                    )}
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
                  Wallet Settings - {formatWalletAddress(showWalletSettings)}
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
                    <h4 className="text-lg font-orbitron font-semibold text-white mb-4">Buy Strategy</h4>
                    <select
                      value={walletSettings[showWalletSettings].swap_strategy || 'none'}
                      onChange={(e) => setWalletSettings(prev => ({
                        ...prev,
                        [showWalletSettings]: {
                          ...prev[showWalletSettings],
                          swap_strategy: e.target.value
                        }
                      }))}
                      className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                    >
                      <option value="none">None</option>
                      <option value="fixed_buys">Constant Size</option>
                    </select>
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
                        className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${
                          walletSettings[showWalletSettings].buy_the_dip ? 'bg-molten-gold' : 'bg-gray-600'
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
                            <label className="block text-sm font-orbitron text-molten-gold font-semibold mb-2">Buy Dip %</label>
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
                            <label className="block text-sm font-orbitron text-molten-gold font-semibold mb-2">Max Dip %</label>
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
                            <label className="block text-sm font-orbitron text-molten-gold font-semibold mb-2">Buy Dip Timeout (seconds)</label>
                            <input
                              type="number"
                              value={walletSettings[showWalletSettings].buy_dip_timeout || 300}
                              onChange={(e) => setWalletSettings(prev => ({
                                ...prev,
                                [showWalletSettings]: {
                                  ...prev[showWalletSettings],
                                  buy_dip_timeout: parseInt(e.target.value) || 0
                                }
                              }))}
                              className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                              min="0"
                              step="1"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-orbitron text-molten-gold font-semibold">Dip Recovery</label>
                              <motion.button
                                onClick={() => setWalletSettings(prev => ({
                                  ...prev,
                                  [showWalletSettings]: {
                                    ...prev[showWalletSettings],
                                    dip_recovery: !prev[showWalletSettings].dip_recovery
                                  }
                                }))}
                                className={`w-10 h-5 rounded-full p-1 transition-all duration-300 ${
                                  walletSettings[showWalletSettings].dip_recovery ? 'bg-molten-gold' : 'bg-gray-600'
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
                              <label className="block text-sm font-orbitron text-molten-gold font-semibold mb-2">Dip Recovery %</label>
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
                              <label className="block text-sm font-orbitron text-molten-gold font-semibold mb-2">Dip Recovery Timeout (seconds)</label>
                              <input
                                type="number"
                                value={walletSettings[showWalletSettings].dip_recovery_timeout || 600}
                                onChange={(e) => setWalletSettings(prev => ({
                                  ...prev,
                                  [showWalletSettings]: {
                                    ...prev[showWalletSettings],
                                    dip_recovery_timeout: parseInt(e.target.value) || 0
                                  }
                                }))}
                                className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                                min="0"
                                step="1"
                              />
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
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

                  <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4">
                    <h4 className="text-lg font-orbitron font-semibold text-white mb-4">Advanced Filters</h4>
                    
                    <div className="space-y-4">
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
                    </div>
                  </div>

                  <motion.button
                    onClick={() => handleUpdateWalletSettings(showWalletSettings)}
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
      </div>
    </div>
  )

  const renderTrackerLogs = () => {
    return (
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-8">
        <div className="flex items-center gap-4">
          <h1 className="text-xl md:text-3xl font-orbitron font-bold text-molten-gold">
            Tracker Logs
          </h1>
        </div>

        {/* Copy Trading Statistics Section */}
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-molten-gold/20 rounded-lg p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-orbitron font-bold text-molten-gold mb-4 md:mb-6 flex items-center gap-3">
            <TrendingUp size={20} />
            Copy Trading Statistics
          </h3>
          
          {statsLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-molten-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/60 font-space-grotesk">Loading statistics...</p>
            </div>
          ) : statsError ? (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <div className="flex items-center gap-2 text-red-400">
                <XCircle size={20} />
                <span className="font-orbitron font-bold">{statsError}</span>
              </div>
            </div>
          ) : copyTradingStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {/* Total Tracked Wallets */}
              <div className="bg-void-black/30 border border-molten-gold/20 rounded-lg p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <Wallet size={18} className="md:w-5 md:h-5 text-molten-gold" />
                  <span className="text-xs md:text-sm font-orbitron text-molten-gold tracking-wide">TOTAL WALLETS</span>
                </div>
                <div className="text-xl md:text-2xl font-orbitron font-bold text-white">
                  {copyTradingStats.total_tracked_wallets}
                </div>
              </div>

              {/* Active Wallets */}
              <div className="bg-void-black/30 border border-molten-gold/20 rounded-lg p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <Activity size={18} className="md:w-5 md:h-5 text-green-400" />
                  <span className="text-xs md:text-sm font-orbitron text-green-400 tracking-wide">ACTIVE WALLETS</span>
                </div>
                <div className="text-xl md:text-2xl font-orbitron font-bold text-white">
                  {copyTradingStats.active_wallets}
                </div>
              </div>

              {/* Success Rate */}
              <div className="bg-void-black/30 border border-molten-gold/20 rounded-lg p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <CheckCircle size={18} className="md:w-5 md:h-5 text-blue-400" />
                  <span className="text-xs md:text-sm font-orbitron text-blue-400 tracking-wide">SUCCESS RATE</span>
                </div>
                <div className="text-xl md:text-2xl font-orbitron font-bold text-white">
                  {copyTradingStats.success_rate.toFixed(1)}%
                </div>
              </div>

              {/* Total Volume */}
              <div className="bg-void-black/30 border border-molten-gold/20 rounded-lg p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <TrendingUp size={18} className="md:w-5 md:h-5 text-purple-400" />
                  <span className="text-xs md:text-sm font-orbitron text-purple-400 tracking-wide">TOTAL VOLUME</span>
                </div>
                <div className="text-xl md:text-2xl font-orbitron font-bold text-white">
                  {copyTradingStats.total_volume_traded.toLocaleString()} {selectedCoin.toUpperCase()}
                </div>
              </div>

              {/* Total Matches */}
              <div className="bg-void-black/30 border border-molten-gold/20 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <FileText size={20} className="text-yellow-400" />
                  <span className="text-sm font-orbitron text-yellow-400 tracking-wide">TOTAL MATCHES</span>
                </div>
                <div className="text-2xl font-orbitron font-bold text-white">
                  {copyTradingStats.total_matches}
                </div>
              </div>

              {/* Successful Trades */}
              <div className="bg-void-black/30 border border-molten-gold/20 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle size={20} className="text-green-400" />
                  <span className="text-sm font-orbitron text-green-400 tracking-wide">SUCCESSFUL TRADES</span>
                </div>
                <div className="text-2xl font-orbitron font-bold text-white">
                  {copyTradingStats.successful_trades}
                </div>
              </div>

              {/* Failed Trades */}
              <div className="bg-void-black/30 border border-molten-gold/20 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <XCircle size={20} className="text-red-400" />
                  <span className="text-sm font-orbitron text-red-400 tracking-wide">FAILED TRADES</span>
                </div>
                <div className="text-2xl font-orbitron font-bold text-white">
                  {copyTradingStats.failed_trades}
                </div>
              </div>

              {/* Refresh Button */}
              <div className="bg-void-black/30 border border-molten-gold/20 rounded-lg p-4 flex items-center justify-center">
                <motion.button
                  onClick={fetchCopyTradingStats}
                  disabled={statsLoading}
                  className="px-4 py-2 bg-molten-gold text-void-black font-orbitron font-bold tracking-wider hover:brightness-110 transition duration-300 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {statsLoading ? (
                    <div className="w-4 h-4 border-2 border-void-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                  Refresh
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp size={48} className="text-molten-gold/40 mx-auto mb-4" />
              <p className="text-white/60 font-space-grotesk">No statistics available</p>
              <p className="text-white/40 font-space-grotesk text-sm mt-2">Start tracking wallets to see statistics</p>
            </div>
          )}
        </div>

        {/* Wallet Stats Section */}
        {copyTradingStats && copyTradingStats.wallet_stats && copyTradingStats.wallet_stats.length > 0 && (
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-molten-gold/20 rounded-lg p-6">
            <h3 className="text-xl font-orbitron font-bold text-molten-gold mb-6 flex items-center gap-3">
              <TrendingUp size={20} />
              Wallet Performance Overview
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {copyTradingStats.wallet_stats.map((wallet, index) => (
                <motion.div
                  key={wallet.wallet_address}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-void-black/30 border border-molten-gold/20 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Wallet size={20} className="text-molten-gold" />
                      <span className="font-orbitron font-bold text-white text-sm">
                        {wallet.wallet_address.slice(0, 6)}...{wallet.wallet_address.slice(-4)}
                      </span>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-orbitron font-bold ${
                      wallet.is_active 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/50'
                    }`}>
                      {wallet.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-sm font-orbitron text-molten-gold tracking-wide mb-1">MATCHES</div>
                      <div className="text-xl font-orbitron font-bold text-white">{wallet.total_matches}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-orbitron text-blue-400 tracking-wide mb-1">SUCCESS RATE</div>
                      <div className="text-xl font-orbitron font-bold text-white">{wallet.success_rate.toFixed(1)}%</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Account Logs Section */}
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-molten-gold/20 rounded-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-orbitron font-bold text-molten-gold flex items-center gap-3">
              <FileText size={20} />
              Account Event Logs ({logsTotal})
            </h3>
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
              {trackerLogs && trackerLogs.filter(log => log && log.id).map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-void-black/50 border border-molten-gold/10 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${log.status === 'success' ? 'bg-green-400' : log.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                      <span className={`text-sm font-orbitron font-semibold tracking-wider uppercase ${
                        log.event_type === 'tracked_wallet_purchase' ? 'text-green-400' : 
                        log.event_type === 'user_purchase' ? 'text-blue-400' :
                        log.event_type === 'user_sell' ? 'text-orange-400' :
                        log.event_type === 'admin_fee' ? 'text-purple-400' : 'text-gray-400'
                      }`}>
                        {log.event_type?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN EVENT'}
                      </span>
                    </div>
                    <span className="text-xs text-white/40 font-space-grotesk">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : 'Unknown Date'}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Transaction Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-molten-gold/60 font-orbitron text-xs tracking-wider uppercase mb-1">Status</p>
                        <p className={`font-orbitron font-bold ${log.status === 'success' ? 'text-green-400' : log.status === 'failed' ? 'text-red-400' : 'text-yellow-400'}`}>
                          {log.status?.toUpperCase() || 'UNKNOWN'}
                        </p>
                      </div>
                      <div>
                        <p className="text-molten-gold/60 font-orbitron text-xs tracking-wider uppercase mb-1">Target Token</p>
                        <div className="flex items-center gap-2">
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
                        </div>
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
                        const isBuyOperation = log.event_type === 'tracked_wallet_purchase' || log.event_type === 'user_purchase'
                        const isToken = !isBuyOperation
                        return (
                          <div>
                            <p className="text-molten-gold/60 font-orbitron text-xs tracking-wider uppercase mb-1">Sent</p>
                            <p className="text-white font-space-grotesk font-mono text-sm">
                              {formatAmount(log.amount_in, selectedCoin, isToken, isToken ? log.token_decimals : null)}
                              {isToken && log.token_name ? ` ${log.token_name}` : ` ${selectedCoin.toUpperCase()}`}
                            </p>
                          </div>
                        )
                      })()}
                      
                      {log.amount_out && (() => {
                        const isBuyOperation = log.event_type === 'tracked_wallet_purchase' || log.event_type === 'user_purchase'
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
                            {formatAmount(log.fee_amount, selectedCoin, false)} {selectedCoin.toUpperCase()}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Event Data */}
                    {log.event_data && (
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
                  
                  {log.error_message && (
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
      </div>
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
                    {isLoading ? '...' : (profile?.failed_trades ?? copyTradingStats?.failed_trades ?? 0)}
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
                      placeholder={`Minimum ${config.trade_amount} ${selectedCoin.toUpperCase()}`}
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
                      Public Address
                    </span>
                  </div>
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
                      {selectedCoin === 'sol' ? 'SOL Balance' : 'BNB Balance'}
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
                  <p className="text-xl md:text-2xl font-orbitron font-bold text-molten-gold break-words">
                    {isLoading || balanceRefreshing ? '...' : `${parseFloat(selectedCoin === 'sol' ? (profile?.sol_balance || '0') : (profile?.bnb_balance || '0')).toFixed(4)} ${selectedCoin.toUpperCase()}`}
                  </p>
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

        {/* Trading Statistics */}
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-molten-gold/20 rounded-lg p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-orbitron font-bold text-molten-gold mb-4 md:mb-6 flex items-center gap-3">
            <Activity size={18} className="md:w-5 md:h-5" />
            Trading Statistics
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-void-black/50 border border-molten-gold/10 rounded-lg p-3 md:p-4 text-center">
              <Activity size={20} className="md:w-6 md:h-6 text-molten-gold mx-auto mb-2 md:mb-3" />
              <p className="text-xl md:text-2xl font-orbitron font-bold text-white mb-1">
                {isLoading ? '...' : profile?.total_trades || 0}
              </p>
              <p className="text-xs font-orbitron font-medium text-molten-gold/80 tracking-wider uppercase">
                Total Trades
              </p>
            </div>
            
            <div className="bg-void-black/50 border border-molten-gold/10 rounded-lg p-3 md:p-4 text-center">
              <XCircle size={20} className="md:w-6 md:h-6 text-red-400 mx-auto mb-2 md:mb-3" />
              <p className="text-xl md:text-2xl font-orbitron font-bold text-red-400 mb-1">
                {isLoading ? '...' : (profile?.failed_trades ?? copyTradingStats?.failed_trades ?? 0)}
              </p>
              <p className="text-xs font-orbitron font-medium text-molten-gold/80 tracking-wider uppercase">
                Failed Trades
              </p>
            </div>
            
            
            <div className="bg-void-black/50 border border-molten-gold/10 rounded-lg p-3 md:p-4 text-center">
              <Activity size={20} className="md:w-6 md:h-6 text-blue-400 mx-auto mb-2 md:mb-3" />
              <p className="text-xl md:text-2xl font-orbitron font-bold text-blue-400 mb-1">
                {isLoading ? '...' : profile?.active_mirrors || 0}
              </p>
              <p className="text-xs font-orbitron font-medium text-molten-gold/80 tracking-wider uppercase">
                Active Mirrors
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
                    <div>Amount: {withdrawSuccess.amount_sol} SOL</div>
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

      {currentSection === 'wallet-tracker' ? renderWalletTrackerSection() : 
       currentSection === 'tracker-logs' ? renderTrackerLogs() : 
       renderProfileOverview()}
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
