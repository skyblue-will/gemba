import { NextRequest, NextResponse } from 'next/server'
import { updateNode } from '@/lib/queries'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const updates = await request.json()
  const node = await updateNode(id, updates)
  if (!node) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(node)
}
