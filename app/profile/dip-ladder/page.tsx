'use client'

import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProfileLayout from '../../../components/ProfileLayout'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import { getProfile } from '../../../store/slices/authSlice'
import DipLadderPageContent from './DipLadderPageContent'

function DipLadderRouteContent() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { user, profile, isLoading, error, selectedCoin } = useAppSelector((state) => state.auth)

  useEffect(() => {
    if (user) {
      dispatch(getProfile(selectedCoin))
    }
  }, [dispatch, user, selectedCoin])

  useEffect(() => {
    if (!user && !isLoading) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (error && (error.includes('401') || error.includes('unauthorized') || error.includes('No access token') || error.includes('Session expired'))) {
      router.push('/login')
    }
  }, [error, router])

  if (user && !profile && isLoading) {
    return (
      <ProfileLayout>
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-molten-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/60 font-space-grotesk">Loading profile...</p>
          </div>
        </div>
      </ProfileLayout>
    )
  }

  return (
    <ProfileLayout>
      <DipLadderPageContent />
    </ProfileLayout>
  )
}

export default function DipLadderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <div className="text-molten-gold">Loading...</div>
      </div>
    }>
      <DipLadderRouteContent />
    </Suspense>
  )
}
