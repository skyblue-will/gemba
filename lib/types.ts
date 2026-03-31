export type StoryState = 'burning' | 'messy' | 'stuck' | 'progressing' | 'clear' | 'dormant'

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

export interface JournalEntry {
  id: string
  body: string
  storyId: string | null
  processed: boolean | null
  createdAt: Date | null
}

export interface MapState {
  roles: Role[]
  etag: string
}

export interface ExtractionAction {
  type: 'create_role' | 'create_story' | 'update_story' | 'create_problem' | 'mark_processed'
  [key: string]: unknown
}
