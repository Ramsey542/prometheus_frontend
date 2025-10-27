import type { Metadata } from 'next'
import { Orbitron, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import AuthInitializer from '../components/AuthInitializer'

const orbitron = Orbitron({ 
  subsets: ['latin'],
  variable: '--font-orbitron',
  weight: ['400', '700', '900']
})

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['300', '400', '500', '600', '700']
})

export const metadata: Metadata = {
  title: 'Prometheus - Unleash the Flame',
  description: 'Divine knowledge becoming technology',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${orbitron.variable} ${spaceGrotesk.variable} antialiased`}>
        <Providers>
          <AuthInitializer />
          {children}
        </Providers>
      </body>
    </html>
  )
}

