import { NextRequest, NextResponse } from 'next/server'
import { createNode } from '@/lib/queries'

export async function POST(request: NextRequest) {
  const data = await request.json()
  if (!data.label) return NextResponse.json({ error: 'label is required' }, { status: 400 })
  const node = await createNode({ type: 'story', label: data.label, body: data.narrative, state: data.state, parentId: data.parentId })
  return NextResponse.json(node, { status: 201 })
}
