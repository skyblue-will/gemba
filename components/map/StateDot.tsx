'use client'

import { motion } from 'framer-motion'
import type { StoryState } from '@/lib/types'

const stateColors: Record<StoryState, string> = {
  burning: 'var(--state-burning)',
  messy: 'var(--state-messy)',
  stuck: 'var(--state-stuck)',
  progressing: 'var(--state-progressing)',
  clear: 'var(--state-clear)',
  dormant: 'var(--state-dormant)',
}

const stateLabels: Record<StoryState, string> = {
  burning: 'Burning',
  messy: 'Messy',
  stuck: 'Stuck',
  progressing: 'Progressing',
  clear: 'Clear',
  dormant: 'Dormant',
}

const stateCycle: StoryState[] = ['burning', 'messy', 'stuck', 'progressing', 'clear']

interface StateDotProps {
  state: StoryState
  size?: number
  onClick?: (nextState: StoryState) => void
}

export function StateDot({ state, size = 10, onClick }: StateDotProps) {
  const color = stateColors[state]
  const isBurning = state === 'burning'
  const isClickable = !!onClick && state !== 'dormant'

  function handleClick(e: React.MouseEvent) {
    if (!onClick || state === 'dormant') return
    e.stopPropagation()
    const currentIdx = stateCycle.indexOf(state)
    const nextIdx = (currentIdx + 1) % stateCycle.length
    onClick(stateCycle[nextIdx])
  }

  return (
    <motion.div
      className={`rounded-full shrink-0 ${isClickable ? 'cursor-pointer hover:scale-150' : ''}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        boxShadow: state !== 'dormant' ? `0 0 ${size * 0.8}px ${color}60` : 'none',
        opacity: state === 'dormant' ? 0.5 : 1,
        transition: 'transform 0.15s ease',
      }}
      animate={isBurning ? {
        boxShadow: [
          `0 0 ${size * 0.8}px ${color}60`,
          `0 0 ${size * 1.6}px ${color}a0`,
          `0 0 ${size * 0.8}px ${color}60`,
        ],
      } : undefined}
      transition={isBurning ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : undefined}
      onClick={handleClick}
      role={isClickable ? 'button' : 'img'}
      aria-label={`${stateLabels[state]}${isClickable ? ' (click to change)' : ''}`}
      title={`${stateLabels[state]}${isClickable ? ' — click to cycle' : ''}`}
    />
  )
}
