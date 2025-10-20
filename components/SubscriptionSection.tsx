'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'

export default function SubscriptionSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)

  const handleUnlock = () => {
    setIsUnlocking(true)
    setTimeout(() => {
      setIsUnlocking(false)
      setIsUnlocked(true)
    }, 2000)
  }

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-7xl font-orbitron font-bold crt-glow-text mb-6">
            SEIZE THE FIRE
          </h2>
          <p className="text-xl text-neural-emerald font-space-grotesk">
            Choose your path to enlightenment
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Starter Plan */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative p-8 border border-molten-gold/30 hover:border-molten-gold transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,184,0,0.3)] ember-transition"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">🔥</div>
              <h3 className="text-3xl font-orbitron font-bold text-molten-gold mb-4">SPARK</h3>
              <div className="text-5xl font-orbitron font-bold text-neural-emerald mb-6">
                $49<span className="text-xl text-molten-gold/50">/mo</span>
              </div>
              <ul className="text-left space-y-4 mb-8 font-space-grotesk text-molten-gold/70">
                <li className="flex items-start">
                  <span className="text-neural-emerald mr-2">→</span>
                  <span>Basic copy trading</span>
                </li>
                <li className="flex items-start">
                  <span className="text-neural-emerald mr-2">→</span>
                  <span>Up to 3 wallets</span>
                </li>
                <li className="flex items-start">
                  <span className="text-neural-emerald mr-2">→</span>
                  <span>Standard support</span>
                </li>
              </ul>
              <button className="prometheus-button w-full">
                BEGIN
              </button>
            </div>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative p-8 border-2 border-molten-gold hover:shadow-[0_0_60px_rgba(255,184,0,0.5)] transition-all duration-500 ember-transition scale-105"
          >
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-molten-gold text-void-black px-6 py-1 font-orbitron font-bold text-sm">
              MOST CHOSEN
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-3xl font-orbitron font-bold text-molten-gold mb-4">FLAME</h3>
              <div className="text-5xl font-orbitron font-bold text-neural-emerald mb-6">
                $149<span className="text-xl text-molten-gold/50">/mo</span>
              </div>
              <ul className="text-left space-y-4 mb-8 font-space-grotesk text-molten-gold/70">
                <li className="flex items-start">
                  <span className="text-neural-emerald mr-2">→</span>
                  <span>Advanced AI trading</span>
                </li>
                <li className="flex items-start">
                  <span className="text-neural-emerald mr-2">→</span>
                  <span>Unlimited wallets</span>
                </li>
                <li className="flex items-start">
                  <span className="text-neural-emerald mr-2">→</span>
                  <span>Priority support</span>
                </li>
                <li className="flex items-start">
                  <span className="text-neural-emerald mr-2">→</span>
                  <span>Multi-chain access</span>
                </li>
              </ul>
              <button 
                className="prometheus-button w-full"
                onClick={handleUnlock}
              >
                {isUnlocking ? 'IGNITING...' : isUnlocked ? 'UNLOCKED ✓' : 'IGNITE'}
              </button>
            </div>

            {/* Chain breaking animation */}
            {isUnlocking && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ 
                      scale: 0, 
                      opacity: 0,
                      x: Math.cos((i / 8) * Math.PI * 2) * 100,
                      y: Math.sin((i / 8) * Math.PI * 2) * 100,
                    }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="absolute text-4xl"
                  >
                    ⛓️
                  </motion.div>
                ))}
              </div>
            )}

            {/* Unlocked message */}
            {isUnlocked && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-neural-emerald/10 border border-neural-emerald px-6 py-2 rounded"
              >
                <p className="text-neural-emerald font-orbitron font-bold whitespace-nowrap">
                  You've unlocked the flame 🔥
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Enterprise Plan */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="relative p-8 border border-molten-gold/30 hover:border-molten-gold transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,184,0,0.3)] ember-transition"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">👁️</div>
              <h3 className="text-3xl font-orbitron font-bold text-molten-gold mb-4">TITAN</h3>
              <div className="text-5xl font-orbitron font-bold text-neural-emerald mb-6">
                $499<span className="text-xl text-molten-gold/50">/mo</span>
              </div>
              <ul className="text-left space-y-4 mb-8 font-space-grotesk text-molten-gold/70">
                <li className="flex items-start">
                  <span className="text-neural-emerald mr-2">→</span>
                  <span>Custom strategies</span>
                </li>
                <li className="flex items-start">
                  <span className="text-neural-emerald mr-2">→</span>
                  <span>Dedicated account manager</span>
                </li>
                <li className="flex items-start">
                  <span className="text-neural-emerald mr-2">→</span>
                  <span>API access</span>
                </li>
                <li className="flex items-start">
                  <span className="text-neural-emerald mr-2">→</span>
                  <span>White-label options</span>
                </li>
              </ul>
              <button className="prometheus-button w-full">
                ASCEND
              </button>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-20 text-center"
        >
          <p className="text-molten-gold/50 font-space-grotesk text-sm">
            "I stole fire from the gods and gave it to humanity" — Prometheus
          </p>
        </motion.div>
      </div>
    </section>
  )
}

