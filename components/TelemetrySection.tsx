'use client'

import { motion } from 'framer-motion'

export default function TelemetrySection() {
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
          <button className="px-8 py-4 border border-white text-white font-orbitron font-bold tracking-wider hover:bg-white/10 transition duration-300 rounded-lg">
            Open Telemetry
          </button>
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
            <p className="text-3xl font-orbitron font-black text-white">
              — S
            </p>
          </div>
          
          <div className="bg-black/50 border border-molten-gold/20 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-lg font-orbitron font-bold text-molten-gold mb-2">
              Same-block fills
            </h3>
            <p className="text-3xl font-orbitron font-black text-white">
              — %
            </p>
          </div>
          
          <div className="bg-black/50 border border-molten-gold/20 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-lg font-orbitron font-bold text-molten-gold mb-2">
              24h copy trades
            </h3>
            <p className="text-3xl font-orbitron font-black text-white">
              —
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
