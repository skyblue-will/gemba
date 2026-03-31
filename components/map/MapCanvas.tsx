'use client'

import { useCallback } from 'react'
import { RoleContainer } from './RoleContainer'
import { AgentStatus } from './AgentStatus'
import type { MapState } from '@/lib/types'

interface MapCanvasProps {
  state: MapState | null
  loading: boolean
  unprocessedCount: number
  onReply?: (storyId: string, body: string) => void
}

function autoPlace(index: number): { x: number; y: number } {
  const col = index % 2
  const row = Math.floor(index / 2)
  return { x: 24 + col * 340, y: 56 + row * 280 }
}

function isValidPosition(pos: { x: number; y: number } | null): pos is { x: number; y: number } {
  return pos !== null && (pos.x > 10 || pos.y > 10)
}

export function MapCanvas({ state, loading, unprocessedCount, onReply }: MapCanvasProps) {
  const handlePositionChange = useCallback(async (roleId: string, position: { x: number; y: number }) => {
    try {
      await fetch(`/api/roles/${roleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position }),
      })
    } catch {}
  }, [])

  if (loading) {
    return (
      <div className="flex-1 relative bg-[var(--bg-base)] flex items-center justify-center">
        <div className="text-[var(--text-muted)] text-sm animate-pulse">Loading...</div>
      </div>
    )
  }

  const isEmpty = !state || state.roles.length === 0

  if (isEmpty) {
    return (
      <div className="flex-1 relative bg-[var(--bg-base)] flex items-center justify-center"
        style={{
          background: 'radial-gradient(circle at 30% 40%, #7c6ff008 0%, transparent 50%), radial-gradient(circle at 70% 60%, #f07c6f06 0%, transparent 50%), var(--bg-base)',
        }}
      >
        <AgentStatus unprocessedCount={unprocessedCount} />
        {extracting ? (
          <div className="text-center max-w-md px-8">
            <div className="text-lg text-[var(--text-primary)] mb-2 animate-pulse">
              Mapping your world...
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              Creating roles and stories from what you wrote.
            </p>
          </div>
        ) : (
          <div className="text-center max-w-md px-8">
            <p className="text-sm text-[var(--text-muted)]">
              Your map will appear here as you journal.
            </p>
          </div>
        )}
      </div>
    )
  }

  const rolesWithPositions = state.roles.map((role, i) => ({
    ...role,
    position: isValidPosition(role.position) ? role.position : autoPlace(i),
  }))

  return (
    <div
      className="flex-1 relative overflow-auto"
      style={{
        background: 'radial-gradient(circle at 30% 40%, #7c6ff008 0%, transparent 50%), radial-gradient(circle at 70% 60%, #f07c6f06 0%, transparent 50%), var(--bg-base)',
      }}
    >
      <AgentStatus extracting={extracting} lastSync={lastSync} />

      {rolesWithPositions.map(role => (
        <RoleContainer
          key={role.id}
          role={role}
          onPositionChange={handlePositionChange}
          onReply={onReply}
        />
      ))}
    </div>
  )
}
