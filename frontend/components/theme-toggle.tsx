'use client'

import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from './theme-provider'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full hover:bg-surface-1 transition-colors flex items-center justify-center border border-hairline focus:outline-none ${
        className || ''
      }`}
      aria-label="تغيير المظهر"
    >
      {resolvedTheme === 'dark' ? (
        <Moon className="w-5 h-5 text-brand-primary" />
      ) : (
        <Sun className="w-5 h-5 text-brand-primary" />
      )}
    </button>
  )
}
