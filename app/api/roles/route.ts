import { NextRequest, NextResponse } from 'next/server'
import { createNode } from '@/lib/queries'

export async function POST(request: NextRequest) {
  const data = await request.json()
  if (!data.name) return NextResponse.json({ error: 'name is required' }, { status: 400 })
  const node = await createNode({ type: 'role', label: data.name, icon: data.icon, vision: data.vision })
  return NextResponse.json(node, { status: 201 })
}
