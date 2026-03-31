import { pgTable, uuid, text, boolean, timestamp, jsonb, primaryKey, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

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

export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  body: text('body').notNull(),
  processed: boolean('processed').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
