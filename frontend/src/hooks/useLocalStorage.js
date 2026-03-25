import { useState } from 'react'

/**
 * useState that persists its value in localStorage.
 *
 * Usage:
 *   const [cart, setCart] = useLocalStorage('pos_cart', {})
 *
 * @param {string} key          — localStorage key
 * @param {*}      initialValue — default value if key doesn't exist
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      const toStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(toStore)
      localStorage.setItem(key, JSON.stringify(toStore))
    } catch {
      // ignore write errors
    }
  }

  const remove = () => {
    localStorage.removeItem(key)
    setStoredValue(initialValue)
  }

  return [storedValue, setValue, remove]
}
