'use client'

export function TopBar() {
  return (
    <header className="h-12 bg-[var(--bg-surface)] border-b border-[var(--border)] flex items-center px-5">
      <div className="text-lg font-bold tracking-tight">
        <span className="text-[var(--accent)]">G</span>
        <span className="text-[var(--text-primary)]">emba</span>
      </div>
    </header>
  )
}
