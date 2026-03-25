import { useState, useEffect } from 'react'

/**
 * Returns a debounced version of the value that only updates
 * after the specified delay has passed without a new value.
 *
 * Usage (search/filter inputs):
 *   const debounced = useDebounce(searchTerm, 400)
 *   useEffect(() => { fetchResults(debounced) }, [debounced])
 *
 * @param {*}      value — the value to debounce
 * @param {number} delay — milliseconds to wait (default 400)
 */
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}
