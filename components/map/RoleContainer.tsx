'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { StoryCard } from './StoryCard'
import type { Role } from '@/lib/types'

interface RoleContainerProps {
  role: Role
  isFocused?: boolean
  onFocus?: (roleId: string) => void
  onPositionChange?: (roleId: string, position: { x: number; y: number }) => void
  onReply?: (storyId: string, body: string) => void
}

export function RoleContainer({ role, isFocused, onFocus, onPositionChange, onReply }: RoleContainerProps) {
  const activeCount = role.stories.filter(s => s.state !== 'dormant').length
  const constraintsRef = useRef(null)

  return (
    <motion.div
      layout
      className="absolute border border-[var(--border)] rounded-2xl p-4 bg-[var(--bg-surface)]90 backdrop-blur-sm"
      drag
      dragMomentum={false}
      dragElastic={0}
      whileDrag={{ scale: 1.02, zIndex: 100, cursor: 'grabbing' }}
      onPointerDown={() => onFocus?.(role.id)}
      style={{
        left: role.position?.x ?? 0,
        top: role.position?.y ?? 0,
        minWidth: 240,
        maxWidth: 320,
        cursor: 'grab',
        zIndex: isFocused ? 50 : 1,
      }}
      onDragEnd={(_, info) => {
        const newX = (role.position?.x ?? 0) + info.offset.x
        const newY = (role.position?.y ?? 0) + info.offset.y
        onPositionChange?.(role.id, { x: Math.max(0, newX), y: Math.max(0, newY) })
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        {role.icon && (
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'var(--accent)20', color: 'var(--accent)' }}
          >
            {role.icon}
          </div>
        )}
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
          {role.name}
        </h3>
        {activeCount > 0 && (
          <span className="text-[10px] font-mono text-[var(--text-muted)] ml-auto">
            {activeCount} active
          </span>
        )}
      </div>

      {role.vision && (
        <p className="text-[11px] text-[var(--text-muted)] italic mb-3 pl-9">
          {role.vision}
        </p>
      )}

      <div className="space-y-0">
        {role.stories.length === 0 && (
          <p className="text-xs text-[var(--text-muted)] py-2 text-center">
            No stories yet
          </p>
        )}
        {role.stories.map(story => (
          <StoryCard key={story.id} story={story} onReply={onReply} />
        ))}
      </div>
    </motion.div>
  )
}
