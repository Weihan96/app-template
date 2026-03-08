# skills-wip AGENTS.override.md

## Scope

- These instructions apply when working inside `skills-wip/` and its subdirectories.
- This file is intended to keep skill curation prompts separate from repository feature prompts.

## Step 0: Scope Check (required)

- Before editing any skill, confirm the current task is running from `skills-wip` context.
- If scope does not include `skills-wip`, warn that this override may not be active and ask the user to open a new task from `skills-wip/`.

## Skill Development Rules

- Treat `skills-wip/` as the only source of truth for skill development.
- Treat `.agents/skills/` as protected runtime state. Do not edit runtime files directly during curation.
- Keep generated test artifacts under `.tmp/skills/` only.
- Keep skill folders clean: do not keep logs, traces, screenshots, or temporary reports in skill directories.

## Validation and Test Gate

- Validate with `bun run skills:validate --profile auto`.
- Run dependency checks with `bun run skills:deps`.
- Run smoke checks with `bun run skills:smoke -- <skill|all>`.
- Run cleanup checks with `bun run skills:tidyup`.

## Publish Gate

- Publish only after validate + deps + smoke + tidyup pass.
- Use `bun run skills:publish -- <skill|all>`.
- If publish cannot write to `.agents/skills` due to protection, use generated manual publish commands and then run `bun run skills:verify-runtime`.
