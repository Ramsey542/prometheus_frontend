'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { config } from '../lib/config'
import Image from 'next/image'

interface StatusData {
  sol_latency?: number
  bnb_latency?: number
  same_block_fills?: number
  copy_trades_24h?: number
}

export default function TelemetrySection() {
  const [statusData, setStatusData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${config.apiBaseUrl}/status`)
        console.log('the response', response)
        if (!response.ok) {
          throw new Error('Failed to fetch status')
        }
        const data = await response.json()
        setStatusData(data)
      } catch (error) {
        console.error('Failed to fetch status:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
  }, [])

  return (
    <section className="py-20 px-6 md:px-8 bg-void-black">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12"
        >
          <div className="mb-6 md:mb-0">
            <h2 className="text-4xl md:text-5xl font-orbitron font-black text-white mb-4">
              Forged in Zero-Block
            </h2>
            <p className="text-lg md:text-xl font-space-grotesk text-white max-w-2xl">
              Public telemetry: fills, median latency, same-block rate — refreshed in real time.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-black/50 border border-molten-gold/20 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-lg font-orbitron font-bold text-molten-gold mb-2">
              Median latency
            </h3>
            {loading ? (
              <p className="text-3xl font-orbitron font-black text-white">—</p>
            ) : (
              <div className="flex items-center gap-4">
                {statusData?.sol_latency !== undefined && (
                  <>
                    <div className="flex items-center gap-3">
                      <Image src="/assets/sol.png" alt="SOL" width={24} height={24} className="w-6 h-6" />
                      <p className="text-2xl font-orbitron font-black text-white">
                        {statusData.sol_latency}ms
                      </p>
                    </div>
                    {statusData?.bnb_latency !== undefined && (
                      <>
                        <div className="h-8 w-px bg-molten-gold/30"></div>
                        <div className="flex items-center gap-3">
                          <Image src="/assets/bnb.png" alt="BNB" width={24} height={24} className="w-6 h-6" />
                          <p className="text-2xl font-orbitron font-black text-white">
                            {statusData.bnb_latency}ms
                          </p>
                        </div>
                      </>
                    )}
                  </>
                )}
                {statusData?.sol_latency === undefined && statusData?.bnb_latency !== undefined && (
                  <div className="flex items-center gap-3">
                    <Image src="/assets/bnb.png" alt="BNB" width={24} height={24} className="w-6 h-6" />
                    <p className="text-3xl font-orbitron font-black text-white">
                      {statusData.bnb_latency}ms
                    </p>
                  </div>
                )}
                {statusData?.sol_latency === undefined && statusData?.bnb_latency === undefined && (
                  <p className="text-3xl font-orbitron font-black text-white">—</p>
                )}
              </div>
            )}
          </div>
          
          <div className="bg-black/50 border border-molten-gold/20 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-lg font-orbitron font-bold text-molten-gold mb-2">
              Same-block fills
            </h3>
            <p className="text-3xl font-orbitron font-black text-white">
              {loading ? '—' : statusData?.same_block_fills !== undefined ? `${statusData.same_block_fills}%` : '—'}
            </p>
          </div>
          
          <div className="bg-black/50 border border-molten-gold/20 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-lg font-orbitron font-bold text-molten-gold mb-2">
              24h copy trades
            </h3>
            <p className="text-3xl font-orbitron font-black text-white">
              {loading ? '—' : statusData?.copy_trades_24h !== undefined ? statusData.copy_trades_24h.toLocaleString() : '—'}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
