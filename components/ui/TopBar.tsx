'use client'

interface TopBarProps {
  onRefresh?: () => void
}

export function TopBar({ onRefresh }: TopBarProps) {
  return (
    <header className="h-12 bg-[var(--bg-surface)] border-b border-[var(--border)] flex items-center px-5">
      <div className="text-lg font-bold tracking-tight">
        <span className="text-[var(--accent)]">G</span>
        <span className="text-[var(--text-primary)]">emba</span>
      </div>

      <div className="ml-auto">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] px-3 py-1.5 rounded-md hover:bg-[var(--bg-elevated)] transition-colors"
            title="Refresh map (after /gemba-sync)"
          >
            Refresh map
          </button>
        )}
      </div>
    </header>
  )
}
