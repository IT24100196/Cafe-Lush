import { useState, useEffect, useCallback } from 'react'

/**
 * Generic data-fetching hook.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApi(getItems)
 *   const { data, loading, refetch } = useApi(() => getOrderHistory({ status: 'pending' }))
 *
 * @param {Function} apiFn  — async function that returns an axios response
 * @param {boolean}  immediate — fetch on mount (default true)
 */
export function useApi(apiFn, immediate = true) {
  const [data,    setData]    = useState(undefined)
  const [loading, setLoading] = useState(immediate)
  const [error,   setError]   = useState(null)

  const fetch = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFn(...args)
      setData(res.data)
      return res.data
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Something went wrong.')
      return null
    } finally {
      setLoading(false)
    }
  }, [apiFn])

  useEffect(() => {
    if (immediate) fetch()
  }, [immediate]) // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch: fetch }
}
