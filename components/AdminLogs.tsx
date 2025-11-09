'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, ChevronRight, AlertCircle } from 'lucide-react'
import { walletTrackerApi } from '../services/walletTrackerApi'

interface LogEntry {
  id: number
  user_id: number | null
  event_type: string
  transaction_signature: string | null
  wallet_address: string | null
  target_token: string | null
  token_name: string | null
  status: string | null
  error_message: string | null
  created_at: string
  [key: string]: any
}

export default function AdminLogs() {
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [searchInput, setSearchInput] = useState('')
  const [currentOffset, setCurrentOffset] = useState(0)
  const limit = 20

  useEffect(() => {
    fetchLogs(true)
  }, [sortBy, sortOrder])

  const fetchLogs = async (reset: boolean = false, searchTerm?: string) => {
    try {
      if (reset) {
        setLoading(true)
        setCurrentOffset(0)
      } else {
        setLoadingMore(true)
      }
      setError(null)
      const searchValue = searchTerm !== undefined ? searchTerm : search
      const offset = reset ? 0 : currentOffset
      const page = Math.floor(offset / limit) + 1
      
      const data = await walletTrackerApi.getAdminLogs(page, limit, searchValue || undefined, sortBy, sortOrder)
      const newLogs = data.logs || []
      
      if (reset) {
        setLogs(newLogs)
      } else {
        setLogs(prev => [...prev, ...newLogs])
      }
      
      setTotal(data.total || 0)
      setHasMore(newLogs.length === limit && (offset + limit) < (data.total || 0))
      setCurrentOffset(offset + newLogs.length)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch logs')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleSearch = () => {
    setSearch(searchInput)
    fetchLogs(true, searchInput)
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
    fetchLogs(true)
  }

  const handleLoadMore = () => {
    fetchLogs(false)
  }

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-molten-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 font-space-grotesk">Loading logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-orbitron font-bold text-molten-gold mb-6">Logs</h1>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle size={20} />
            <span className="font-orbitron font-bold">{error}</span>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search logs..."
            className="w-full pl-10 pr-4 py-3 bg-void-black/50 border border-molten-gold/20 rounded-lg text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-6 py-3 bg-molten-gold text-void-black font-orbitron font-bold rounded-lg hover:brightness-110 transition-all duration-300"
        >
          Search
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-void-black/50 border border-molten-gold/20 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-molten-gold/10 border-b border-molten-gold/20">
              <tr>
                <th
                  onClick={() => handleSort('id')}
                  className="px-4 py-3 text-left text-xs font-orbitron font-semibold text-molten-gold uppercase tracking-wider cursor-pointer hover:bg-molten-gold/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    ID {getSortIcon('id')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('event_type')}
                  className="px-4 py-3 text-left text-xs font-orbitron font-semibold text-molten-gold uppercase tracking-wider cursor-pointer hover:bg-molten-gold/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Event Type {getSortIcon('event_type')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="px-4 py-3 text-left text-xs font-orbitron font-semibold text-molten-gold uppercase tracking-wider cursor-pointer hover:bg-molten-gold/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Status {getSortIcon('status')}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-orbitron font-semibold text-molten-gold uppercase tracking-wider">
                  Token
                </th>
                <th className="px-4 py-3 text-left text-xs font-orbitron font-semibold text-molten-gold uppercase tracking-wider">
                  Wallet
                </th>
                <th
                  onClick={() => handleSort('created_at')}
                  className="px-4 py-3 text-left text-xs font-orbitron font-semibold text-molten-gold uppercase tracking-wider cursor-pointer hover:bg-molten-gold/20 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Created At {getSortIcon('created_at')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-molten-gold/10">
              {logs.map((log) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-molten-gold/5 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-white/80 font-space-grotesk">
                    {log.id}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`font-orbitron font-semibold ${
                      log.event_type === 'user_purchase' ? 'text-blue-400' :
                      log.event_type === 'user_sell' ? 'text-orange-400' :
                      log.event_type === 'tracked_wallet_purchase' ? 'text-green-400' :
                      'text-gray-400'
                    }`}>
                      {log.event_type?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`font-orbitron font-semibold ${
                      log.status === 'success' ? 'text-green-400' :
                      log.status === 'failed' ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      {log.status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/80 font-space-grotesk font-mono">
                    {log.token_name || log.target_token ? (
                      <div>
                        {log.token_name && <div>{log.token_name}</div>}
                        {log.target_token && (
                          <div className="text-xs text-white/40 truncate max-w-[150px]">
                            {log.target_token}
                          </div>
                        )}
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/80 font-space-grotesk font-mono">
                    {log.wallet_address ? (
                      <span className="truncate max-w-[150px] block">
                        {log.wallet_address}
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/60 font-space-grotesk">
                    {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && !loading && (
          <div className="p-8 text-center text-white/40">
            <p className="font-space-grotesk">No logs found</p>
          </div>
        )}
      </div>

      {/* Load More Section */}
      {logs.length > 0 && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-white/60 font-space-grotesk">
            Showing {logs.length} of {total} total logs
          </div>
          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-6 py-3 bg-molten-gold/10 border border-molten-gold/20 text-molten-gold rounded-lg hover:bg-molten-gold/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-orbitron font-semibold"
            >
              {loadingMore ? (
                <>
                  <div className="w-5 h-5 border-2 border-molten-gold border-t-transparent rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Load More
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          )}
          {!hasMore && logs.length > 0 && (
            <p className="text-white/40 font-space-grotesk text-sm">All logs loaded</p>
          )}
        </div>
      )}
    </div>
  )
}

