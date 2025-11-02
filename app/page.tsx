'use client'

import { useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/store/hooks'
import HeroSection from '@/components/HeroSection'
import GreekRuneOverlay from '@/components/GreekRuneOverlay'
import SparkEffect from '@/components/SparkEffect'
import TelemetrySection from '@/components/TelemetrySection'
import WardsSection from '@/components/WardsSection'
import RiteOfFireSection from '@/components/RiteOfFireSection'
import FAQSection from '@/components/FAQSection'
import Footer from '@/components/Footer'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const { scrollYProgress } = useScroll()
  const router = useRouter()
  const { isAuthenticated } = useAppSelector((state) => state.auth)
  
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0.6])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/profile')
    }
  }, [isAuthenticated, router])

  if (!mounted) return null

  return (
    <main className="relative min-h-screen bg-void-black">
      {/* Static Noise Background */}
      <div className="static-noise" />
      
      {/* Greek Rune Overlay */}
      <GreekRuneOverlay />
      
      {/* CRT Effect Overlay */}
      <div className="crt-effect fixed inset-0 pointer-events-none z-50" />

      {/* Main Content */}
      <div className="relative z-10 w-full">
        <HeroSection />
        <TelemetrySection />
        <WardsSection />
        <RiteOfFireSection />
        <FAQSection />
        <Footer />
      </div>

      {/* Spark Effects Container */}
      <SparkEffect />
    </main>
  )
}

