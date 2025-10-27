'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Flame, ArrowLeft, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { loginWithProfile, clearError } from '../../store/slices/authSlice'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const dispatch = useAppDispatch()
  const router = useRouter()
  const { isLoading, error, isAuthenticated, user } = useAppSelector((state: any) => state.auth)

  useEffect(() => {
    if (isAuthenticated && user) {
      router.push('/')
    }
  }, [isAuthenticated, user, router])

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

    const result = await dispatch(loginWithProfile({
      username: formData.username,
      password: formData.password
    }))

    if (loginWithProfile.fulfilled.match(result)) {
      setShowSuccess(true)
      setTimeout(() => {
        router.push('/')
      }, 1500)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-void-black text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="static-noise" />
      <div className="crt-effect fixed inset-0 pointer-events-none z-50" />
      


      {/* Header */}
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

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          {/* Login Form */}
          <div className="relative p-8 border-2 border-molten-gold/50 bg-black/60 backdrop-blur-sm">
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-molten-gold" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-molten-gold" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-molten-gold" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-molten-gold" />

            <div className="text-center mb-8">
              <h2 className="text-3xl font-orbitron font-bold text-molten-gold mb-2 tracking-wide">
                ENTER THE FLAME
              </h2>
              <p className="text-molten-gold/70 font-space-grotesk">
                Rekindle your connection to the forge
              </p>
            </div>

            {/* Success Message */}
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-neural-emerald/20 border border-neural-emerald/50 rounded-lg"
              >
                <div className="flex items-center gap-2 text-neural-emerald">
                  <CheckCircle size={20} />
                  <span className="font-orbitron font-bold">Login successful! Redirecting...</span>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
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
              {/* Username Field */}
              <div>
                <label className="block text-sm font-orbitron text-molten-gold mb-2 tracking-wide">
                  USERNAME
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent border-b-2 border-molten-gold/30 focus:border-molten-gold outline-none text-lg font-space-grotesk text-white py-3 px-2 transition-all duration-300 placeholder-gray-400"
                  placeholder="Your forge name"
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-orbitron text-molten-gold mb-2 tracking-wide">
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full bg-transparent border-b-2 border-molten-gold/30 focus:border-molten-gold outline-none text-lg font-space-grotesk text-white py-3 px-2 pr-10 transition-all duration-300 placeholder-gray-400"
                    placeholder="Your secret key"
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || showSuccess}
                className="w-full py-4 bg-molten-gold text-void-black font-orbitron font-bold tracking-wider hover:brightness-110 transition duration-300 shadow-lg hover:shadow-molten-gold/50 hover:shadow-2xl relative group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-void-black border-t-transparent rounded-full animate-spin" />
                      IGNITING...
                    </>
                  ) : (
                    <>
                      <Flame className="w-5 h-5" />
                      IGNITE THE FLAME
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Signup Link */}
            <div className="text-center mt-6">
              <p className="text-molten-gold/50 font-space-grotesk text-sm">
                New to the forge?{' '}
                <Link href="/signup" className="text-molten-gold hover:text-neural-emerald transition duration-300">
                  Enter the forge
                </Link>
              </p>
            </div>
          </div>

          {/* Greek Rune Accent */}
          <div className="text-center mt-8">
            <div className="text-molten-gold/30 text-2xl font-orbitron">Ω Φ Ψ Ξ Σ Π Θ</div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
