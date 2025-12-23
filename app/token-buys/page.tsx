'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/DashboardLayout'
import { ShoppingCart, TrendingUp, TrendingDown, Settings, CheckCircle, XCircle, ExternalLink, RefreshCw } from 'lucide-react'
import { useAppSelector } from '../../store/hooks'
import { authApi } from '../../services/authApi'

interface TakeProfitLevel {
  profit_percentage: number
  sell_percentage: number
  is_active: boolean
}

interface StopLossLevel {
  loss_percentage: number
  sell_percentage: number
  is_active: boolean
}

interface WalletSettings {
  swap_strategy: string
  buy_the_dip: boolean
  buy_dip_percentage: number
  max_dip_percentage: number
  buy_dip_timeout: number
  dip_recovery: boolean
  dip_recovery_percentage: number
  dip_recovery_timeout: number
  slippage: number
  max_buys_per_mirror_per_hour: number
  max_buys_per_mirror_per_day: number
  max_buys_per_token_per_day: number
  take_profit_levels: TakeProfitLevel[] | null
  stop_loss_levels: StopLossLevel[] | null
  tp_sl_is_active: boolean
}

export default function TokenBuysPage() {
  const { selectedCoin } = useAppSelector((s) => s.auth)
  const [tokenAddress, setTokenAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [slippage, setSlippage] = useState('10')
  const [buying, setBuying] = useState(false)
  const [buySuccess, setBuySuccess] = useState<string | null>(null)
  const [buyError, setBuyError] = useState<string | null>(null)
  const [transactionSignature, setTransactionSignature] = useState<string | null>(null)
  
  const [tpslSettings, setTpslSettings] = useState<WalletSettings>({
    swap_strategy: 'none',
    buy_the_dip: false,
    buy_dip_percentage: 10.0,
    max_dip_percentage: 50.0,
    buy_dip_timeout: 300,
    dip_recovery: false,
    dip_recovery_percentage: 5.0,
    dip_recovery_timeout: 600,
    slippage: 10.0,
    max_buys_per_mirror_per_hour: 10,
    max_buys_per_mirror_per_day: 50,
    max_buys_per_token_per_day: 20,
    take_profit_levels: null,
    stop_loss_levels: null,
    tp_sl_is_active: false
  })
  const [loadingTpsl, setLoadingTpsl] = useState(true)
  const [tpslError, setTpslError] = useState<string | null>(null)

  useEffect(() => {
    fetchTPSLSettings()
  }, [])

  const fetchTPSLSettings = async () => {
    try {
      setLoadingTpsl(true)
      const data = await authApi.get('/copy-trading/wallet-settings')
      setTpslSettings(data)
    } catch (error: any) {
      console.error('Error fetching TP/SL settings:', error)
      setTpslError(error.message || 'Failed to fetch TP/SL settings')
    } finally {
      setLoadingTpsl(false)
    }
  }

  const handleBuy = async () => {
    if (!tokenAddress || !amount || !slippage) {
      setBuyError('All fields are required')
      return
    }

    const amountNum = parseFloat(amount)
    const slippageNum = parseFloat(slippage)

    if (isNaN(amountNum) || amountNum <= 0) {
      setBuyError('Amount must be greater than 0')
      return
    }

    if (isNaN(slippageNum) || slippageNum < 0) {
      setBuyError('Slippage must be greater than or equal to 0')
      return
    }

    try {
      setBuying(true)
      setBuyError(null)
      setBuySuccess(null)
      setTransactionSignature(null)

      const data = await authApi.post(`/manual-trading/buy/${selectedCoin}`, {
        token_address: tokenAddress,
        amount: amountNum,
        slippage: slippageNum
      })

      setBuySuccess(data.message || 'Buy order submitted successfully')
      if (data.transaction_signature) {
        setTransactionSignature(data.transaction_signature)
      }
      
      setTokenAddress('')
      setAmount('')
    } catch (error: any) {
      console.error('Error executing buy:', error)
      setBuyError(error.message || 'Buy order failed')
    } finally {
      setBuying(false)
    }
  }


  const getExplorerUrl = (signature: string) => {
    if (selectedCoin === 'sol') {
      return `https://solscan.io/tx/${signature}`
    } else {
      return `https://bscscan.com/tx/${signature}`
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-void-black/95 to-black/90 backdrop-blur-md border border-molten-gold/30 rounded-lg p-6 shadow-2xl shadow-molten-gold/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-molten-gold to-yellow-600 rounded-full flex items-center justify-center">
              <ShoppingCart size={20} className="text-void-black" />
            </div>
            <div>
              <h1 className="text-3xl font-orbitron font-bold text-molten-gold">
                Manual Token Buy
              </h1>
              <p className="text-sm text-white/60 font-space-grotesk">
                Manually purchase tokens with custom settings
              </p>
            </div>
          </div>

          {buyError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg mb-6"
            >
              <div className="flex items-center gap-2 text-red-400">
                <XCircle size={20} />
                <span className="font-orbitron font-bold">{buyError}</span>
              </div>
            </motion.div>
          )}

          {buySuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg mb-6"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle size={20} />
                  <span className="font-orbitron font-bold">{buySuccess}</span>
                </div>
                {transactionSignature && (
                  <a
                    href={getExplorerUrl(transactionSignature)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-300 hover:text-green-200 transition-colors text-sm font-space-grotesk underline"
                  >
                    <ExternalLink size={16} />
                    View transaction on {selectedCoin === 'sol' ? 'Solscan' : 'BscScan'}
                  </a>
                )}
              </div>
            </motion.div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-orbitron font-semibold text-white mb-2">
                Token Address
              </label>
              <input
                type="text"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-4 py-3 text-white font-space-grotesk focus:border-molten-gold focus:outline-none"
                placeholder="Enter token contract address"
                disabled={buying}
              />
            </div>

            <div>
              <label className="block text-sm font-orbitron font-semibold text-white mb-2">
                Amount ({selectedCoin.toUpperCase()})
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-4 py-3 text-white font-space-grotesk focus:border-molten-gold focus:outline-none"
                placeholder="0.0"
                min="0"
                step="0.01"
                disabled={buying}
              />
            </div>

            <div>
              <label className="block text-sm font-orbitron font-semibold text-white mb-2">
                Slippage (%)
              </label>
              <input
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-4 py-3 text-white font-space-grotesk focus:border-molten-gold focus:outline-none"
                placeholder="10"
                min="0"
                step="0.1"
                disabled={buying}
              />
            </div>

            <motion.button
              onClick={handleBuy}
              disabled={buying || !tokenAddress || !amount || !slippage}
              className="w-full px-6 py-3 bg-gradient-to-r from-molten-gold to-yellow-500 text-void-black font-orbitron font-bold rounded-lg hover:from-yellow-500 hover:to-molten-gold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              whileHover={{ scale: buying ? 1 : 1.02 }}
              whileTap={{ scale: buying ? 1 : 0.98 }}
            >
              {buying ? (
                <>
                  <RefreshCw size={20} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ShoppingCart size={20} />
                  Buy Token
                </>
              )}
            </motion.button>
          </div>
        </div>

        <div className="bg-gradient-to-r from-void-black/95 to-black/90 backdrop-blur-md border border-molten-gold/30 rounded-lg p-6 shadow-2xl shadow-molten-gold/10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-red-500 rounded-full flex items-center justify-center">
                <Settings size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-orbitron font-bold text-molten-gold">
                  Take Profit / Stop Loss Settings
                </h2>
                <p className="text-sm text-white/60 font-space-grotesk">
                  View your TP/SL levels for manual buys
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 text-sm font-orbitron font-semibold rounded-lg ${
                tpslSettings.tp_sl_is_active 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/40' 
                  : 'bg-gray-500/20 text-gray-400 border border-gray-500/40'
              }`}>
                {tpslSettings.tp_sl_is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-6"
          >
            <div className="flex items-start gap-2 text-blue-300">
              <Settings size={16} className="flex-shrink-0 mt-0.5" />
              <div className="text-sm font-space-grotesk">
                <span className="font-semibold">Note:</span> TP/SL settings are managed in the{' '}
                <a 
                  href="/dashboard" 
                  className="text-molten-gold hover:text-yellow-400 underline transition-colors font-semibold"
                >
                  Controls Page
                </a>
                . Changes there will apply to all manual buys.
              </div>
            </div>
          </motion.div>

          {tpslError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg mb-4"
            >
              <div className="flex items-center gap-2 text-red-400">
                <XCircle size={16} />
                <span className="text-sm font-orbitron font-bold">{tpslError}</span>
              </div>
            </motion.div>
          )}

          {loadingTpsl ? (
            <div className="text-center py-8">
              <RefreshCw size={32} className="animate-spin text-molten-gold mx-auto mb-4" />
              <p className="text-white/60 font-space-grotesk">Loading settings...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={20} className="text-green-400" />
                  <h3 className="text-lg font-orbitron font-bold text-green-400">Take Profit Levels</h3>
                </div>

                {tpslSettings.take_profit_levels && tpslSettings.take_profit_levels.length > 0 ? (
                  <div className="space-y-2">
                    {tpslSettings.take_profit_levels.map((level, index) => (
                      <div key={index} className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                        <div className="text-sm font-space-grotesk text-white">
                          +{level.profit_percentage}% → Sell {level.sell_percentage}%
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-void-black/50 border border-green-500/20 rounded-lg p-4 text-center">
                    <p className="text-sm text-white/40 font-space-grotesk">No take profit levels configured</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown size={20} className="text-red-400" />
                  <h3 className="text-lg font-orbitron font-bold text-red-400">Stop Loss Levels</h3>
                </div>

                {tpslSettings.stop_loss_levels && tpslSettings.stop_loss_levels.length > 0 ? (
                  <div className="space-y-2">
                    {tpslSettings.stop_loss_levels.map((level, index) => (
                      <div key={index} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <div className="text-sm font-space-grotesk text-white">
                          -{level.loss_percentage}% → Sell {level.sell_percentage}%
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-void-black/50 border border-red-500/20 rounded-lg p-4 text-center">
                    <p className="text-sm text-white/40 font-space-grotesk">No stop loss levels configured</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

