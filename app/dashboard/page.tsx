'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import { config } from '../../lib/config'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/index'
import { useRouter } from 'next/navigation'

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
  buy_the_dip: boolean
  buy_dip_percentage: number
  max_dip_percentage: number
  buy_dip_timeout: number
  dip_recovery: boolean
  dip_recovery_percentage: number
  dip_recovery_timeout: number
  slippage: number | ''
  max_buys_per_mirror_per_hour?: number
  max_buys_per_mirror_per_day?: number
  max_buys_per_token_per_day?: number
  take_profit_levels?: TakeProfitLevel[]
  stop_loss_levels?: StopLossLevel[]
  trailing_stop_percentage?: number
  trailing_stop_sell_percentage?: number
}

export default function DashboardPage() {
  const [settings, setSettings] = useState<WalletSettings>({
    swap_strategy: 'none',
    buy_the_dip: false,
    buy_dip_percentage: 10,
    max_dip_percentage: 50,
    buy_dip_timeout: 300,
    dip_recovery: false,
    dip_recovery_percentage: 5,
    dip_recovery_timeout: 600,
    slippage: 1,
    max_buys_per_mirror_per_hour: 1,
    max_buys_per_mirror_per_day: 1,
    max_buys_per_token_per_day: 1
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [tpValidationError, setTpValidationError] = useState<string | null>(null)
  const [slValidationError, setSlValidationError] = useState<string | null>(null)
  const [showAllTP, setShowAllTP] = useState(false)
  const [showAllSL, setShowAllSL] = useState(false)
  const [tpSlIsActive, setTpSlIsActive] = useState(true)

  const swapStrategies = [
    { value: 'none', label: 'None' },
    { value: 'fixed_buys', label: 'Constant Size' }
  ]

  const calculateTotalSellPercentage = (levels: TakeProfitLevel[] | StopLossLevel[]): number => {
    return levels.reduce((sum, level) => sum + (level.sell_percentage || 0), 0)
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

  const profile = useSelector((state: RootState) => state.auth.profile)
  const router = useRouter()

  useEffect(() => {
    if (profile) {
      fetchSettings()
    }
  }, [profile])

  const fetchSettings = async () => {
    try {
      setInitialLoading(true)
      const response = await fetch(`${config.apiBaseUrl}/copy-trading/wallet-settings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      })
      console.log('the response', response)
      if (response.ok) {
        const data = await response.json()
        setSettings({
          ...data,
          take_profit_levels: data.take_profit_levels && data.take_profit_levels.length > 0 
            ? data.take_profit_levels 
            : [{ profit_percentage: 0, sell_percentage: 0 }],
          stop_loss_levels: data.stop_loss_levels && data.stop_loss_levels.length > 0 
            ? data.stop_loss_levels 
            : [{ loss_percentage: 0, sell_percentage: 0 }]
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
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const payload = {
        ...settings,
        slippage: settings.slippage === '' ? 0 : settings.slippage,
        max_buys_per_mirror_per_hour: settings.max_buys_per_mirror_per_hour ?? undefined,
        max_buys_per_mirror_per_day: settings.max_buys_per_mirror_per_day ?? undefined,
        max_buys_per_token_per_day: settings.max_buys_per_token_per_day ?? undefined,
        take_profit_levels: settings.take_profit_levels,
        stop_loss_levels: settings.stop_loss_levels,
        tp_sl_is_active: tpSlIsActive,
      }
      const response = await fetch(`${config.apiBaseUrl}/copy-trading/wallet-settings`, {
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
              <h3 className="text-base md:text-lg font-orbitron font-semibold text-white mb-3 md:mb-4">Buy Strategy</h3>
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-4 py-3 text-white font-space-grotesk flex items-center justify-between hover:border-molten-gold/40 transition-colors duration-300"
                >
                  <span>{swapStrategies.find(s => s.value === settings.swap_strategy)?.label}</span>
                  <ChevronDown size={16} className={`text-molten-gold transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-void-black/90 border border-molten-gold/20 rounded-lg shadow-2xl z-10"
                  >
                    {swapStrategies.map((strategy) => (
                      <button
                        key={strategy.value}
                        onClick={() => {
                          setSettings(prev => ({ ...prev, swap_strategy: strategy.value }))
                          setShowDropdown(false)
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-molten-gold/10 transition-colors duration-300 ${
                          settings.swap_strategy === strategy.value ? 'text-molten-gold bg-molten-gold/10' : 'text-white'
                        }`}
                      >
                        {strategy.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>

            <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0">
                <div>
                  <h3 className="text-base md:text-lg font-orbitron font-semibold text-white mb-1 md:mb-2">Buy the Dip</h3>
                  <p className="text-white/60 font-space-grotesk text-xs md:text-sm">Enable automatic dip buying strategy</p>
                </div>
                <motion.button
                  onClick={() => setSettings(prev => ({ ...prev, buy_the_dip: !prev.buy_the_dip }))}
                  className={`w-14 h-7 rounded-full p-1 transition-all duration-300 ${
                    settings.buy_the_dip ? 'bg-molten-gold' : 'bg-gray-600'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="w-5 h-5 bg-white rounded-full"
                    animate={{ x: settings.buy_the_dip ? 20 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </motion.button>
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
                      <div className="flex items-center gap-2 mb-2">
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
                      <input
                        type="number"
                        value={settings.buy_dip_timeout}
                        onChange={(e) => setSettings(prev => ({ ...prev, buy_dip_timeout: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                        placeholder="300"
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
                          className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${
                            settings.dip_recovery ? 'bg-molten-gold' : 'bg-gray-600'
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
                          <div className="flex items-center gap-2 mb-2">
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
                          <input
                            type="number"
                            value={settings.dip_recovery_timeout}
                            onChange={(e) => setSettings(prev => ({ ...prev, dip_recovery_timeout: parseInt(e.target.value) || 0 }))}
                            className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                            placeholder="600"
                            min="0"
                            step="1"
                          />
                        </div>
                      </motion.div>
                    )}
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

            {/* TP/SL Control Switch */}
            <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base md:text-lg font-orbitron font-semibold text-white mb-1">Take Profit / Stop Loss</h3>
                  <p className="text-white/60 font-space-grotesk text-xs md:text-sm">Enable or disable TP/SL tracking</p>
                </div>
                <motion.button
                  onClick={() => setTpSlIsActive(!tpSlIsActive)}
                  className={`w-14 h-7 rounded-full p-1 transition-all duration-300 ${
                    tpSlIsActive ? 'bg-molten-gold' : 'bg-gray-600'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="w-5 h-5 bg-white rounded-full"
                    animate={{ x: tpSlIsActive ? 20 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </motion.button>
              </div>
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

            <motion.button
              onClick={handleSave}
              disabled={loading}
              className="w-full py-3 md:py-4 bg-gradient-to-r from-molten-gold to-yellow-500 text-void-black font-orbitron font-bold rounded-lg hover:brightness-110 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-void-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle size={20} />
              )}
              {loading ? 'Saving...' : 'Save Settings'}
            </motion.button>
        </div>
      </div>
    </DashboardLayout>
  )
}
