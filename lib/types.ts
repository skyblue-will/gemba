export type NodeType = 'role' | 'story' | 'project' | 'task' | 'problem'
export type NodeState = 'burning' | 'messy' | 'stuck' | 'progressing' | 'clear' | 'dormant'

export interface GembaNode {
  id: string
  parentId: string | null
  type: NodeType
  label: string
  body: string | null
  icon: string | null
  state: NodeState | null
  vision: string | null
  position: { x: number; y: number } | null
  metadata: Record<string, unknown> | null
  lastMentioned: Date | null
  createdAt: Date | null
  updatedAt: Date | null
}

export interface GembaNodeWithChildren extends GembaNode {
  children: GembaNodeWithChildren[]
  edges: Edge[]
}

export interface Edge {
  id: string
  sourceId: string
  targetId: string
  type: string
  createdAt: Date | null
}

export interface JournalEntry {
  id: string
  body: string
  nodeId: string | null
  processed: boolean | null
  createdAt: Date | null
}

// ── Legacy types (for backward-compat /api/state) ──

export type StoryState = NodeState

export interface Role {
  id: string
  name: string
  icon: string | null
  vision: string | null
  position: { x: number; y: number } | null
  createdAt: Date | null
  stories: StoryWithChildren[]
}

export interface Story {
  id: string
  parentId: string | null
  label: string
  narrative: string | null
  state: StoryState
  lastMentioned: Date | null
  createdAt: Date | null
  updatedAt: Date | null
  roleIds: string[]
}

export interface StoryWithChildren extends Story {
  children: StoryWithChildren[]
  problems: Problem[]
}

export interface Problem {
  id: string
  storyId: string | null
  description: string
  emergedFrom: string | null
  createdAt: Date | null
}

export interface MapState {
  roles: Role[]
  etag: string
}
