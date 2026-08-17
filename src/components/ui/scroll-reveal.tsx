'use client'

import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * ScrollReveal — React Bits, adapted.
 *
 * Words resolve from faint and blurred to solid as the block passes through the
 * viewport, and the block itself unrotates. All three animations are scrubbed,
 * so the reader controls the pace.
 *
 * Three changes from the published source:
 *
 *  1. Cleanup was `ScrollTrigger.getAll().forEach(t => t.kill())`, which kills
 *     every trigger on the page — including ones this component never created.
 *     Any other scroll-driven section would silently die when this unmounted.
 *     Replaced with gsap.context(), which reverts only what it created.
 *  2. It rendered <p> inside <h2>. That is invalid HTML — a heading cannot
 *     contain a paragraph — and browsers repair it by closing the heading
 *     early, which breaks the styling and the accessibility tree.
 *  3. `willChange: 'opacity'` was set and never cleared, permanently promoting
 *     every word to its own layer. It is now cleared once the tween completes.
 */

export type ScrollRevealProps = {
  children: string
  scrollContainerRef?: RefObject<HTMLElement | null>
  enableBlur?: boolean
  baseOpacity?: number
  baseRotation?: number
  blurStrength?: number
  containerClassName?: string
  textClassName?: string
  rotationEnd?: string
  wordAnimationEnd?: string
}

export function ScrollReveal({
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 3,
  blurStrength = 4,
  containerClassName = '',
  textClassName = '',
  rotationEnd = 'bottom bottom',
  wordAnimationEnd = 'bottom bottom',
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const splitText: ReactNode[] = useMemo(
    () =>
      children.split(/(\s+)/).map((word, i) =>
        /^\s+$/.test(word) ? (
          word
        ) : (
          <span className="word" key={i}>
            {word}
          </span>
        ),
      ),
    [children],
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    /* A gentler equivalent, not nothing: the text is simply already resolved. */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(el.querySelectorAll('.word'), { opacity: 1, filter: 'none' })
      gsap.set(el, { rotate: 0 })
      return
    }

    const scroller = scrollContainerRef?.current ?? window
    const words = el.querySelectorAll('.word')

    /* Scoped to this element — reverting the context undoes only these tweens
       and their triggers, leaving every other section's alone. */
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { transformOrigin: '0% 50%', rotate: baseRotation },
        {
          ease: 'none',
          rotate: 0,
          scrollTrigger: { trigger: el, scroller, start: 'top bottom', end: rotationEnd, scrub: true },
        },
      )

      gsap.fromTo(
        words,
        { opacity: baseOpacity, willChange: 'opacity, filter' },
        {
          ease: 'none',
          opacity: 1,
          stagger: 0.05,
          /* Dropped once settled — leaving it on keeps every word promoted to
             its own compositor layer for the life of the page. */
          onComplete: () => {
            gsap.set(words, { willChange: 'auto' })
          },
          scrollTrigger: {
            trigger: el,
            scroller,
            start: 'top bottom-=20%',
            end: wordAnimationEnd,
            scrub: true,
          },
        },
      )

      if (enableBlur) {
        gsap.fromTo(
          words,
          { filter: `blur(${blurStrength}px)` },
          {
            ease: 'none',
            filter: 'blur(0px)',
            stagger: 0.05,
            scrollTrigger: {
              trigger: el,
              scroller,
              start: 'top bottom-=20%',
              end: wordAnimationEnd,
              scrub: true,
            },
          },
        )
      }
    }, el)

    return () => ctx.revert()
  }, [
    scrollContainerRef,
    enableBlur,
    baseRotation,
    baseOpacity,
    rotationEnd,
    wordAnimationEnd,
    blurStrength,
  ])

  return (
    <div ref={containerRef} className={containerClassName}>
      <p className={textClassName}>{splitText}</p>
    </div>
  )
}
