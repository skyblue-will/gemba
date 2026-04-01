import { NextRequest, NextResponse } from 'next/server'
import { createEdge } from '@/lib/queries'

export async function POST(request: NextRequest) {
  const data = await request.json()

  if (!data.sourceId || !data.targetId || !data.type) {
    return NextResponse.json({ error: 'sourceId, targetId, and type are required' }, { status: 400 })
  }

  const edge = await createEdge(data)
  return NextResponse.json(edge, { status: 201 })
}
