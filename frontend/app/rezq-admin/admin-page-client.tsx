'use client'

import { api } from '@/lib/api'
import AdminLogin from './admin-login'
import AdminDashboard from './admin-dashboard'
import { useEffect, useState } from 'react'

export default function AdminPageClient() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/session`, {
          credentials: 'include',
        })
        const data = await response.json()
        setIsAuthenticated(data.authenticated === true)
      } catch (err) {
        console.error('[Auth check failed]', err)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = async () => {
    try {
      await api.logout()
    } catch (err) {
      console.error('[Logout failed]', err)
    }
    setIsAuthenticated(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">جاري التحميل...</div>
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />
  }

  return <AdminDashboard onLogout={handleLogout} />
}
