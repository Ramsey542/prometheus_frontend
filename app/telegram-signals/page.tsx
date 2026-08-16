'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '../../components/DashboardLayout'
import TelegramSignalsPanel from '../../components/TelegramSignalsPanel'
import { useAppSelector } from '../../store/hooks'
import { config } from '../../lib/config'

export default function TelegramSignalsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAppSelector((state) => state.auth)
  const hasTelegramSignalAccess = Boolean(user && config.telegramSignalUsernames.includes(user.username))

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login')
      return
    }

    if (!hasTelegramSignalAccess) {
      router.push('/profile')
    }
  }, [user, isAuthenticated, hasTelegramSignalAccess, router])

  if (!isAuthenticated || !user || !hasTelegramSignalAccess) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <div className="text-molten-gold">Loading...</div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <TelegramSignalsPanel />
    </DashboardLayout>
  )
}
