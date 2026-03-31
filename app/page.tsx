'use client'

import { useEffect, useState, useCallback } from 'react'
import { TopBar } from '@/components/ui/TopBar'
import { JournalPanel } from '@/components/journal/JournalPanel'
import { MapCanvas } from '@/components/map/MapCanvas'
import { useSmartPoll } from '@/lib/poll'

export default function Home() {
  const { state, loading, fetchState } = useSmartPoll()
  const [unprocessedCount, setUnprocessedCount] = useState(0)
  const [journalRefreshKey, setJournalRefreshKey] = useState(0)

  async function fetchUnprocessedCount() {
    try {
      const res = await fetch('/api/journal?unprocessed=true')
      if (res.ok) {
        const data = await res.json()
        setUnprocessedCount(data.length)
      }
    } catch {}
  }

  useEffect(() => {
    fetchState()
    fetchUnprocessedCount()
  }, [fetchState])

  const handleRefresh = useCallback(() => {
    fetchState()
    fetchUnprocessedCount()
  }, [fetchState])

  const handleEntryCreated = useCallback(() => {
    setUnprocessedCount(prev => prev + 1)
  }, [])

  const handleScrollToStory = useCallback((storyId: string) => {
    const el = document.querySelector(`[data-story-id="${storyId}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-2', 'ring-[var(--accent)]', 'rounded-lg')
      setTimeout(() => el.classList.remove('ring-2', 'ring-[var(--accent)]', 'rounded-lg'), 2000)
    }
  }, [])

  const handleReply = useCallback(async (storyId: string, body: string) => {
    try {
      await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, storyId }),
      })
      setUnprocessedCount(prev => prev + 1)
      setJournalRefreshKey(prev => prev + 1)
    } catch {}
  }, [])

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-secondary)]">
      <TopBar onRefresh={handleRefresh} />
      <div className="flex flex-1 overflow-hidden max-md:flex-col">
        <JournalPanel onEntryCreated={handleEntryCreated} mapState={state} onScrollToStory={handleScrollToStory} refreshKey={journalRefreshKey} />
        <MapCanvas
          state={state}
          loading={loading}
          unprocessedCount={unprocessedCount}
          onReply={handleReply}
        />
      </div>
    </div>
  )
}
