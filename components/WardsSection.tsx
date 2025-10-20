'use client'

import { motion } from 'framer-motion'

export default function WardsSection() {
  const wards = [
    {
      title: "Fire-Fast Execution",
      description: "Latency-tuned copy trades across Solana DEXs with parallel routing."
    },
    {
      title: "MEV Wards",
      description: "Tiered MEV protection with automatic price-impact guards."
    },
    {
      title: "Oracle Wallets",
      description: "Curated alpha feed refreshed daily; follow, cap, and time-out per wallet."
    },
    {
      title: "Guild Bounties",
      description: "Earn up to 40% of fees from referrals. Bring fuel to the flame."
    }
  ]

  return (
    <section className="py-20 px-6 md:px-8 bg-void-black">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-orbitron font-black text-white mb-12"
        >
          Wards & Weapons
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {wards.map((ward, index) => (
            <motion.div
              key={ward.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              viewport={{ once: true }}
              className="bg-black/50 border border-molten-gold/20 rounded-lg p-6 backdrop-blur-sm hover:border-molten-gold/40 transition duration-300"
            >
              <h3 className="text-xl font-orbitron font-bold text-molten-gold mb-3">
                {ward.title}
              </h3>
              <p className="text-white font-space-grotesk leading-relaxed">
                {ward.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
