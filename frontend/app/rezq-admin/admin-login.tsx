'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Lock, User, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { clientLogger } from '@/lib/client-logger'

interface AdminLoginProps {
  onLoginSuccess: () => void
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      clientLogger.log('Attempting login with username:', username)
      await api.login(username, password)
      clientLogger.log('Login successful')
      localStorage.setItem('admin_authenticated', 'true')
      onLoginSuccess()
    } catch (err) {
      clientLogger.error('Login failed:', err)
      setError(err instanceof Error ? err.message : 'تعذّر تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-inverse-canvas flex items-center justify-center px-4 font-body">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <Image
            src="/logo.jpeg"
            alt="الحسين للاب توب"
            width={56}
            height={56}
            className="rounded-2xl object-cover"
          />
          <div className="text-center">
            <h1 className="font-sans font-bold text-white text-xl">الحسين للاب توب</h1>
            <p className="font-body text-sm text-white/50">لوحة الإدارة</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-canvas rounded-[24px] border border-hairline p-6 flex flex-col gap-4"
        >
          <div>
            <h2 className="font-sans font-bold text-ink text-lg">تسجيل الدخول</h2>
            <p className="font-body text-sm text-ink-muted mt-1">
              أدخل بيانات المسؤول للوصول للوحة التحكم.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="username" className="font-body text-sm text-ink">
              اسم المستخدم
            </label>
            <div className="relative">
              <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
              <input
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full ps-9 pe-4 py-2.5 rounded-xl border border-hairline font-body text-sm bg-canvas text-ink focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
                placeholder="admin"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="font-body text-sm text-ink">
              كلمة المرور
            </label>
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full ps-9 pe-4 py-2.5 rounded-xl border border-hairline font-body text-sm bg-canvas text-ink focus:outline-none focus:ring-2 focus:ring-[#0FC7C1]/30"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <p className="font-body text-xs text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 h-11 rounded-full bg-brand-primary text-white font-sans font-bold flex items-center justify-center gap-2 hover:bg-brand-primary/90 disabled:opacity-60 transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            دخول
          </button>
        </form>
      </div>
    </div>
  )
}
