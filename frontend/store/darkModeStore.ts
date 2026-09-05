'use client'

import { useSyncExternalStore } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

interface DarkModeState {
  theme: ThemeMode
  isDark: boolean
  toggleTheme: () => void
  setTheme: (theme: ThemeMode) => void
}

const STORAGE_KEY = 'alhussain_theme'

let currentTheme: ThemeMode = 'system'
let listeners: Array<() => void> = []

function getSystemDark(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function computeIsDark(theme: ThemeMode): boolean {
  if (theme === 'dark') return true
  if (theme === 'light') return false
  return getSystemDark()
}

function applyThemeToDocument(isDark: boolean) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

// Initialize on client
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      currentTheme = saved
    }
  } catch {
    // Ignore localStorage errors
  }
  applyThemeToDocument(computeIsDark(currentTheme))

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (currentTheme === 'system') {
      applyThemeToDocument(getSystemDark())
      notify()
    }
  })
}

function notify() {
  for (const listener of listeners) {
    listener()
  }
}

export const darkModeStore = {
  getSnapshot: (): DarkModeState => ({
    theme: currentTheme,
    isDark: computeIsDark(currentTheme),
    toggleTheme: () => {
      const next: ThemeMode = computeIsDark(currentTheme) ? 'light' : 'dark'
      darkModeStore.setTheme(next)
    },
    setTheme: (theme: ThemeMode) => {
      currentTheme = theme
      try {
        localStorage.setItem(STORAGE_KEY, theme)
      } catch {
        // Ignore
      }
      applyThemeToDocument(computeIsDark(theme))
      notify()
    },
  }),
  subscribe: (listener: () => void) => {
    listeners.push(listener)
    return () => {
      listeners = listeners.filter(l => l !== listener)
    }
  },
  setTheme: (theme: ThemeMode) => {
    currentTheme = theme
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Ignore
    }
    applyThemeToDocument(computeIsDark(theme))
    notify()
  },
}

export function useDarkModeStore(): DarkModeState {
  return useSyncExternalStore(
    darkModeStore.subscribe,
    darkModeStore.getSnapshot,
    // Server snapshot
    () => ({
      theme: 'system',
      isDark: false,
      toggleTheme: () => {},
      setTheme: () => {},
    })
  )
}

export default useDarkModeStore
