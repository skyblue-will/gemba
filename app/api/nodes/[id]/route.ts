import { NextRequest, NextResponse } from 'next/server'
import { getNodeWithChildren, updateNode, deleteNode } from '@/lib/queries'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const node = await getNodeWithChildren(id)
  if (!node) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(node)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const updates = await request.json()
  const node = await updateNode(id, updates)
  if (!node) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(node)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const deleted = await deleteNode(id)
  if (!deleted) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ deleted: true })
}
