---
name: curate-skills
description: Curate and harden repository skills after initial scaffolding. Use when a skill needs compatibility validation, dependency checks, smoke testing, cleanup, and protected publish into runtime discovery.
metadata:
  short-description: Curate skill quality and publish
---

# Curate Skills

## Step 0: Scope and Override Check

1. Confirm current working context includes `skills-wip/`.
2. If not, warn that `skills-wip/AGENTS.override.md` may not be active.
3. Ask user to reopen the task from `skills-wip/` context before continuing.

## Workflow

1. Run core compatibility validation first.
2. Apply project curation checks and improvements.
3. Run dependency check and smoke tests.
4. Clean temporary artifacts and verify no pollution remains in skill folders.
5. Publish to `.agents/skills` only after all checks pass.
6. Verify runtime contents and discoverability.

## Commands

```bash
bun run skills:validate --profile core --target <skill>
bun run skills:validate --profile auto --target <skill>
bun run skills:deps --target <skill>
bun run skills:smoke -- <skill>
bun run skills:tidyup
bun run skills:publish -- <skill>
bun run skills:verify-runtime --target <skill>
```

## Acceptance Criteria

1. Skill passes core validation without official compatibility regressions.
2. Project curation warnings are addressed or documented before publish.
3. Runtime publish is completed or a manual publish command bundle is produced.

## Verification Checklist

1. Confirm `skills-wip/manifest.json` entry exists and state is updated.
2. Confirm smoke outputs only exist under `.tmp/skills/smoke/`.
3. Confirm `.agents/skills/<skill>/SKILL.md` is available after publish.

## Known Couplings

- Depends on repository scripts under `commands/skills/`.
- Depends on protected runtime path behavior for `.agents/skills`.

## Install Notes

- Runtime publish may require user-run manual commands when `.agents/skills` is protected.
- Always run `bun run skills:verify-runtime` after manual publish commands.
