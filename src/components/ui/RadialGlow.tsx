import { cn } from '@/lib/utils'

interface RadialGlowProps {
  color?: string
  size?: string
  opacity?: string
  position?: string
  className?: string
}

export function RadialGlow({
  color = '#1B4FD8',
  size = '800px',
  opacity = '0.15',
  position = '50% 0%',
  className,
}: RadialGlowProps) {
  return (
    <div
      aria-hidden
      className={cn('absolute pointer-events-none z-0', className)}
      style={{
        background: `radial-gradient(${size} circle at ${position}, ${color} 0%, transparent 70%)`,
        opacity,
        inset: 0,
      }}
    />
  )
}
