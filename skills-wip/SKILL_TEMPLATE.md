---
name: "<skill-name>"
description: "When to use this skill and what outcome it provides."
# compatibility: "Add this field when Step 0 checks external dependencies."
---

# <Skill Title>

## Step 0

Check required dependencies before running the workflow.
If any dependency is missing, stop and provide installation guidance.

Example:

```bash
command -v bun >/dev/null 2>&1 && command -v bunx >/dev/null 2>&1
```

## Workflow

1. Describe the execution order clearly.
2. Keep instructions deterministic for fragile operations.
3. Reference scripts under `scripts/` when applicable.

## Acceptance Criteria

1. Define observable completion conditions.
2. Keep criteria measurable and repository-specific.

## Verification Checklist

1. List checks the operator should run.
2. Include manual verification steps when needed.

## Known Couplings

- Document which parts depend on current repository structure and may change over time.

## Install Notes

- Mention any caveats for `bun run skills:install -- <skill|all>`.
- Note conflict handling expectations before install.
