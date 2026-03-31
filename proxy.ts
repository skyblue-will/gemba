import { NextRequest, NextResponse } from 'next/server'

export default function proxy(request: NextRequest) {
  // Only protect /api routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Skip auth for same-origin requests (browser UI)
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (origin && host && origin.includes(host)) {
    return NextResponse.next()
  }

  // Also skip if referer is from the same host (navigation requests)
  const referer = request.headers.get('referer')
  if (referer && host && referer.includes(host)) {
    return NextResponse.next()
  }

  // External requests need API key
  const apiKey = request.headers.get('x-api-key')
  const expected = process.env.GEMBA_API_KEY

  if (!expected) {
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
