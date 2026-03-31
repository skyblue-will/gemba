'use client'

import { useState, useRef } from 'react'

interface JournalInputProps {
  onSubmit: (body: string) => void
  disabled?: boolean
}

export function JournalInput({ onSubmit, disabled }: JournalInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSubmit() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed)
    setValue('')
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="p-3 border-t border-[var(--border)]">
      <div className="flex items-end gap-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[10px] p-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What's happening right now..."
          maxLength={2000}
          rows={1}
          disabled={disabled}
          className="flex-1 bg-transparent border-none text-[var(--text-secondary)] text-sm outline-none resize-none placeholder:text-[var(--text-muted)] disabled:opacity-50"
          style={{ minHeight: '20px', maxHeight: '120px' }}
          onInput={e => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = 'auto'
            target.style.height = Math.min(target.scrollHeight, 120) + 'px'
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="w-7 h-7 rounded-md bg-[var(--accent)] text-white flex items-center justify-center text-sm shrink-0 disabled:opacity-30 hover:brightness-110 transition-all"
          aria-label="Send journal entry"
        >
          ↑
        </button>
      </div>
    </div>
  )
}
