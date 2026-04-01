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
- When you say "sync", "update the map", or "process my journal"
- Note: This only processes UNPROCESSED entries. To rebuild everything from scratch (e.g. after changing extraction rules), use `/gemba-reprocess` instead.

## Configuration

Production-only project. Always hits the live API.

```bash
GEMBA_URL="https://gemba-beige.vercel.app"

# Look for GEMBA_API_KEY in known locations (working dir may vary)
for f in gemba/.env.local .env.local; do
  [ -f "$f" ] && source <(grep -E '^GEMBA_API_KEY=' "$f" 2>/dev/null | head -1 | sed 's/^/export /')
  [ -n "${GEMBA_API_KEY:-}" ] && break
done
GEMBA_KEY="${GEMBA_API_KEY:-}"

echo "URL: $GEMBA_URL"
echo "KEY: ${GEMBA_KEY:+set}"
```

If `GEMBA_KEY` is empty, pull it from Vercel:
```bash
cd gemba && npx vercel env pull .env.local --environment=production && cd ..
```
Then re-run the configuration block above.

Verify connectivity:
```bash
curl -sf "$GEMBA_URL/api/state" -H "x-api-key: $GEMBA_KEY" > /dev/null 2>&1 && echo "READY" || echo "UNREACHABLE"
```

If `UNREACHABLE`: check the API key is correct. Re-pull with `cd gemba && npx vercel env pull .env.local --environment=production`.

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
- If the API is unreachable: "Can't reach Gemba. Check connectivity."
- If auth fails (401): "API key rejected. Re-pull with `cd gemba && npx vercel env pull .env.local --environment=production`."
