import { generateText, Output } from 'ai'
import { z } from 'zod'
import { createNode, createEdge, updateNode, updateJournalEntry, listNodes, listEdges } from './queries'
import type { MapState, GembaNodeWithChildren } from './types'
import { db } from './db'
import { nodes, edges } from './schema'

const ActionSchema = z.object({
  actions: z.array(z.discriminatedUnion('type', [
    z.object({
      type: z.literal('create_role'),
      label: z.string(),
      icon: z.string(),
      vision: z.string(),
      description: z.string().optional().describe('Longer description of what this role encompasses and what it does NOT include'),
    }),
    z.object({
      type: z.literal('create_node'),
      nodeType: z.enum(['story', 'project', 'task', 'problem']),
      label: z.string(),
      body: z.string(),
      state: z.enum(['burning', 'messy', 'stuck', 'progressing', 'clear']).optional(),
      parentRoleName: z.string().describe('The role this node lives under in the zoom hierarchy'),
      additionalRoleNames: z.array(z.string()).optional().describe('Other roles this node relates to (creates belongs_to edges)'),
      parentNodeId: z.string().optional().describe('If this is a child of an existing non-role node, its ID'),
    }),
    z.object({
      type: z.literal('update_node'),
      nodeId: z.string(),
      updates: z.object({
        state: z.enum(['burning', 'messy', 'stuck', 'progressing', 'clear']).optional(),
        body: z.string().optional(),
        label: z.string().optional(),
      }),
    }),
    z.object({
      type: z.literal('update_role'),
      nodeId: z.string(),
      updates: z.object({
        vision: z.string().optional(),
        description: z.string().optional().describe('Evolving description of what this role encompasses and excludes — refine as you learn more from entries'),
      }),
    }),
  ])),
})

function buildSystemPrompt(allNodes: any[], allEdges: any[]): string {
  // Build a tree description from nodes
  const nodeMap = new Map<string, any>()
  for (const n of allNodes) {
    nodeMap.set(n.id, { ...n, children: [] })
  }
  for (const n of nodeMap.values()) {
    if (n.parentId && nodeMap.has(n.parentId)) {
      nodeMap.get(n.parentId).children.push(n)
    }
  }

  const topLevel = allNodes.filter(n => !n.parentId)

  function describeNode(n: any, indent: string): string {
    const node = nodeMap.get(n.id) || n
    let line = `${indent}- [${n.id}] (${n.type}) "${n.label}"`
    if (n.state) line += ` [${n.state}]`
    if (n.vision) line += ` — vision: ${n.vision}`
    if (n.type === 'role' && n.body) line += `\n${indent}  description: ${n.body}`

    // Show cross-references
    const nodeEdges = allEdges.filter((e: any) => e.sourceId === n.id)
    for (const e of nodeEdges) {
      const target = nodeMap.get(e.targetId)
      if (target) line += `\n${indent}  ↔ ${e.type} → "${target.label}"`
    }

    if (node.children && node.children.length > 0) {
      line += '\n' + node.children.map((c: any) => describeNode(c, indent + '  ')).join('\n')
    }
    return line
  }

  const stateDesc = topLevel.length > 0
    ? topLevel.map(n => describeNode(n, '  ')).join('\n\n')
    : '(empty - no nodes yet)'

  return `You are the extraction engine for Gemba, a life OS. Your job is to analyze journal entries and map them to a structured ontology of nodes and relationships.

CURRENT STATE:
${stateDesc}

NODE TYPES:
- role: An identity you step into. "Father", "AI Lead at Alertacall", "Brand Builder". NOT abstract domains like "Work" or "Personal".
- story: A moment, event, or narrative arc. "Got a 3.5% pay rise", "Night at the Black Horse". Transient.
- project: A persistent thing being built or worked on. Has a name, a deliverable, persists across entries. "Gemba", "Holly's bike", "AI incentive framework". NOT a moment.
- task: A single actionable step with a clear done state. "Take bike to Russell's on Saturday", "Draft the incentive proposal".
- problem: A gap between reality and a role's vision. Emerges from stories/projects.

RULES:
1. MATCH before CREATE. Before creating a new node, check if an existing node matches by semantic similarity. Use update_node for existing nodes.

2. Roles are ACTUAL ROLES — the hat you wear, the identity you step into. Good: "Father", "AI Lead at Alertacall", "Brand Builder". Bad: "Work", "Career", "Personal".

3. PROJECT vs STORY heuristic: If it has a name, a deliverable, and will persist across multiple entries → project. If it's a narrative arc, a feeling, or a moment → story. "Holly's bike" = project. "Got a pay rise" = story. "Building Gemba" = project.

4. TASK heuristic: A single actionable step with a clear done state. "Take bike to Russell's" = task. "Get Holly riding" = project (too big for one step). IMPORTANT: A task is only "clear" (done) when there is explicit evidence it was COMPLETED — "I took the bike to Russell's", "done", "finished". Planning to do something ("let's take it Saturday") means the task is "progressing" at most. Future intentions are NOT completions.

5. Infer state from emotional tone:
   - "on fire," "urgent," "crisis" → burning
   - "confused," "tangled," "messy" → messy
   - "blocked," "stuck," "waiting on" → stuck
   - "making progress," "shipped," "working" → progressing
   - "done," "resolved," "under control" → clear

6. Life moments ARE stories. Watching your kid perform, having dinner, a nice walk — these are stories. The map reflects ALL of life, not just problems.

7. Problems emerge from gaps between reality and role vision. Example: Role vision = "Ship products that matter." Story = "Can't hire." Problem = "Engineering capacity gap blocking shipping."

8. NESTING: Nodes live inside their parent role (parentRoleName). Projects and stories are children of roles. Tasks are children of projects. Sub-stories are children of stories. Problems are children of the story/project they emerged from.

9. CROSS-REFERENCES: If a project relates to multiple roles, set parentRoleName to its primary home and list the others in additionalRoleNames. This creates belongs_to edges.

10. SEPARATE CONTEXT FROM CAUSE. A journal entry might mention a role as context but describe something that belongs elsewhere. "Stuck at Rosie's, couldn't get out the door" is a self-management problem, not a Father story — even though it happened during parenting time. Ask: "Is this ABOUT the role, or did it just happen DURING the role?" Place nodes where the actual pattern lives.

11. Be conservative. When unsure, update an existing node rather than creating a new one.

12. VISION MATCH: Before placing a node under a role, check the role's vision AND description. The node must plausibly advance, relate to, or reflect that role's purpose. A football trip does not build a professional brand. A pub night alone is not fathering. If no existing role's vision fits, create a new role — don't force-fit into the nearest-sounding role.

13. REFINE ROLE DESCRIPTIONS: As you process entries, use update_role to enrich role descriptions. Each entry teaches you more about what a role encompasses. Build up the description field over time so future extractions classify better. Include what the role IS and what it is NOT when the distinction matters.

For create_node, use parentRoleName matching an existing role name. If the role doesn't exist, also emit a create_role action for it BEFORE the create_node.
For update_node, use the exact nodeId from the current state above.
For create_node with parentNodeId, use the exact ID of the parent node from the current state.`
}

