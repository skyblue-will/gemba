import { NextRequest, NextResponse } from 'next/server'

export default function proxy(request: NextRequest) {
  // Only protect /api routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  const apiKey = request.headers.get('x-api-key')
  const expected = process.env.GEMBA_API_KEY

  if (!expected) {
    // No key configured, skip auth (dev mode)
    return NextResponse.next()
  }

  if (apiKey !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
