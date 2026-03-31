'use client'

import { useEffect, useState, useCallback } from 'react'
import { TopBar } from '@/components/ui/TopBar'
import { JournalPanel } from '@/components/journal/JournalPanel'
import { MapCanvas } from '@/components/map/MapCanvas'
import { useSmartPoll } from '@/lib/poll'

export default function Home() {
  const { state, loading, fetchState, startPolling } = useSmartPoll()
  const [extracting, setExtracting] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    fetchState().then(() => setLastSync(new Date()))
  }, [fetchState])

  const handleEntryCreated = useCallback(() => {
    setExtracting(true)
    startPolling().then(() => {
      setExtracting(false)
      setLastSync(new Date())
    })
  }, [startPolling])

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-secondary)]">
      <TopBar />
      <div className="flex flex-1 overflow-hidden max-md:flex-col">
        <JournalPanel onEntryCreated={handleEntryCreated} />
        <MapCanvas
          state={state}
          loading={loading}
          extracting={extracting}
          lastSync={lastSync}
        />
      </div>
    </div>
  )
}
