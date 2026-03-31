'use client'

import { useState, useEffect } from 'react'

interface AgentStatusProps {
  unprocessedCount?: number
}

export function AgentStatus({ unprocessedCount = 0 }: AgentStatusProps) {
  const synced = unprocessedCount === 0

  return (
    <div className="absolute top-4 right-4 flex items-center gap-2 text-[11px] text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg px-3 py-1.5 z-10">
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor: synced ? 'var(--state-progressing)' : 'var(--state-messy)',
        }}
      />
      {synced
        ? 'All synced'
        : `${unprocessedCount} unprocessed`
      }
    </div>
  )
}
