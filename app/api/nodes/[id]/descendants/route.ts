import { NextRequest, NextResponse } from 'next/server'
import { getDescendants } from '@/lib/queries'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tree = await getDescendants(id)
  return NextResponse.json(tree)
}
