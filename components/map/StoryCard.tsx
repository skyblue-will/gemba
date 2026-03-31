'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StateDot } from './StateDot'
import { ProblemCard } from './ProblemCard'
import type { StoryWithChildren } from '@/lib/types'

function timeAgo(date: Date | null): string {
  if (!date) return ''
  const diff = new Date().getTime() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function StoryCard({ story, depth = 0 }: { story: StoryWithChildren; depth?: number }) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = story.children.length > 0 || story.problems.length > 0
  const isDormant = story.state === 'dormant'
  const isActive = story.lastMentioned
    ? new Date().getTime() - new Date(story.lastMentioned).getTime() < 86400000
    : false

  return (
    <motion.div
      layout
      className="mb-1.5"
      style={{ opacity: isDormant ? 0.4 : 1 }}
      animate={{ opacity: isDormant ? 0.4 : 1 }}
      transition={{ duration: 0.5 }}
    >
      <button
        onClick={() => hasChildren && setExpanded(!expanded)}
        className={`w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left transition-colors ${
          isActive ? 'bg-[var(--accent)]08' : 'bg-[var(--bg-elevated)]80'
        } border border-[var(--border)] hover:border-[var(--text-muted)] ${
          hasChildren ? 'cursor-pointer' : 'cursor-default'
        }`}
        style={{ marginLeft: depth * 16 }}
        aria-expanded={hasChildren ? expanded : undefined}
      >
        <StateDot state={story.state} />
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] leading-snug text-[var(--text-secondary)]">
            <span className="font-medium text-[var(--text-primary)]">{story.label}</span>
            {story.narrative && (
              <span className="text-[var(--text-muted)]"> — {story.narrative}</span>
            )}
          </div>
          <div className="text-[10px] font-mono text-[var(--text-muted)] mt-1">
            {timeAgo(story.lastMentioned)}
          </div>
        </div>
        {hasChildren && (
          <span className="text-[10px] text-[var(--text-muted)] mt-1">
            {expanded ? '▾' : '▸'}
          </span>
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {story.problems.map(p => (
              <ProblemCard key={p.id} problem={p} />
            ))}
            {story.children.map(child => (
              <StoryCard key={child.id} story={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
