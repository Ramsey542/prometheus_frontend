'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'

export default function WalletSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })
  const [walletAddress, setWalletAddress] = useState('')
  const [isTransforming, setIsTransforming] = useState(false)

  const greekRuneMap: { [key: string]: string } = {
    '0': 'Ο', '1': 'Ι', '2': 'Ζ', '3': 'Ε', '4': 'Α',
    '5': 'Σ', '6': 'Β', '7': 'Ψ', '8': 'Θ', '9': 'Π',
    'a': 'α', 'b': 'β', 'c': 'χ', 'd': 'δ', 'e': 'ε',
    'f': 'φ', 'A': 'Α', 'B': 'Β', 'C': 'Χ', 'D': 'Δ',
    'E': 'Ε', 'F': 'Φ', 'x': 'ξ', 'X': 'Ξ',
  }

  const transformToGreek = (text: string) => {
    return text.split('').map(char => greekRuneMap[char] || char).join('')
  }

  const handleFocus = () => {
    setIsTransforming(true)
  }

  const handleBlur = () => {
    setTimeout(() => setIsTransforming(false), 2000)
  }

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl md:text-7xl font-orbitron font-bold crt-glow-text mb-6">
            CONNECT YOUR VESSEL
          </h2>
          <p className="text-xl text-neural-emerald font-space-grotesk">
            Inscribe your address in the ancient tongue
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative"
        >
          <div className="relative p-8 border-2 border-molten-gold/50 hover:border-molten-gold transition-all duration-500 bg-void-black/50 backdrop-blur-sm">
            {/* Greek Rune Display */}
            {isTransforming && walletAddress && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -top-12 left-0 right-0 text-center"
              >
                <div className="text-2xl font-serif text-molten-gold opacity-70 tracking-widest greek-rune" style={{ opacity: 0.7 }}>
                  {transformToGreek(walletAddress)}
                </div>
              </motion.div>
            )}

            <div className="mb-6">
              <label className="block text-lg font-orbitron text-molten-gold mb-4 tracking-wide">
                WALLET ADDRESS
              </label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="0x..."
                className="w-full bg-transparent border-b-2 border-molten-gold/30 focus:border-molten-gold outline-none text-xl font-space-grotesk text-neural-emerald py-4 px-2 transition-all duration-300 placeholder-molten-gold/20"
                style={{
                  textShadow: '0 0 10px rgba(0, 255, 159, 0.5)',
                }}
              />
            </div>

            <button className="prometheus-button w-full mt-8">
              FORGE CONNECTION
            </button>

            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-molten-gold" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-molten-gold" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-molten-gold" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-molten-gold" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

