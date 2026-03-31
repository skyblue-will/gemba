'use client'

import { useState, useCallback, useRef } from 'react'
import type { MapState } from './types'

export function useSmartPoll(apiKey?: string) {
  const [state, setState] = useState<MapState | null>(null)
  const [loading, setLoading] = useState(true)
  const pollingRef = useRef(false)
  const etagRef = useRef<string | null>(null)

  const headers: Record<string, string> = {}
  if (apiKey) headers['x-api-key'] = apiKey

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/state', { headers })
      if (!res.ok) return false
      const data: MapState = await res.json()
      const changed = etagRef.current !== null && etagRef.current !== data.etag
      etagRef.current = data.etag
      setState(data)
      setLoading(false)
      return changed
    } catch {
      return false
    }
  }, [])

  const startPolling = useCallback(async () => {
    if (pollingRef.current) return
    pollingRef.current = true

    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 2000))
      if (!pollingRef.current) break
      const changed = await fetchState()
      if (changed) break
    }

    pollingRef.current = false
  }, [fetchState])

  const stopPolling = useCallback(() => {
    pollingRef.current = false
  }, [])

  return { state, loading, fetchState, startPolling, stopPolling }
}
