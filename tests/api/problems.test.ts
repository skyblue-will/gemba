import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { resetStore, mockQueries } from '../mocks/queries'

vi.mock('@/lib/queries', () => mockQueries)

const { POST } = await import('@/app/api/problems/route')

function makeRequest(url: string, options?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options)
}

describe('POST /api/problems', () => {
  beforeEach(() => resetStore())

  it('creates a problem', async () => {
    const res = await POST(makeRequest('http://localhost:3000/api/problems', {
      method: 'POST',
      body: JSON.stringify({
        description: 'Can\'t hire senior engineer',
        storyId: 's1',
        emergedFrom: 'Engineering capacity gap',
      }),
    }))
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.description).toBe('Can\'t hire senior engineer')
  })

  it('rejects missing description', async () => {
    const res = await POST(makeRequest('http://localhost:3000/api/problems', {
      method: 'POST',
      body: JSON.stringify({ storyId: 's1' }),
    }))

    expect(res.status).toBe(400)
  })
})