export async function extractFromEntries(
  state: MapState,
  entries: Array<{ id: string; body: string; nodeId?: string | null; processed: boolean | null; createdAt: Date | null }>
): Promise<z.infer<typeof ActionSchema>['actions']> {
  // Fetch all nodes and edges for the prompt
  const allNodes = await db.select().from(nodes)
  const allEdges = await db.select().from(edges)

  // Find node labels for scoped entries
  const nodeById = new Map(allNodes.map(n => [n.id, n]))

  const entriesText = entries.map(e => {
    const scope = e.nodeId && nodeById.has(e.nodeId)
      ? ` [REPLY TO: "${nodeById.get(e.nodeId)!.label}" (id: ${e.nodeId})]`
      : ''
    return `[${e.createdAt?.toISOString() || 'unknown'}]${scope} ${e.body}`
  }).join('\n\n')

  const { experimental_output } = await generateText({
    model: 'anthropic/claude-sonnet-4.6' as any,
    system: buildSystemPrompt(allNodes, allEdges),
    prompt: `Analyze these journal entries and return structured actions:\n\n${entriesText}`,
    experimental_output: Output.object({ schema: ActionSchema }),
  })

  const result = experimental_output
  if (!result) return []

  const actions = result.actions

  // Build a name→id map for roles
  const roleNameToId = new Map<string, string>()
  for (const n of allNodes) {
    if (n.type === 'role') {
      roleNameToId.set(n.label.toLowerCase(), n.id)
    }
  }

  for (const action of actions) {
    try {
      switch (action.type) {
        case 'create_role': {
          const role = await createNode({
            type: 'role',
            label: action.label,
            icon: action.icon,
            vision: action.vision,
            body: action.description,
          })
          roleNameToId.set(action.label.toLowerCase(), role.id)
          break
        }
        case 'create_node': {
          // Find parent: either an explicit parentNodeId, or the role
          let parentId: string | null = null

          if (action.parentNodeId) {
            parentId = action.parentNodeId
          } else {
            parentId = roleNameToId.get(action.parentRoleName.toLowerCase()) || null
          }

          const node = await createNode({
            parentId,
            type: action.nodeType,
            label: action.label,
            body: action.body,
            state: action.state || (action.nodeType === 'problem' ? undefined : 'messy'),
          })

          // Create belongs_to edges for additional roles
          if (action.additionalRoleNames) {
            for (const roleName of action.additionalRoleNames) {
              const roleId = roleNameToId.get(roleName.toLowerCase())
              if (roleId) {
                await createEdge({ sourceId: node.id, targetId: roleId, type: 'belongs_to' })
              }
            }
          }
          break
        }
        case 'update_node': {
          await updateNode(action.nodeId, {
            ...action.updates,
            lastMentioned: new Date(),
          })
          break
        }
        case 'update_role': {
          await updateNode(action.nodeId, {
            ...(action.updates.vision && { vision: action.updates.vision }),
            ...(action.updates.description && { body: action.updates.description }),
            lastMentioned: new Date(),
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
