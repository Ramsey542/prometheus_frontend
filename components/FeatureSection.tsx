'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const features = [
  {
    icon: '⚡',
    title: 'DIVINE EXECUTION',
    description: 'Lightning-fast trades executed with godlike precision. No hesitation, no delay.',
    greek: 'Δύναμις',
  },
  {
    icon: '🔥',
    title: 'PROMETHEUS ALGORITHM',
    description: 'Advanced AI that learns, adapts, and evolves. The fire that never dies.',
    greek: 'Σοφία',
  },
  {
    icon: '⛓️',
    title: 'CHAIN LIBERATION',
    description: 'Multi-chain support. Break the chains of limitation.',
    greek: 'Ελευθερία',
  },
]

export default function FeatureSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center px-4 py-20 greek-container">
      <div className="max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-7xl font-orbitron font-bold text-white mb-6">
            THE POWER WITHIN
          </h2>
          <p className="text-xl text-gray-300 font-space-grotesk">
            Ancient wisdom coded into modern architecture
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="relative group"
            >
              <div className="relative p-8 border border-molten-gold/30 hover:border-molten-gold transition-all duration-500 ember-transition hover:shadow-[0_0_30px_rgba(255,184,0,0.3)] greek-container">
                {/* Greek watermark */}
                <div className="absolute top-4 right-4 text-6xl opacity-10 text-molten-gold font-serif">
                  {feature.greek}
                </div>

                <div className="text-6xl mb-6">{feature.icon}</div>
                
                <h3 className="text-2xl font-orbitron font-bold text-white mb-4 tracking-wide">
                  {feature.title}
                </h3>
                
                <p className="text-lg font-space-grotesk text-gray-300 leading-relaxed">
                  {feature.description}
                </p>

                {/* Data streams on hover */}
                <div className="absolute top-1/2 left-0 w-full h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="data-stream w-full" />
                </div>

                {/* Greek runes that appear on hover */}
                <div className="greek-rune absolute bottom-4 left-4 text-4xl">α</div>
                <div className="greek-rune absolute top-1/2 left-1/2 text-3xl">ω</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

