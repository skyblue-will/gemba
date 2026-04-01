import { NextRequest, NextResponse } from 'next/server'
import { createNode } from '@/lib/queries'

export async function POST(request: NextRequest) {
  const data = await request.json()
  if (!data.description) return NextResponse.json({ error: 'description is required' }, { status: 400 })
  const node = await createNode({ type: 'problem', label: data.description, body: data.description })
  return NextResponse.json(node, { status: 201 })
}
