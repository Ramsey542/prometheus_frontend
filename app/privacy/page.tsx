'use client'

import Link from 'next/link'
import Navbar from '../../components/Navbar'

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-void-black text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-orbitron font-extrabold tracking-wider text-molten-gold">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-white/70 font-space-grotesk">
            Effective Date: November 2nd 2025
          </p>
          <p className="text-sm text-white/70 font-space-grotesk">
            Last Updated: November 2nd 2025
          </p>
        </div>

        <p className="text-white/90 leading-7 font-space-grotesk">
          Prometheus Bot (“Prometheus,” “we,” “us,” or “our”) values your privacy. This policy explains how we collect, use, and protect information when you use our Services.
        </p>

        <section className="space-y-6 mt-8">
          <div>
            <h2 className="text-xl font-orbitron font-bold tracking-wide text-molten-gold">1. Information We Collect</h2>
            <h3 className="mt-3 font-semibold font-space-grotesk">a. User-Provided Data:</h3>
            <ul className="mt-2 list-disc list-inside space-y-2 text-white/90 leading-7 font-space-grotesk">
              <li>Email, username, or wallet address (if you create an account).</li>
              <li>Payment or subscription details (handled securely by payment processors).</li>
            </ul>
            <h3 className="mt-4 font-semibold font-space-grotesk">b. Automatically Collected Data:</h3>
            <ul className="mt-2 list-disc list-inside space-y-2 text-white/90 leading-7 font-space-grotesk">
              <li>Device type, browser, IP address, timestamps.</li>
              <li>Blockchain wallet data (public on-chain addresses only).</li>
            </ul>
            <p className="mt-2 text-white/90 leading-7 font-space-grotesk">We do not collect private keys or seed phrases.</p>
          </div>

          <div>
            <h2 className="text-xl font-orbitron font-bold tracking-wide text-molten-gold">2. How We Use Data</h2>
            <ul className="mt-3 list-disc list-inside space-y-2 text-white/90 leading-7 font-space-grotesk">
              <li>To provide and improve Services.</li>
              <li>To process payments and manage subscriptions.</li>
              <li>To send service-related updates or security notices.</li>
              <li>To monitor platform health and detect abuse.</li>
            </ul>
            <p className="mt-2 text-white/90 leading-7 font-space-grotesk">We do not sell or rent user data.</p>
          </div>

          <div>
            <h2 className="text-xl font-orbitron font-bold tracking-wide text-molten-gold">3. Data Storage and Security</h2>
            <ul className="mt-3 list-disc list-inside space-y-2 text-white/90 leading-7 font-space-grotesk">
              <li>We use encrypted storage and secure access control.</li>
              <li>Wallet or blockchain data remains public and immutable by design.</li>
              <li>While we take reasonable measures, no online service is 100% secure.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-orbitron font-bold tracking-wide text-molten-gold">4. Data Sharing</h2>
            <p className="mt-3 text-white/90 leading-7 font-space-grotesk">We may share limited data with:</p>
            <ul className="mt-2 list-disc list-inside space-y-2 text-white/90 leading-7 font-space-grotesk">
              <li>Service providers (payment processors, analytics platforms, etc.)</li>
              <li>Law enforcement, if legally required.</li>
            </ul>
            <p className="mt-2 text-white/90 leading-7 font-space-grotesk">We do not share data for marketing without consent.</p>
          </div>

          <div>
            <h2 className="text-xl font-orbitron font-bold tracking-wide text-molten-gold">5. Cookies & Analytics</h2>
            <p className="mt-3 text-white/90 leading-7 font-space-grotesk">
              We may use cookies or third-party analytics to improve site functionality. Users can disable cookies in their browser settings.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-orbitron font-bold tracking-wide text-molten-gold">6. Your Rights</h2>
            <p className="mt-3 text-white/90 leading-7 font-space-grotesk">Depending on your jurisdiction, you may:</p>
            <ul className="mt-2 list-disc list-inside space-y-2 text-white/90 leading-7 font-space-grotesk">
              <li>Request access to or deletion of your data.</li>
              <li>Withdraw consent for communications.</li>
              <li>Opt out of analytics or cookies.</li>
            </ul>
            <p className="mt-2 text-white/90 leading-7 font-space-grotesk">Requests can be made to: <span className="text-molten-gold">privacy@prometheusbot.io</span></p>
          </div>

          <div>
            <h2 className="text-xl font-orbitron font-bold tracking-wide text-molten-gold">7. Policy Updates</h2>
            <p className="mt-3 text-white/90 leading-7 font-space-grotesk">
              We may update this policy periodically. Updates take effect upon posting on our website.
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


