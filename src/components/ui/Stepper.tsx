'use client'

import React, { useState, Children, useRef, useLayoutEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface StepperProps {
  children: React.ReactNode
  initialStep?: number
  onStepChange?: (step: number) => void
  onFinalStepCompleted?: () => void
  backButtonText?: string
  nextButtonText?: string
  disableStepIndicators?: boolean
  stepLabels?: string[]
}

export default function Stepper({
  children,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  backButtonText = 'Back',
  nextButtonText = 'Continue',
  disableStepIndicators = false,
  stepLabels,
}: StepperProps) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [direction, setDirection] = useState(0)
  const stepsArray = Children.toArray(children)
  const totalSteps = stepsArray.length
  const isCompleted = currentStep > totalSteps
  const isLastStep = currentStep === totalSteps

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep)
    if (newStep > totalSteps) {
      onFinalStepCompleted()
    } else {
      onStepChange(newStep)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1)
      updateStep(currentStep - 1)
    }
  }

  const handleNext = () => {
    if (!isLastStep) {
      setDirection(1)
      updateStep(currentStep + 1)
    }
  }

  const handleComplete = () => {
    setDirection(1)
    updateStep(totalSteps + 1)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Step indicators row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          paddingBottom: 24,
          gap: 0,
        }}
      >
        {stepsArray.map((_, index) => {
          const stepNumber = index + 1
          const isNotLastStep = index < totalSteps - 1
          return (
            <React.Fragment key={stepNumber}>
              <StepIndicator
                step={stepNumber}
                label={stepLabels?.[index]}
                disableStepIndicators={disableStepIndicators}
                currentStep={currentStep}
                onClickStep={(clicked) => {
                  setDirection(clicked > currentStep ? 1 : -1)
                  updateStep(clicked)
                }}
              />
              {isNotLastStep && <StepConnector isComplete={currentStep > stepNumber} />}
            </React.Fragment>
          )
        })}
      </div>

      {/* Step content */}
      <StepContentWrapper isCompleted={isCompleted} currentStep={currentStep} direction={direction}>
        {stepsArray[currentStep - 1]}
      </StepContentWrapper>

      {/* Footer buttons */}
      {!isCompleted && (
        <div
          style={{
            display: 'flex',
            justifyContent: currentStep !== 1 ? 'space-between' : 'flex-end',
            alignItems: 'center',
            paddingTop: 20,
            marginTop: 8,
            borderTop: '1px solid var(--color-border)',
          }}
        >
          {currentStep !== 1 && (
            <button
              onClick={handleBack}
              type="button"
              style={{
                background: 'none',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                padding: '8px 20px',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                transition: 'all 200ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-text-muted)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)'
              }}
            >
              {backButtonText}
            </button>
          )}
          <button
            onClick={isLastStep ? handleComplete : handleNext}
            type="button"
            style={{
              background: 'var(--color-accent-blue)',
              border: 'none',
              borderRadius: 6,
              padding: '8px 24px',
              fontSize: 13,
              fontWeight: 500,
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 200ms',
              boxShadow: '0 2px 8px rgba(27, 79, 216, 0.25)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-accent-glow)'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(27, 79, 216, 0.35)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-accent-blue)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(27, 79, 216, 0.25)'
            }}
          >
            {isLastStep ? 'Submit Request' : nextButtonText}
          </button>
        </div>
      )}
    </div>
  )
}

function StepContentWrapper({
  isCompleted,
  currentStep,
  direction,
  children,
}: {
  isCompleted: boolean
  currentStep: number
  direction: number
  children: React.ReactNode
}) {
  const [parentHeight, setParentHeight] = useState(0)

  return (
    <motion.div
      style={{ position: 'relative', overflow: 'hidden' }}
      animate={{ height: isCompleted ? 0 : parentHeight }}
      transition={{ type: 'spring', duration: 0.4 }}
    >
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        {!isCompleted && (
          <SlideTransition key={currentStep} direction={direction} onHeightReady={(h) => setParentHeight(h)}>
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function SlideTransition({
  children,
  direction,
  onHeightReady,
}: {
  children: React.ReactNode
  direction: number
  onHeightReady: (h: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (containerRef.current) onHeightReady(containerRef.current.offsetHeight)
  }, [children, onHeightReady])

  return (
    <motion.div
      ref={containerRef}
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4 }}
      style={{ position: 'absolute', left: 0, right: 0, top: 0 }}
    >
      {children}
    </motion.div>
  )
}

const stepVariants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? '-100%' : '100%',
    opacity: 0,
  }),
  center: {
    x: '0%',
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? '50%' : '-50%',
    opacity: 0,
  }),
}

export function Step({ children }: { children: React.ReactNode }) {
  return <div style={{ paddingTop: 4, paddingBottom: 8 }}>{children}</div>
}

function StepIndicator({
  step,
  label,
  currentStep,
  onClickStep,
  disableStepIndicators,
}: {
  step: number
  label?: string
  currentStep: number
  onClickStep: (step: number) => void
  disableStepIndicators: boolean
}) {
  const status = currentStep === step ? 'active' : currentStep < step ? 'inactive' : 'complete'

  const handleClick = () => {
    if (step !== currentStep && !disableStepIndicators) onClickStep(step)
  }

  return (
    <motion.div
      onClick={handleClick}
      style={{
        position: 'relative',
        cursor: disableStepIndicators ? 'default' : 'pointer',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
      }}
      animate={status}
      initial={false}
    >
      <motion.div
        variants={{
          inactive: { scale: 1, backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' },
          active: { scale: 1, backgroundColor: 'var(--color-accent-blue)', color: '#fff' },
          complete: { scale: 1, backgroundColor: 'var(--color-accent-blue)', color: '#fff' },
        }}
        transition={{ duration: 0.3 }}
        style={{
          display: 'flex',
          width: 32,
          height: 32,
          minWidth: 32,
          minHeight: 32,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          fontWeight: 600,
          fontSize: 13,
          border: status === 'inactive' ? '1px solid var(--color-border)' : '1px solid transparent',
        }}
      >
        {status === 'complete' ? (
          <CheckIcon />
        ) : status === 'active' ? (
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{step}</span>
        ) : (
          <span style={{ fontSize: 13 }}>{step}</span>
        )}
      </motion.div>
      {label && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.04em',
            color: status === 'active' ? 'var(--color-accent-blue)' : 'var(--color-text-muted)',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      )}
    </motion.div>
  )
}

function StepConnector({ isComplete }: { isComplete: boolean }) {
  return (
    <div
      style={{
        position: 'relative',
        marginLeft: 8,
        marginRight: 8,
        height: 2,
        flex: 1,
        overflow: 'hidden',
        borderRadius: 2,
        backgroundColor: 'var(--color-border)',
        alignSelf: 'center',
      }}
    >
      <motion.div
        style={{ position: 'absolute', left: 0, top: 0, height: '100%' }}
        variants={{
          incomplete: { width: 0, backgroundColor: 'transparent' },
          complete: { width: '100%', backgroundColor: 'var(--color-accent-blue)' },
        }}
        initial={false}
        animate={isComplete ? 'complete' : 'incomplete'}
        transition={{ duration: 0.4 }}
      />
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.1, type: 'tween', ease: 'easeOut', duration: 0.3 }}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  )
}
