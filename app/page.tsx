'use client'

import { useEffect, useState, useCallback } from 'react'
import { TopBar } from '@/components/ui/TopBar'
import { JournalPanel } from '@/components/journal/JournalPanel'
import { MapCanvas } from '@/components/map/MapCanvas'
import { useSmartPoll } from '@/lib/poll'

export default function Home() {
  const { state, loading, fetchState } = useSmartPoll()
  const [unprocessedCount, setUnprocessedCount] = useState(0)

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

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-secondary)]">
      <TopBar onRefresh={handleRefresh} />
      <div className="flex flex-1 overflow-hidden max-md:flex-col">
        <JournalPanel onEntryCreated={handleEntryCreated} />
        <MapCanvas
          state={state}
          loading={loading}
          unprocessedCount={unprocessedCount}
        />
      </div>
    </div>
  )
}
