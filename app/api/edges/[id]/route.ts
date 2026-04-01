import { NextRequest, NextResponse } from 'next/server'
import { deleteEdge } from '@/lib/queries'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const deleted = await deleteEdge(id)
  if (!deleted) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ deleted: true })
}
