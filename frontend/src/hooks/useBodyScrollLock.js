import { useEffect } from 'react'

let lockCount = 0
let lockedScrollY = 0
let previousStyles = null

export function useBodyScrollLock(active = true) {
  useEffect(() => {
    if (!active || typeof window === 'undefined') return undefined

    lockCount += 1

    if (lockCount === 1) {
      lockedScrollY = window.scrollY || document.documentElement.scrollTop || 0
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

      previousStyles = {
        bodyOverflow: document.body.style.overflow,
        bodyPosition: document.body.style.position,
        bodyTop: document.body.style.top,
        bodyWidth: document.body.style.width,
        bodyPaddingRight: document.body.style.paddingRight,
        htmlOverflow: document.documentElement.style.overflow,
      }

      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${lockedScrollY}px`
      document.body.style.width = '100%'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    }

    return () => {
      lockCount = Math.max(0, lockCount - 1)

      if (lockCount === 0 && previousStyles) {
        document.documentElement.style.overflow = previousStyles.htmlOverflow
        document.body.style.overflow = previousStyles.bodyOverflow
        document.body.style.position = previousStyles.bodyPosition
        document.body.style.top = previousStyles.bodyTop
        document.body.style.width = previousStyles.bodyWidth
        document.body.style.paddingRight = previousStyles.bodyPaddingRight
        window.scrollTo(0, lockedScrollY)
        previousStyles = null
      }
    }
  }, [active])
}
