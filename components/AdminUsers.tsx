'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronRight, AlertCircle, X, User as UserIcon, BarChart2, Briefcase, TrendingUp, History, Target } from 'lucide-react'
import { walletTrackerApi } from '../services/walletTrackerApi'

interface UserListItem {
    id: number
    username: string
    email: string
    created_at: string
    trade_count: number
}

interface UserStats {
    user_id: number
    username: string
    email: string
    total_pnl: number
    dip_ladder_pnl: number
    coin_type: string
    total_trades: number
    active_trades: number
    created_at: string
    recent_trades: Array<{
        id: number
        event_type: string
        target_token: string
        amount_in: string
        amount_out: string
        status: string
        created_at: string
    }>
}

export default function AdminUsers() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [users, setUsers] = useState<UserListItem[]>([])
    const [totalUsers, setTotalUsers] = useState(0)
    const [search, setSearch] = useState('')
    const [searchInput, setSearchInput] = useState('')
    const [page, setPage] = useState(1)
    const [limit] = useState(20)
    const [selectedUser, setSelectedUser] = useState<UserStats | null>(null)
    const [loadingStats, setLoadingStats] = useState(false)

    useEffect(() => {
        fetchUsers()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, search])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await walletTrackerApi.getAdminUsers(page, limit, search || undefined)
            setUsers(data.users || [])
            setTotalUsers(data.total || 0)
        } catch (err: any) {
            setError(err.message || 'Failed to fetch users')
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = () => {
        setSearch(searchInput)
        setPage(1)
    }

    const fetchUserStats = async (userId: number) => {
        try {
            setLoadingStats(true)
            const data = await walletTrackerApi.getAdminUserStats(userId)
            setSelectedUser(data)
        } catch (err: any) {
            setError(err.message || 'Failed to fetch user stats')
        } finally {
            setLoadingStats(false)
        }
    }

    const formatPnL = (pnl: number | null | undefined) => {
        const value = Number(pnl || 0)
        const isPositive = value >= 0
        return (
            <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
                {isPositive ? '+' : ''}${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
        )
    }

    if (loading && users.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-molten-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white/60 font-space-grotesk">Loading users...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-orbitron font-bold text-molten-gold">Users</h1>
                <div className="text-white/40 font-space-grotesk bg-molten-gold/5 px-4 py-2 rounded-full border border-molten-gold/10">
                    Total Users: <span className="text-molten-gold font-bold">{totalUsers}</span>
                </div>
            </div>

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
                        placeholder="Search by username or email..."
                        className="w-full pl-10 pr-4 py-3 bg-void-black/50 border border-molten-gold/20 rounded-lg text-white font-space-grotesk focus:border-molten-gold focus:outline-none transition-colors"
                    />
                </div>
                <button
                    onClick={handleSearch}
                    className="px-6 py-3 bg-molten-gold text-void-black font-orbitron font-bold rounded-lg hover:brightness-110 transition-all duration-300 shadow-[0_0_15px_rgba(255,215,0,0.3)]"
                >
                    Search
                </button>
            </div>

            {/* Users List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((user, index) => (
                    <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => fetchUserStats(user.id)}
                        className="bg-void-black/50 border border-molten-gold/20 rounded-lg p-6 hover:border-molten-gold/50 cursor-pointer transition-all duration-300 group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-molten-gold/5 rounded-bl-full -mr-12 -mt-12 transition-all duration-300 group-hover:bg-molten-gold/10" />

                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-molten-gold/10 rounded-full flex items-center justify-center text-molten-gold border border-molten-gold/20 group-hover:scale-110 transition-transform duration-300">
                                <UserIcon size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-orbitron font-bold text-white group-hover:text-molten-gold transition-colors truncate max-w-[180px]">
                                    {user.username}
                                </h3>
                                <p className="text-xs text-white/40 font-space-grotesk truncate max-w-[180px]">
                                    {user.email}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/60 font-space-grotesk">Trades</span>
                                <span className="text-molten-gold font-orbitron font-bold">{user.trade_count}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-white/40 font-space-grotesk">Joined</span>
                                <span className="text-white/60 font-space-grotesk">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-molten-gold/10 flex items-center justify-end text-molten-gold/60 group-hover:text-molten-gold transition-colors">
                            <span className="text-xs font-orbitron font-semibold mr-1">View Stats</span>
                            <ChevronRight size={16} />
                        </div>
                    </motion.div>
                ))}
            </div>

            {users.length === 0 && !loading && (
                <div className="p-12 text-center bg-void-black/30 border border-molten-gold/10 rounded-xl">
                    <p className="text-white/40 font-space-grotesk text-lg">No users found matching your search</p>
                </div>
            )}

            {/* Pagination */}
            {totalUsers > limit && (
                <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: Math.ceil(totalUsers / limit) }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i + 1)}
                            className={`w-10 h-10 rounded-lg font-orbitron font-bold transition-all duration-300 ${page === i + 1
                                ? 'bg-molten-gold text-void-black shadow-[0_0_10px_rgba(255,215,0,0.3)]'
                                : 'bg-void-black/50 border border-molten-gold/20 text-white/40 hover:border-molten-gold/50'
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}

            {/* User Stats Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedUser(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-4xl bg-void-black border border-molten-gold/30 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-molten-gold/20 bg-molten-gold/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-molten-gold/20 rounded-xl flex items-center justify-center text-molten-gold border border-molten-gold/30">
                                        <UserIcon size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-orbitron font-bold text-white tracking-wider">
                                            {selectedUser.username}
                                        </h2>
                                        <p className="text-sm text-white/40 font-space-grotesk">{selectedUser.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-molten-gold/5 border border-molten-gold/10 p-4 rounded-xl">
                                        <div className="flex items-center gap-3 mb-2 text-molten-gold">
                                            <TrendingUp size={18} />
                                            <span className="text-xs font-orbitron font-bold uppercase tracking-widest opacity-60">Total PnL</span>
                                        </div>
                                        <div className="text-2xl font-orbitron font-bold">
                                            {formatPnL(selectedUser.total_pnl)}
                                        </div>
                                    </div>
                                    <div className="bg-molten-gold/5 border border-molten-gold/10 p-4 rounded-xl">
                                        <div className="flex items-center gap-3 mb-2 text-green-400">
                                            <Target size={18} />
                                            <span className="text-xs font-orbitron font-bold uppercase tracking-widest opacity-60">Dip Ladder PnL</span>
                                        </div>
                                        <div className="text-2xl font-orbitron font-bold">
                                            {formatPnL(selectedUser.dip_ladder_pnl)}
                                        </div>
                                    </div>
                                    <div className="bg-molten-gold/5 border border-molten-gold/10 p-4 rounded-xl">
                                        <div className="flex items-center gap-3 mb-2 text-blue-400">
                                            <BarChart2 size={18} />
                                            <span className="text-xs font-orbitron font-bold uppercase tracking-widest opacity-60">Total Trades</span>
                                        </div>
                                        <div className="text-2xl font-orbitron font-bold text-white">
                                            {selectedUser.total_trades}
                                        </div>
                                    </div>
                                    <div className="bg-molten-gold/5 border border-molten-gold/10 p-4 rounded-xl">
                                        <div className="flex items-center gap-3 mb-2 text-green-400">
                                            <Briefcase size={18} />
                                            <span className="text-xs font-orbitron font-bold uppercase tracking-widest opacity-60">Active Trades</span>
                                        </div>
                                        <div className="text-2xl font-orbitron font-bold text-white">
                                            {selectedUser.active_trades}
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Trades Table */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-molten-gold/60">
                                        <History size={18} />
                                        <h3 className="font-orbitron font-bold uppercase tracking-widest text-sm">Recent Activity</h3>
                                    </div>

                                    <div className="bg-void-black/50 border border-molten-gold/10 rounded-xl overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-white/5 border-b border-white/10">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-[10px] font-orbitron font-bold text-white/40 uppercase tracking-widest">Type</th>
                                                        <th className="px-4 py-3 text-left text-[10px] font-orbitron font-bold text-white/40 uppercase tracking-widest">Token</th>
                                                        <th className="px-4 py-3 text-left text-[10px] font-orbitron font-bold text-white/40 uppercase tracking-widest">Amount In</th>
                                                        <th className="px-4 py-3 text-left text-[10px] font-orbitron font-bold text-white/40 uppercase tracking-widest">Amount Out</th>
                                                        <th className="px-4 py-3 text-left text-[10px] font-orbitron font-bold text-white/40 uppercase tracking-widest">Status</th>
                                                        <th className="px-4 py-3 text-left text-[10px] font-orbitron font-bold text-white/40 uppercase tracking-widest">Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {selectedUser.recent_trades.map((trade) => (
                                                        <tr key={trade.id} className="hover:bg-white/5 transition-colors">
                                                            <td className="px-4 py-3">
                                                                <span className={`text-[10px] font-orbitron font-bold px-2 py-1 rounded-full border ${trade.event_type === 'user_purchase'
                                                                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                                                    : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                                                                    }`}>
                                                                    {trade.event_type === 'user_purchase' ? 'BUY' : 'SELL'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="text-xs text-white/80 font-mono font-space-grotesk truncate max-w-[120px]" title={trade.target_token}>
                                                                    {trade.target_token}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-xs text-white/60 font-space-grotesk">
                                                                {trade.amount_in || '0'}
                                                            </td>
                                                            <td className="px-4 py-3 text-xs text-white/60 font-space-grotesk">
                                                                {trade.amount_out || '0'}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`text-[10px] font-orbitron font-bold ${trade.status === 'success' ? 'text-green-400' : 'text-red-400'
                                                                    }`}>
                                                                    {trade.status?.toUpperCase() || 'UNKNOWN'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-[10px] text-white/40 font-space-grotesk">
                                                                {new Date(trade.created_at).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {selectedUser.recent_trades.length === 0 && (
                                                        <tr>
                                                            <td colSpan={6} className="px-4 py-8 text-center text-white/20 font-space-grotesk text-sm">
                                                                No recent trade activity found
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 bg-white/5 border-t border-white/10 flex justify-end">
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-orbitron font-bold rounded-lg transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Loading Stats Overlay */}
            {loadingStats && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-12 h-12 border-4 border-molten-gold border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </div>
    )
}
