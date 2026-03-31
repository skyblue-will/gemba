'use client'

import { RoleContainer } from './RoleContainer'
import { AgentStatus } from './AgentStatus'
import type { MapState } from '@/lib/types'

interface MapCanvasProps {
  state: MapState | null
  loading: boolean
  extracting: boolean
  lastSync: Date | null
}

export function MapCanvas({ state, loading, extracting, lastSync }: MapCanvasProps) {
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
        <AgentStatus extracting={extracting} lastSync={lastSync} />
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

  return (
    <div
      className="flex-1 relative overflow-auto p-6"
      style={{
        background: 'radial-gradient(circle at 30% 40%, #7c6ff008 0%, transparent 50%), radial-gradient(circle at 70% 60%, #f07c6f06 0%, transparent 50%), var(--bg-base)',
      }}
    >
      <AgentStatus extracting={extracting} lastSync={lastSync} />

      <div className="flex flex-wrap gap-4 items-start">
        {state.roles.map(role => (
          <RoleContainer key={role.id} role={role} />
        ))}
      </div>
    </div>
  )
}
