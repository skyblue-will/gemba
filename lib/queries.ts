import { db } from './db'
import { roles, stories, storyRoles, problems, journalEntries } from './schema'
import { eq, and, sql } from 'drizzle-orm'
import { neon } from '@neondatabase/serverless'
import type { MapState, StoryWithChildren, Role } from './types'
import crypto from 'crypto'

// ── Journal ──

export async function listJournalEntries(unprocessedOnly = false) {
  if (unprocessedOnly) {
    return db.select().from(journalEntries).where(eq(journalEntries.processed, false)).orderBy(journalEntries.createdAt)
  }
  return db.select().from(journalEntries).orderBy(journalEntries.createdAt)
}

export async function createJournalEntry(body: string) {
  const [entry] = await db.insert(journalEntries).values({ body }).returning()
  return entry
}

export async function updateJournalEntry(id: string, updates: { processed?: boolean }) {
  const [entry] = await db.update(journalEntries).set(updates).where(eq(journalEntries.id, id)).returning()
  return entry
}

export async function deleteJournalEntry(id: string) {
  const [entry] = await db.delete(journalEntries).where(and(eq(journalEntries.id, id), eq(journalEntries.processed, false))).returning()
  return entry
}

// ── Roles ──

export async function createRole(data: { name: string; icon?: string; vision?: string; position?: { x: number; y: number } }) {
  const [role] = await db.insert(roles).values(data).returning()
  return role
}

export async function updateRole(id: string, updates: Partial<{ name: string; icon: string; vision: string; position: { x: number; y: number } }>) {
  const [role] = await db.update(roles).set(updates).where(eq(roles.id, id)).returning()
  return role
}

// ── Stories ──

import type { StoryState } from './types'

export async function createStory(data: { label: string; narrative?: string; state?: StoryState; parentId?: string; roleIds?: string[] }) {
  const { roleIds, ...storyData } = data
  const [story] = await db.insert(stories).values(storyData).returning()

  if (roleIds && roleIds.length > 0) {
    await db.insert(storyRoles).values(
      roleIds.map(roleId => ({ storyId: story.id, roleId }))
    )
  }

  return story
}

export async function updateStory(id: string, updates: Partial<{ label: string; narrative: string; state: StoryState; parentId: string; lastMentioned: Date }>) {
  const [story] = await db.update(stories).set({ ...updates, updatedAt: new Date() }).where(eq(stories.id, id)).returning()
  return story
}

export async function updateStoryRoles(storyId: string, roleIds: string[]) {
  await db.delete(storyRoles).where(eq(storyRoles.storyId, storyId))
  if (roleIds.length > 0) {
    await db.insert(storyRoles).values(
      roleIds.map(roleId => ({ storyId, roleId }))
    )
  }
}

// ── Problems ──

export async function createProblem(data: { storyId?: string; description: string; emergedFrom?: string }) {
  const [problem] = await db.insert(problems).values(data).returning()
  return problem
}

// ── Map State (recursive tree) ──

export async function getMapState(): Promise<MapState> {
  const rawSql = neon(process.env.DATABASE_URL!)

  // Fetch all data in parallel
  const [allRoles, allStories, allStoryRoles, allProblems] = await Promise.all([
    db.select().from(roles),
    db.select().from(stories),
    db.select().from(storyRoles),
    db.select().from(problems),
  ])

  // Build role-to-stories mapping
  const storyRoleMap = new Map<string, string[]>()
  for (const sr of allStoryRoles) {
    if (!storyRoleMap.has(sr.storyId)) storyRoleMap.set(sr.storyId, [])
    storyRoleMap.get(sr.storyId)!.push(sr.roleId)
  }

  // Build problems-by-story mapping
  const problemsByStory = new Map<string, typeof allProblems>()
  for (const p of allProblems) {
    if (!p.storyId) continue
    if (!problemsByStory.has(p.storyId)) problemsByStory.set(p.storyId, [])
    problemsByStory.get(p.storyId)!.push(p)
  }

  // Build story tree
  const storyMap = new Map<string, StoryWithChildren>()
  for (const s of allStories) {
    storyMap.set(s.id, {
      ...s,
      roleIds: storyRoleMap.get(s.id) || [],
      children: [],
      problems: (problemsByStory.get(s.id) || []).map(p => ({
        id: p.id,
        storyId: p.storyId,
        description: p.description,
        emergedFrom: p.emergedFrom,
        createdAt: p.createdAt,
      })),
    })
  }

  // Nest children under parents
  const topLevelStories: StoryWithChildren[] = []
  for (const s of storyMap.values()) {
    if (s.parentId && storyMap.has(s.parentId)) {
      storyMap.get(s.parentId)!.children.push(s)
    } else {
      topLevelStories.push(s)
    }
  }

  // Assemble roles with their stories
  const result: Role[] = allRoles.map(r => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    vision: r.vision,
    position: r.position as { x: number; y: number } | null,
    createdAt: r.createdAt,
    stories: topLevelStories.filter(s => s.roleIds.includes(r.id)),
  }))

  // Generate ETag for change detection
  const hash = crypto.createHash('md5').update(JSON.stringify(result)).digest('hex')

  return { roles: result, etag: hash }
}
