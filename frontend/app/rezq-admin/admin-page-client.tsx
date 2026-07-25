'use client'

import { api } from '@/lib/api'
import AdminLogin from './admin-login'
import AdminDashboard from './admin-dashboard'
import { useEffect, useState } from 'react'

export default function AdminPageClient() {
  const [session, setSession] = useState<{ authenticated: boolean } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const result = await api.check_session()
        setSession(result)
      } catch (error) {
        console.error('[v0] Session check error:', error)
        setSession({ authenticated: false })
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">جاري التحميل...</div>
  }

  if (!session?.authenticated) {
    return <AdminLogin />
  }

  return <AdminDashboard />
}
