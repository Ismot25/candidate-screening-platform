import { createContext, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, if a token exists, restore the session.
  useEffect(() => {
    async function restore() {
      if (getToken()) {
        try {
          const me = await api.me()
          setUser(me)
        } catch {
          setToken(null)
        }
      }
      setLoading(false)
    }
    restore()
  }, [])

  async function login(email, password) {
    const res = await api.login({ email, password })
    setToken(res.access_token)
    setUser(res.user)
    return res.user
  }

  async function register(payload) {
    const res = await api.register(payload)
    setToken(res.access_token)
    setUser(res.user)
    return res.user
  }

  function logout() {
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
