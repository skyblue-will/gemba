import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { resetStore, seedStore, mockQueries } from '../mocks/queries'

vi.mock('@/lib/queries', () => mockQueries)

const { GET } = await import('@/app/api/state/route')

function makeRequest(url: string) {
  return new NextRequest(new URL(url, 'http://localhost:3000'))
}

describe('GET /api/state', () => {
  beforeEach(() => resetStore())

  it('returns empty state', async () => {
    const res = await GET(makeRequest('http://localhost:3000/api/state'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.roles).toEqual([])
    expect(data.etag).toBeDefined()
  })

  it('returns nested roles with stories', async () => {
    seedStore({
      roles: [{ id: 'r1', name: 'Parent', icon: null, vision: 'Be present', position: null, createdAt: new Date() }],
      stories: [{ id: 's1', parentId: null, label: 'Kids school', narrative: null, state: 'progressing', lastMentioned: new Date(), createdAt: new Date(), updatedAt: new Date() }],
      storyRoles: [{ storyId: 's1', roleId: 'r1' }],
    })

    const res = await GET(makeRequest('http://localhost:3000/api/state'))
    const data = await res.json()

    expect(data.roles).toHaveLength(1)
    expect(data.roles[0].name).toBe('Parent')
    expect(data.roles[0].stories).toHaveLength(1)
    expect(data.roles[0].stories[0].label).toBe('Kids school')
  })

  it('nests child stories under parents', async () => {
    seedStore({
      roles: [{ id: 'r1', name: 'Parent', icon: null, vision: null, position: null, createdAt: new Date() }],
      stories: [
        { id: 's1', parentId: null, label: 'Bike project', narrative: null, state: 'progressing', lastMentioned: new Date(), createdAt: new Date(), updatedAt: new Date() },
        { id: 's2', parentId: 's1', label: 'Take to Russell', narrative: null, state: 'progressing', lastMentioned: new Date(), createdAt: new Date(), updatedAt: new Date() },
      ],
      storyRoles: [{ storyId: 's1', roleId: 'r1' }],
    })

    const res = await GET(makeRequest('http://localhost:3000/api/state'))
    const data = await res.json()

    expect(data.roles[0].stories[0].children).toHaveLength(1)
    expect(data.roles[0].stories[0].children[0].label).toBe('Take to Russell')
  })

  it('includes ETag header', async () => {
    const res = await GET(makeRequest('http://localhost:3000/api/state'))

    expect(res.headers.get('ETag')).toBeDefined()
  })

  it('ETag changes when state changes', async () => {
    const res1 = await GET(makeRequest('http://localhost:3000/api/state'))
    const etag1 = (await res1.json()).etag

    seedStore({
      roles: [{ id: 'r1', name: 'New', icon: null, vision: null, position: null, createdAt: new Date() }],
    })

    const res2 = await GET(makeRequest('http://localhost:3000/api/state'))
    const etag2 = (await res2.json()).etag

    expect(etag1).not.toBe(etag2)
  })
})
