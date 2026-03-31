import { NextRequest, NextResponse } from 'next/server'
import { getMapState } from '@/lib/queries'

export async function GET(request: NextRequest) {
  const state = await getMapState()
  const response = NextResponse.json(state)
  response.headers.set('ETag', state.etag)
  return response
}
