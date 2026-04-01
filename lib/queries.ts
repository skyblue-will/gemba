import { db } from './db'
import { nodes, edges, journalEntries, roles, stories, storyRoles, problems } from './schema'
import { eq, and, isNull } from 'drizzle-orm'
import type { MapState, StoryWithChildren, Role, GembaNode, GembaNodeWithChildren, Edge } from './types'
import crypto from 'crypto'

// ── Journal ──

export async function listJournalEntries(unprocessedOnly = false) {
  if (unprocessedOnly) {
    return db.select().from(journalEntries).where(eq(journalEntries.processed, false)).orderBy(journalEntries.createdAt)
  }
  return db.select().from(journalEntries).orderBy(journalEntries.createdAt)
}

export async function createJournalEntry(body: string, nodeId?: string) {
  const [entry] = await db.insert(journalEntries).values({ body, nodeId: nodeId || null }).returning()
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

// ── Nodes ──

export async function listNodes(parentId?: string | null) {
  if (parentId === undefined || parentId === null) {
    return db.select().from(nodes).where(isNull(nodes.parentId)).orderBy(nodes.createdAt)
  }
  return db.select().from(nodes).where(eq(nodes.parentId, parentId)).orderBy(nodes.createdAt)
}

export async function getNode(id: string) {
  const [node] = await db.select().from(nodes).where(eq(nodes.id, id))
  return node || null
}

export async function createNode(data: {
  parentId?: string | null
  type: string
  label: string
  body?: string | null
  icon?: string | null
  state?: string | null
  vision?: string | null
  position?: { x: number; y: number } | null
  metadata?: Record<string, unknown> | null
}) {
  const [node] = await db.insert(nodes).values(data as any).returning()
  return node
}

export async function updateNode(id: string, updates: Partial<{
  label: string
  body: string
  icon: string
  state: string
  vision: string
  position: { x: number; y: number }
  metadata: Record<string, unknown>
  lastMentioned: Date
}>) {
  const [node] = await db.update(nodes).set({ ...updates, updatedAt: new Date() } as any).where(eq(nodes.id, id)).returning()
  return node
}

export async function deleteNode(id: string) {
  const [node] = await db.delete(nodes).where(eq(nodes.id, id)).returning()
  return node
}

// ── Edges ──

export async function listEdges(nodeId: string) {
  const allEdges = await db.select().from(edges)
  return allEdges.filter(e => e.sourceId === nodeId || e.targetId === nodeId)
}

export async function createEdge(data: { sourceId: string; targetId: string; type: string }) {
  const [edge] = await db.insert(edges).values(data).returning()
  return edge
}

export async function deleteEdge(id: string) {
  const [edge] = await db.delete(edges).where(eq(edges.id, id)).returning()
  return edge
}

// ── Node Tree (for zoom views) ──

export async function getNodeWithChildren(id: string): Promise<GembaNodeWithChildren | null> {
  const node = await getNode(id)
  if (!node) return null

  const children = await listNodes(id)
  const nodeEdges = await listEdges(id)

  const childrenWithChildren: GembaNodeWithChildren[] = children.map(c => ({
    ...c,
    children: [],
    edges: [],
  }))

  return {
    ...node,
    children: childrenWithChildren,
    edges: nodeEdges,
  }
}

export async function getDescendants(id: string): Promise<GembaNodeWithChildren> {
  const allNodes = await db.select().from(nodes)
  const allEdges = await db.select().from(edges)

  const nodeMap = new Map<string, GembaNodeWithChildren>()
  for (const n of allNodes) {
    nodeMap.set(n.id, { ...n, children: [], edges: [] })
  }

  // Attach edges to their source nodes
  for (const e of allEdges) {
    nodeMap.get(e.sourceId)?.edges.push(e)
  }

  // Build tree
  for (const n of nodeMap.values()) {
    if (n.parentId && nodeMap.has(n.parentId)) {
      nodeMap.get(n.parentId)!.children.push(n)
    }
  }

  return nodeMap.get(id) || { id, parentId: null, type: 'role' as const, label: 'Not found', body: null, icon: null, state: null, vision: null, position: null, metadata: null, lastMentioned: null, createdAt: null, updatedAt: null, children: [], edges: [] }
}

// ── Reset ──

export async function resetMap() {
  await db.delete(edges)
  await db.delete(nodes)
  await db.update(journalEntries).set({ processed: false, nodeId: null })
}

// ── Legacy: Map State (backward-compat for skills) ──

export async function getMapState(): Promise<MapState> {
  const allNodes = await db.select().from(nodes)
  const allEdges = await db.select().from(edges)

  // Build node tree
  const nodeMap = new Map<string, GembaNodeWithChildren>()
  for (const n of allNodes) {
    nodeMap.set(n.id, { ...n, children: [], edges: [] })
  }

  for (const e of allEdges) {
    nodeMap.get(e.sourceId)?.edges.push(e)
  }

  // Nest children
  const topLevel: GembaNodeWithChildren[] = []
  for (const n of nodeMap.values()) {
    if (n.parentId && nodeMap.has(n.parentId)) {
      nodeMap.get(n.parentId)!.children.push(n)
    } else if (!n.parentId) {
      topLevel.push(n)
    }
  }

  // Reshape into legacy format: roles with stories
  const roleNodes = topLevel.filter(n => n.type === 'role')

  function toStory(n: GembaNodeWithChildren): StoryWithChildren {
    // Find role edges for this node
    const roleIds = n.edges
      .filter(e => e.type === 'belongs_to')
      .map(e => e.targetId)

    return {
      id: n.id,
      parentId: n.parentId,
      label: n.label,
      narrative: n.body,
      state: n.state || 'messy',
      lastMentioned: n.lastMentioned,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
      roleIds,
      children: n.children.filter(c => c.type !== 'problem').map(toStory),
      problems: n.children.filter(c => c.type === 'problem').map(p => ({
        id: p.id,
        storyId: p.parentId,
        description: p.body || p.label,
        emergedFrom: null,
        createdAt: p.createdAt,
      })),
    }
  }

  const result: Role[] = roleNodes.map(r => ({
    id: r.id,
    name: r.label,
    icon: r.icon,
    vision: r.vision,
    position: r.position,
    createdAt: r.createdAt,
    stories: r.children.filter(c => c.type !== 'problem').map(toStory),
  }))

  const hash = crypto.createHash('md5').update(JSON.stringify(result)).digest('hex')
  return { roles: result, etag: hash }
}
