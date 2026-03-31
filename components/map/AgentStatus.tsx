'use client'

import { motion } from 'framer-motion'

interface AgentStatusProps {
  extracting: boolean
  lastSync: Date | null
}

function timeAgo(date: Date | null): string {
  if (!date) return 'Never'
  const diff = new Date().getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export function AgentStatus({ extracting, lastSync }: AgentStatusProps) {
  return (
    <div className="absolute top-4 right-4 flex items-center gap-2 text-[11px] text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 z-10">
      <motion.div
        className="w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor: extracting ? 'var(--state-messy)' : 'var(--state-progressing)',
        }}
        animate={{ opacity: extracting ? [1, 0.4, 1] : [1, 0.4, 1] }}
        transition={{ duration: extracting ? 0.8 : 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {extracting ? 'Mapping...' : `Synced ${timeAgo(lastSync)}`}
    </div>
  )
}
