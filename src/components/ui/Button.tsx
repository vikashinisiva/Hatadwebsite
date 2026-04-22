'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ButtonProps {
  variant?: 'primary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  onClick?: () => void
  className?: string
  href?: string
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  className,
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-medium tracking-wide transition-all duration-200 cursor-pointer select-none btn-ripple'

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  }

  const variants = {
    primary:
      'bg-[#0C1525] text-white border border-[#0C1525] hover:bg-[#152238] hover:border-[#152238]',
    ghost:
      'bg-transparent text-text-primary border border-border hover:border-text-secondary hover:bg-surface',
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(base, sizes[size], variants[variant], className)}
    >
      {children}
    </motion.button>
  )
}
