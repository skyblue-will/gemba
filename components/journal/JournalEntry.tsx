'use client'

import type { JournalEntry as JournalEntryType } from '@/lib/types'

function timeAgo(date: Date | null): string {
  if (!date) return ''
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface JournalEntryCardProps {
  entry: JournalEntryType
  storyLabel?: string
  onDelete?: (id: string) => void
}

export function JournalEntryCard({ entry, storyLabel, onDelete }: JournalEntryCardProps) {
  const isRecent = entry.createdAt
    ? new Date().getTime() - new Date(entry.createdAt).getTime() < 3600000
    : false
  const canDelete = !entry.processed
  const isReply = !!entry.storyId

  return (
    <div
      className={`group p-3 mb-2 rounded-lg bg-[var(--bg-elevated)] border-l-[3px] text-sm leading-relaxed transition-opacity ${
        isReply
          ? 'border-l-[var(--accent)]50'
          : isRecent ? 'border-l-[var(--accent)]' : 'border-l-transparent opacity-60'
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[11px] font-mono text-[var(--text-muted)]">
          {timeAgo(entry.createdAt)}
        </span>
        {isReply && storyLabel && (
          <span className="text-[10px] text-[var(--accent)] truncate max-w-[160px]" title={`Reply to: ${storyLabel}`}>
            ↩ {storyLabel}
          </span>
        )}
        {entry.processed && (
          <span className="text-[10px] text-[var(--state-progressing)]" title="Mapped">✓</span>
        )}
        {entry.processed === false && (
          <span className="text-[10px] text-[var(--state-messy)]" title="Not yet mapped">○</span>
        )}
        {canDelete && onDelete && (
          <button
            onClick={() => onDelete(entry.id)}
            className="ml-auto text-[10px] text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--state-burning)] transition-all"
            title="Remove entry"
            aria-label="Remove journal entry"
          >
            ✕
          </button>
        )}
      </div>
      <p className="text-[var(--text-secondary)]">{entry.body}</p>
    </div>
  )
}
