'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, TrendingUp, DollarSign, Activity, AlertCircle } from 'lucide-react'
import { walletTrackerApi } from '../services/walletTrackerApi'

const formatSolAmount = (amount: number): string => {
  if (amount === 0) return '0'
  
  const amountStr = amount.toString()
  const parts = amountStr.split('.')
  
  if (parts.length === 1) {
    return amountStr
  }
  
  const decimalPart = parts[1].slice(0, 9)
  const trimmedDecimal = decimalPart.replace(/0+$/, '')
  
  if (trimmedDecimal === '') {
    return parts[0]
  }
  
  return `${parts[0]}.${trimmedDecimal}`
}

export default function AdminOverview() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [overviewData, setOverviewData] = useState<any>(null)

  useEffect(() => {
    fetchOverview()
  }, [])

  const fetchOverview = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await walletTrackerApi.getAdminOverview()
      setOverviewData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch overview data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-molten-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 font-space-grotesk">Loading overview...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle size={20} />
          <span className="font-orbitron font-bold">{error}</span>
        </div>
      </div>
    )
  }

  const stats = [
    {
      label: 'Total Signups',
      value: overviewData?.total_signups || 0,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
    {
      label: 'Total Trades',
      value: overviewData?.total_trades || 0,
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
    },
    {
      label: 'Fees Generated',
      value: overviewData?.total_fees !== undefined && overviewData?.total_fees !== null 
        ? `${formatSolAmount(overviewData.total_fees)} SOL` 
        : '0 SOL',
      icon: DollarSign,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
    },
    {
      label: 'Website Health',
      value: overviewData?.health_status || 'Unknown',
      icon: Activity,
      color: overviewData?.health_status === 'Healthy' ? 'text-green-400' : 'text-red-400',
      bgColor: overviewData?.health_status === 'Healthy' ? 'bg-green-500/10' : 'bg-red-500/10',
      borderColor: overviewData?.health_status === 'Healthy' ? 'border-green-500/30' : 'border-red-500/30',
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-orbitron font-bold text-molten-gold mb-6">Overview</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${stat.bgColor} ${stat.borderColor} border rounded-lg p-6`}
            >
              <div className="flex items-center justify-between mb-4">
                <Icon className={`${stat.color} w-8 h-8`} />
              </div>
              <p className="text-white/60 font-space-grotesk text-sm mb-2">{stat.label}</p>
              <p className={`${stat.color} font-orbitron font-bold text-2xl`}>{stat.value}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Signups Chart */}
        {overviewData?.signups_data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-6"
          >
            <h3 className="text-xl font-orbitron font-semibold text-white mb-4">Signups Over Time</h3>
            <div className="h-64 flex items-center justify-center">
              <SimpleLineChart data={overviewData.signups_data} />
            </div>
          </motion.div>
        )}

        {/* Trades Chart */}
        {overviewData?.trades_data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-6"
          >
            <h3 className="text-xl font-orbitron font-semibold text-white mb-4">Trades Over Time</h3>
            <div className="h-64 flex items-center justify-center">
              <SimpleLineChart data={overviewData.trades_data} />
            </div>
          </motion.div>
        )}

        {/* Fees Pie Chart */}
        {overviewData?.fees_by_type && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-6"
          >
            <h3 className="text-xl font-orbitron font-semibold text-white mb-4">Fees by Type</h3>
            <div className="h-64 flex items-center justify-center">
              <SimplePieChart data={overviewData.fees_by_type} />
            </div>
          </motion.div>
        )}

        {/* Trade Status Pie Chart */}
        {overviewData?.trades_by_status && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-6"
          >
            <h3 className="text-xl font-orbitron font-semibold text-white mb-4">Trades by Status</h3>
            <div className="h-64 flex items-center justify-center">
              <SimplePieChart data={overviewData.trades_by_status} />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// Simple Line Chart Component
function SimpleLineChart({ data }: { data: Array<{ date: string; value: number }> }) {
  if (!data || data.length === 0) {
    return <p className="text-white/40">No data available</p>
  }

  const maxValue = Math.max(...data.map(d => d.value), 1)
  const chartHeight = 200
  const chartWidth = 100

  return (
    <div className="w-full h-full flex items-end justify-between gap-2">
      {data.map((item, index) => {
        const height = (item.value / maxValue) * chartHeight
        return (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <div className="relative w-full" style={{ height: chartHeight }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="w-full bg-gradient-to-t from-molten-gold to-yellow-400 rounded-t"
                style={{ height: `${height}px` }}
              />
            </div>
            <span className="text-xs text-white/40 font-space-grotesk">
              {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <span className="text-xs text-molten-gold font-orbitron font-semibold">{item.value}</span>
          </div>
        )
      })}
    </div>
  )
}

// Simple Pie Chart Component
function SimplePieChart({ data }: { data: Array<{ label: string; value: number }> }) {
  if (!data || data.length === 0) {
    return <p className="text-white/40">No data available</p>
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)
  const colors = ['#FFD700', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6']

  let currentAngle = 0
  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100
    const angle = (item.value / total) * 360
    const startAngle = currentAngle
    currentAngle += angle

    return {
      ...item,
      percentage,
      startAngle,
      angle,
      color: colors[index % colors.length],
    }
  })

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-48 h-48">
        <svg width="192" height="192" viewBox="0 0 192 192" className="transform -rotate-90">
          {segments.map((segment, index) => {
            const startAngleRad = (segment.startAngle * Math.PI) / 180
            const endAngleRad = ((segment.startAngle + segment.angle) * Math.PI) / 180
            const largeArcFlag = segment.angle > 180 ? 1 : 0

            const x1 = 96 + 96 * Math.cos(startAngleRad)
            const y1 = 96 + 96 * Math.sin(startAngleRad)
            const x2 = 96 + 96 * Math.cos(endAngleRad)
            const y2 = 96 + 96 * Math.sin(endAngleRad)

            return (
              <path
                key={index}
                d={`M 96 96 L ${x1} ${y1} A 96 96 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                fill={segment.color}
                opacity={0.8}
                className="transition-opacity hover:opacity-100"
              />
            )
          })}
        </svg>
      </div>
      <div className="space-y-2 w-full">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-sm text-white/80 font-space-grotesk">{segment.label}</span>
            </div>
            <span className="text-sm text-molten-gold font-orbitron font-semibold">
              {segment.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

