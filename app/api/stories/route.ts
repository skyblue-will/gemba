import { NextRequest, NextResponse } from 'next/server'
import { createStory } from '@/lib/queries'

export async function POST(request: NextRequest) {
  const data = await request.json()
  if (!data.label) return NextResponse.json({ error: 'label is required' }, { status: 400 })
  const story = await createStory(data)
  return NextResponse.json(story, { status: 201 })
}
