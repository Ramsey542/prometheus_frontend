'use client'

import { motion } from 'framer-motion'

export default function RiteOfFireSection() {
  const steps = [
    {
      number: "01",
      title: "Enter the Forge",
      description: "Connect wallet, pick a profile, set base risk."
    },
    {
      number: "02", 
      title: "Fund in SOL",
      description: "Stable fee model; instant account state."
    },
    {
      number: "03",
      title: "Bind to Oracles", 
      description: "Follow wallets with caps, slippage bands, & kill-switch."
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
          Rite of Fire
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              viewport={{ once: true }}
              className="bg-black/50 border border-molten-gold/20 rounded-lg p-6 backdrop-blur-sm"
            >
              <div className="text-2xl font-orbitron font-black text-white mb-3">
                {step.number}
              </div>
              <h3 className="text-xl font-orbitron font-bold text-molten-gold mb-3">
                {step.title}
              </h3>
              <p className="text-white font-space-grotesk leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="flex justify-center"
        >
        </motion.div>
      </div>
    </section>
  )
}
