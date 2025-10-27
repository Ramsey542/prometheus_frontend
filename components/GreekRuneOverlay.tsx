'use client'

import { useEffect, useState } from 'react'

const greekSymbols = ['Α', 'Β', 'Γ', 'Δ', 'Ε', 'Ζ', 'Η', 'Θ', 'Ι', 'Κ', 'Λ', 'Μ', 'Ν', 'Ξ', 'Ο', 'Π', 'Ρ', 'Σ', 'Τ', 'Υ', 'Φ', 'Χ', 'Ψ', 'Ω']

interface Rune {
  id: number
  symbol: string
  x: number
  y: number
  opacity: number
}

export default function GreekRuneOverlay() {
  const [runes, setRunes] = useState<Rune[]>([])
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const generatedRunes: Rune[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      symbol: greekSymbols[Math.floor(Math.random() * greekSymbols.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      opacity: 0,
    }))
    setRunes(generatedRunes)

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    setRunes(prevRunes =>
      prevRunes.map(rune => {
        const runeX = (rune.x / 100) * window.innerWidth
        const runeY = (rune.y / 100) * window.innerHeight
        const distance = Math.sqrt(
          Math.pow(mousePosition.x - runeX, 2) + Math.pow(mousePosition.y - runeY, 2)
        )
        
        const maxDistance = 200
        const newOpacity = distance < maxDistance ? (1 - distance / maxDistance) * 0.6 : 0
        
        return { ...rune, opacity: newOpacity }
      })
    )
  }, [mousePosition])

  return (
    <div className="fixed inset-0 pointer-events-none z-20">
      {runes.map(rune => (
        <div
          key={rune.id}
          className="absolute text-4xl font-serif text-molten-gold transition-all duration-300 ease-out"
          style={{
            left: `${rune.x}%`,
            top: `${rune.y}%`,
            opacity: rune.opacity,
            textShadow: `0 0 ${rune.opacity * 20}px #FFB800, 0 0 ${rune.opacity * 40}px #FFB800`,
            transform: `scale(${1 + rune.opacity * 0.3})`,
          }}
        >
          {rune.symbol}
        </div>
      ))}
    </div>
  )
}

