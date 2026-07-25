'use client'

import { api } from '@/lib/api'
import AdminLogin from './admin-login'
import AdminDashboard from './admin-dashboard'
import { useEffect, useState } from 'react'

export default function AdminPageClient() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const auth = localStorage.getItem('admin_authenticated')
      setIsAuthenticated(auth === 'true')
      setLoading(false)
    }

    checkAuth()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">جاري التحميل...</div>
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />
  }

  return <AdminDashboard onLogout={() => setIsAuthenticated(false)} />
}
