'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StateDot } from './StateDot'
import { ProblemCard } from './ProblemCard'
import type { StoryWithChildren, StoryState } from '@/lib/types'

function timeAgo(date: Date | null): string {
  if (!date) return ''
  const diff = new Date().getTime() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface StoryCardProps {
  story: StoryWithChildren
  depth?: number
  onStateChange?: (storyId: string, newState: StoryState) => void
  onReply?: (storyId: string, body: string) => void
}

export function StoryCard({ story, depth = 0, onStateChange, onReply }: StoryCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [currentState, setCurrentState] = useState<StoryState>(story.state)
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const hasChildren = story.children.length > 0 || story.problems.length > 0
  const isDormant = currentState === 'dormant'
  const isActive = story.lastMentioned
    ? new Date().getTime() - new Date(story.lastMentioned).getTime() < 86400000
    : false

  async function handleStateChange(nextState: StoryState) {
    setCurrentState(nextState)
    try {
      await fetch(`/api/stories/${story.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: nextState }),
      })
      onStateChange?.(story.id, nextState)
    } catch {
      setCurrentState(story.state)
    }
  }

  function handleCardClick() {
    if (hasChildren) {
      setExpanded(!expanded)
    } else {
      setReplying(true)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  function handleReplySubmit() {
    const trimmed = replyText.trim()
    if (!trimmed) return
    onReply?.(story.id, trimmed)
    setReplyText('')
    setReplying(false)
  }

  function handleReplyKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleReplySubmit()
    }
    if (e.key === 'Escape') {
      setReplying(false)
      setReplyText('')
    }
  }

  return (
    <motion.div
      layout
      className="mb-1.5"
      style={{ opacity: isDormant ? 0.4 : 1 }}
      animate={{ opacity: isDormant ? 0.4 : 1 }}
      transition={{ duration: 0.5 }}
    >
      <div
        onClick={handleCardClick}
        className={`w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left transition-colors cursor-pointer ${
          isActive ? 'bg-[var(--accent)]08' : 'bg-[var(--bg-elevated)]80'
        } border border-[var(--border)] hover:border-[var(--text-muted)]`}
        role="button"
        aria-expanded={hasChildren ? expanded : undefined}
      >
        <StateDot state={currentState} onClick={handleStateChange} />
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
        <div className="flex items-center gap-1 mt-1">
          {!replying && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setReplying(true)
                setTimeout(() => inputRef.current?.focus(), 100)
              }}
              className="text-[10px] text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--accent)] transition-all px-1"
              title="Reply to this story"
            >
              ↩
            </button>
          )}
          {hasChildren && (
            <span className="text-[10px] text-[var(--text-muted)]">
              {expanded ? '▾' : '▸'}
            </span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {replying && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden mt-1"
          >
            <div className="flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-2.5 py-1.5">
              <span className="text-[10px] text-[var(--accent)] shrink-0">↩</span>
              <input
                ref={inputRef}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={handleReplyKeyDown}
                placeholder={`Reply to "${story.label.slice(0, 30)}..."`}
                className="flex-1 bg-transparent border-none text-[12px] text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-muted)]"
                maxLength={2000}
              />
              <button
                onClick={handleReplySubmit}
                disabled={!replyText.trim()}
                className="text-[10px] text-[var(--accent)] disabled:opacity-30"
              >
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden ml-4 mt-1 pl-3 border-l border-[var(--border)]"
          >
            {story.problems.map(p => (
              <ProblemCard key={p.id} problem={p} />
            ))}
            {story.children.map(child => (
              <StoryCard key={child.id} story={child} depth={0} onStateChange={onStateChange} onReply={onReply} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
