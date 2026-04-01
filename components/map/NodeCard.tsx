'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StateDot } from './StateDot'
import type { GembaNodeWithChildren, NodeState } from '@/lib/types'

function timeAgo(date: Date | null): string {
  if (!date) return ''
  const diff = new Date().getTime() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const typeIcons: Record<string, string> = {
  project: '◆',
  task: '☐',
  problem: '!',
}

interface NodeCardProps {
  node: GembaNodeWithChildren
  onZoom?: (nodeId: string) => void
  onReply?: (nodeId: string, body: string) => void
}

export function NodeCard({ node, onZoom, onReply }: NodeCardProps) {
  const [currentState, setCurrentState] = useState<NodeState | null>(node.state)
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const hasChildren = node.children.length > 0
  const isDormant = currentState === 'dormant'
  const isRole = node.type === 'role'
  const isProblem = node.type === 'problem'
  const isTask = node.type === 'task'
  const isProject = node.type === 'project'

  async function handleStateChange(nextState: NodeState) {
    setCurrentState(nextState)
    try {
      await fetch(`/api/nodes/${node.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: nextState }),
      })
    } catch {
      setCurrentState(node.state)
    }
  }

  function handleClick() {
    if (hasChildren || isRole || isProject) {
      onZoom?.(node.id)
    } else if (!replying) {
      setReplying(true)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  function handleReplySubmit() {
    const trimmed = replyText.trim()
    if (!trimmed) return
    onReply?.(node.id, trimmed)
    setReplyText('')
    setReplying(false)
  }

  function handleReplyKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); handleReplySubmit() }
    if (e.key === 'Escape') { setReplying(false); setReplyText('') }
  }

  // Problem rendering (minimal)
  if (isProblem) {
    return (
      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--state-messy)]08 border border-[var(--state-messy)]20 text-xs text-[var(--text-muted)]">
        <span className="text-[var(--state-messy)] font-bold shrink-0">!</span>
        <span>{node.body || node.label}</span>
      </div>
    )
  }

  // Role rendering (header card with vision)
  if (isRole) {
    const activeCount = node.children.filter(c => c.state !== 'dormant').length
    return (
      <motion.div
        className="border border-[var(--border)] rounded-2xl p-4 bg-[var(--bg-surface)]90 backdrop-blur-sm cursor-pointer hover:border-[var(--text-muted)] transition-colors"
        onClick={handleClick}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        style={{ opacity: isDormant ? 0.4 : 1 }}
      >
        <div className="flex items-center gap-2 mb-1">
          {node.icon && (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
              style={{ background: 'var(--accent)20', color: 'var(--accent)' }}
            >
              {node.icon}
            </div>
          )}
          <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
            {node.label}
          </h3>
          {activeCount > 0 && (
            <span className="text-[10px] font-mono text-[var(--text-muted)] ml-auto">
              {activeCount} active
            </span>
          )}
          <span className="text-[10px] text-[var(--text-muted)]">▸</span>
        </div>
        {node.vision && (
          <p className="text-[11px] text-[var(--text-muted)] italic pl-9">
            {node.vision}
          </p>
        )}
      </motion.div>
    )
  }

  // Story / Project / Task rendering
  return (
    <motion.div layout data-node-id={node.id} style={{ opacity: isDormant ? 0.4 : 1 }}>
      <div
        onClick={handleClick}
        className={`group w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left transition-colors cursor-pointer bg-[var(--bg-elevated)]80 border border-[var(--border)] hover:border-[var(--text-muted)]`}
      >
        {currentState && !isTask && (
          <StateDot state={currentState} onClick={handleStateChange} />
        )}
        {isTask && (
          <input
            type="checkbox"
            checked={currentState === 'clear'}
            onChange={() => handleStateChange(currentState === 'clear' ? 'messy' : 'clear')}
            onClick={e => e.stopPropagation()}
            className="mt-0.5 accent-[var(--accent)]"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] leading-snug text-[var(--text-secondary)]">
            {typeIcons[node.type] && (
              <span className={`text-[var(--text-muted)] mr-1 ${isProject ? 'text-[var(--accent)]' : ''}`}>
                {typeIcons[node.type]}
              </span>
            )}
            <span className={`font-medium text-[var(--text-primary)] ${currentState === 'clear' && isTask ? 'line-through opacity-50' : ''}`}>
              {node.label}
            </span>
            {node.body && (
              <span className="text-[var(--text-muted)]"> — {node.body}</span>
            )}
          </div>
          <div className="text-[10px] font-mono text-[var(--text-muted)] mt-1 flex items-center gap-2">
            {timeAgo(node.lastMentioned)}
            {hasChildren && <span className="text-[var(--accent)]">{node.children.length} inside</span>}
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
              title="Reply"
            >
              ↩
            </button>
          )}
          {(hasChildren || isProject) && (
            <span className="text-[10px] text-[var(--text-muted)]">▸</span>
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
                placeholder={`Reply to "${node.label.slice(0, 30)}..."`}
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
    </motion.div>
  )
}
