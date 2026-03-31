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

export function StateDot({ state, size = 10 }: { state: StoryState; size?: number }) {
  const color = stateColors[state]
  const isBurning = state === 'burning'

  return (
    <motion.div
      className="rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        boxShadow: state !== 'dormant' ? `0 0 ${size * 0.8}px ${color}60` : 'none',
        opacity: state === 'dormant' ? 0.5 : 1,
      }}
      animate={isBurning ? {
        boxShadow: [
          `0 0 ${size * 0.8}px ${color}60`,
          `0 0 ${size * 1.6}px ${color}a0`,
          `0 0 ${size * 0.8}px ${color}60`,
        ],
      } : undefined}
      transition={isBurning ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : undefined}
      role="img"
      aria-label={stateLabels[state]}
      title={stateLabels[state]}
    />
  )
}
