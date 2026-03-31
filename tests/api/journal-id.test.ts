import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { resetStore, seedStore, getStore, mockQueries } from '../mocks/queries'

vi.mock('@/lib/queries', () => mockQueries)

const { PATCH, DELETE } = await import('@/app/api/journal/[id]/route')

function makeRequest(url: string, options?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options)
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('PATCH /api/journal/[id]', () => {
  beforeEach(() => resetStore())

  it('marks entry as processed', async () => {
    seedStore({
      journalEntries: [{ id: 'e1', body: 'test', processed: false, createdAt: new Date() }],
    })

    const res = await PATCH(
      makeRequest('http://localhost:3000/api/journal/e1', {
        method: 'PATCH',
        body: JSON.stringify({ processed: true }),
      }),
      makeParams('e1'),
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.processed).toBe(true)
  })

  it('returns 404 for missing entry', async () => {
    const res = await PATCH(
      makeRequest('http://localhost:3000/api/journal/missing', {
        method: 'PATCH',
        body: JSON.stringify({ processed: true }),
      }),
      makeParams('missing'),
    )

    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/journal/[id]', () => {
  beforeEach(() => resetStore())

  it('deletes unprocessed entry', async () => {
    seedStore({
      journalEntries: [{ id: 'e1', body: 'test', processed: false, createdAt: new Date() }],
    })

    const res = await DELETE(
      makeRequest('http://localhost:3000/api/journal/e1', { method: 'DELETE' }),
      makeParams('e1'),
    )
    const data = await res.json()

    expect(data.deleted).toBe(true)
    expect(getStore().journalEntries).toHaveLength(0)
  })

  it('does not delete processed entry', async () => {
    seedStore({
      journalEntries: [{ id: 'e1', body: 'test', processed: true, createdAt: new Date() }],
    })

    const res = await DELETE(
      makeRequest('http://localhost:3000/api/journal/e1', { method: 'DELETE' }),
      makeParams('e1'),
    )

    expect(res.status).toBe(404)
    expect(getStore().journalEntries).toHaveLength(1)
  })

  it('returns 404 for missing entry', async () => {
    const res = await DELETE(
      makeRequest('http://localhost:3000/api/journal/missing', { method: 'DELETE' }),
      makeParams('missing'),
    )

    expect(res.status).toBe(404)
  })
})
