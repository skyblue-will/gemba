import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { resetStore, seedStore, getStore, mockQueries } from '../mocks/queries'

// Mock the queries module
vi.mock('@/lib/queries', () => mockQueries)
vi.mock('@/lib/extract', () => ({ extractFromEntries: vi.fn() }))

// Import after mocking
const { GET, POST } = await import('@/app/api/journal/route')

function makeRequest(url: string, options?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options)
}

describe('GET /api/journal', () => {
  beforeEach(() => resetStore())

  it('returns all entries', async () => {
    seedStore({
      journalEntries: [
        { id: '1', body: 'first', processed: true, createdAt: new Date() },
        { id: '2', body: 'second', processed: false, createdAt: new Date() },
      ],
    })

    const res = await GET(makeRequest('http://localhost:3000/api/journal'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toHaveLength(2)
  })

  it('filters unprocessed entries', async () => {
    seedStore({
      journalEntries: [
        { id: '1', body: 'done', processed: true, createdAt: new Date() },
        { id: '2', body: 'pending', processed: false, createdAt: new Date() },
      ],
    })

    const res = await GET(makeRequest('http://localhost:3000/api/journal?unprocessed=true'))
    const data = await res.json()

    expect(data).toHaveLength(1)
    expect(data[0].body).toBe('pending')
  })

  it('returns empty array when no entries', async () => {
    const res = await GET(makeRequest('http://localhost:3000/api/journal'))
    const data = await res.json()

    expect(data).toEqual([])
  })
})

describe('POST /api/journal', () => {
  beforeEach(() => resetStore())

  it('creates an entry', async () => {
    const res = await POST(makeRequest('http://localhost:3000/api/journal', {
      method: 'POST',
      body: JSON.stringify({ body: 'Hello world' }),
    }))
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.body).toBe('Hello world')
    expect(data.processed).toBe(false)
    expect(data.id).toBeDefined()
  })

  it('rejects empty body', async () => {
    const res = await POST(makeRequest('http://localhost:3000/api/journal', {
      method: 'POST',
      body: JSON.stringify({ body: '' }),
    }))

    expect(res.status).toBe(400)
  })

  it('rejects missing body', async () => {
    const res = await POST(makeRequest('http://localhost:3000/api/journal', {
      method: 'POST',
      body: JSON.stringify({}),
    }))

    expect(res.status).toBe(400)
  })

  it('rejects body over 2000 chars', async () => {
    const res = await POST(makeRequest('http://localhost:3000/api/journal', {
      method: 'POST',
      body: JSON.stringify({ body: 'a'.repeat(2001) }),
    }))

    expect(res.status).toBe(400)
  })

  it('trims whitespace', async () => {
    const res = await POST(makeRequest('http://localhost:3000/api/journal', {
      method: 'POST',
      body: JSON.stringify({ body: '  hello  ' }),
    }))
    const data = await res.json()

    expect(data.body).toBe('hello')
  })
})
