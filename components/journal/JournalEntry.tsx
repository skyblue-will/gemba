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

export function JournalEntryCard({ entry }: { entry: JournalEntryType }) {
  const isRecent = entry.createdAt
    ? new Date().getTime() - new Date(entry.createdAt).getTime() < 3600000
    : false

  return (
    <div
      className={`p-3 mb-2 rounded-lg bg-[var(--bg-elevated)] border-l-[3px] text-sm leading-relaxed transition-opacity ${
        isRecent ? 'border-l-[var(--accent)]' : 'border-l-transparent opacity-60'
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[11px] font-mono text-[var(--text-muted)]">
          {timeAgo(entry.createdAt)}
        </span>
        {entry.processed && (
          <span className="text-[10px] text-[var(--state-progressing)]" title="Mapped">✓</span>
        )}
        {entry.processed === false && (
          <span className="text-[10px] text-[var(--state-messy)]" title="Not yet mapped">○</span>
        )}
      </div>
      <p className="text-[var(--text-secondary)]">{entry.body}</p>
    </div>
  )
}
