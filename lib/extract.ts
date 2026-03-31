import { generateText, Output } from 'ai'
import { z } from 'zod'
import { createRole, createStory, updateStory, createProblem, updateJournalEntry } from './queries'
import type { MapState, JournalEntry } from './types'

const ActionSchema = z.object({
  actions: z.array(z.discriminatedUnion('type', [
    z.object({
      type: z.literal('create_role'),
      name: z.string(),
      icon: z.string(),
      vision: z.string(),
    }),
    z.object({
      type: z.literal('create_story'),
      label: z.string(),
      narrative: z.string(),
      state: z.enum(['burning', 'messy', 'stuck', 'progressing', 'clear']),
      roleNames: z.array(z.string()),
    }),
    z.object({
      type: z.literal('update_story'),
      storyId: z.string(),
      updates: z.object({
        state: z.enum(['burning', 'messy', 'stuck', 'progressing', 'clear']).optional(),
        narrative: z.string().optional(),
        label: z.string().optional(),
      }),
    }),
    z.object({
      type: z.literal('create_problem'),
      storyLabel: z.string(),
      description: z.string(),
      emergedFrom: z.string(),
    }),
  ])),
})

function buildSystemPrompt(state: MapState): string {
  const rolesDesc = state.roles.map(r => {
    const storiesDesc = r.stories.map(s =>
      `  - [${s.id}] "${s.label}" (state: ${s.state})`
    ).join('\n')
    return `Role: "${r.name}" (vision: ${r.vision || 'not set'})\n${storiesDesc || '  (no stories yet)'}`
  }).join('\n\n')

  return `You are the extraction engine for Gemba, a life OS. Your job is to analyze journal entries and map them to a structured ontology of Roles, Stories, and Problems.

CURRENT STATE:
${rolesDesc || '(empty - no roles or stories yet)'}

RULES:
1. MATCH before CREATE. Before creating a new story, check if an existing story matches by semantic similarity. "Sarah conflict" and "Roadmap pushback from Sarah" are the same story. Use the existing story's ID for update_story.

2. MATCH roles by intent, not name. "Work," "CEO," "Company," "My job" are all the same role. Match to the closest existing role. Only create a new role if no existing role covers this life area.

3. Infer state from emotional tone:
   - "on fire," "urgent," "crisis" -> burning
   - "confused," "tangled," "messy" -> messy
   - "blocked," "stuck," "waiting on" -> stuck
   - "making progress," "shipped," "working" -> progressing
   - "done," "resolved," "under control" -> clear

4. Vague entries get minimal extraction. "Feeling stressed today" should NOT create a new story called "Stress." Only create stories for specific situations or events.

5. Problems emerge from gaps between story reality and role vision. Example: Role vision = "Ship products that matter." Story = "Can't hire." Problem = "Engineering capacity gap blocking shipping."

6. One entry can affect multiple stories across different roles.

7. Be conservative. When unsure, update an existing story rather than creating a new one. When very unsure, do nothing.

For create_story, use roleNames that match existing role names. If no role fits, include a new role name and also emit a create_role action for it.
For update_story, use the exact storyId from the current state above.
For create_problem, use the storyLabel of the story the problem belongs to.`
}

export async function extractFromEntries(
  state: MapState,
  entries: Array<{ id: string; body: string; processed: boolean | null; createdAt: Date | null }>
): Promise<z.infer<typeof ActionSchema>['actions']> {
  const entriesText = entries.map(e =>
    `[${e.createdAt?.toISOString() || 'unknown'}] ${e.body}`
  ).join('\n\n')

  const { experimental_output } = await generateText({
    model: 'anthropic/claude-sonnet-4.6' as any,
    system: buildSystemPrompt(state),
    prompt: `Analyze these journal entries and return structured actions:\n\n${entriesText}`,
    experimental_output: Output.object({ schema: ActionSchema }),
  })

  const result = experimental_output
  if (!result) return []

  const actions = result.actions

  // Execute actions against the database
  const roleNameToId = new Map<string, string>()
  for (const r of state.roles) {
    roleNameToId.set(r.name.toLowerCase(), r.id)
  }

  for (const action of actions) {
    try {
      switch (action.type) {
        case 'create_role': {
          const role = await createRole({
            name: action.name,
            icon: action.icon,
            vision: action.vision,
          })
          roleNameToId.set(action.name.toLowerCase(), role.id)
          break
        }
        case 'create_story': {
          const roleIds = action.roleNames
            .map(name => roleNameToId.get(name.toLowerCase()))
            .filter((id): id is string => !!id)
          await createStory({
            label: action.label,
            narrative: action.narrative,
            state: action.state,
            roleIds,
          })
          break
        }
        case 'update_story': {
          await updateStory(action.storyId, {
            ...action.updates,
            lastMentioned: new Date(),
          })
          break
        }
        case 'create_problem': {
          // Find story by label match
          const allStories = state.roles.flatMap(r => r.stories)
          const matchingStory = allStories.find(s =>
            s.label.toLowerCase().includes(action.storyLabel.toLowerCase()) ||
            action.storyLabel.toLowerCase().includes(s.label.toLowerCase())
          )
          await createProblem({
            storyId: matchingStory?.id,
            description: action.description,
            emergedFrom: action.emergedFrom,
          })
          break
        }
      }
    } catch (err) {
      console.error(`Failed to execute action ${action.type}:`, err)
    }
  }

  // Mark entries as processed
  for (const entry of entries) {
    await updateJournalEntry(entry.id, { processed: true })
  }

  return actions
}
