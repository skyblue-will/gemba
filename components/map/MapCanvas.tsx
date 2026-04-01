'use client'

import { useCallback, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { NodeCard } from './NodeCard'
import { AgentStatus } from './AgentStatus'
import type { GembaNodeWithChildren } from '@/lib/types'

interface MapCanvasProps {
  unprocessedCount: number
  onReply?: (nodeId: string, body: string) => void
}

function autoPlace(index: number): { x: number; y: number } {
  const col = index % 2
  const row = Math.floor(index / 2)
  return { x: 24 + col * 340, y: 56 + row * 280 }
}

interface BreadcrumbItem {
  id: string | null
  label: string
}

export function MapCanvas({ unprocessedCount, onReply }: MapCanvasProps) {
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null)
  const [children, setChildren] = useState<GembaNodeWithChildren[]>([])
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: null, label: 'All' }])
  const [loading, setLoading] = useState(true)
  const [focusedId, setFocusedId] = useState<string | null>(null)

  const fetchChildren = useCallback(async (nodeId: string | null) => {
    try {
      const url = nodeId ? `/api/nodes/${nodeId}` : '/api/nodes'
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json()
      // /api/nodes returns an array, /api/nodes/:id returns a node with children
      setChildren(nodeId ? data.children : data)
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChildren(currentNodeId)
  }, [currentNodeId, fetchChildren])

  // Re-fetch periodically to pick up extraction results
  useEffect(() => {
    const interval = setInterval(() => fetchChildren(currentNodeId), 10000)
    return () => clearInterval(interval)
  }, [currentNodeId, fetchChildren])

  const handleZoom = useCallback((nodeId: string) => {
    const node = children.find(c => c.id === nodeId)
    if (node) {
      setBreadcrumbs(prev => [...prev, { id: nodeId, label: node.label }])
    }
    setCurrentNodeId(nodeId)
    setFocusedId(null)
  }, [children])

  const handleBreadcrumbClick = useCallback((index: number) => {
    const target = breadcrumbs[index]
    setBreadcrumbs(prev => prev.slice(0, index + 1))
    setCurrentNodeId(target.id)
    setFocusedId(null)
  }, [breadcrumbs])

  const handlePositionChange = useCallback(async (nodeId: string, position: { x: number; y: number }) => {
    try {
      await fetch(`/api/nodes/${nodeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position }),
      })
    } catch {}
  }, [])

  // Expose refresh for parent
  const handleRefresh = useCallback(() => {
    fetchChildren(currentNodeId)
  }, [currentNodeId, fetchChildren])

  // Attach refresh to window for TopBar
  useEffect(() => {
    (window as any).__gembaRefresh = handleRefresh
    return () => { delete (window as any).__gembaRefresh }
  }, [handleRefresh])

  if (loading && children.length === 0) {
    return (
      <div className="flex-1 relative bg-[var(--bg-base)] flex items-center justify-center">
        <div className="text-[var(--text-muted)] text-sm animate-pulse">Loading...</div>
      </div>
    )
  }

  const isEmpty = children.length === 0
  const isTopLevel = currentNodeId === null

  // Top-level roles use absolute positioning (spatial canvas)
  // Deeper levels use a flow layout (list within the zoomed node)
  const useSpatialLayout = isTopLevel || children.every(c => c.type === 'role')

  return (
    <div
      className="flex-1 relative overflow-auto"
      style={{
        background: 'radial-gradient(circle at 30% 40%, #7c6ff008 0%, transparent 50%), radial-gradient(circle at 70% 60%, #f07c6f06 0%, transparent 50%), var(--bg-base)',
      }}
    >
      <AgentStatus unprocessedCount={unprocessedCount} />

      {/* Breadcrumbs */}
      {breadcrumbs.length > 1 && (
        <div className="absolute top-4 left-4 flex items-center gap-1 z-10 text-[11px]">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.id ?? 'root'} className="flex items-center gap-1">
              {i > 0 && <span className="text-[var(--text-muted)]">→</span>}
              <button
                onClick={() => handleBreadcrumbClick(i)}
                className={`px-2 py-1 rounded-md transition-colors ${
                  i === breadcrumbs.length - 1
                    ? 'text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                {crumb.label}
              </button>
            </span>
          ))}
        </div>
      )}

      {isEmpty && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md px-8">
            <p className="text-sm text-[var(--text-muted)]">
              {isTopLevel
                ? 'Your map will appear here. Journal your thoughts, then run /gemba-sync.'
                : 'No items yet. Journal your thoughts and sync.'}
            </p>
            {!isTopLevel && (
              <button
                onClick={() => handleBreadcrumbClick(breadcrumbs.length - 2)}
                className="mt-3 text-xs text-[var(--accent)] hover:underline"
              >
                ← Go back
              </button>
            )}
          </div>
        </div>
      )}

      {/* Spatial layout for top-level roles */}
      {useSpatialLayout && !isEmpty && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentNodeId ?? 'root'}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            {children.map((node, i) => {
              const pos = node.position ?? autoPlace(i)
              return (
                <motion.div
                  key={node.id}
                  className="absolute"
                  drag
                  dragMomentum={false}
                  dragElastic={0}
                  whileDrag={{ scale: 1.02, zIndex: 100, cursor: 'grabbing' }}
                  onPointerDown={() => setFocusedId(node.id)}
                  style={{
                    left: pos.x,
                    top: pos.y,
                    minWidth: 240,
                    maxWidth: 320,
                    cursor: 'grab',
                    zIndex: node.id === focusedId ? 50 : 1,
                  }}
                  onDragEnd={(_, info) => {
                    const newX = pos.x + info.offset.x
                    const newY = pos.y + info.offset.y
                    handlePositionChange(node.id, { x: Math.max(0, newX), y: Math.max(0, newY) })
                  }}
                >
                  <NodeCard node={node} onZoom={handleZoom} onReply={onReply} />
                </motion.div>
              )
            })}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Flow layout for zoomed-in views */}
      {!useSpatialLayout && !isEmpty && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentNodeId ?? 'root'}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="p-6 pt-14 max-w-2xl mx-auto space-y-2"
          >
            {children.map(node => (
              <NodeCard key={node.id} node={node} onZoom={handleZoom} onReply={onReply} />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
