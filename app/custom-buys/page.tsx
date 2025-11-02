'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../components/DashboardLayout'
import { CheckCircle, XCircle } from 'lucide-react'
import { useAppSelector } from '../../store/hooks'
import { walletTrackerApi } from '../../services/walletTrackerApi'

export default function CustomBuysPage() {
  const { selectedCoin } = useAppSelector((s) => s.auth)
  const [tokenAddress, setTokenAddress] = useState('')
  const [sellAmount, setSellAmount] = useState('')
  const [slippage, setSlippage] = useState('')
  const [selling, setSelling] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSell = async () => {
    if (!tokenAddress || !sellAmount || !slippage) {
      setErrorMessage('All fields are required')
      return
    }
    const slippageNum = parseFloat(slippage)
    if (isNaN(slippageNum) || slippageNum < 1 || slippageNum > 100) {
      setErrorMessage('Slippage must be between 1 and 100 percent')
      return
    }
    try {
      setSelling(true)
      setSuccessMessage(null)
      setErrorMessage(null)
      const res = await walletTrackerApi.customSell(selectedCoin, tokenAddress.trim(), parseFloat(sellAmount), slippageNum)
      setSuccessMessage(res?.message || 'Sell order submitted')
    } catch (err: any) {
      setErrorMessage(err.message || 'Sell failed')
    } finally {
      setSelling(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-8">
        <div className="bg-gradient-to-r from-void-black/95 to-black/90 backdrop-blur-md border border-molten-gold/30 rounded-lg p-4 md:p-8 shadow-2xl shadow-molten-gold/10">
          <h1 className="text-xl md:text-3xl font-orbitron font-bold text-molten-gold mb-4 md:mb-6">Sell Owned Tokens</h1>

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg mb-6"
            >
              <div className="flex items-center gap-2 text-red-400">
                <XCircle size={20} />
                <span className="font-orbitron font-bold">{errorMessage}</span>
              </div>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg mb-6"
            >
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle size={20} />
                <span className="font-orbitron font-bold">{successMessage}</span>
              </div>
            </motion.div>
          )}

          <div className="space-y-4 md:space-y-6">
            <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4 md:p-6">
              <h3 className="text-base md:text-lg font-orbitron font-semibold text-white mb-3 md:mb-4">Token Contract Address</h3>
              <input
                type="text"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                placeholder="Enter CA"
              />
            </div>

            <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4 md:p-6">
              <h3 className="text-base md:text-lg font-orbitron font-semibold text-white mb-3 md:mb-4">Slippage (%)</h3>
              <input
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                placeholder="1.0"
                min="1"
                max="100"
                step="0.1"
                required
              />
              <p className="text-xs text-white/60 mt-2 font-space-grotesk">Slippage must be between 1 and 100 percent</p>
            </div>

            <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-4 md:p-6">
              <h3 className="text-base md:text-lg font-orbitron font-semibold text-white mb-3 md:mb-4">Sell Amount (Token amount)</h3>
              <input
                type="number"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                className="w-full bg-void-black/50 border border-molten-gold/20 rounded-lg px-3 py-2 text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors duration-300"
                placeholder="0.00"
                min="0"
                step="0.0001"
                disabled={selling}
              />
              <motion.button
                onClick={handleSell}
                disabled={selling || !tokenAddress || !sellAmount || !slippage}
                className="mt-4 w-full py-3 bg-red-500/20 border border-red-500/40 text-red-300 font-orbitron font-bold rounded-lg hover:bg-red-500/30 transition-all duration-300 disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {selling ? 'Processing sell...' : 'Sell'}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}


