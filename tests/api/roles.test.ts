import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { resetStore, seedStore, mockQueries } from '../mocks/queries'

vi.mock('@/lib/queries', () => mockQueries)

const { POST } = await import('@/app/api/roles/route')
const { PATCH } = await import('@/app/api/roles/[id]/route')

function makeRequest(url: string, options?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options)
}

describe('POST /api/roles', () => {
  beforeEach(() => resetStore())

  it('creates a role', async () => {
    const res = await POST(makeRequest('http://localhost:3000/api/roles', {
      method: 'POST',
      body: JSON.stringify({ name: 'Builder', icon: '🔧', vision: 'Make things' }),
    }))
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.name).toBe('Builder')
    expect(data.icon).toBe('🔧')
  })

  it('rejects missing name', async () => {
    const res = await POST(makeRequest('http://localhost:3000/api/roles', {
      method: 'POST',
      body: JSON.stringify({ icon: '🔧' }),
    }))

    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/roles/[id]', () => {
  beforeEach(() => resetStore())

  it('updates a role', async () => {
    seedStore({ roles: [{ id: 'r1', name: 'Old', icon: null, vision: null, position: null, createdAt: new Date() }] })

    const res = await PATCH(
      makeRequest('http://localhost:3000/api/roles/r1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'New', vision: 'Updated vision' }),
      }),
      { params: Promise.resolve({ id: 'r1' }) },
    )
    const data = await res.json()

    expect(data.name).toBe('New')
    expect(data.vision).toBe('Updated vision')
  })

  it('returns 404 for missing role', async () => {
    const res = await PATCH(
      makeRequest('http://localhost:3000/api/roles/missing', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'X' }),
      }),
      { params: Promise.resolve({ id: 'missing' }) },
    )

    expect(res.status).toBe(404)
  })
})
