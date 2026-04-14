import { useState, useEffect, useCallback } from 'react'
import { login as loginService, logout as logoutService, initAuth } from '../api/authService'
import { AuthContext } from './authContextCore'

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null)
  const [authLoading, setAuthLoading] = useState(true)  // true while initAuth runs
  const [loading,     setLoading]     = useState(false)  // true during login call

  // ── On app load: validate token, silent-refresh if expired ──────────────────
  useEffect(() => {
    initAuth()
      .then((resolvedUser) => setUser(resolvedUser))
      .finally(() => setAuthLoading(false))
  }, [])

  // ── Login ────────────────────────────────────────────────────────────────────
  const login = useCallback(async (username, password) => {
    setLoading(true)
    try {
      const resolvedUser = await loginService(username, password)
      setUser(resolvedUser)
      return resolvedUser
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Logout ───────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await logoutService()
    setUser(null)
  }, [])

  // Don't render children until the initial auth check is complete.
  // This prevents a flash of the login page for already-authenticated users.
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
