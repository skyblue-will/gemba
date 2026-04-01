---
name: gemba-reprocess
description: |
  Wipe all derived data (roles, stories, problems) and re-extract from ALL journal
  entries using the current extraction rules. Use when roles/stories need realigning
  after changing the extraction prompt, renaming conventions, or restructuring.
---

# /gemba-reprocess — Full Map Rebuild

Nuke all derived data and rebuild the map from scratch using current extraction rules.

## When to use

- After changing the extraction prompt (e.g. fixing role naming conventions, context-vs-cause rules)
- When roles/stories have drifted and need realigning
- When the user says "reprocess", "rebuild the map", "start fresh", "re-extract everything"
- After restructuring roles or stories conceptually
- After fixing node placement rules (e.g. self-management patterns landing under wrong roles)

## Warning

This is destructive. It deletes ALL roles, stories, and problems, then re-creates them from journal entries. Manual edits to roles/stories (renamed labels, repositioned nodes, custom visions) will be lost.

**Always confirm with the user before proceeding.**

## Configuration

Production-only project. Always hits the live API.

```bash
GEMBA_URL="https://gemba-beige.vercel.app"
source <(grep -E '^GEMBA_API_KEY=' gemba/.env.local 2>/dev/null | sed 's/^/export /')
GEMBA_KEY="${GEMBA_API_KEY:-}"
echo "URL: $GEMBA_URL"
echo "KEY: ${GEMBA_KEY:+set}"
```

If `GEMBA_KEY` is empty: run `vercel env pull gemba/.env.local --environment=production` to fetch it.

Verify connectivity:
```bash
curl -sf "$GEMBA_URL/api/state" -H "x-api-key: $GEMBA_KEY" > /dev/null 2>&1 && echo "READY" || echo "UNREACHABLE"
```

If `UNREACHABLE`: "Can't reach Gemba. Check your API key with `vercel env pull gemba/.env.local --environment=production`."

## Execution

### Step 0: Confirm

Before doing anything, show the user what will happen:

"This will **delete all roles, stories, and problems** and rebuild from {N} journal entries using the current extraction rules. Manual edits (repositioned nodes, renamed labels) will be lost. Proceed?"

Wait for confirmation. Do NOT proceed without it.

### Step 1: Snapshot current state

```bash
curl -s "$GEMBA_URL/api/state" -H "x-api-key: $GEMBA_KEY"
```

Count current roles, stories, problems. Show: "Current map: {N} roles, {M} stories, {P} problems"

### Step 2: Reprocess

```bash
curl -s -X POST "$GEMBA_URL/api/reprocess" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $GEMBA_KEY" \
  -d '{}'
```

This endpoint wipes all derived data, marks all entries unprocessed, then re-extracts in chronological batches of 10. It can take a while for large journals.

Parse the response. It returns `{ message, actions }`.

### Step 3: Report what was rebuilt

For each action in the response, report:

- `create_role`: "Created role: {name} ({vision})"
- `create_story`: "Created story: {label} in {roleNames} (state: {state})"
- `update_story`: "Updated story: {label} — {changes}"
- `create_problem`: "Surfaced problem: {description}"

### Step 4: Show new map state

```bash
curl -s "$GEMBA_URL/api/state" -H "x-api-key: $GEMBA_KEY"
```

Display the rebuilt map:
```
REBUILT MAP:
  {role.name} ({N} stories)
    - {story.label} [{story.state}]
    ...
```

### Step 5: Compare

"Rebuild complete. Before: {old_roles} roles, {old_stories} stories. After: {new_roles} roles, {new_stories} stories. Processed {N} entries in {B} batches."

## Error handling

- If reprocess returns an error: "Reprocess failed: {error}. The map may be in a partial state — run /gemba-reprocess again to retry."
- If the API is unreachable: "Can't reach Gemba. Check connectivity."
- If auth fails (401): "API key rejected. Re-pull with `vercel env pull gemba/.env.local --environment=production`."
- If it times out: The endpoint processes in batches and may take 30-60s for large journals. Suggest increasing timeout or checking server logs.
