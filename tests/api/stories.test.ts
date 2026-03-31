import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { resetStore, seedStore, getStore, mockQueries } from '../mocks/queries'

vi.mock('@/lib/queries', () => mockQueries)

const { POST } = await import('@/app/api/stories/route')
const { PATCH } = await import('@/app/api/stories/[id]/route')

function makeRequest(url: string, options?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), options)
}

describe('POST /api/stories', () => {
  beforeEach(() => resetStore())

  it('creates a story', async () => {
    seedStore({ roles: [{ id: 'r1', name: 'Parent', icon: null, vision: null, position: null, createdAt: new Date() }] })

    const res = await POST(makeRequest('http://localhost:3000/api/stories', {
      method: 'POST',
      body: JSON.stringify({ label: 'Kids school', state: 'progressing', roleIds: ['r1'] }),
    }))
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.label).toBe('Kids school')
  })

  it('creates a sub-story with parentId', async () => {
    seedStore({
      roles: [{ id: 'r1', name: 'Parent', icon: null, vision: null, position: null, createdAt: new Date() }],
      stories: [{ id: 's1', parentId: null, label: 'Bike project', state: 'progressing', createdAt: new Date(), updatedAt: new Date(), lastMentioned: new Date() }],
      storyRoles: [{ storyId: 's1', roleId: 'r1' }],
    })

    const res = await POST(makeRequest('http://localhost:3000/api/stories', {
      method: 'POST',
      body: JSON.stringify({ label: 'Fix brakes', parentId: 's1' }),
    }))
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.parentId).toBe('s1')
  })

  it('rejects missing label', async () => {
    const res = await POST(makeRequest('http://localhost:3000/api/stories', {
      method: 'POST',
      body: JSON.stringify({ state: 'messy' }),
    }))

    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/stories/[id]', () => {
  beforeEach(() => resetStore())

  it('updates story state', async () => {
    seedStore({
      stories: [{ id: 's1', parentId: null, label: 'Test', state: 'messy', createdAt: new Date(), updatedAt: new Date(), lastMentioned: new Date() }],
    })

    const res = await PATCH(
      makeRequest('http://localhost:3000/api/stories/s1', {
        method: 'PATCH',
        body: JSON.stringify({ state: 'progressing' }),
      }),
      { params: Promise.resolve({ id: 's1' }) },
    )
    const data = await res.json()

    expect(data.state).toBe('progressing')
  })

  it('updates story roles', async () => {
    seedStore({
      roles: [
        { id: 'r1', name: 'A', icon: null, vision: null, position: null, createdAt: new Date() },
        { id: 'r2', name: 'B', icon: null, vision: null, position: null, createdAt: new Date() },
      ],
      stories: [{ id: 's1', parentId: null, label: 'Test', state: 'messy', createdAt: new Date(), updatedAt: new Date(), lastMentioned: new Date() }],
      storyRoles: [{ storyId: 's1', roleId: 'r1' }],
    })

    await PATCH(
      makeRequest('http://localhost:3000/api/stories/s1', {
        method: 'PATCH',
        body: JSON.stringify({ roleIds: ['r2'] }),
      }),
      { params: Promise.resolve({ id: 's1' }) },
    )

    const store = getStore()
    expect(store.storyRoles.filter(sr => sr.storyId === 's1')).toHaveLength(1)
    expect(store.storyRoles[0].roleId).toBe('r2')
  })

  it('returns 404 for missing story', async () => {
    const res = await PATCH(
      makeRequest('http://localhost:3000/api/stories/missing', {
        method: 'PATCH',
        body: JSON.stringify({ state: 'clear' }),
      }),
      { params: Promise.resolve({ id: 'missing' }) },
    )

    expect(res.status).toBe(404)
  })
})
