import { NextRequest, NextResponse } from 'next/server'
import { extractFromEntries } from '@/lib/extract'
import { getMapState, listJournalEntries } from '@/lib/queries'

export async function POST(request: NextRequest) {
  const { entryIds } = await request.json().catch(() => ({ entryIds: undefined }))

  const state = await getMapState()

  let entries
  if (entryIds && Array.isArray(entryIds)) {
    const all = await listJournalEntries(false)
    entries = all.filter(e => entryIds.includes(e.id))
  } else {
    entries = await listJournalEntries(true)
  }

  if (entries.length === 0) {
    return NextResponse.json({ message: 'No entries to process', actions: [] })
  }

  const actions = await extractFromEntries(state, entries)
  return NextResponse.json({ message: `Processed ${entries.length} entries`, actions })
}
