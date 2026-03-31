'use client'

import type { Problem } from '@/lib/types'

export function ProblemCard({ problem }: { problem: Problem }) {
  return (
    <div className="ml-5 pl-3 py-2 border-l border-[var(--state-messy)] border-opacity-30 text-xs text-[var(--text-muted)]">
      <span className="text-[var(--state-messy)]">!</span>{' '}
      {problem.description}
    </div>
  )
}
