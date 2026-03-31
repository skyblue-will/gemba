import { vi } from 'vitest'

// In-memory store for tests
let journalEntries: any[] = []
let roles: any[] = []
let stories: any[] = []
let storyRolesMap: any[] = []
let problems: any[] = []

export function resetStore() {
  journalEntries = []
  roles = []
  stories = []
  storyRolesMap = []
  problems = []
}

export function seedStore(data: {
  journalEntries?: any[]
  roles?: any[]
  stories?: any[]
  storyRoles?: any[]
  problems?: any[]
}) {
  if (data.journalEntries) journalEntries = [...data.journalEntries]
  if (data.roles) roles = [...data.roles]
  if (data.stories) stories = [...data.stories]
  if (data.storyRoles) storyRolesMap = [...data.storyRoles]
  if (data.problems) problems = [...data.problems]
}

export function getStore() {
  return { journalEntries, roles, stories, storyRoles: storyRolesMap, problems }
}

export const mockQueries = {
  listJournalEntries: vi.fn(async (unprocessedOnly = false) => {
    if (unprocessedOnly) return journalEntries.filter(e => !e.processed)
    return [...journalEntries]
  }),

  createJournalEntry: vi.fn(async (body: string) => {
    const entry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      body,
      processed: false,
      createdAt: new Date(),
    }
    journalEntries.push(entry)
    return entry
  }),

  updateJournalEntry: vi.fn(async (id: string, updates: any) => {
    const entry = journalEntries.find(e => e.id === id)
    if (!entry) return null
    Object.assign(entry, updates)
    return entry
  }),

  deleteJournalEntry: vi.fn(async (id: string) => {
    const idx = journalEntries.findIndex(e => e.id === id && !e.processed)
    if (idx === -1) return null
    const [deleted] = journalEntries.splice(idx, 1)
    return deleted
  }),

  createRole: vi.fn(async (data: any) => {
    const role = { id: `role-${Date.now()}`, ...data, createdAt: new Date() }
    roles.push(role)
    return role
  }),

  updateRole: vi.fn(async (id: string, updates: any) => {
    const role = roles.find(r => r.id === id)
    if (!role) return null
    Object.assign(role, updates)
    return role
  }),

  createStory: vi.fn(async (data: any) => {
    const { roleIds, ...rest } = data
    const story = { id: `story-${Date.now()}`, ...rest, createdAt: new Date(), updatedAt: new Date(), lastMentioned: new Date() }
    stories.push(story)
    if (roleIds) {
      roleIds.forEach((rid: string) => storyRolesMap.push({ storyId: story.id, roleId: rid }))
    }
    return story
  }),

  updateStory: vi.fn(async (id: string, updates: any) => {
    const story = stories.find(s => s.id === id)
    if (!story) return null
    Object.assign(story, updates, { updatedAt: new Date() })
    return story
  }),

  updateStoryRoles: vi.fn(async (storyId: string, roleIds: string[]) => {
    storyRolesMap = storyRolesMap.filter(sr => sr.storyId !== storyId)
    roleIds.forEach(rid => storyRolesMap.push({ storyId, roleId: rid }))
  }),

  createProblem: vi.fn(async (data: any) => {
    const problem = { id: `problem-${Date.now()}`, ...data, createdAt: new Date() }
    problems.push(problem)
    return problem
  }),

  getMapState: vi.fn(async () => {
    const result = roles.map(r => ({
      ...r,
      stories: stories
        .filter(s => !s.parentId && storyRolesMap.some(sr => sr.storyId === s.id && sr.roleId === r.id))
        .map(s => ({
          ...s,
          roleIds: storyRolesMap.filter(sr => sr.storyId === s.id).map(sr => sr.roleId),
          children: stories.filter(c => c.parentId === s.id).map(c => ({
            ...c,
            roleIds: [],
            children: [],
            problems: problems.filter(p => p.storyId === c.id),
          })),
          problems: problems.filter(p => p.storyId === s.id),
        })),
    }))
    const hash = JSON.stringify(result).length.toString()
    return { roles: result, etag: hash }
  }),
}
