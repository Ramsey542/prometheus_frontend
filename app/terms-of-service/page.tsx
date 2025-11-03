'use client'

import Link from 'next/link'
import Navbar from '../../components/Navbar'

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-void-black text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-orbitron font-extrabold tracking-wider text-molten-gold">
            Terms of Service (ToS)
          </h1>
          <p className="mt-4 text-sm text-white/70 font-space-grotesk">
            Effective Date: November 2nd 2025
          </p>
          <p className="text-sm text-white/70 font-space-grotesk">
            Last Updated: November 2nd 2025
          </p>
        </div>

        <p className="text-white/90 leading-7 font-space-grotesk">
          Welcome to Prometheus Bot (“Prometheus,” “we,” “us,” or “our”). These Terms of Service (“Terms”) govern your use of the Prometheus platform, website, and associated applications (collectively, the “Services”). By accessing or using the Services, you agree to be bound by these Terms.
        </p>
        <p className="mt-4 text-white/90 leading-7 font-space-grotesk">
          If you do not agree, you may not access or use Prometheus.
        </p>

        <div className="my-8 h-px w-full bg-molten-gold/20" />

        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-orbitron font-bold tracking-wide text-molten-gold">1. Overview of Services</h2>
            <p className="mt-3 text-white/90 leading-7 font-space-grotesk">
              Prometheus Bot provides automated tools for cryptocurrency wallet monitoring, copy trading, and related analytics. Our Services may integrate with third-party blockchain APIs (e.g., Solana, Helius, or Moralis).
            </p>
            <p className="mt-2 text-white/90 leading-7 font-space-grotesk">
              Prometheus does not execute or custody trades directly — transactions occur through user-linked wallets or third-party protocols.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-orbitron font-bold tracking-wide text-molten-gold">2. Eligibility</h2>
            <p className="mt-3 text-white/90 leading-7 font-space-grotesk">You must:</p>
            <ul className="mt-2 list-disc list-inside space-y-2 text-white/90 leading-7 font-space-grotesk">
              <li>Be at least 18 years old.</li>
              <li>Have the legal capacity to enter into these Terms.</li>
              <li>Comply with all applicable laws in your jurisdiction.</li>
            </ul>
            <p className="mt-2 text-white/90 leading-7 font-space-grotesk">
              By using the Services, you represent that you meet these requirements.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-orbitron font-bold tracking-wide text-molten-gold">3. Account and Access</h2>
            <ul className="mt-3 list-disc list-inside space-y-2 text-white/90 leading-7 font-space-grotesk">
              <li>You are responsible for maintaining the confidentiality of any credentials, wallet keys, or API tokens you use.</li>
              <li>You agree not to share or resell access to the Services.</li>
              <li>We reserve the right to suspend or terminate access for violations of these Terms.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-orbitron font-bold tracking-wide text-molten-gold">4. Fees and Payments</h2>
            <ul className="mt-3 list-disc list-inside space-y-2 text-white/90 leading-7 font-space-grotesk">
              <li>Some features are free; others may require a subscription or transaction fee (e.g., percentage of copied trades).</li>
              <li>Fees are displayed within the platform before purchase.</li>
              <li>Payments are processed via supported crypto or fiat payment methods.</li>
              <li>All transactions are final and non-refundable unless required by law.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-orbitron font-bold tracking-wide text-molten-gold">5. Copy Trading Disclaimer</h2>
            <p className="mt-3 text-white/90 leading-7 font-space-grotesk">
              Prometheus enables users to automatically mirror the on-chain trades of selected wallets (“Leader Wallets”).
            </p>
            <ul className="mt-2 list-disc list-inside space-y-2 text-white/90 leading-7 font-space-grotesk">
              <li>You acknowledge that copy trading does not guarantee profit and may result in substantial losses.</li>
              <li>Prometheus does not endorse or verify the performance of any Leader Wallet.</li>
              <li>You assume full responsibility for trades made using the Service.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-orbitron font-bold tracking-wide text-molten-gold">6. User Responsibilities</h2>
            <p className="mt-3 text-white/90 leading-7 font-space-grotesk">You agree not to:</p>
            <ul className="mt-2 list-disc list-inside space-y-2 text-white/90 leading-7 font-space-grotesk">
              <li>Use the Services for illegal or fraudulent purposes.</li>
              <li>Attempt to gain unauthorized access to other users’ data or wallets.</li>
              <li>Reverse-engineer, copy, or modify any part of the platform.</li>
              <li>Use bots or scripts that overload or disrupt network operations.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-orbitron font-bold tracking-wide text-molten-gold">7. Third-Party Integrations</h2>
            <p className="mt-3 text-white/90 leading-7 font-space-grotesk">
              Prometheus may use third-party APIs or smart contracts for market data and trade execution. We are not responsible for the uptime, security, or accuracy of external providers.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-orbitron font-bold tracking-wide text-molten-gold">8. Intellectual Property</h2>
            <p className="mt-3 text-white/90 leading-7 font-space-grotesk">
              All content, branding, software, and designs within Prometheus are owned or licensed by us. You may not reproduce or distribute our assets without written consent.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-orbitron font-bold tracking-wide text-molten-gold">9. Limitation of Liability</h2>
            <p className="mt-3 text-white/90 leading-7 font-space-grotesk">To the maximum extent permitted by law:</p>
            <ul className="mt-2 list-disc list-inside space-y-2 text-white/90 leading-7 font-space-grotesk">
              <li>Prometheus and its affiliates are not liable for any direct, indirect, or consequential losses arising from your use of the Services.</li>
              <li>Prometheus does not provide financial, investment, or trading advice.</li>
            </ul>
            <p className="mt-2 text-white/90 leading-7 font-space-grotesk">Use the Services at your own risk.</p>
          </div>

          <div>
            <h2 className="text-xl font-orbitron font-bold tracking-wide text-molten-gold">10. Indemnification</h2>
            <p className="mt-3 text-white/90 leading-7 font-space-grotesk">You agree to defend and hold harmless Prometheus, its team, and affiliates from any claims or damages resulting from:</p>
            <ul className="mt-2 list-disc list-inside space-y-2 text-white/90 leading-7 font-space-grotesk">
              <li>Your use of the Services</li>
              <li>Your violation of these Terms</li>
              <li>Your breach of applicable law</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-orbitron font-bold tracking-wide text-molten-gold">11. Changes to Terms</h2>
            <p className="mt-3 text-white/90 leading-7 font-space-grotesk">
              We may update these Terms from time to time. Updates will take effect immediately upon posting. Your continued use constitutes acceptance of the revised Terms.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-orbitron font-bold tracking-wide text-molten-gold">12. Contact</h2>
            <p className="mt-3 text-white/90 leading-7 font-space-grotesk">
              If you have questions about these Terms, contact: <span className="text-molten-gold">support@prometheanorder.org</span>
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


