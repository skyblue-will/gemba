import { NextRequest, NextResponse } from 'next/server'
import { listJournalEntries, createJournalEntry } from '@/lib/queries'

export async function GET(request: NextRequest) {
  const unprocessed = request.nextUrl.searchParams.get('unprocessed') === 'true'
  const entries = await listJournalEntries(unprocessed)
  return NextResponse.json(entries)
}

export async function POST(request: NextRequest) {
  const { body, storyId, nodeId } = await request.json()

  if (!body || typeof body !== 'string' || body.trim().length === 0) {
    return NextResponse.json({ error: 'body is required' }, { status: 400 })
  }

  if (body.length > 2000) {
    return NextResponse.json({ error: 'body exceeds 2000 character limit' }, { status: 400 })
  }

  const entry = await createJournalEntry(body.trim(), nodeId || storyId)

  return NextResponse.json(entry, { status: 201 })
}
