@AGENTS.md

# Gemba

Life OS for ADHD brains. Roles → Stories → Emergent Problems.

Roles are ACTUAL ROLES — the hat you wear, the identity you step into. "Father", "AI Lead at Alertacall", "Brand Builder" — not abstract domains like "Work", "Career", "Personal".

## Skills

- `/gemba-sync` — Bulk process unprocessed journal entries. Triggers AI extraction and updates the map. Use when: "sync gemba", "process my journal", "update the map".
- `/gemba-reprocess` — Wipe all derived data and rebuild the entire map from scratch using current extraction rules. Destructive — confirms before proceeding. Use when: "reprocess", "rebuild the map", "start fresh", "re-extract everything".

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.

Key routing rules:
- "sync", "process journal", "update the map" → invoke gemba-sync
- "reprocess", "rebuild", "start fresh", "re-extract" → invoke gemba-reprocess
- Product ideas, brainstorming → invoke office-hours
- Bugs, errors, "why is this broken" → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Design system, brand → invoke design-consultation
- Architecture review → invoke plan-eng-review
