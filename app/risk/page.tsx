'use client'

import Link from 'next/link'
import Navbar from '../../components/Navbar'

export default function RiskDisclosurePage() {
  return (
    <main className="min-h-screen bg-void-black text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-orbitron font-extrabold tracking-wider text-molten-gold">
            Risk Disclosure Statement
          </h1>
          <p className="mt-4 text-sm text-white/70 font-space-grotesk">
            Effective Date: November 2nd 2025
          </p>
        </div>

        <p className="text-white/90 leading-7 font-space-grotesk">
          Trading cryptocurrencies, including through automated systems like Prometheus Bot, involves substantial risk. You should carefully consider whether such trading is suitable for you.
        </p>

        <section className="space-y-6 mt-8">
          <div>
            <h2 className="text-xl font-orbitron font-bold tracking-wide text-molten-gold">1. Market Risk</h2>
            <p className="mt-3 text-white/90 leading-7 font-space-grotesk">
              Cryptocurrency markets are highly volatile. Prices can fluctuate dramatically within seconds and may result in partial or total loss of funds.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-orbitron font-bold tracking-wide text-molten-gold">2. Technology Risk</h2>
            <p className="mt-3 text-white/90 leading-7 font-space-grotesk">
              Prometheus relies on blockchain networks, APIs, and smart contracts. System failures, API downtime, or code vulnerabilities may lead to execution delays or losses.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-orbitron font-bold tracking-wide text-molten-gold">3. Automation Risk</h2>
            <p className="mt-3 text-white/90 leading-7 font-space-grotesk">
              The copy-trading mechanism executes trades automatically based on external wallets. Unexpected market movements or strategy changes from those wallets can impact results.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-orbitron font-bold tracking-wide text-molten-gold">4. Third-Party Risk</h2>
            <p className="mt-3 text-white/90 leading-7 font-space-grotesk">
              Prometheus integrates with third-party providers. We do not control or guarantee their reliability, liquidity, or data accuracy.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-orbitron font-bold tracking-wide text-molten-gold">5. No Investment Advice</h2>
            <p className="mt-3 text-white/90 leading-7 font-space-grotesk">
              Prometheus does not provide financial advice. All information and tools are for informational and automation purposes only.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-orbitron font-bold tracking-wide text-molten-gold">6. Limitation of Liability</h2>
            <p className="mt-3 text-white/90 leading-7 font-space-grotesk">
              By using Prometheus, you agree that the platform and its team are not responsible for any loss or damage resulting from use of the Services.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-orbitron font-bold tracking-wide text-molten-gold">7. User Responsibility</h2>
            <p className="mt-3 text-white/90 leading-7 font-space-grotesk">You are solely responsible for:</p>
            <ul className="mt-2 list-disc list-inside space-y-2 text-white/90 leading-7 font-space-grotesk">
              <li>Managing your private keys and wallets.</li>
              <li>Understanding the trading strategies you follow.</li>
              <li>Ensuring compliance with your local laws and regulations.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-orbitron font-bold tracking-wide text-molten-gold">8. Acknowledgment</h2>
            <p className="mt-3 text-white/90 leading-7 font-space-grotesk">
              By accessing or using Prometheus Bot, you acknowledge that you have read, understood, and accept these risks.
            </p>
          </div>
        </section>

        <div className="mt-10">
          <Link href="/" className="text-sm text-molten-gold hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}


