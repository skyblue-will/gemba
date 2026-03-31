import { NextRequest, NextResponse } from 'next/server'
import { updateJournalEntry, deleteJournalEntry } from '@/lib/queries'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const updates = await request.json()
  const entry = await updateJournalEntry(id, updates)
  if (!entry) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(entry)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const deleted = await deleteJournalEntry(id)
  if (!deleted) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ deleted: true })
}
