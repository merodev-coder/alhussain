'use client'

import { api } from '@/lib/api'
import AdminLogin from './admin-login'
import AdminDashboard from './admin-dashboard'
import { useEffect, useState } from 'react'
import { clientLogger } from '@/lib/client-logger'
import { ThemeProvider } from '@/components/theme-provider'
import { Loader2 } from 'lucide-react'

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
        clientLogger.error('Auth check failed', err)
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
      clientLogger.error('Logout failed', err)
    }
    setIsAuthenticated(false)
  }

  if (loading) {
    return (
      <ThemeProvider>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="animate-spin text-brand-primary h-12 w-12" />
        </div>
      </ThemeProvider>
    )
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <AdminLogin onLoginSuccess={handleLoginSuccess} />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <AdminDashboard onLogout={handleLogout} />
    </ThemeProvider>
  )
}
