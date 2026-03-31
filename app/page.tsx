'use client'

import { useEffect, useState, useCallback } from 'react'
import { TopBar } from '@/components/ui/TopBar'
import { JournalPanel } from '@/components/journal/JournalPanel'
import { MapCanvas } from '@/components/map/MapCanvas'
import { useSmartPoll } from '@/lib/poll'

export default function Home() {
  const { state, loading, fetchState } = useSmartPoll()
  const [lastSync, setLastSync] = useState<Date | null>(null)

  // Fetch map state once on page load
  useEffect(() => {
    fetchState().then(() => setLastSync(new Date()))
  }, [fetchState])

  // No auto-polling after journal submit. Map updates only on:
  // 1. Page load (above)
  // 2. Manual refresh (button below)
  // 3. After running /gemba-sync (user refreshes page)

  const handleRefresh = useCallback(() => {
    fetchState().then(() => setLastSync(new Date()))
  }, [fetchState])

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-secondary)]">
      <TopBar onRefresh={handleRefresh} />
      <div className="flex flex-1 overflow-hidden max-md:flex-col">
        <JournalPanel onEntryCreated={() => {}} />
        <MapCanvas
          state={state}
          loading={loading}
          extracting={false}
          lastSync={lastSync}
        />
      </div>
    </div>
  )
}
