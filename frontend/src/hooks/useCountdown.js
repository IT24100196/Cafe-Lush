import { useState, useEffect } from 'react'

/**
 * Returns a live countdown string and whether the cutoff has passed.
 *
 * Usage (student meal order):
 *   const { timeLeft, isPast } = useCountdown(cutoffDate)
 *
 * @param {Date|null} targetDate — the cutoff datetime to count down to
 * @returns {{ timeLeft: string, isPast: boolean }}
 */
export function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState('')
  const [isPast,   setIsPast]   = useState(false)

  useEffect(() => {
    if (!targetDate) { setTimeLeft(''); setIsPast(false); return }

    const tick = () => {
      const diff = new Date(targetDate) - Date.now()
      if (diff <= 0) {
        setIsPast(true)
        setTimeLeft('Cutoff passed')
        return
      }
      setIsPast(false)
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1_000)
      setTimeLeft(`${h}h ${m}m ${s}s remaining`)
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetDate])

  return { timeLeft, isPast }
}
