'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  featured?: boolean
  hoverable?: boolean
}

export function Card({ children, className, featured, hoverable = true }: CardProps) {
  return (
    <motion.div
      whileHover={hoverable ? { scale: 1.02 } : undefined}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'rounded-sm border p-6 transition-all duration-300',
        featured
          ? 'bg-surface-raised border-l-4 border-l-accent-blue border-border'
          : 'bg-surface border-border',
        hoverable &&
          'hover:border-accent-blue hover:shadow-[0_4px_24px_rgba(27,79,216,0.12)]',
        className
      )}
    >
      {children}
    </motion.div>
  )
}
