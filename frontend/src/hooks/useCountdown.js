import { useState, useEffect } from 'react'

function getCountdownState(targetDate, now = Date.now()) {
  if (!targetDate) return { timeLeft: '', isPast: false }

  const diff = new Date(targetDate) - now
  if (diff <= 0) return { timeLeft: 'Cutoff passed', isPast: true }

  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1_000)
  return { timeLeft: `${h}h ${m}m ${s}s remaining`, isPast: false }
}

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
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  return getCountdownState(targetDate, now)
}
