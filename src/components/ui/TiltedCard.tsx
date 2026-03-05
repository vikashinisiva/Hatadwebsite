'use client'

import { useRef, useCallback, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

const springConfig = {
  damping: 25,
  stiffness: 150,
  mass: 1.2,
}

const captionSpring = {
  stiffness: 350,
  damping: 30,
  mass: 1,
}

interface TiltedCardProps {
  children: ReactNode
  containerHeight?: string
  containerWidth?: string
  scaleOnHover?: number
  rotateAmplitude?: number
  showTooltip?: boolean
  captionText?: string
}

export function TiltedCard({
  children,
  containerHeight = '100%',
  containerWidth = '100%',
  scaleOnHover = 1.05,
  rotateAmplitude = 12,
  showTooltip = false,
  captionText = '',
}: TiltedCardProps) {
  const ref = useRef<HTMLElement>(null)
  const lastY = useRef(0)
  const rafId = useRef(0)

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(0, springConfig)
  const rotateY = useSpring(0, springConfig)
  const scale = useSpring(1, springConfig)
  const opacity = useSpring(0)
  const rotateFigcaption = useSpring(0, captionSpring)

  const handleMouse = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return

    cancelAnimationFrame(rafId.current)
    rafId.current = requestAnimationFrame(() => {
      const el = ref.current
      if (!el) return

      const rect = el.getBoundingClientRect()
      const halfW = rect.width / 2
      const halfH = rect.height / 2
      const offsetX = e.clientX - rect.left - halfW
      const offsetY = e.clientY - rect.top - halfH

      rotateX.set((offsetY / halfH) * -rotateAmplitude)
      rotateY.set((offsetX / halfW) * rotateAmplitude)

      x.set(e.clientX - rect.left)
      y.set(e.clientY - rect.top)

      const velocityY = offsetY - lastY.current
      rotateFigcaption.set(-velocityY * 0.6)
      lastY.current = offsetY
    })
  }, [rotateAmplitude, rotateX, rotateY, x, y, rotateFigcaption])

  const handleMouseEnter = useCallback(() => {
    scale.set(scaleOnHover)
    opacity.set(1)
  }, [scaleOnHover, scale, opacity])

  const handleMouseLeave = useCallback(() => {
    cancelAnimationFrame(rafId.current)
    opacity.set(0)
    scale.set(1)
    rotateX.set(0)
    rotateY.set(0)
    rotateFigcaption.set(0)
    lastY.current = 0
  }, [opacity, scale, rotateX, rotateY, rotateFigcaption])

  return (
    <figure
      ref={ref}
      className="tilted-card-figure"
      style={{ height: containerHeight, width: containerWidth }}
      onMouseMove={handleMouse}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="tilted-card-inner"
        style={{ rotateX, rotateY, scale, width: '100%' }}
      >
        {children}
      </motion.div>

      {showTooltip && captionText && (
        <motion.figcaption
          className="tilted-card-caption"
          style={{ x, y, opacity, rotate: rotateFigcaption }}
        >
          {captionText}
        </motion.figcaption>
      )}
    </figure>
  )
}
