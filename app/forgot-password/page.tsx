'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Flame, ArrowLeft, Eye, EyeOff, CheckCircle, XCircle, Mail, Lock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { requestPasswordReset, resetPassword, clearError } from '../../store/slices/authSlice'

type Step = 'email' | 'otp'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const dispatch = useAppDispatch()
  const router = useRouter()
  const { isLoading, error } = useAppSelector((state: any) => state.auth)

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError())
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, dispatch])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      return
    }

    const result = await dispatch(requestPasswordReset({ email }))
    
    if (requestPasswordReset.fulfilled.match(result)) {
      setStep('otp')
    }
  }

  const handleTokenAndPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log(resetToken, password, confirmPassword)
    if (!resetToken || !password || password !== confirmPassword) {
      return
    }

    const result = await dispatch(resetPassword({
      token: resetToken,
      new_password: password
    }))

    if (resetPassword.fulfilled.match(result)) {
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
          <Link href="/login" className="flex items-center gap-2 hover:opacity-80 transition duration-300">
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
              {step === 'email' && (
                <>
                  <Mail className="w-16 h-16 text-molten-gold mx-auto mb-4" />
                  <h2 className="text-3xl font-orbitron font-bold text-molten-gold mb-2 tracking-wide">
                    RESET PASSWORD
                  </h2>
                  <p className="text-molten-gold/70 font-space-grotesk">
                    Enter your email to receive a reset token
                  </p>
                </>
              )}
              {step === 'otp' && (
                <>
                  <Lock className="w-16 h-16 text-molten-gold mx-auto mb-4" />
                  <h2 className="text-3xl font-orbitron font-bold text-molten-gold mb-2 tracking-wide">
                    RESET PASSWORD
                  </h2>
                  <p className="text-molten-gold/70 font-space-grotesk">
                    Enter the reset token from your email and your new password
                  </p>
                </>
              )}
            </div>

            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-neural-emerald/20 border border-neural-emerald/50 rounded-lg"
              >
                <div className="flex items-center gap-2 text-neural-emerald">
                  <CheckCircle size={20} />
                  <span className="font-orbitron font-bold">Password reset successfully! Redirecting to login...</span>
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

            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-6">
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-molten-gold text-void-black font-orbitron font-bold tracking-wider hover:brightness-110 transition duration-300 shadow-lg hover:shadow-molten-gold/50 hover:shadow-2xl relative group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-void-black border-t-transparent rounded-full animate-spin" />
                        SENDING...
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        SEND RESET TOKEN
                      </>
                    )}
                  </span>
                </button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleTokenAndPasswordSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-orbitron text-molten-gold mb-2 tracking-wide">
                    RESET TOKEN
                  </label>
                  <input
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required
                    className="w-full bg-transparent border-b-2 border-molten-gold/30 focus:border-molten-gold outline-none text-lg font-space-grotesk text-white py-3 px-2 transition-all duration-300 placeholder-gray-400"
                    placeholder="Paste the reset token from your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-orbitron text-molten-gold mb-2 tracking-wide">
                    NEW PASSWORD
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-transparent border-b-2 border-molten-gold/30 focus:border-molten-gold outline-none text-lg font-space-grotesk text-white py-3 px-2 pr-10 transition-all duration-300 placeholder-gray-400"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-molten-gold/50 hover:text-molten-gold transition duration-300"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-orbitron text-molten-gold mb-2 tracking-wide">
                    CONFIRM PASSWORD
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full bg-transparent border-b-2 border-molten-gold/30 focus:border-molten-gold outline-none text-lg font-space-grotesk text-white py-3 px-2 pr-10 transition-all duration-300 placeholder-gray-400"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-molten-gold/50 hover:text-molten-gold transition duration-300"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || showSuccess || password !== confirmPassword}
                  className="w-full py-4 bg-molten-gold text-void-black font-orbitron font-bold tracking-wider hover:brightness-110 transition duration-300 shadow-lg hover:shadow-molten-gold/50 hover:shadow-2xl relative group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-void-black border-t-transparent rounded-full animate-spin" />
                        RESETTING...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        RESET PASSWORD
                      </>
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="w-full py-2 text-molten-gold/70 hover:text-molten-gold transition duration-300 font-space-grotesk text-sm"
                >
                  Back to email
                </button>
              </form>
            )}

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

