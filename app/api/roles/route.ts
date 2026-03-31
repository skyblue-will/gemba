import { NextRequest, NextResponse } from 'next/server'
import { createRole } from '@/lib/queries'

export async function POST(request: NextRequest) {
  const data = await request.json()
  if (!data.name) return NextResponse.json({ error: 'name is required' }, { status: 400 })
  const role = await createRole(data)
  return NextResponse.json(role, { status: 201 })
}
