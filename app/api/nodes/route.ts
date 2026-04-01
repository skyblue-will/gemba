import { NextRequest, NextResponse } from 'next/server'
import { listNodes, createNode } from '@/lib/queries'

export async function GET(request: NextRequest) {
  const parentId = request.nextUrl.searchParams.get('parentId')
  const nodes = await listNodes(parentId)
  return NextResponse.json(nodes)
}

export async function POST(request: NextRequest) {
  const data = await request.json()

  if (!data.label || !data.type) {
    return NextResponse.json({ error: 'label and type are required' }, { status: 400 })
  }

  const node = await createNode(data)
  return NextResponse.json(node, { status: 201 })
}
