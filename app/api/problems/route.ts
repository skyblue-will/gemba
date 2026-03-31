import { NextRequest, NextResponse } from 'next/server'
import { createProblem } from '@/lib/queries'

export async function POST(request: NextRequest) {
  const data = await request.json()
  if (!data.description) return NextResponse.json({ error: 'description is required' }, { status: 400 })
  const problem = await createProblem(data)
  return NextResponse.json(problem, { status: 201 })
}
