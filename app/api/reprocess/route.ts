import { NextRequest, NextResponse } from 'next/server'
import { extractFromEntries } from '@/lib/extract'
import { getMapState, listJournalEntries, resetMap } from '@/lib/queries'

const BATCH_SIZE = 10

export async function POST(request: NextRequest) {
  // Step 1: Wipe all derived data, mark entries unprocessed
  await resetMap()

  // Step 2: Re-extract all entries in chronological batches
  const allEntries = await listJournalEntries(false)

  if (allEntries.length === 0) {
    return NextResponse.json({ message: 'No journal entries to reprocess', actions: [] })
  }

  const allActions: any[] = []

  for (let i = 0; i < allEntries.length; i += BATCH_SIZE) {
    const batch = allEntries.slice(i, i + BATCH_SIZE)
    // Re-fetch state each batch so the LLM sees what previous batches created
    const state = await getMapState()
    const actions = await extractFromEntries(state, batch)
    allActions.push(...actions)
  }

  return NextResponse.json({
    message: `Reprocessed ${allEntries.length} entries in ${Math.ceil(allEntries.length / BATCH_SIZE)} batches`,
    actions: allActions,
  })
}
