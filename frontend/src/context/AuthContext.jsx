import { createContext, useContext, useState, useEffect } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

const DEFAULT_CUSTOMER = {
  id: 2,
  name: 'Shopper',
  email: 'customer@smartmart.ai',
  role: 'customer',
  title: 'SmartMart Customer',
  avatar: '🛒',
  token: 'smartmart-customer-session-token',
}

const ADMIN_PROFILE = {
  id: 1,
  name: 'Parag (Store Owner)',
  email: 'admin@smartmart.ai',
  role: 'admin',
  title: 'Store Administrator & AI Lead',
  avatar: '👨‍💼',
  token: 'smartmart-admin-auth-token-verified-cse276',
}

export function AuthProvider({ children }) {
  // Public default is always Customer
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('smartmart_user')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {}
    }
    return DEFAULT_CUSTOMER
  })

  useEffect(() => {
    if (user) {
      localStorage.setItem('smartmart_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('smartmart_user')
    }
  }, [user])

  // Admin login strictly requires password CSE276
  const loginAdmin = async (password) => {
    const pwd = (password || '').trim().toUpperCase()

    // 1. Instant client-side verification for 100% reliability on both GitHub Pages and localhost
    if (pwd === 'CSE276') {
      setUser(ADMIN_PROFILE)
      try {
        await client.post('/auth/login', { role: 'admin', password: 'CSE276' })
      } catch {}
      return { success: true, user: ADMIN_PROFILE }
    }

    // 2. Fallback to API check if custom password configured
    try {
      const res = await client.post('/auth/login', {
        role: 'admin',
        password: pwd,
      })
      const userData = {
        ...res.data.user,
        token: res.data.token,
      }
      setUser(userData)
      return { success: true, user: userData }
    } catch {
      throw new Error('Access Denied: Invalid password.')
    }
  }

  // Customer login: Direct access, zero password required
  const loginCustomer = async () => {
    try {
      const res = await client.post('/auth/login', { role: 'customer' })
      const userData = {
        ...res.data.user,
        token: res.data.token,
      }
      setUser(userData)
      return userData
    } catch {
      setUser(DEFAULT_CUSTOMER)
      return DEFAULT_CUSTOMER
    }
  }

  const logoutAdmin = () => {
    setUser(DEFAULT_CUSTOMER)
  }

  const value = {
    user,
    role: user?.role || 'customer',
    isAdmin: user?.role === 'admin',
    isCustomer: user?.role === 'customer',
    loginAdmin,
    loginCustomer,
    logoutAdmin,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
