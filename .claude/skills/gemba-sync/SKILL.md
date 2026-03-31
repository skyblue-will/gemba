---
name: gemba-sync
description: |
  Bulk reprocess unprocessed journal entries in Gemba. Reads entries via the API,
  triggers AI extraction, and reports what changed. Use when: "sync gemba",
  "process my journal", "update the map", or after the auto-extraction missed entries.
---

# /gemba-sync — Bulk Journal Processing

Process all unprocessed journal entries through AI extraction and update the map.

## When to use

- After writing multiple journal entries without the app running
- When auto-extraction failed (entries show amber dots)
- To reprocess entries after changing roles or restructuring the map
- When you say "sync", "update the map", or "process my journal"

## Configuration

The skill needs the app's base URL and API key.

```bash
# Detect base URL
if [ -f .env.local ]; then
  source <(grep -E '^(GEMBA_API_KEY|NEXT_PUBLIC_APP_URL)' .env.local | sed 's/^/export /')
fi
GEMBA_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
GEMBA_KEY="${GEMBA_API_KEY:-}"
echo "URL: $GEMBA_URL"
echo "KEY: ${GEMBA_KEY:+set}"
```

If `GEMBA_URL` points to localhost, confirm the dev server is running:
```bash
curl -sf "$GEMBA_URL/api/state" -H "x-api-key: $GEMBA_KEY" > /dev/null 2>&1 && echo "READY" || echo "NOT_RUNNING"
```

If `NOT_RUNNING`: tell the user "Dev server isn't running. Start it with `npm run dev` first, or set NEXT_PUBLIC_APP_URL to your production URL."

## Execution

### Step 1: Fetch unprocessed entries

```bash
curl -s "$GEMBA_URL/api/journal?unprocessed=true" -H "x-api-key: $GEMBA_KEY"
```

Parse the JSON response. Count entries. If 0: "All entries are already processed. Map is up to date." Exit.

Otherwise: "Found N unprocessed entries. Processing..."

### Step 2: Trigger extraction

```bash
curl -s -X POST "$GEMBA_URL/api/extract" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $GEMBA_KEY" \
  -d '{}'
```

The extract endpoint processes all unprocessed entries by default when no `entryIds` are provided.

Parse the response. It returns `{ message, actions }`.

### Step 3: Report what changed

For each action in the response, report:

- `create_role`: "Created role: {name} ({vision})"
- `create_story`: "Created story: {label} in {roleNames} (state: {state})"
- `update_story`: "Updated story {storyId}: {changes}"
- `create_problem`: "Surfaced problem: {description}"

### Step 4: Verify

```bash
curl -s "$GEMBA_URL/api/state" -H "x-api-key: $GEMBA_KEY"
```

Parse and display a summary:
```
MAP STATE:
  {role.name} ({N} stories)
    - {story.label} [{story.state}]
    ...
```

### Step 5: Confirm

"Sync complete. Processed N entries. Created X roles, Y stories, Z problems."

## Error handling

- If extraction returns an error: "Extraction failed: {error}. Entries remain unprocessed. Try again or check the server logs."
- If the API is unreachable: "Can't reach Gemba at {URL}. Is the server running?"
- If auth fails (401): "API key rejected. Check GEMBA_API_KEY in .env.local matches the server."
