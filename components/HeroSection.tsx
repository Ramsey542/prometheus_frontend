'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Flame, Menu, X, Zap, Code2 } from 'lucide-react'
import Link from 'next/link'

export default function HeroSection() {
  const [binaryText, setBinaryText] = useState<string[]>([])
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const binary = Array.from({ length: 100 }, () => (Math.random() > 0.5 ? '1' : '0'))
    setBinaryText(binary)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 md:px-8 greek-container">
      {/* Background Binary Fire (kept, toned down) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        {binaryText.map((char, i) => (
          <span
            key={i}
            className="binary-char absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              // @ts-ignore
              '--i': i % 10,
            }}
          >
            {char}
          </span>
        ))}
      </div>

      {/* Header (positioned within hero top) */}
      <header className="absolute top-0 left-0 right-0 border-b border-molten-gold/20 bg-black/50 backdrop-blur-sm z-[60]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Flame className="w-7 h-7 text-molten-gold animate-pulse" />
            <h1 className="text-2xl md:text-3xl font-orbitron font-black tracking-wider text-molten-gold">
              PROMETHEUS
            </h1>
          </div>
          <nav className="hidden md:flex gap-8 items-center">
            {['Telemetry', 'Wards', 'How it Works', 'Covenant', 'Guild'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm tracking-widest text-white hover:text-molten-gold transition duration-300"
              >
                {item}
              </a>
            ))}
            <button className="px-4 py-2 border border-white text-white text-sm tracking-widest hover:bg-white/10 transition duration-300 rounded-lg">
              Temple
            </button>
            <Link href="/signup" className="px-6 py-2 bg-molten-gold text-void-black font-bold text-sm tracking-widest hover:brightness-110 transition duration-300 rounded-lg">
              Enter the Forge
            </Link>
          </nav>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-molten-gold">
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-black/90 backdrop-blur-sm border-t border-molten-gold/20 relative z-[60]"
          >
            <div className="px-6 py-4 space-y-4">
              {['Telemetry', 'Wards', 'How it Works', 'Covenant', 'Guild'].map((item) => (
                <a
                  key={item}
                  href="#"
                  onClick={() => setMenuOpen(false)}
                  className="block text-sm tracking-widest text-white hover:text-molten-gold transition duration-300 py-2"
                >
                  {item}
                </a>
              ))}
              <div className="pt-4 space-y-3">
                <button 
                  onClick={() => setMenuOpen(false)}
                  className="w-full px-4 py-2 border border-white text-white text-sm tracking-widest hover:bg-white/10 transition duration-300 rounded-lg"
                >
                  Temple
                </button>
                <Link 
                  href="/signup" 
                  onClick={() => setMenuOpen(false)}
                  className="block w-full px-6 py-2 bg-molten-gold text-void-black font-bold text-sm tracking-widest hover:brightness-110 transition duration-300 rounded-lg text-center"
                >
                  Enter the Forge
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </header>

      {/* Main Content */}
      <div className="left-20 z-10 text-left max-w-4xl pt-24 ">

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1 }}
          className="text-6xl md:text-8xl font-orbitron font-black mb-6 tracking-tight leading-tight text-white"
        >
          Trade by <span className="text-molten-gold">Fire</span>.<br />
          Mirror the <span className="text-molten-gold">Titans</span>.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.25 }}
          className="text-lg md:text-xl font-space-grotesk text-white mb-10 leading-relaxed"
        >
          Lightning-grade Solana copy trading with price-impact shields, MEV wards, and public speed telemetry. Bind to Oracles and let the flame follow the whales.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="flex flex-col md:flex-row gap-6 justify-start mb-8"
        >
          <Link href="/signup" className="px-8 py-4 bg-molten-gold text-void-black font-orbitron font-bold tracking-wider hover:brightness-110 transition duration-300 inline-block rounded-lg">
            Enter the Forge
          </Link>
          <button className="px-8 py-4 border border-white text-white font-orbitron font-bold tracking-wider hover:bg-white/10 transition duration-300 rounded-lg">
            View Live Speed
          </button>
        </motion.div>

        {/* Compatibility Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-sm text-gray-400 font-space-grotesk"
        >
          Compatible with Pump.fun • Moonshot • Boop.fun
        </motion.div>
      </div>

      {/* Decorative Greek Symbols (kept subtle) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="text-8xl greek-rune absolute" style={{ top: '15%', left: '5%' }}>Ω</div>
        <div className="text-8xl greek-rune absolute" style={{ top: '20%', left: '8%' }}>Φ</div>
        <div className="text-8xl greek-rune absolute" style={{ bottom: '20%', left: '10%' }}>Ψ</div>
        <div className="text-8xl greek-rune absolute" style={{ bottom: '15%', left: '6%' }}>Ξ</div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-molten-gold rounded-full flex items-start justify-center p-2">
          <motion.div
            className="w-1 h-2 bg-molten-gold rounded-full"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  )
}

