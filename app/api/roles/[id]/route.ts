import { NextRequest, NextResponse } from 'next/server'
import { updateRole } from '@/lib/queries'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const updates = await request.json()
  const role = await updateRole(id, updates)
  if (!role) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(role)
}
