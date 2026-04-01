import { pgTable, uuid, text, boolean, timestamp, jsonb, primaryKey, uniqueIndex, index } from 'drizzle-orm/pg-core'

// ── New: Unified Node Model ──

export const nodes = pgTable('nodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parent_id').references((): any => nodes.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['role', 'story', 'project', 'task', 'problem'] }).notNull(),
  label: text('label').notNull(),
  body: text('body'),
  icon: text('icon'),
  state: text('state', { enum: ['burning', 'messy', 'stuck', 'progressing', 'clear', 'dormant'] }),
  vision: text('vision'),
  position: jsonb('position').$type<{ x: number; y: number }>(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  lastMentioned: timestamp('last_mentioned', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_nodes_parent').on(table.parentId),
  index('idx_nodes_type').on(table.type),
  index('idx_nodes_parent_type').on(table.parentId, table.type),
])

export const edges = pgTable('edges', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceId: uuid('source_id').notNull().references(() => nodes.id, { onDelete: 'cascade' }),
  targetId: uuid('target_id').notNull().references(() => nodes.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex('idx_edges_unique').on(table.sourceId, table.targetId, table.type),
  index('idx_edges_source').on(table.sourceId),
  index('idx_edges_target').on(table.targetId),
])

// ── Journal (unchanged, storyId renamed to nodeId) ──

export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  body: text('body').notNull(),
  // Renamed from story_id to node_id in migration
  nodeId: uuid('node_id').references(() => nodes.id, { onDelete: 'set null' }),
  processed: boolean('processed').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ── Legacy tables (kept as fallback, will be dropped after migration verified) ──

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  icon: text('icon'),
  vision: text('vision'),
  position: jsonb('position').$type<{ x: number; y: number }>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const stories = pgTable('stories', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parent_id').references((): any => stories.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  narrative: text('narrative'),
  state: text('state', { enum: ['burning', 'messy', 'stuck', 'progressing', 'clear', 'dormant'] }).notNull().default('messy'),
  lastMentioned: timestamp('last_mentioned', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const storyRoles = pgTable('story_roles', {
  storyId: uuid('story_id').notNull().references(() => stories.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.storyId, table.roleId] }),
])

export const problems = pgTable('problems', {
  id: uuid('id').primaryKey().defaultRandom(),
  storyId: uuid('story_id').references(() => stories.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  emergedFrom: text('emerged_from'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
