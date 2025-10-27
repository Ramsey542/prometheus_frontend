'use client'

import { useEffect, useState } from 'react'

interface Spark {
  id: number
  x: number
  y: number
  delay: number
}

export default function SparkEffect() {
  const [sparks, setSparks] = useState<Spark[]>([])
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isMoving, setIsMoving] = useState(false)

  useEffect(() => {
    let timeout: NodeJS.Timeout

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
      setIsMoving(true)

      clearTimeout(timeout)
      timeout = setTimeout(() => {
        setIsMoving(false)
      }, 100)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    if (isMoving) {
      const newSpark: Spark = {
        id: Date.now() + Math.random(),
        x: mousePosition.x,
        y: mousePosition.y,
        delay: Math.random() * 0.3,
      }

      setSparks(prev => [...prev, newSpark])

      setTimeout(() => {
        setSparks(prev => prev.filter(s => s.id !== newSpark.id))
      }, 1500)
    }
  }, [mousePosition, isMoving])

  return (
    <div className="fixed inset-0 pointer-events-none z-30">
      {sparks.map(spark => (
        <div
          key={spark.id}
          className="spark"
          style={{
            left: spark.x,
            top: spark.y,
            animationDelay: `${spark.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

