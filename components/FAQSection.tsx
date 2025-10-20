'use client'

import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

export default function FAQSection() {
  const faqs = [
    {
      question: "Why Prometheus over other SOL bots?",
      answer: "Prometheus offers superior MEV protection, real-time telemetry, and lightning-fast execution across Solana DEXs with our proprietary parallel routing system."
    },
    {
      question: "Do you support Pump.fun?",
      answer: "Yes, Prometheus is fully compatible with Pump.fun, Moonshot, and Boop.fun, providing seamless copy trading across all major Solana platforms."
    },
    {
      question: "How do Guild bounties pay?",
      answer: "Guild bounties pay up to 40% of fees from referrals. Earnings are distributed automatically to your connected wallet based on your referral performance."
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
          Questions from the Flame
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="space-y-4 mb-12"
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              viewport={{ once: true }}
              className="bg-black/50 border border-molten-gold/20 rounded-lg backdrop-blur-sm overflow-hidden"
            >
              <div className="w-full p-6 text-left flex items-center justify-between">
                <span className="text-lg font-orbitron font-bold text-white">
                  {faq.question}
                </span>
                <ChevronRight 
                  className="w-5 h-5 text-molten-gold"
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="flex justify-center"
        >
          <button className="px-8 py-4 bg-black/50 border border-white text-white font-orbitron font-bold tracking-wider hover:bg-white/10 transition duration-300 rounded-lg">
            Read the Covenant →
          </button>
        </motion.div>
      </div>
    </section>
  )
}
