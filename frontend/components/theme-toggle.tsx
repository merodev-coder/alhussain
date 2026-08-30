'use client'

import React from 'react'
import { Sun, Moon, Laptop } from 'lucide-react'
import { useTheme } from './theme-provider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
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
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-canvas border border-hairline min-w-[120px]">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={`flex items-center gap-2 cursor-pointer ${
            theme === 'light' ? 'text-brand-primary font-bold' : ''
          }`}
        >
          <Sun className="w-4 h-4" />
          <span>فاتح</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-2 cursor-pointer ${
            theme === 'dark' ? 'text-brand-primary font-bold' : ''
          }`}
        >
          <Moon className="w-4 h-4" />
          <span>داكن</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={`flex items-center gap-2 cursor-pointer ${
            theme === 'system' ? 'text-brand-primary font-bold' : ''
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>تلقائي</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
