'use client'

import { useState, useEffect, useRef } from 'react'
import { JournalInput } from './JournalInput'
import { JournalEntryCard } from './JournalEntry'
import type { JournalEntry, MapState } from '@/lib/types'

interface JournalPanelProps {
  onEntryCreated: () => void
  mapState: MapState | null
  onScrollToStory?: (storyId: string) => void
}

export function JournalPanel({ onEntryCreated, mapState, onScrollToStory }: JournalPanelProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [submitting, setSubmitting] = useState(false)
  const feedRef = useRef<HTMLDivElement>(null)

  async function fetchEntries() {
    try {
      const res = await fetch('/api/journal')
      if (res.ok) {
        const data = await res.json()
        setEntries(data.reverse())
      }
    } catch {}
  }

  useEffect(() => {
    fetchEntries()
  }, [])

  async function handleSubmit(body: string) {
    setSubmitting(true)

    // Optimistic add
    const optimistic: JournalEntry = {
      id: 'temp-' + Date.now(),
      body,
      storyId: null,
      processed: false,
      createdAt: new Date(),
    }
    setEntries(prev => [optimistic, ...prev])

    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })

      if (res.ok) {
        const entry = await res.json()
        setEntries(prev => prev.map(e => e.id === optimistic.id ? entry : e))
        onEntryCreated()
      } else {
        setEntries(prev => prev.filter(e => e.id !== optimistic.id))
      }
    } catch {
      setEntries(prev => prev.filter(e => e.id !== optimistic.id))
    }

    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id))
    try {
      await fetch(`/api/journal/${id}`, { method: 'DELETE' })
    } catch {}
  }

  // Build story ID -> label map from map state
  const storyLabelMap = new Map<string, string>()
  if (mapState) {
    const collect = (stories: any[]) => {
      for (const s of stories) {
        storyLabelMap.set(s.id, s.label)
        if (s.children) collect(s.children)
      }
    }
    mapState.roles.forEach(r => collect(r.stories))
  }

  // Refresh entries periodically to pick up processed status
  useEffect(() => {
    const interval = setInterval(fetchEntries, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-[360px] shrink-0 border-r border-[var(--border)] flex flex-col bg-[var(--bg-surface)] max-md:w-full max-md:border-r-0">
      <div className="p-4 pb-3 text-xs uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border)]">
        Journal
      </div>

      <div ref={feedRef} className="flex-1 overflow-y-auto p-3 space-y-0">
        {entries.length === 0 && (
          <div className="text-center text-[var(--text-muted)] text-sm py-12">
            Your story starts here.
          </div>
        )}
        {entries.map(entry => (
          <JournalEntryCard
            key={entry.id}
            entry={entry}
            storyLabel={entry.storyId ? storyLabelMap.get(entry.storyId) : undefined}
            onDelete={handleDelete}
            onScrollToStory={onScrollToStory}
          />
        ))}
      </div>

      <JournalInput onSubmit={handleSubmit} disabled={submitting} />
    </div>
  )
}
