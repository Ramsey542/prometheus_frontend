'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, AlertTriangle, Info, CheckCircle, X } from 'lucide-react'
import Image from 'next/image'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../store/index'
import { createWallet } from '../store/slices/authSlice'

interface CreateWalletModalProps {
    isOpen: boolean
    onClose: () => void
    initialChain?: 'solana' | 'bnb'
}

export default function CreateWalletModal({ isOpen, onClose, initialChain = 'solana' }: CreateWalletModalProps) {
    const dispatch = useDispatch<AppDispatch>()
    const [newWalletName, setNewWalletName] = useState('')
    const [newWalletChain, setNewWalletChain] = useState<'solana' | 'bnb'>(initialChain)
    const [isCreating, setIsCreating] = useState(false)
    const [createdWallet, setCreatedWallet] = useState<any>(null)
    const [countdown, setCountdown] = useState(60)
    const [createWalletError, setCreateWalletError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            setNewWalletChain(initialChain)
        }
    }, [isOpen, initialChain])

    useEffect(() => {
        let timer: NodeJS.Timeout
        if (createdWallet && countdown > 0) {
            timer = setTimeout(() => setCountdown(c => c - 1), 1000)
        } else if (createdWallet && countdown === 0) {
            handleClose()
        }
        return () => clearTimeout(timer)
    }, [createdWallet, countdown])

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    const handleCreateWallet = async () => {
        setIsCreating(true)
        setCreateWalletError(null)
        try {
            const result = await dispatch(createWallet({ blockchain: newWalletChain, name: newWalletName })).unwrap()
            setCreatedWallet(result)
            setCountdown(60)
            setNewWalletName('')
        } catch (err: any) {
            console.error('Failed to create wallet:', err)
            setCreateWalletError(err || 'Failed to create wallet')
        } finally {
            setIsCreating(false)
        }
    }

    const handleClose = () => {
        onClose()
        // Reset state after a slight delay to allow exit animation
        setTimeout(() => {
            setCreatedWallet(null)
            setCreateWalletError(null)
            setCountdown(60)
            setNewWalletName('')
        }, 300)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={handleClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-md bg-void-black border border-molten-gold/30 rounded-xl overflow-hidden relative z-10 shadow-2xl shadow-molten-gold/10"
            >
                <div className="p-6 border-b border-molten-gold/20 flex justify-between items-center">
                    <h3 className="text-xl font-orbitron font-bold text-molten-gold">
                        {createdWallet ? 'Wallet Created' : 'Initialize New Wallet'}
                    </h3>
                    <button
                        onClick={handleClose}
                        className="text-white/40 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {createdWallet ? (
                        <div className="space-y-6">
                            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex gap-3 animate-pulse">
                                <AlertTriangle size={24} className="text-red-500 shrink-0" />
                                <div>
                                    <h4 className="font-orbitron font-bold text-red-500 text-sm mb-1">WARNING</h4>
                                    <p className="text-xs text-red-200/80 font-space-grotesk leading-relaxed">
                                        Save these keys immediately. This window will close automatically.
                                    </p>
                                </div>
                            </div>

                            <div className="text-center mb-4">
                                <div className="text-4xl font-orbitron font-bold text-molten-gold tabular-nums">
                                    {countdown}s
                                </div>
                                <p className="text-xs text-white/40 font-space-grotesk mt-1 uppercase tracking-widest">
                                    Auto-closing
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-orbitron text-molten-gold/60 uppercase tracking-widest">
                                        Public Key
                                    </label>
                                    <div className="bg-black/50 border border-molten-gold/20 rounded-lg p-3 flex items-center justify-between group hover:border-molten-gold/50 transition-colors">
                                        <code className="text-xs text-white/80 font-mono break-all pr-4">
                                            {newWalletChain === 'solana' ? createdWallet.solana_public_key : createdWallet.bnb_public_key}
                                        </code>
                                        <button
                                            onClick={() => copyToClipboard(newWalletChain === 'solana' ? createdWallet.solana_public_key : createdWallet.bnb_public_key)}
                                            className="text-white/40 hover:text-molten-gold transition-colors"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-orbitron text-molten-gold/60 uppercase tracking-widest">
                                        Private Key
                                    </label>
                                    <div className="bg-black/50 border border-molten-gold/20 rounded-lg p-3 flex items-center justify-between group hover:border-molten-gold/50 transition-colors">
                                        <code className="text-xs text-red-400/80 font-mono break-all pr-4 blur-sm hover:blur-none transition-all duration-300">
                                            {newWalletChain === 'solana' ? createdWallet.solana_private_key : createdWallet.bnb_private_key}
                                        </code>
                                        <button
                                            onClick={() => copyToClipboard(newWalletChain === 'solana' ? createdWallet.solana_private_key : createdWallet.bnb_private_key)}
                                            className="text-white/40 hover:text-molten-gold transition-colors"
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-molten-gold/10 border border-molten-gold/30 rounded-lg p-3">
                                <p className="text-xs text-molten-gold font-space-grotesk text-center">
                                    Note: You can switch to this wallet in the Controls page.
                                </p>
                            </div>

                            <button
                                onClick={handleClose}
                                className="w-full py-3 rounded-lg font-orbitron font-bold text-sm bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
                            >
                                I HAVE SAVED MY KEYS
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                <label className="text-sm font-orbitron text-molten-gold/80 uppercase tracking-widest">Select Blockchain</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setNewWalletChain('solana')}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300 ${newWalletChain === 'solana'
                                            ? 'bg-molten-gold/20 border-molten-gold shadow-lg shadow-molten-gold/10'
                                            : 'bg-white/5 border-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <Image src="/assets/sol.png" alt="Solana" width={32} height={32} />
                                        <span className="font-orbitron text-sm font-bold text-white">SOLANA</span>
                                    </button>
                                    <button
                                        disabled={true}
                                        onClick={() => setNewWalletChain('bnb')}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300
                            ${newWalletChain === 'bnb'
                                                ? 'bg-molten-gold/20 border-molten-gold shadow-lg shadow-molten-gold/10'
                                                : 'bg-white/5 border-white/10 hover:border-white/20'
                                            }
                            disabled:pointer-events-none
                            disabled:opacity-50
                            disabled:cursor-not-allowed
                          `}
                                    >
                                        <Image src="/assets/bnb.png" alt="BNB" width={32} height={32} />
                                        <span className="font-orbitron text-sm font-bold text-white">BNB CHAIN</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-orbitron text-molten-gold/80 uppercase tracking-widest">Wallet Name (Optional)</label>
                                <input
                                    type="text"
                                    value={newWalletName}
                                    onChange={(e) => {
                                        setNewWalletName(e.target.value)
                                        setCreateWalletError(null)
                                    }}
                                    placeholder="e.g. Degen Vault"
                                    className="w-full bg-void-black border border-white/10 rounded-lg px-4 py-3 text-white font-space-grotesk focus:outline-none focus:border-molten-gold/50 transition-colors"
                                />
                                {createWalletError && (
                                    <p className="text-xs text-red-500 font-space-grotesk mt-1">{createWalletError}</p>
                                )}
                            </div>

                            <div className="bg-molten-gold/5 border border-molten-gold/20 rounded-lg p-4 flex gap-3">
                                <Info size={18} className="text-molten-gold shrink-0 mt-0.5" />
                                <p className="text-xs text-molten-gold/80 leading-relaxed font-space-grotesk">
                                    Initializing a new wallet will generate a unique keypair on the selected blockchain.
                                </p>
                            </div>

                            <button
                                onClick={handleCreateWallet}
                                disabled={isCreating}
                                className={`w-full py-4 rounded-lg font-orbitron font-bold tracking-widest transition-all duration-300 ${isCreating
                                    ? 'bg-white/10 text-white/40 cursor-not-allowed'
                                    : 'bg-molten-gold text-void-black hover:brightness-110 active:scale-95 shadow-xl shadow-molten-gold/20'
                                    }`}
                            >
                                {isCreating ? 'FORGING WALLET...' : 'INITIALIZE WALLET'}
                            </button>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
