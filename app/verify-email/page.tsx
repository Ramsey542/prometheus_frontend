'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, Suspense } from 'react'
import { Flame, ArrowLeft, CheckCircle, XCircle, Mail } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { verifyEmail, clearError } from '../../store/slices/authSlice'

function VerifyEmailContent() {
  const [otpCode, setOtpCode] = useState('')
  const [email, setEmail] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const dispatch = useAppDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoading, error } = useAppSelector((state: any) => state.auth)

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError())
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, dispatch])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !otpCode) {
      return
    }

    const result = await dispatch(verifyEmail({
      email: email,
      otp_code: otpCode
    }))

    if (verifyEmail.fulfilled.match(result)) {
      setShowSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen bg-void-black text-white relative overflow-hidden">
      <div className="static-noise" />
      <div className="crt-effect fixed inset-0 pointer-events-none z-50" />

      <header className="relative border-b border-molten-gold/20 backdrop-blur-sm bg-black/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition duration-300">
            <ArrowLeft className="w-6 h-6 text-molten-gold" />
            <Flame className="w-7 h-7 text-molten-gold animate-pulse" />
            <h1 className="text-2xl font-orbitron font-black tracking-wider text-molten-gold">
              PROMETHEUS
            </h1>
          </Link>
        </div>
      </header>

      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          <div className="relative p-8 border-2 border-molten-gold/50 bg-black/60 backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-molten-gold" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-molten-gold" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-molten-gold" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-molten-gold" />

            <div className="text-center mb-8">
              <Mail className="w-16 h-16 text-molten-gold mx-auto mb-4" />
              <h2 className="text-3xl font-orbitron font-bold text-molten-gold mb-2 tracking-wide">
                VERIFY YOUR EMAIL
              </h2>
              <p className="text-molten-gold/70 font-space-grotesk">
                Enter the OTP code sent to your email
              </p>
            </div>

            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-neural-emerald/20 border border-neural-emerald/50 rounded-lg"
              >
                <div className="flex items-center gap-2 text-neural-emerald">
                  <CheckCircle size={20} />
                  <span className="font-orbitron font-bold">Email verified! Redirecting to login...</span>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg"
              >
                <div className="flex items-center gap-2 text-red-400">
                  <XCircle size={20} />
                  <span className="font-orbitron font-bold">{error}</span>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-orbitron text-molten-gold mb-2 tracking-wide">
                  EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-transparent border-b-2 border-molten-gold/30 focus:border-molten-gold outline-none text-lg font-space-grotesk text-white py-3 px-2 transition-all duration-300 placeholder-gray-400"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-orbitron text-molten-gold mb-2 tracking-wide">
                  OTP CODE
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full bg-transparent border-b-2 border-molten-gold/30 focus:border-molten-gold outline-none text-lg font-space-grotesk text-white py-3 px-2 transition-all duration-300 placeholder-gray-400 text-center tracking-widest"
                  placeholder="000000"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || showSuccess}
                className="w-full py-4 bg-molten-gold text-void-black font-orbitron font-bold tracking-wider hover:brightness-110 transition duration-300 shadow-lg hover:shadow-molten-gold/50 hover:shadow-2xl relative group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-void-black border-t-transparent rounded-full animate-spin" />
                      VERIFYING...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      VERIFY EMAIL
                    </>
                  )}
                </span>
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-molten-gold/50 font-space-grotesk text-sm">
                <Link href="/login" className="text-molten-gold hover:text-neural-emerald transition duration-300">
                  Back to login
                </Link>
              </p>
            </div>
          </div>

          <div className="text-center mt-8">
            <div className="text-molten-gold/30 text-2xl font-orbitron">Ω Φ Ψ Ξ Σ Π Θ</div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-void-black text-white flex items-center justify-center">
        <div className="text-molten-gold">Loading...</div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

