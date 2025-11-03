'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const toggle = (index: number) => {
    setOpenIndex(prev => (prev === index ? null : index))
  }
  const faqs = [
    {
      question: "Why Prometheus over other SOL bots?",
      answer: "Prometheus delivers verified zero-block execution, tiered MEV and price-impact protection, and full on-chain transparency. Unlike most Solana bots, it proves its speed with a public telemetry dashboard, keeps your funds in your own wallet, and adds smart safety tools like risk caps and slippage bands. Faster. Safer. Transparent."
    },
    {
      question: "Do you support Pump.fun?",
      answer: "Yes. Prometheus fully supports Pump.fun along with Moonshot and other Solana launch platforms. Trades from these platforms are copied automatically with slippage guards and honeypot filters to protect users during volatile launches. We also support BSC. Detailed list available on discord."
    },
    {
      question: "How do Guild bounties pay?",
      answer: "Guild Bounties pay automatically through our on-chain referral system. When a trader joins using your referral link, you earn up to 40% of their transaction fees in real time. Rewards are credited to your linked wallet — no manual claims, no waiting periods."
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
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.05 * index }}
                viewport={{ once: true }}
                className="bg-black/50 border border-molten-gold/20 rounded-lg backdrop-blur-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${index}`}
                >
                  <span className="text-lg font-orbitron font-bold text-white pr-6">
                    {faq.question}
                  </span>
                  <ChevronRight 
                    className={`w-5 h-5 text-molten-gold transition-transform ${isOpen ? 'rotate-90' : ''}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      id={`faq-panel-${index}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="px-6 pb-6"
                    >
                      <p className="text-white/90 leading-7 font-space-grotesk whitespace-pre-line">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
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
