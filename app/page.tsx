'use client'

import { useEffect, useState, useCallback } from 'react'
import { TopBar } from '@/components/ui/TopBar'
import { JournalPanel } from '@/components/journal/JournalPanel'
import { MapCanvas } from '@/components/map/MapCanvas'

export default function Home() {
  const [unprocessedCount, setUnprocessedCount] = useState(0)
  const [journalRefreshKey, setJournalRefreshKey] = useState(0)
  // mapState is still fetched for the journal panel's story label map
  const [mapState, setMapState] = useState<any>(null)

  async function fetchUnprocessedCount() {
    try {
      const res = await fetch('/api/journal?unprocessed=true')
      if (res.ok) {
        const data = await res.json()
        setUnprocessedCount(data.length)
      }
    } catch {}
  }

  async function fetchMapState() {
    try {
      const res = await fetch('/api/state')
      if (res.ok) {
        const data = await res.json()
        setMapState(data)
      }
    } catch {}
  }

  useEffect(() => {
    fetchUnprocessedCount()
    fetchMapState()
  }, [])

  const handleRefresh = useCallback(() => {
    fetchUnprocessedCount()
    fetchMapState()
    // Trigger canvas refresh via window
    ;(window as any).__gembaRefresh?.()
  }, [])

  const handleEntryCreated = useCallback(() => {
    setUnprocessedCount(prev => prev + 1)
  }, [])

  const handleScrollToNode = useCallback((nodeId: string) => {
    const el = document.querySelector(`[data-node-id="${nodeId}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-2', 'ring-[var(--accent)]', 'rounded-lg')
      setTimeout(() => el.classList.remove('ring-2', 'ring-[var(--accent)]', 'rounded-lg'), 2000)
    }
  }, [])

  const handleReply = useCallback(async (nodeId: string, body: string) => {
    try {
      await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, nodeId }),
      })
      setUnprocessedCount(prev => prev + 1)
      setJournalRefreshKey(prev => prev + 1)
    } catch {}
  }, [])

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-base)] text-[var(--text-secondary)]">
      <TopBar onRefresh={handleRefresh} />
      <div className="flex flex-1 overflow-hidden max-md:flex-col">
        <JournalPanel
          onEntryCreated={handleEntryCreated}
          mapState={mapState}
          onScrollToStory={handleScrollToNode}
          refreshKey={journalRefreshKey}
        />
        <MapCanvas
          unprocessedCount={unprocessedCount}
          onReply={handleReply}
        />
      </div>
    </div>
  )
}
