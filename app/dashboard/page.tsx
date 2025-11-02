'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, ChevronDown } from 'lucide-react'
import DashboardLayout from '../../components/DashboardLayout'
import { config } from '../../lib/config'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/index'
import { useRouter } from 'next/navigation'

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
  buy_strategy?: string
  max_buys_per_mirror_per_hour?: number
  max_buys_per_mirror_per_day?: number
  max_buys_per_token_per_day?: number
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
    buy_strategy: 'constant_size',
    max_buys_per_mirror_per_hour: 1,
    max_buys_per_mirror_per_day: 1,
    max_buys_per_token_per_day: 1
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')

  const swapStrategies = [
    { value: 'none', label: 'None' },
    { value: 'fixed_buys', label: 'Fixed Buys' }
  ]

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
      
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
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
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-8">
        <div className="bg-gradient-to-r from-void-black/95 to-black/90 backdrop-blur-md border border-molten-gold/30 rounded-lg p-4 md:p-8 shadow-2xl shadow-molten-gold/10">
          <h1 className="text-xl md:text-3xl font-orbitron font-bold text-molten-gold mb-4 md:mb-8">
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
              <h3 className="text-base md:text-lg font-orbitron font-semibold text-white mb-3 md:mb-4">Swap Strategy</h3>
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

            <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4 md:p-6">
              <h3 className="text-base md:text-lg font-orbitron font-semibold text-white mb-3 md:mb-4">Advanced Filters</h3>
              
              <div className="space-y-4">
                <div className="bg-void-black/30 border border-molten-gold/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-orbitron font-semibold text-white">Buy Strategy</h4>
                    <button
                      disabled
                      className="text-xs text-gray-500 font-space-grotesk underline cursor-not-allowed opacity-50"
                    >
                      change
                    </button>
                  </div>
                  <p className="text-sm text-white/80 font-space-grotesk capitalize">
                    {settings.buy_strategy?.replace(/_/g, ' ') || 'Constant Size'}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="bg-void-black/30 border border-molten-gold/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-orbitron text-white font-semibold">Max buys per mirror per hour</label>
                      <div className="flex gap-2">
                        <button
                          disabled
                          className="text-xs text-gray-500 font-space-grotesk underline cursor-not-allowed opacity-50"
                        >
                          change
                        </button>
                        <button
                          disabled
                          className="text-xs text-gray-500 font-space-grotesk underline cursor-not-allowed opacity-50"
                        >
                          remove
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-white/80 font-space-grotesk">
                      {settings.max_buys_per_mirror_per_hour ?? '1'}
                    </p>
                  </div>

                  <div className="bg-void-black/30 border border-molten-gold/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-orbitron text-white font-semibold">Max buys per mirror per day</label>
                      <div className="flex gap-2">
                        <button
                          disabled
                          className="text-xs text-gray-500 font-space-grotesk underline cursor-not-allowed opacity-50"
                        >
                          change
                        </button>
                        <button
                          disabled
                          className="text-xs text-gray-500 font-space-grotesk underline cursor-not-allowed opacity-50"
                        >
                          remove
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-white/80 font-space-grotesk">
                      {settings.max_buys_per_mirror_per_day ?? '1'}
                    </p>
                  </div>

                  <div className="bg-void-black/30 border border-molten-gold/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-orbitron text-white font-semibold">Max buys per token per day</label>
                      <div className="flex gap-2">
                        <button
                          disabled
                          className="text-xs text-gray-500 font-space-grotesk underline cursor-not-allowed opacity-50"
                        >
                          change
                        </button>
                        <button
                          disabled
                          className="text-xs text-gray-500 font-space-grotesk underline cursor-not-allowed opacity-50"
                        >
                          remove
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-white/80 font-space-grotesk">
                      {settings.max_buys_per_token_per_day ?? '1'}
                    </p>
                  </div>
                </div>
              </div>
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
      </div>
    </DashboardLayout>
  )
}
